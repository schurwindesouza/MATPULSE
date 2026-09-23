from typing import List, Tuple, Dict, Any, Optional
from collections import defaultdict
from app.services.matcher import compare_materials
from app.services.matching_rules import compare_category


def generate_candidate_pairs(materials: List[Any]) -> List[Tuple[Any, Any]]:
    """
    Generate plausible, non-redundant cross-CPSE candidate pairs for matching.
    
    Guarantees:
    1. Cross-CPSE: materials from the same CPSE are NOT paired.
    2. Self-exclusion: a material is NEVER paired with itself.
    3. Canonical ordering: if (A, B) is evaluated, (B, A) is not separately generated.
    4. Heuristic pre-filter: excludes pairs with completely incompatible known categories (e.g. Valves vs Fasteners).
    """
    pairs: List[Tuple[Any, Any]] = []
    seen_pair_keys = set()
    n = len(materials)

    for i in range(n):
        for j in range(i + 1, n):
            m_a = materials[i]
            m_b = materials[j]

            # 1. Self-exclusion
            id_a = getattr(m_a, "id", None) or i
            id_b = getattr(m_b, "id", None) or j
            if id_a == id_b:
                continue

            # 2. Cross-CPSE requirement
            cpse_a = (getattr(m_a, "cpse", None) or "").strip().lower()
            cpse_b = (getattr(m_b, "cpse", None) or "").strip().lower()
            if not cpse_a or not cpse_b or cpse_a == cpse_b:
                continue

            # 3. Canonical ordering: ensure unique pair key (min, max)
            pair_key = (min(str(id_a), str(id_b)), max(str(id_a), str(id_b)))
            if pair_key in seen_pair_keys:
                continue
            seen_pair_keys.add(pair_key)

            # 4. Category pre-filtering: if both categories are known and 100% incompatible, prune candidate
            cat_a = getattr(m_a, "category", None)
            cat_b = getattr(m_b, "category", None)
            if cat_a and cat_b:
                cat_score, _ = compare_category(cat_a, cat_b)
                if cat_score == 0.0:
                    continue

            pairs.append((m_a, m_b))

    return pairs


def find_material_matches(
    materials: List[Any],
    top_k: int = 5,
    min_confidence: float = 0.0,
    target_cpse: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute batch matching across candidate materials from multiple CPSEs.
    
    Returns structured results per material with candidates ranked by final_confidence descending.
    """
    candidate_pairs = generate_candidate_pairs(materials)
    
    # Store match candidate for each material (material_id -> list of candidate match dicts)
    matches_by_material = defaultdict(list)
    unique_pairs_evaluated = 0

    for m_a, m_b in candidate_pairs:
        id_a = getattr(m_a, "id", None)
        id_b = getattr(m_b, "id", None)

        # Run pairwise AI matching engine (cached singleton SentenceTransformers)
        res = compare_materials(
            desc_a=getattr(m_a, "description", ""),
            desc_b=getattr(m_b, "description", ""),
            spec_a=getattr(m_a, "technical_specification", None),
            spec_b=getattr(m_b, "technical_specification", None),
            category_a=getattr(m_a, "category", None),
            category_b=getattr(m_b, "category", None),
            uom_a=getattr(m_a, "uom", None),
            uom_b=getattr(m_b, "uom", None),
            material_a_id=id_a,
            material_b_id=id_b,
        )
        unique_pairs_evaluated += 1

        confidence = res["final_confidence"]

        # Filter by min_confidence
        if confidence < min_confidence:
            continue

        # Add match candidate entry for material A (matching with B)
        candidate_for_a = {
            "material_id": id_b,
            "cpse": getattr(m_b, "cpse", ""),
            "material_code": getattr(m_b, "material_code", ""),
            "description": getattr(m_b, "description", ""),
            "final_confidence": confidence,
            "classification": res["classification"],
            "semantic_score": res["semantic_score"],
            "technical_score": res["technical_score"],
            "category_score": res["category_score"],
            "uom_score": res["uom_score"],
            "reasons": res["reasons"],
            "warnings": res["warnings"],
            "attribute_comparison": res["attribute_comparison"],
        }
        matches_by_material[id_a].append(candidate_for_a)

        # Symmetric match candidate entry for material B (matching with A)
        candidate_for_b = {
            "material_id": id_a,
            "cpse": getattr(m_a, "cpse", ""),
            "material_code": getattr(m_a, "material_code", ""),
            "description": getattr(m_a, "description", ""),
            "final_confidence": confidence,
            "classification": res["classification"],
            "semantic_score": res["semantic_score"],
            "technical_score": res["technical_score"],
            "category_score": res["category_score"],
            "uom_score": res["uom_score"],
            "reasons": res["reasons"],
            "warnings": res["warnings"],
            "attribute_comparison": res["attribute_comparison"],
        }
        matches_by_material[id_b].append(candidate_for_b)

    # Compile ranked results per material
    results = []
    for m in materials:
        m_id = getattr(m, "id", None)
        m_cpse = getattr(m, "cpse", "")

        # Optional CPSE filter on source materials
        if target_cpse and m_cpse.strip().lower() != target_cpse.strip().lower():
            continue

        # Sort candidate matches descending by final_confidence
        material_candidates = matches_by_material.get(m_id, [])
        material_candidates.sort(key=lambda x: x["final_confidence"], reverse=True)
        top_candidates = material_candidates[:top_k]

        results.append({
            "material_id": m_id,
            "cpse": m_cpse,
            "material_code": getattr(m, "material_code", ""),
            "description": getattr(m, "description", ""),
            "category": getattr(m, "category", None),
            "matches_count": len(material_candidates),
            "matches": top_candidates,
        })

    return {
        "total_materials": len(materials),
        "pairs_evaluated": unique_pairs_evaluated,
        "results": results,
    }
