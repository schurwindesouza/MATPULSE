from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import material as crud_material
from app.schemas.material import (
    MaterialCreate,
    MaterialUpdate,
    MaterialBulkCreate,
    MaterialResponse,
    HarmonizationStatsResponse,
)

router = APIRouter()


@router.get(
    "/stats",
    response_model=HarmonizationStatsResponse,
    summary="Get cross-CPSE harmonization statistics",
    description="Returns high-level harmonization metrics: total materials, distinct CPSEs, breakdown by matching status and CPSE.",
)
def get_harmonization_stats(db: Session = Depends(get_db)):
    return crud_material.get_harmonization_stats(db)


@router.get(
    "/common/{common_material_code}",
    response_model=List[MaterialResponse],
    summary="Get materials harmonized under a Common National Material Code",
    description="Retrieve all CPSE materials mapped or harmonized to a given Common National Material Code.",
)
def read_materials_by_common_code(
    common_material_code: str,
    db: Session = Depends(get_db),
):
    return crud_material.get_materials_by_common_code(
        db, common_material_code=common_material_code
    )


@router.get(
    "/",
    response_model=List[MaterialResponse],
    summary="List and filter materials across CPSEs",
    description="Query material master records with pagination, filtering by CPSE, category, matching status, and full-text search.",
)
def read_materials(
    skip: int = Query(0, ge=0, description="Records to skip for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    cpse: Optional[str] = Query(None, description="Filter by CPSE name (e.g. BHEL, NTPC, ONGC)"),
    category: Optional[str] = Query(None, description="Filter by material category"),
    matching_status: Optional[str] = Query(None, description="Filter by status (UNMATCHED, SUGGESTED, MATCHED, REVIEWED)"),
    common_material_code: Optional[str] = Query(None, description="Filter by assigned common material code"),
    search: Optional[str] = Query(None, description="Search across material code, description, specifications, and normalized description"),
    db: Session = Depends(get_db),
):
    materials = crud_material.get_materials(
        db,
        skip=skip,
        limit=limit,
        cpse=cpse,
        category=category,
        matching_status=matching_status,
        common_material_code=common_material_code,
        search=search,
    )
    return materials


@router.post(
    "/",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new material master record",
    description="Register a material code and specification from a CPSE catalog.",
)
def create_material(
    material_in: MaterialCreate,
    db: Session = Depends(get_db),
):
    existing = crud_material.get_material_by_cpse_and_code(
        db, cpse=material_in.cpse, material_code=material_in.material_code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material code '{material_in.material_code}' already exists for CPSE '{material_in.cpse}'.",
        )
    return crud_material.create_material(db, material_in=material_in)


@router.post(
    "/bulk",
    response_model=List[MaterialResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Bulk upload CPSE materials",
    description="Batch upload multiple material records for catalog ingestion.",
)
def create_materials_bulk(
    bulk_in: MaterialBulkCreate,
    db: Session = Depends(get_db),
):
    # Check for duplicates within payload or existing in DB
    seen = set()
    for item in bulk_in.items:
        key = (item.cpse.strip().lower(), item.material_code.strip().lower())
        if key in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate entry in bulk payload for CPSE '{item.cpse}' and code '{item.material_code}'.",
            )
        seen.add(key)

        existing = crud_material.get_material_by_cpse_and_code(
            db, cpse=item.cpse, material_code=item.material_code
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Material code '{item.material_code}' already exists for CPSE '{item.cpse}'.",
            )

    return crud_material.create_materials_bulk(db, materials_in=bulk_in.items)


@router.get(
    "/{material_id}",
    response_model=MaterialResponse,
    summary="Get material details by ID",
)
def read_material(
    material_id: int,
    db: Session = Depends(get_db),
):
    material = crud_material.get_material(db, material_id=material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with ID {material_id} not found.",
        )
    return material


@router.put(
    "/{material_id}",
    response_model=MaterialResponse,
    summary="Update material details",
    description="Update material attributes, assign common material code, or update matching status.",
)
def update_material(
    material_id: int,
    material_in: MaterialUpdate,
    db: Session = Depends(get_db),
):
    material = crud_material.get_material(db, material_id=material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with ID {material_id} not found.",
        )

    # Check for collision if cpse or material_code is changed
    target_cpse = material_in.cpse or material.cpse
    target_code = material_in.material_code or material.material_code
    if (target_cpse != material.cpse) or (target_code != material.material_code):
        conflict = crud_material.get_material_by_cpse_and_code(
            db, cpse=target_cpse, material_code=target_code
        )
        if conflict and conflict.id != material.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Material code '{target_code}' already exists for CPSE '{target_cpse}'.",
            )

    return crud_material.update_material(
        db, db_material=material, material_in=material_in
    )


@router.delete(
    "/{material_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete material",
)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
):
    material = crud_material.get_material(db, material_id=material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with ID {material_id} not found.",
        )
    crud_material.delete_material(db, material_id=material_id)
    return {"message": "Material deleted successfully", "id": material_id}
