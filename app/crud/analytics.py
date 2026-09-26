from typing import Optional, List, Dict, Any
from collections import defaultdict
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, aliased
from app.models.material import Material
from app.models.match import MaterialMatch
from app.services.matcher import MatchingConfig


STATUS_COLORS = {
    "MATCHED": "#10b981",    # Emerald
    "UNMATCHED": "#64748b",  # Slate
    "SUGGESTED": "#f59e0b",  # Amber
    "REVIEWED": "#6366f1",   # Indigo
    "REJECTED": "#f43f5e",   # Rose
}


def _get_filtered_materials_query(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
):
    query = db.query(Material)
    if cpse and cpse.strip() and cpse.strip().lower() != "all":
        query = query.filter(func.lower(Material.cpse) == cpse.strip().lower())
    if category and category.strip() and category.strip().lower() != "all":
        query = query.filter(func.lower(Material.category) == category.strip().lower())
    if matching_status and matching_status.strip() and matching_status.strip().lower() != "all":
        query = query.filter(func.lower(Material.matching_status) == matching_status.strip().lower())
    return query


def _get_filtered_matches_query(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    review_status: Optional[str] = None,
    min_confidence: Optional[float] = None,
    max_confidence: Optional[float] = None,
):
    query = db.query(MaterialMatch)
    mat_a = aliased(Material)
    mat_b = aliased(Material)

    needs_join = bool(
        (cpse and cpse.strip() and cpse.strip().lower() != "all")
        or (category and category.strip() and category.strip().lower() != "all")
    )

    if needs_join:
        query = query.join(mat_a, MaterialMatch.material_a_id == mat_a.id).join(
            mat_b, MaterialMatch.material_b_id == mat_b.id
        )

        if cpse and cpse.strip() and cpse.strip().lower() != "all":
            cpse_target = cpse.strip().lower()
            query = query.filter(
                or_(
                    func.lower(mat_a.cpse) == cpse_target,
                    func.lower(mat_b.cpse) == cpse_target,
                )
            )

        if category and category.strip() and category.strip().lower() != "all":
            cat_target = category.strip().lower()
            query = query.filter(
                or_(
                    func.lower(mat_a.category) == cat_target,
                    func.lower(mat_b.category) == cat_target,
                )
            )

    if review_status and review_status.strip() and review_status.strip().lower() != "all":
        query = query.filter(func.lower(MaterialMatch.status) == review_status.strip().lower())

    if min_confidence is not None:
        query = query.filter(MaterialMatch.final_confidence >= min_confidence)

    if max_confidence is not None:
        query = query.filter(MaterialMatch.final_confidence <= max_confidence)

    return query


def get_analytics_summary(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
) -> Dict[str, Any]:
    mat_query = _get_filtered_materials_query(db, cpse, category, matching_status)
    total_materials = mat_query.count()

    distinct_cpses = (
        mat_query.with_entities(func.count(func.distinct(Material.cpse))).scalar() or 0
    )

    status_rows = (
        mat_query.with_entities(Material.matching_status, func.count(Material.id))
        .group_by(Material.matching_status)
        .all()
    )
    status_map = {row[0].upper(): row[1] for row in status_rows if row[0]}

    matched_count = status_map.get("MATCHED", 0)
    unmatched_count = status_map.get("UNMATCHED", 0)
    suggested_count = status_map.get("SUGGESTED", 0)
    reviewed_count = status_map.get("REVIEWED", 0)
    rejected_count = status_map.get("REJECTED", 0)

    harmonization_rate = (
        round((matched_count / total_materials) * 100.0, 1) if total_materials > 0 else 0.0
    )

    # Pending reviews in matching pipeline
    pending_reviews = (
        db.query(func.count(MaterialMatch.id))
        .filter(MaterialMatch.status == "PENDING")
        .scalar()
        or 0
    )

    # Distinct common material codes and mapped items count
    common_codes_query = mat_query.filter(Material.common_material_code.isnot(None))
    total_mapped_materials = common_codes_query.count()
    total_common_codes = (
        common_codes_query.with_entities(func.count(func.distinct(Material.common_material_code))).scalar()
        or 0
    )

    return {
        "total_materials": total_materials,
        "distinct_cpses": distinct_cpses,
        "matched_materials": matched_count,
        "unmatched_materials": unmatched_count,
        "suggested_materials": suggested_count,
        "reviewed_materials": reviewed_count,
        "rejected_materials": rejected_count,
        "harmonization_rate": harmonization_rate,
        "pending_reviews": pending_reviews,
        "total_common_codes": total_common_codes,
        "total_mapped_materials": total_mapped_materials,
    }


