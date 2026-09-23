from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import material as crud_material
from app.schemas.matching import MatchingCompareRequest, MatchingCompareResponse
from app.services.matcher import compare_materials

router = APIRouter()


@router.post(
    "/compare",
    response_model=MatchingCompareResponse,
    summary="Compare two materials for cross-CPSE equivalence",
    description=(
        "Executes the full AI matching pipeline (normalization, attribute extraction, "
        "semantic embedding cosine similarity, technical rule validation, category/UOM check) "
        "and returns an explainable confidence score and classification."
    ),
)
def compare_material_pair(
    payload: MatchingCompareRequest,
    db: Session = Depends(get_db),
):
    material_a = crud_material.get_material(db, material_id=payload.material_a_id)
    if not material_a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with ID {payload.material_a_id} not found.",
        )

    material_b = crud_material.get_material(db, material_id=payload.material_b_id)
    if not material_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with ID {payload.material_b_id} not found.",
        )

    result = compare_materials(
        desc_a=material_a.description,
        desc_b=material_b.description,
        spec_a=material_a.technical_specification,
        spec_b=material_b.technical_specification,
        category_a=material_a.category,
        category_b=material_b.category,
        uom_a=material_a.uom,
        uom_b=material_b.uom,
        material_a_id=material_a.id,
        material_b_id=material_b.id,
    )

    return result
