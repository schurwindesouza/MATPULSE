from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import material as crud_material
from app.schemas.matching import (
    MatchingCompareRequest,
    MatchingCompareResponse,
    BatchMatchingRequest,
    BatchMatchingResponse,
)
from app.services.matcher import compare_materials
from app.services.candidate_matcher import find_material_matches

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


@router.post(
    "/batch",
    response_model=BatchMatchingResponse,
    summary="Batch cross-CPSE candidate matching",
    description=(
        "Evaluates cross-CPSE candidate pairs across materials stored in the database. "
        "Generates plausible candidate pairs, prevents self-matches and duplicate pair evaluations, "
        "ranks matches by final confidence descending, and returns the top_k candidate matches."
    ),
)
def batch_match_materials(
    payload: Optional[BatchMatchingRequest] = None,
    top_k: int = Query(5, ge=1, le=50, description="Max candidate matches to return per material"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0, description="Optional minimum confidence filter"),
    cpse: Optional[str] = Query(None, description="Optional filter for source CPSE"),
    db: Session = Depends(get_db),
):
    # Resolve parameters: payload takes precedence over query params if supplied
    effective_top_k = payload.top_k if payload and payload.top_k is not None else top_k
    effective_min_conf = (
        payload.min_confidence
        if payload and payload.min_confidence is not None
        else (min_confidence if min_confidence is not None else 0.0)
    )
    effective_cpse = payload.cpse if payload and payload.cpse is not None else cpse

    # Fetch materials from database
    materials = crud_material.get_materials(db, skip=0, limit=500)

    # Run batch candidate matching
    batch_results = find_material_matches(
        materials=materials,
        top_k=effective_top_k,
        min_confidence=effective_min_conf,
        target_cpse=effective_cpse,
    )

    return batch_results
