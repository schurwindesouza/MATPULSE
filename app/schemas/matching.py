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
