from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from app.services.normalizer import normalize_text
from app.services.attribute_extractor import extract_attributes
from app.services.embedding_service import embedding_service
from app.services.matching_rules import (
    compare_attributes,
    compare_category,
    compare_uom,
)


@dataclass
class MatchingConfig:
    # Component weights (summing to 1.0)
    SEMANTIC_WEIGHT: float = 0.45
    TECHNICAL_WEIGHT: float = 0.40
    CATEGORY_WEIGHT: float = 0.10
    UOM_WEIGHT: float = 0.05

    # Classification thresholds
    HIGH_CONFIDENCE_THRESHOLD: float = 90.0
    REVIEW_REQUIRED_THRESHOLD: float = 70.0

    # Critical mismatch penalty: max confidence cap if critical attributes conflict
    CRITICAL_MISMATCH_CAP: float = 65.0
    CATEGORY_MISMATCH_CAP: float = 55.0


def compare_materials(
    desc_a: str,
    desc_b: str,
    spec_a: Optional[str] = None,
    spec_b: Optional[str] = None,
    category_a: Optional[str] = None,
    category_b: Optional[str] = None,
    uom_a: Optional[str] = None,
    uom_b: Optional[str] = None,
    material_a_id: Optional[int] = None,
    material_b_id: Optional[int] = None,
    config: Optional[MatchingConfig] = None,
) -> Dict[str, Any]:
    """
    Execute the full MATPULSE AI material matching pipeline on two materials.
    
    Pipeline stages:
    1. Text Normalization
    2. Attribute Extraction
    3. Semantic Similarity Calculation (all-MiniLM-L6-v2)
    4. Technical Rules & Dimensions Comparison
    5. Category and UOM Validation
    6. Weighted Confidence Scoring & Critical Conflict Guards
    7. Classification (HIGH_CONFIDENCE_MATCH, REVIEW_REQUIRED, LOW_CONFIDENCE)
    8. Explainability Generation (reasons, warnings, attribute diffs)
    """
    if config is None:
        config = MatchingConfig()

    reasons: List[str] = []
    warnings: List[str] = []

    # 1. TEXT NORMALIZATION
    norm_a = normalize_text(f"{desc_a or ''} {spec_a or ''}".strip())
    norm_b = normalize_text(f"{desc_b or ''} {spec_b or ''}".strip())

    # 2. ATTRIBUTE EXTRACTION
    attrs_a = extract_attributes(desc_a, spec_a)
    attrs_b = extract_attributes(desc_b, spec_b)

    # 3. SEMANTIC EMBEDDING SIMILARITY
    semantic_score = embedding_service.compute_similarity(norm_a, norm_b)
    if semantic_score >= 85.0:
        reasons.append(f"Descriptions are semantically similar ({semantic_score:.1f}%)")
    elif semantic_score < 60.0:
        warnings.append(f"Semantic similarity is low ({semantic_score:.1f}%)")

    # 4. TECHNICAL ATTRIBUTE VALIDATION
    tech_score, attr_details, has_critical_mismatch, tech_reasons, tech_warnings = compare_attributes(
        attrs_a, attrs_b
    )
    reasons.extend(tech_reasons)
    warnings.extend(tech_warnings)

    # 5. CATEGORY & UOM VALIDATION
    cat_score, cat_msg = compare_category(category_a, category_b)
    if cat_score >= 90.0:
        reasons.append(cat_msg)
    elif cat_score == 0.0:
        warnings.append(cat_msg)

    uom_score, uom_msg = compare_uom(uom_a, uom_b)
    if uom_score >= 90.0:
        reasons.append(uom_msg)
    elif uom_score == 0.0:
        warnings.append(uom_msg)

    # 6. COMBINED CONFIDENCE SCORING
    raw_confidence = (
        config.SEMANTIC_WEIGHT * semantic_score
        + config.TECHNICAL_WEIGHT * tech_score
        + config.CATEGORY_WEIGHT * cat_score
        + config.UOM_WEIGHT * uom_score
    )

    final_confidence = round(raw_confidence, 1)

    # Apply critical mismatch penalties
    if has_critical_mismatch:
        final_confidence = min(final_confidence, config.CRITICAL_MISMATCH_CAP)
        warnings.append("Confidence capped due to critical technical attribute mismatch")

    if cat_score == 0.0:
        final_confidence = min(final_confidence, config.CATEGORY_MISMATCH_CAP)
        warnings.append("Confidence capped due to incompatible category domains")

    final_confidence = round(max(0.0, min(100.0, final_confidence)), 1)

    # 7. CLASSIFICATION
    if final_confidence >= config.HIGH_CONFIDENCE_THRESHOLD and not has_critical_mismatch:
        classification = "HIGH_CONFIDENCE_MATCH"
    elif final_confidence >= config.REVIEW_REQUIRED_THRESHOLD and not has_critical_mismatch:
        classification = "REVIEW_REQUIRED"
    else:
        classification = "LOW_CONFIDENCE"

    # Simplify attribute comparison format: e.g. {"material": "MATCH", "diameter": "MATCH"}
    simple_attribute_comparison = {
        k: v["status"] for k, v in attr_details.items()
    }

    return {
        "material_a_id": material_a_id,
        "material_b_id": material_b_id,
        "semantic_score": semantic_score,
        "technical_score": tech_score,
        "category_score": cat_score,
        "uom_score": uom_score,
        "final_confidence": final_confidence,
        "classification": classification,
        "attribute_comparison": simple_attribute_comparison,
        "attribute_details": attr_details,
        "reasons": reasons,
        "warnings": warnings,
    }
