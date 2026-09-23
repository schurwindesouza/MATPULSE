from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.material import MaterialResponse


class MatchingCompareRequest(BaseModel):
    material_a_id: int = Field(..., description="Database ID of the first material")
    material_b_id: int = Field(..., description="Database ID of the second material")


class MatchingCompareResponse(BaseModel):
    material_a_id: Optional[int] = Field(None, description="Material A ID")
    material_b_id: Optional[int] = Field(None, description="Material B ID")
    semantic_score: float = Field(..., description="Semantic cosine similarity (0 - 100)")
    technical_score: float = Field(..., description="Deterministic technical compatibility (0 - 100)")
    category_score: float = Field(..., description="Category compatibility score (0 - 100)")
    uom_score: float = Field(..., description="Unit of measurement compatibility score (0 - 100)")
    final_confidence: float = Field(..., description="Combined weighted confidence score (0 - 100)")
    classification: str = Field(..., description="HIGH_CONFIDENCE_MATCH | REVIEW_REQUIRED | LOW_CONFIDENCE")
    attribute_comparison: Dict[str, str] = Field(..., description="Per-attribute status (MATCH, MISMATCH, UNKNOWN)")
    reasons: List[str] = Field(default_factory=list, description="Explanations supporting the match")
    warnings: List[str] = Field(default_factory=list, description="Warnings or reasons for penalty/mismatch")


class BatchMatchingRequest(BaseModel):
    top_k: int = Field(5, ge=1, le=50, description="Max candidate matches to return per material")
    min_confidence: Optional[float] = Field(0.0, ge=0.0, le=100.0, description="Optional minimum confidence threshold (0 - 100)")
    cpse: Optional[str] = Field(None, description="Optional filter to limit source materials to a specific CPSE")


class MaterialMatchCandidate(BaseModel):
    material_id: Optional[int] = Field(None, description="Matched candidate material ID")
    cpse: str = Field(..., description="CPSE of the matched material")
    material_code: str = Field(..., description="Material code of the matched material")
    description: str = Field(..., description="Description of the matched material")
    final_confidence: float = Field(..., description="Combined confidence score (0 - 100)")
    classification: str = Field(..., description="Classification category")
    semantic_score: float = Field(..., description="Semantic score")
    technical_score: float = Field(..., description="Technical score")
    category_score: float = Field(..., description="Category score")
    uom_score: float = Field(..., description="UOM score")
    reasons: List[str] = Field(default_factory=list, description="Positive match reasons")
    warnings: List[str] = Field(default_factory=list, description="Warnings / discrepancy notices")
    attribute_comparison: Dict[str, str] = Field(default_factory=dict, description="Attribute comparison mapping")


class MaterialBatchMatchResult(BaseModel):
    material_id: Optional[int] = Field(None, description="Source material ID")
    cpse: str = Field(..., description="Source CPSE")
    material_code: str = Field(..., description="Source material code")
    description: str = Field(..., description="Source description")
    category: Optional[str] = Field(None, description="Source category")
    matches_count: int = Field(..., description="Total candidate matches found above threshold")
    matches: List[MaterialMatchCandidate] = Field(default_factory=list, description="Top ranked matches")


class BatchMatchingResponse(BaseModel):
    total_materials: int = Field(..., description="Total materials considered")
    pairs_evaluated: int = Field(..., description="Total unique cross-CPSE candidate pairs evaluated")
    results: List[MaterialBatchMatchResult] = Field(..., description="Ranked matches per material")


# --- Phase 4 Schemas: Persistence & Human Review Workflow ---

class GenerateMatchesRequest(BaseModel):
    top_k: int = Field(5, ge=1, le=50, description="Max candidate matches per material to consider")
    min_confidence: float = Field(70.0, ge=0.0, le=100.0, description="Minimum confidence threshold to persist")


class GenerateMatchesResponse(BaseModel):
    matches_created: int = Field(..., description="New pending match recommendations created")
    matches_skipped: int = Field(..., description="Candidate matches skipped due to deduplication or existing records")
    total_candidates: int = Field(..., description="Total candidate matches above confidence threshold")


class MaterialSummary(BaseModel):
    id: int
    cpse: str
    material_code: str
    description: str
    category: Optional[str] = None
    uom: Optional[str] = None
    common_material_code: Optional[str] = None
    matching_status: str

    model_config = ConfigDict(from_attributes=True)


class MatchReviewQueueItem(BaseModel):
    id: int
    material_a: MaterialSummary
    material_b: MaterialSummary
    final_confidence: float
    classification: str
    status: str
    common_material_code: Optional[str] = None
    reasons: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MatchDetailResponse(BaseModel):
    id: int
    status: str
    final_confidence: float
    classification: str
    semantic_score: float
    technical_score: float
    category_score: float
    uom_score: float
    common_material_code: Optional[str] = None
    attribute_comparison: Dict[str, str] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    rejection_reason: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    material_a: MaterialResponse
    material_b: MaterialResponse

    model_config = ConfigDict(from_attributes=True)


class ApproveMatchRequest(BaseModel):
    common_material_code: str = Field(..., min_length=1, max_length=100, description="Assigned Common National Material Code (e.g. NMC-PIP-CS-50NB-40)")


class RejectMatchRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Optional rejection explanation")
