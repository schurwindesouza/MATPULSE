from typing import List, Optional, Dict
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialUpdate


def get_material(db: Session, material_id: int) -> Optional[Material]:
    """Retrieve a single material by primary key ID."""
    return db.query(Material).filter(Material.id == material_id).first()


def get_material_by_cpse_and_code(
    db: Session, cpse: str, material_code: str
) -> Optional[Material]:
    """Retrieve a material by its CPSE and internal material code."""
    return (
        db.query(Material)
        .filter(
            func.lower(Material.cpse) == cpse.lower().strip(),
            func.lower(Material.material_code) == material_code.lower().strip(),
        )
        .first()
    )


def get_materials_by_common_code(
    db: Session, common_material_code: str
) -> List[Material]:
    """Retrieve all materials harmonized under a given Common National Material Code."""
    return (
        db.query(Material)
        .filter(Material.common_material_code == common_material_code)
        .all()
    )


def _apply_filters(
    query,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
    common_material_code: Optional[str] = None,
    search: Optional[str] = None,
):
    if cpse:
        query = query.filter(func.lower(Material.cpse) == cpse.lower().strip())
    if category:
        query = query.filter(func.lower(Material.category) == category.lower().strip())
    if matching_status:
        query = query.filter(func.lower(Material.matching_status) == matching_status.lower().strip())
    if common_material_code:
        query = query.filter(Material.common_material_code == common_material_code.strip())
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Material.material_code.ilike(search_pattern),
                Material.description.ilike(search_pattern),
                Material.technical_specification.ilike(search_pattern),
                Material.normalized_description.ilike(search_pattern),
                Material.common_material_code.ilike(search_pattern),
            )
        )
    return query


def get_materials(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
    common_material_code: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Material]:
    """Query materials with pagination and cross-CPSE filters."""
    query = db.query(Material)
    query = _apply_filters(
        query,
        cpse=cpse,
        category=category,
        matching_status=matching_status,
        common_material_code=common_material_code,
        search=search,
    )
    return query.order_by(Material.id.asc()).offset(skip).limit(limit).all()


def count_materials(
    db: Session,
    cpse: Optional[str] = None,
    category: Optional[str] = None,
    matching_status: Optional[str] = None,
    common_material_code: Optional[str] = None,
    search: Optional[str] = None,
) -> int:
    """Count materials matching filter criteria."""
    query = db.query(func.count(Material.id))
    query = _apply_filters(
        query,
        cpse=cpse,
        category=category,
        matching_status=matching_status,
        common_material_code=common_material_code,
        search=search,
    )
    return query.scalar() or 0


def create_material(db: Session, material_in: MaterialCreate) -> Material:
    """Create and persist a new material master record."""
    data = material_in.model_dump()
    db_material = Material(**data)
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


def create_materials_bulk(
    db: Session, materials_in: List[MaterialCreate]
) -> List[Material]:
    """Bulk create materials, returning the created instances."""
    created_materials: List[Material] = []
    for item in materials_in:
        db_material = Material(**item.model_dump())
        db.add(db_material)
        created_materials.append(db_material)
    db.commit()
    for mat in created_materials:
        db.refresh(mat)
    return created_materials


def update_material(
    db: Session, db_material: Material, material_in: MaterialUpdate
) -> Material:
    """Update fields on an existing material record."""
    update_data = material_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_material, field, value)

    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


def delete_material(db: Session, material_id: int) -> Optional[Material]:
    """Delete a material master record by ID."""
    db_material = get_material(db, material_id)
    if db_material:
        db.delete(db_material)
        db.commit()
    return db_material


def get_harmonization_stats(db: Session) -> Dict:
    """Calculate cross-CPSE material harmonization metrics."""
    total_materials = db.query(func.count(Material.id)).scalar() or 0
    distinct_cpses = db.query(func.count(func.distinct(Material.cpse))).scalar() or 0
    unmatched_count = (
        db.query(func.count(Material.id))
        .filter(Material.matching_status == "UNMATCHED")
        .scalar()
        or 0
    )
    matched_count = (
        db.query(func.count(Material.id))
        .filter(Material.matching_status == "MATCHED")
        .scalar()
        or 0
    )
    suggested_count = (
        db.query(func.count(Material.id))
        .filter(Material.matching_status == "SUGGESTED")
        .scalar()
        or 0
    )

    # CPSE breakdown
    cpse_rows = (
        db.query(Material.cpse, func.count(Material.id))
        .group_by(Material.cpse)
        .all()
    )
    cpse_breakdown = {row[0]: row[1] for row in cpse_rows if row[0]}

    # Status breakdown
    status_rows = (
        db.query(Material.matching_status, func.count(Material.id))
        .group_by(Material.matching_status)
        .all()
    )
    status_breakdown = {row[0]: row[1] for row in status_rows if row[0]}

    # Category breakdown
    category_rows = (
        db.query(Material.category, func.count(Material.id))
        .filter(Material.category.isnot(None))
        .group_by(Material.category)
        .all()
    )
    category_breakdown = {row[0]: row[1] for row in category_rows if row[0]}

    return {
        "total_materials": total_materials,
        "distinct_cpses": distinct_cpses,
        "unmatched_count": unmatched_count,
        "matched_count": matched_count,
        "suggested_count": suggested_count,
        "cpse_breakdown": cpse_breakdown,
        "status_breakdown": status_breakdown,
        "category_breakdown": category_breakdown,
    }
