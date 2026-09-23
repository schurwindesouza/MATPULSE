from typing import Optional, List
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from app.models.match import MaterialMatch
from app.models.material import Material


def get_match(db: Session, match_id: int) -> Optional[MaterialMatch]:
    """Retrieve a single match recommendation by ID."""
    return db.query(MaterialMatch).filter(MaterialMatch.id == match_id).first()


def get_match_by_pair(db: Session, id_a: int, id_b: int) -> Optional[MaterialMatch]:
    """Retrieve a match recommendation by its canonical material IDs."""
    canon_a = min(id_a, id_b)
    canon_b = max(id_a, id_b)
    return (
        db.query(MaterialMatch)
        .filter(
            MaterialMatch.material_a_id == canon_a,
            MaterialMatch.material_b_id == canon_b,
        )
        .first()
    )


def get_review_queue(
    db: Session,
    status: Optional[str] = None,
    min_confidence: Optional[float] = None,
    classification: Optional[str] = None,
    cpse: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[MaterialMatch]:
    """Query match recommendations for human review with optional filters."""
    query = db.query(MaterialMatch)

    if status:
        normalized_status = status.strip().lower()
        if normalized_status in ("pending", "pending_review", "pending-review"):
            query = query.filter(MaterialMatch.status == "PENDING")
        elif normalized_status in ("approved", "matched"):
            query = query.filter(MaterialMatch.status == "APPROVED")
        elif normalized_status in ("rejected",):
            query = query.filter(MaterialMatch.status == "REJECTED")
        else:
            query = query.filter(func.lower(MaterialMatch.status) == normalized_status)

    if min_confidence is not None:
        query = query.filter(MaterialMatch.final_confidence >= min_confidence)

    if classification:
        query = query.filter(
            func.lower(MaterialMatch.classification) == classification.strip().lower()
        )

    if cpse:
        from sqlalchemy.orm import aliased
        cpse_pattern = cpse.strip().lower()
        mat_a = aliased(Material)
        mat_b = aliased(Material)
        query = query.join(mat_a, MaterialMatch.material_a_id == mat_a.id).join(
            mat_b, MaterialMatch.material_b_id == mat_b.id
        )
        query = query.filter(
            or_(
                func.lower(mat_a.cpse) == cpse_pattern,
                func.lower(mat_b.cpse) == cpse_pattern,
            )
        )

    return (
        query.order_by(MaterialMatch.final_confidence.desc(), MaterialMatch.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_match_record(db: Session, match_data: dict) -> MaterialMatch:
    """Create and persist a new match recommendation."""
    id_a = match_data["material_a_id"]
    id_b = match_data["material_b_id"]

    canon_a = min(id_a, id_b)
    canon_b = max(id_a, id_b)

    payload = dict(match_data)
    payload["material_a_id"] = canon_a
    payload["material_b_id"] = canon_b

    db_match = MaterialMatch(**payload)
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match


def approve_match(
    db: Session, match: MaterialMatch, common_material_code: str
) -> MaterialMatch:
    """
    Approve an AI recommendation:
    1. Sets match status to APPROVED and records reviewed_at.
    2. Saves common_material_code on the match.
    3. Assigns common_material_code to both material master records.
    4. Sets matching_status to MATCHED on both materials.
    5. STRICTLY PRESERVES original CPSE material_code on both materials.
    """
    match.status = "APPROVED"
    match.common_material_code = common_material_code
    match.reviewed_at = func.now()

    # Update Material A (preserve original material_code)
    if match.material_a:
        match.material_a.common_material_code = common_material_code
        match.material_a.matching_status = "MATCHED"

    # Update Material B (preserve original material_code)
    if match.material_b:
        match.material_b.common_material_code = common_material_code
        match.material_b.matching_status = "MATCHED"

    db.commit()
    db.refresh(match)
    return match


def reject_match(
    db: Session, match: MaterialMatch, reason: Optional[str] = None
) -> MaterialMatch:
    """
    Reject an AI recommendation:
    1. Sets match status to REJECTED.
    2. Records rejection_reason and reviewed_at.
    3. Leaves original material master records completely untouched.
    """
    match.status = "REJECTED"
    match.rejection_reason = reason
    match.reviewed_at = func.now()

    db.commit()
    db.refresh(match)
    return match


def get_match_stats(db: Session) -> dict:
    """Calculate matching pipeline statistics across persisted recommendations."""
    total_recommendations = db.query(func.count(MaterialMatch.id)).scalar() or 0
    pending_count = (
        db.query(func.count(MaterialMatch.id))
        .filter(MaterialMatch.status == "PENDING")
        .scalar()
        or 0
    )
    approved_count = (
        db.query(func.count(MaterialMatch.id))
        .filter(MaterialMatch.status == "APPROVED")
        .scalar()
        or 0
    )
    rejected_count = (
        db.query(func.count(MaterialMatch.id))
        .filter(MaterialMatch.status == "REJECTED")
        .scalar()
        or 0
    )
    high_confidence_count = (
        db.query(func.count(MaterialMatch.id))
        .filter(MaterialMatch.classification == "HIGH_CONFIDENCE_MATCH")
        .scalar()
        or 0
    )
    review_required_count = (
        db.query(func.count(MaterialMatch.id))
        .filter(MaterialMatch.classification == "REVIEW_REQUIRED")
        .scalar()
        or 0
    )
    avg_confidence = (
        db.query(func.avg(MaterialMatch.final_confidence)).scalar() or 0.0
    )

    return {
        "total_recommendations": total_recommendations,
        "pending_count": pending_count,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "high_confidence_count": high_confidence_count,
        "review_required_count": review_required_count,
        "avg_confidence": round(float(avg_confidence), 2),
    }