def get_cpse_distribution(
    db: Session,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    # Don't filter by cpse here so user can see cross-CPSE distribution
    query = _get_filtered_materials_query(db, cpse=None, category=category, matching_status=matching_status)
    total_materials = query.count()

    rows = (
        query.with_entities(Material.cpse, func.count(Material.id))
        .group_by(Material.cpse)
        .order_by(func.count(Material.id).desc(), Material.cpse.asc())
        .all()
    )

    result = []
    for cpse_name, count in rows:
        pct = round((count / total_materials) * 100.0, 1) if total_materials > 0 else 0.0
        result.append({
            "cpse": cpse_name,
            "count": count,
            "percentage": pct,
        })
    return result


def get_harmonization_status_distribution(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query = _get_filtered_materials_query(db, cpse=cpse, category=category, matching_status=None)
    total_materials = query.count()

    rows = (
        query.with_entities(Material.matching_status, func.count(Material.id))
        .group_by(Material.matching_status)
        .all()
    )
    status_map = {row[0].upper(): row[1] for row in rows if row[0]}

    ordered_statuses = ["MATCHED", "SUGGESTED", "UNMATCHED", "REVIEWED", "REJECTED"]
    result = []
    for st in ordered_statuses:
        cnt = status_map.get(st, 0)
        pct = round((cnt / total_materials) * 100.0, 1) if total_materials > 0 else 0.0
        result.append({
            "status": st,
            "count": cnt,
            "percentage": pct,
            "color": STATUS_COLORS.get(st, "#64748b"),
        })

    # Add any unexpected statuses if present
    for st, cnt in status_map.items():
        if st not in ordered_statuses:
            pct = round((cnt / total_materials) * 100.0, 1) if total_materials > 0 else 0.0
            result.append({
                "status": st,
                "count": cnt,
                "percentage": pct,
                "color": "#64748b",
            })

    return result


def get_category_distribution(
    db: Session,
    cpse: Optional[str] = None,
    matching_status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query = _get_filtered_materials_query(db, cpse=cpse, category=None, matching_status=matching_status)
    total_materials = query.count()

    rows = (
        query.with_entities(Material.category, func.count(Material.id))
        .group_by(Material.category)
        .order_by(func.count(Material.id).desc())
        .all()
    )

    result = []
    for cat_name, count in rows:
        label = cat_name if cat_name and cat_name.strip() else "Uncategorized"
        pct = round((count / total_materials) * 100.0, 1) if total_materials > 0 else 0.0
        result.append({
            "category": label,
            "count": count,
            "percentage": pct,
        })
    return result


def get_confidence_analytics(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    review_status: Optional[str] = None,
    min_confidence: Optional[float] = None,
    max_confidence: Optional[float] = None,
) -> Dict[str, Any]:
    query = _get_filtered_matches_query(
        db,
        cpse=cpse,
        category=category,
        review_status=review_status,
        min_confidence=min_confidence,
        max_confidence=max_confidence,
    )

    matches = query.all()
    total_matches = len(matches)

    config = MatchingConfig()
    high_threshold = config.HIGH_CONFIDENCE_THRESHOLD  # 90.0
    review_threshold = config.REVIEW_REQUIRED_THRESHOLD  # 70.0

    if total_matches == 0:
        return {
            "avg_confidence": 0.0,
            "high_confidence_count": 0,
            "medium_confidence_count": 0,
            "low_confidence_count": 0,
            "total_matches": 0,
            "high_confidence_threshold": high_threshold,
            "review_required_threshold": review_threshold,
            "buckets": [
                {"bucket": "90-100%", "range_label": "High Confidence (≥ 90%)", "count": 0, "percentage": 0.0},
                {"bucket": "80-89%", "range_label": "Substantial Equivalence (80-89%)", "count": 0, "percentage": 0.0},
                {"bucket": "70-79%", "range_label": "Review Recommended (70-79%)", "count": 0, "percentage": 0.0},
                {"bucket": "<70%", "range_label": "Low Confidence (< 70%)", "count": 0, "percentage": 0.0},
            ],
        }

    conf_values = [m.final_confidence for m in matches]
    avg_conf = round(float(sum(conf_values) / total_matches), 2)

    high_count = sum(1 for c in conf_values if c >= high_threshold)
    med_count = sum(1 for c in conf_values if review_threshold <= c < high_threshold)
    low_count = sum(1 for c in conf_values if c < review_threshold)

    # Detailed buckets
    b_90_100 = sum(1 for c in conf_values if c >= 90.0)
    b_80_89 = sum(1 for c in conf_values if 80.0 <= c < 90.0)
    b_70_79 = sum(1 for c in conf_values if 70.0 <= c < 80.0)
    b_sub_70 = sum(1 for c in conf_values if c < 70.0)

    buckets = [
        {
            "bucket": "90-100%",
            "range_label": "High Confidence (≥ 90%)",
            "count": b_90_100,
            "percentage": round((b_90_100 / total_matches) * 100.0, 1),
        },
        {
            "bucket": "80-89%",
            "range_label": "Substantial Equivalence (80-89%)",
            "count": b_80_89,
            "percentage": round((b_80_89 / total_matches) * 100.0, 1),
        },
        {
            "bucket": "70-79%",
            "range_label": "Review Recommended (70-79%)",
            "count": b_70_79,
            "percentage": round((b_70_79 / total_matches) * 100.0, 1),
        },
        {
            "bucket": "<70%",
            "range_label": "Low Confidence (< 70%)",
            "count": b_sub_70,
            "percentage": round((b_sub_70 / total_matches) * 100.0, 1),
        },
    ]

    return {
        "avg_confidence": avg_conf,
        "high_confidence_count": high_count,
        "medium_confidence_count": med_count,
        "low_confidence_count": low_count,
        "total_matches": total_matches,
        "high_confidence_threshold": high_threshold,
        "review_required_threshold": review_threshold,
        "buckets": buckets,
    }


def get_review_analytics(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    query = _get_filtered_matches_query(db, cpse=cpse, category=category)
    matches = query.all()

    pending_count = sum(1 for m in matches if m.status == "PENDING")
    approved_count = sum(1 for m in matches if m.status == "APPROVED")
    rejected_count = sum(1 for m in matches if m.status == "REJECTED")

    total_reviewed = approved_count + rejected_count
    approval_rate = (
        round((approved_count / total_reviewed) * 100.0, 1) if total_reviewed > 0 else 0.0
    )
    rejection_rate = (
        round((rejected_count / total_reviewed) * 100.0, 1) if total_reviewed > 0 else 0.0
    )

    # Tally actual rejection reasons from rejected recommendations
    reason_counts = defaultdict(int)
    for m in matches:
        if m.status == "REJECTED":
            reason = (m.rejection_reason or "").strip()
            if not reason:
                reason = "No reason specified"
            reason_counts[reason] += 1

    rejection_reasons = [
        {"reason": reason, "count": count}
        for reason, count in sorted(reason_counts.items(), key=lambda x: -x[1])
    ]

    return {
        "pending_count": pending_count,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "total_reviewed": total_reviewed,
        "approval_rate": approval_rate,
        "rejection_rate": rejection_rate,
        "rejection_reasons": rejection_reasons,
    }


def get_common_materials_analytics(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve Common National Material Codes with cross-CPSE coverage,
    mapped source counts, representative category, confidence, and status.
    Sorted dynamically by CPSE coverage descending.
    """
    query = db.query(Material).filter(Material.common_material_code.isnot(None))

    if cpse and cpse.strip() and cpse.strip().lower() != "all":
        # Find common codes that include this CPSE
        codes_for_cpse = (
            db.query(Material.common_material_code)
            .filter(
                func.lower(Material.cpse) == cpse.strip().lower(),
                Material.common_material_code.isnot(None),
            )
            .distinct()
            .all()
        )
        valid_codes = [c[0] for c in codes_for_cpse]
        if not valid_codes:
            return []
        query = query.filter(Material.common_material_code.in_(valid_codes))

    if category and category.strip() and category.strip().lower() != "all":
        query = query.filter(func.lower(Material.category) == category.strip().lower())

    materials = query.all()
    if not materials:
        return []

    # Map approved matches for confidence provenance
    approved_matches = (
        db.query(MaterialMatch)
        .filter(MaterialMatch.status == "APPROVED", MaterialMatch.common_material_code.isnot(None))
        .all()
    )
    conf_by_code = {m.common_material_code: m.final_confidence for m in approved_matches}

    grouped = defaultdict(list)
    for m in materials:
        grouped[m.common_material_code].append(m)

    items = []
    for code, group in grouped.items():
        linked_cpses = sorted(list(set(m.cpse for m in group)))
        cat = group[0].category or "General"
        uom = group[0].uom or "-"
        all_matched = all(m.matching_status == "MATCHED" for m in group)
        status_label = "HARMONIZED" if all_matched else "IN_PROGRESS"

        total_qty = sum(m.annual_quantity or 0.0 for m in group)
        est_spend = sum((m.annual_quantity or 0.0) * (m.approx_unit_price or 0.0) for m in group)

        conf = conf_by_code.get(code)

        items.append({
            "common_material_code": code,
            "cpse_count": len(linked_cpses),
            "original_codes_count": len(group),
            "cpses": linked_cpses,
            "category": cat,
            "uom": uom,
            "confidence": conf,
            "status": status_label,
            "total_annual_quantity": round(total_qty, 2),
            "estimated_spend": round(est_spend, 2),
        })

    # Sort descending by CPSE coverage, then original codes count
    items.sort(key=lambda x: (-x["cpse_count"], -x["original_codes_count"], x["common_material_code"]))
    return items


def get_migration_readiness_analytics(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Migration & Harmonization Readiness Logic:
    1. Ready / Harmonized:
       - Materials with matching_status == 'MATCHED' or valid common_material_code assigned.
       - These have completed reconciliation and have an active National Material Code.
    2. Needs Review:
       - Materials with matching_status == 'SUGGESTED' or involved in pending AI recommendations.
       - Master attributes are sound but cross-CPSE equivalence awaits human verification.
    3. Unmatched / Blocked:
       - Materials with matching_status in ('UNMATCHED', 'REJECTED') or missing critical fields (empty description or empty UOM).
       - Requires catalog enrichment or candidate discovery before harmonization.
    """
    mat_query = _get_filtered_materials_query(db, cpse=cpse, category=category, matching_status=None)
    materials = mat_query.all()
    total = len(materials)

    ready_count = 0
    needs_review_count = 0
    unmatched_blocked_count = 0

    for m in materials:
        status = (m.matching_status or "").upper()
        has_common_code = bool(m.common_material_code and m.common_material_code.strip())

        if status == "MATCHED" or has_common_code:
            ready_count += 1
        elif status == "SUGGESTED":
            needs_review_count += 1
        else:
            unmatched_blocked_count += 1

    ready_pct = round((ready_count / total) * 100.0, 1) if total > 0 else 0.0
    needs_review_pct = round((needs_review_count / total) * 100.0, 1) if total > 0 else 0.0
    unmatched_pct = round((unmatched_blocked_count / total) * 100.0, 1) if total > 0 else 0.0

    items = [
        {
            "state": "Ready / Harmonized",
            "count": ready_count,
            "percentage": ready_pct,
            "description": "Standardized under a verified Common National Material Code; ready for joint procurement.",
        },
        {
            "state": "Needs Review",
            "count": needs_review_count,
            "percentage": needs_review_pct,
            "description": "AI recommendation generated; awaiting domain expert verification.",
        },
        {
            "state": "Unmatched / Blocked",
            "count": unmatched_blocked_count,
            "percentage": unmatched_pct,
            "description": "Currently unmatched across catalogs or pending attribute enrichment.",
        },
    ]

    return {
        "ready_count": ready_count,
        "needs_review_count": needs_review_count,
        "unmatched_blocked_count": unmatched_blocked_count,
        "ready_percentage": ready_pct,
        "needs_review_percentage": needs_review_pct,
        "unmatched_blocked_percentage": unmatched_pct,
        "items": items,
    }


def get_data_quality_analytics(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Data Quality Audit:
    - Missing descriptions
    - Missing UOM
    - Missing category
    - Missing technical specification
    - Cross-CPSE code collisions (identical code strings across different CPSE catalogs)
    - Records requiring review
    - Completeness score (% of records having non-empty description, uom, category, and technical specs)
    """
    mat_query = _get_filtered_materials_query(db, cpse=cpse, category=category, matching_status=None)
    materials = mat_query.all()
    total = len(materials)

    if total == 0:
        return {
            "total_evaluated": 0,
            "missing_descriptions": 0,
            "missing_uom": 0,
            "missing_category": 0,
            "missing_tech_specs": 0,
            "cross_cpse_code_collisions": 0,
            "records_requiring_review": 0,
            "completeness_score": 0.0,
        }

    missing_desc = 0
    missing_uom = 0
    missing_cat = 0
    missing_spec = 0
    fully_complete = 0
    records_req_review = 0

    for m in materials:
        has_desc = bool(m.description and m.description.strip())
        has_uom = bool(m.uom and m.uom.strip())
        has_cat = bool(m.category and m.category.strip())
        has_spec = bool(m.technical_specification and m.technical_specification.strip())

        if not has_desc:
            missing_desc += 1
        if not has_uom:
            missing_uom += 1
        if not has_cat:
            missing_cat += 1
        if not has_spec:
            missing_spec += 1

        if has_desc and has_uom and has_cat and has_spec:
            fully_complete += 1

        if (m.matching_status or "").upper() in ("SUGGESTED", "UNMATCHED"):
            records_req_review += 1

    # Cross-CPSE code collisions: code strings used by more than 1 CPSE
    collision_rows = (
        db.query(Material.material_code)
        .group_by(Material.material_code)
        .having(func.count(func.distinct(Material.cpse)) > 1)
        .all()
    )
    cross_cpse_code_collisions = len(collision_rows)

    completeness_score = round((fully_complete / total) * 100.0, 1)

    return {
        "total_evaluated": total,
        "missing_descriptions": missing_desc,
        "missing_uom": missing_uom,
        "missing_category": missing_cat,
        "missing_tech_specs": missing_spec,
        "cross_cpse_code_collisions": cross_cpse_code_collisions,
        "records_requiring_review": records_req_review,
        "completeness_score": completeness_score,
    }


def get_filter_options(db: Session) -> Dict[str, List[str]]:
    cpse_rows = db.query(Material.cpse).distinct().all()
    cpses = sorted([r[0] for r in cpse_rows if r[0] and r[0].strip()])

    cat_rows = db.query(Material.category).distinct().all()
    categories = sorted([r[0] for r in cat_rows if r[0] and r[0].strip()])

    status_rows = db.query(Material.matching_status).distinct().all()
    statuses = sorted([r[0] for r in status_rows if r[0] and r[0].strip()])

    return {
        "cpses": cpses,
        "categories": categories,
        "statuses": statuses,
    }


def get_full_analytics_overview(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
    review_status: Optional[str] = None,
    min_confidence: Optional[float] = None,
    max_confidence: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Consolidated analytics overview combining all real metrics computed directly
    from SQLite material and match records.
    """
    summary = get_analytics_summary(
        db, cpse=cpse, category=category, matching_status=matching_status
    )
    cpse_dist = get_cpse_distribution(
        db, category=category, matching_status=matching_status
    )
    status_dist = get_harmonization_status_distribution(
        db, cpse=cpse, category=category
    )
    cat_dist = get_category_distribution(
        db, cpse=cpse, matching_status=matching_status
    )
    conf_analytics = get_confidence_analytics(
        db,
        cpse=cpse,
        category=category,
        review_status=review_status,
        min_confidence=min_confidence,
        max_confidence=max_confidence,
    )
    review_analytics = get_review_analytics(
        db, cpse=cpse, category=category
    )
    common_mats = get_common_materials_analytics(
        db, cpse=cpse, category=category
    )
    readiness = get_migration_readiness_analytics(
        db, cpse=cpse, category=category
    )
    quality = get_data_quality_analytics(
        db, cpse=cpse, category=category
    )
    filter_opts = get_filter_options(db)

    return {
        "summary": summary,
        "cpse_distribution": cpse_dist,
        "harmonization_status": status_dist,
        "category_distribution": cat_dist,
        "confidence_distribution": conf_analytics,
        "review": review_analytics,
        "common_materials": common_mats,
        "readiness": readiness,
        "data_quality": quality,
        "filter_options": filter_opts,
        "is_synthetic_dataset": True,
    }
