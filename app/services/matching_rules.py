from typing import Dict, Any, Tuple, List, Optional


# Configurable category synonym clusters
CATEGORY_COMPATIBILITY_GROUPS = [
    {"pipes & tubes", "piping material", "line pipes", "piping", "pipes"},
    {"valves", "process valves", "industrial valves"},
    {"electrical", "electrical switchgear", "switchgear", "circuit breakers"},
    {"fasteners", "bolts & nuts", "bolts", "hardware"},
    {"structural steel", "steel", "rebars", "reinforcement steel"},
    {"cables", "wires & cables", "ht cables", "power cables"},
]

# Configurable unit of measurement (UOM) synonym clusters
UOM_COMPATIBILITY_GROUPS = [
    {"ea", "pcs", "nos", "no", "unit", "pieces", "each"},
    {"mtr", "m", "meter", "meters"},
    {"kg", "kgs", "kilogram", "kilograms"},
    {"ton", "mt", "metric ton"},
    {"ltr", "liter", "liters", "l"},
    {"m3", "cum", "cubic meter", "cubic meters"},
    {"set", "sets"},
]

# Attributes considered critical: a hard mismatch here must penalize overall match confidence
CRITICAL_ATTRIBUTES = {"material", "grade", "diameter", "nominal_bore", "type"}


def compare_category(cat_a: Optional[str], cat_b: Optional[str]) -> Tuple[float, str]:
    """Compare categories for semantic and functional compatibility."""
    if not cat_a or not cat_b:
        return 75.0, "One or both materials have unspecified category (neutral score)"

    c_a = cat_a.strip().lower()
    c_b = cat_b.strip().lower()

    if c_a == c_b:
        return 100.0, f"Identical category: '{cat_a}'"

    # Check compatibility groups
    for group in CATEGORY_COMPATIBILITY_GROUPS:
        if c_a in group and c_b in group:
            return 95.0, f"Compatible category domain: '{cat_a}' and '{cat_b}'"

    return 0.0, f"Incompatible material categories: '{cat_a}' vs '{cat_b}'"


def compare_uom(uom_a: Optional[str], uom_b: Optional[str]) -> Tuple[float, str]:
    """Compare Units of Measurement (UOM)."""
    if not uom_a or not uom_b:
        return 80.0, "One or both materials have unspecified UOM (neutral score)"

    u_a = uom_a.strip().lower()
    u_b = uom_b.strip().lower()

    if u_a == u_b:
        return 100.0, f"Identical UOM: '{uom_a}'"

    # Check synonym groups
    for group in UOM_COMPATIBILITY_GROUPS:
        if u_a in group and u_b in group:
            return 95.0, f"Compatible UOM units: '{uom_a}' and '{uom_b}'"

    return 0.0, f"Incompatible UOM units: '{uom_a}' vs '{uom_b}'"


def compare_attributes(
    attrs_a: Dict[str, Any], attrs_b: Dict[str, Any]
) -> Tuple[float, Dict[str, Dict[str, Any]], bool, List[str], List[str]]:
    """
    Compare technical attributes between two materials.
    
    Returns:
    - technical_score: 0.0 to 100.0
    - comparisons: detail dict for each attribute (status, val_a, val_b, reason)
    - has_critical_mismatch: bool flag indicating irreconcilable technical conflict
    - reasons: list of positive match explanations
    - warnings: list of mismatch or missing attribute warnings
    """
    comparisons: Dict[str, Dict[str, Any]] = {}
    reasons: List[str] = []
    warnings: List[str] = []
    has_critical_mismatch = False

    all_keys = set(attrs_a.keys()).union(set(attrs_b.keys()))

    if not all_keys:
        return 70.0, {}, False, ["No structured technical attributes available for comparison"], []

    scores: List[float] = []
    weights: List[float] = []

    for key in sorted(all_keys):
        val_a = attrs_a.get(key)
        val_b = attrs_b.get(key)
        is_critical = key in CRITICAL_ATTRIBUTES
        weight = 2.0 if is_critical else 1.0

        if val_a is not None and val_b is not None:
            # Both present
            str_a = str(val_a).strip().lower()
            str_b = str(val_b).strip().lower()

            if str_a == str_b:
                comparisons[key] = {
                    "status": "MATCH",
                    "val_a": val_a,
                    "val_b": val_b,
                    "reason": f"Both materials specify matching {key}: '{val_a}'",
                }
                reasons.append(f"{key.replace('_', ' ').capitalize()} matches ({val_a})")
                scores.append(100.0)
                weights.append(weight)
            else:
                # Check for special equivalences (e.g. 50 NB vs 2 in)
                if key == "nominal_bore" and (
                    ("50" in str_a and "2" in str_b) or ("2" in str_a and "50" in str_b)
                ):
                    comparisons[key] = {
                        "status": "MATCH",
                        "val_a": val_a,
                        "val_b": val_b,
                        "reason": f"Equivalent nominal bore: '{val_a}' and '{val_b}'",
                    }
                    reasons.append(f"Nominal bore equivalent ({val_a} ↔ {val_b})")
                    scores.append(100.0)
                    weights.append(weight)
                else:
                    # Mismatch!
                    comparisons[key] = {
                        "status": "MISMATCH",
                        "val_a": val_a,
                        "val_b": val_b,
                        "reason": f"{key.replace('_', ' ').capitalize()} mismatch: '{val_a}' vs '{val_b}'",
                    }
                    warning_msg = f"{key.replace('_', ' ').capitalize()} mismatch: '{val_a}' vs '{val_b}'"
                    warnings.append(warning_msg)
                    scores.append(0.0)
                    weights.append(weight)

                    if is_critical:
                        has_critical_mismatch = True
        else:
            # One material is missing this attribute -> mark as UNKNOWN / incomplete
            present_val = val_a if val_a is not None else val_b
            missing_side = "Material B" if val_a is not None else "Material A"
            comparisons[key] = {
                "status": "UNKNOWN",
                "val_a": val_a,
                "val_b": val_b,
                "reason": f"{missing_side} does not specify {key} (found '{present_val}')",
            }
            # Give neutral partial score (70.0) so missing attributes do not reject the match
            scores.append(70.0)
            weights.append(0.5)

    if weights:
        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        total_weight = sum(weights)
        technical_score = round(weighted_sum / total_weight, 2)
    else:
        technical_score = 70.0

    return technical_score, comparisons, has_critical_mismatch, reasons, warnings
