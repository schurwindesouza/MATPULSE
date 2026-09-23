from typing import Optional, Dict, List
from pydantic import BaseModel, Field


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
