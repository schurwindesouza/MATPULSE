from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import material as crud_material
from app.crud import match as crud_match
from app.schemas.matching import (
    MatchingCompareRequest,
    MatchingCompareResponse,
    BatchMatchingRequest,
    BatchMatchingResponse,
    GenerateMatchesRequest,
    GenerateMatchesResponse,
    MatchReviewQueueItem,
    MatchDetailResponse,
    ApproveMatchRequest,
    RejectMatchRequest,
    MatchingStatsResponse,
)
from app.services.matcher import compare_materials
from app.services.candidate_matcher import generate_candidate_pairs, find_material_matches

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
    effective_top_k = payload.top_k if payload and payload.top_k is not None else top_k
    effective_min_conf = (
        payload.min_confidence
        if payload and payload.min_confidence is not None
        else (min_confidence if min_confidence is not None else 0.0)
    )
    effective_cpse = payload.cpse if payload and payload.cpse is not None else cpse

    materials = crud_material.get_materials(db, skip=0, limit=500)

    batch_results = find_material_matches(
        materials=materials,
        top_k=effective_top_k,
        min_confidence=effective_min_conf,
        target_cpse=effective_cpse,
    )

    return batch_results


# --- Phase 4 Workflow Endpoints ---

@router.post(
    "/generate",
    response_model=GenerateMatchesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and persist AI match recommendations",
    description=(
        "Executes cross-CPSE candidate matching on database materials and persists newly discovered "
        "matches above min_confidence into the review queue with status 'PENDING'. "
        "Avoids duplicate pair creation and leaves material master records untouched."
    ),
)
def generate_and_persist_matches(
    payload: Optional[GenerateMatchesRequest] = None,
    db: Session = Depends(get_db),
):
    top_k = payload.top_k if payload else 5
    min_confidence = payload.min_confidence if payload else 70.0

    materials = crud_material.get_materials(db, skip=0, limit=500)
    candidate_pairs = generate_candidate_pairs(materials)

    matches_created = 0
    matches_skipped = 0
    total_candidates = 0

    for m_a, m_b in candidate_pairs:
        res = compare_materials(
            desc_a=m_a.description,
            desc_b=m_b.description,
            spec_a=m_a.technical_specification,
            spec_b=m_b.technical_specification,
            category_a=m_a.category,
            category_b=m_b.category,
            uom_a=m_a.uom,
            uom_b=m_b.uom,
            material_a_id=m_a.id,
            material_b_id=m_b.id,
        )

        confidence = res["final_confidence"]
        if confidence < min_confidence:
            continue

        total_candidates += 1

        # Check for existing match record
        existing = crud_match.get_match_by_pair(db, id_a=m_a.id, id_b=m_b.id)
        if existing:
            matches_skipped += 1
            continue

        # Persist new recommendation
        match_record = {
            "material_a_id": m_a.id,
            "material_b_id": m_b.id,
            "semantic_score": res["semantic_score"],
            "technical_score": res["technical_score"],
            "category_score": res["category_score"],
            "uom_score": res["uom_score"],
            "final_confidence": confidence,
            "classification": res["classification"],
            "status": "PENDING",
            "common_material_code": None,
            "reasons": res["reasons"],
            "warnings": res["warnings"],
            "attribute_comparison": res["attribute_comparison"],
        }
        crud_match.create_match_record(db, match_record)
        matches_created += 1

    return {
        "matches_created": matches_created,
        "matches_skipped": matches_skipped,
        "total_candidates": total_candidates,
    }


@router.get(
    "/review-queue",
    response_model=List[MatchReviewQueueItem],
    summary="Get match recommendations review queue",
    description="Retrieve persisted match recommendations for human review with optional filtering.",
)
def get_match_review_queue(
    status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, REJECTED)"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum confidence filter"),
    classification: Optional[str] = Query(None, description="Filter by classification (HIGH_CONFIDENCE_MATCH, REVIEW_REQUIRED)"),
    cpse: Optional[str] = Query(None, description="Filter matches involving a specific CPSE"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return crud_match.get_review_queue(
        db=db,
        status=status,
        min_confidence=min_confidence,
        classification=classification,
        cpse=cpse,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=MatchingStatsResponse,
    summary="Get persistent AI matching recommendations pipeline statistics",
    description="Returns total match count, breakdown by review status and classification, and average confidence.",
)
def get_matching_pipeline_stats(
    db: Session = Depends(get_db),
):
    return crud_match.get_match_stats(db=db)


@router.get(
    "/{match_id}",
    response_model=MatchDetailResponse,
    summary="Get full details for a match recommendation",
    description="Inspect full AI explainability metrics, attribute comparison, and original CPSE material records.",
)
def get_match_details(
    match_id: int,
    db: Session = Depends(get_db),
):
    match = crud_match.get_match(db, match_id=match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match recommendation with ID {match_id} not found.",
        )
    return match


@router.post(
    "/{match_id}/approve",
    response_model=MatchDetailResponse,
    summary="Approve match recommendation and assign Common Material Code",
    description=(
        "Approve the AI recommendation, assign the Common Material Code to both materials, "
        "and set their matching_status to MATCHED. Preserves original CPSE material codes."
    ),
)
def approve_match_recommendation(
    match_id: int,
    payload: ApproveMatchRequest,
    db: Session = Depends(get_db),
):
    match = crud_match.get_match(db, match_id=match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match recommendation with ID {match_id} not found.",
        )

    updated_match = crud_match.approve_match(
        db=db,
        match=match,
        common_material_code=payload.common_material_code.strip(),
    )
    return updated_match


@router.post(
    "/{match_id}/reject",
    response_model=MatchDetailResponse,
    summary="Reject match recommendation",
    description="Reject the AI recommendation with optional explanation. Leaves material master records untouched.",
)
def reject_match_recommendation(
    match_id: int,
    payload: Optional[RejectMatchRequest] = None,
    db: Session = Depends(get_db),
):
    match = crud_match.get_match(db, match_id=match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match recommendation with ID {match_id} not found.",
        )

    reason = payload.reason if payload else None
    updated_match = crud_match.reject_match(
        db=db,
        match=match,
        reason=reason,
    )
    return updated_match
