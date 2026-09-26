from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class AnalyticsSummary(BaseModel):
    total_materials: int = Field(..., description="Total material records matching current filter")
    distinct_cpses: int = Field(..., description="Number of distinct CPSE organizations represented")
    matched_materials: int = Field(..., description="Count of harmonized/matched materials")
    unmatched_materials: int = Field(..., description="Count of unmatched materials pending evaluation")
    suggested_materials: int = Field(..., description="Count of materials with AI suggestions")
    reviewed_materials: int = Field(..., description="Count of reviewed materials")
    rejected_materials: int = Field(..., description="Count of rejected materials")
    harmonization_rate: float = Field(..., description="Percentage of materials successfully harmonized")
    pending_reviews: int = Field(..., description="Number of AI match recommendations awaiting human review")
    total_common_codes: int = Field(..., description="Distinct Common National Material Codes assigned")
    total_mapped_materials: int = Field(..., description="Total materials mapped to a Common National Material Code")


class CpseDistributionItem(BaseModel):
    cpse: str
    count: int
    percentage: float


class HarmonizationStatusItem(BaseModel):
    status: str
    count: int
    percentage: float
    color: Optional[str] = None


class CategoryDistributionItem(BaseModel):
    category: str
    count: int
    percentage: float


class ConfidenceBucket(BaseModel):
    bucket: str
    range_label: str
    count: int
    percentage: float


class ConfidenceAnalytics(BaseModel):
    avg_confidence: float
    high_confidence_count: int
    medium_confidence_count: int
    low_confidence_count: int
    total_matches: int
    high_confidence_threshold: float = 90.0
    review_required_threshold: float = 70.0
    buckets: List[ConfidenceBucket]


class RejectionReasonItem(BaseModel):
    reason: str
    count: int


class ReviewAnalytics(BaseModel):
    pending_count: int
    approved_count: int
    rejected_count: int
    total_reviewed: int
    approval_rate: float
    rejection_rate: float
    rejection_reasons: List[RejectionReasonItem]


class CommonMaterialAnalyticsItem(BaseModel):
    common_material_code: str
    cpse_count: int
    original_codes_count: int
    cpses: List[str]
    category: Optional[str] = None
    uom: Optional[str] = None
    confidence: Optional[float] = None
    status: str
    total_annual_quantity: float = 0.0
    estimated_spend: float = 0.0


class DataQualityAnalytics(BaseModel):
    total_evaluated: int
    missing_descriptions: int
    missing_uom: int
    missing_category: int
    missing_tech_specs: int
    cross_cpse_code_collisions: int
    records_requiring_review: int
    completeness_score: float


class MigrationReadinessItem(BaseModel):
    state: str
    count: int
    percentage: float
    description: str


class MigrationReadinessAnalytics(BaseModel):
    ready_count: int
    needs_review_count: int
    unmatched_blocked_count: int
    ready_percentage: float
    needs_review_percentage: float
    unmatched_blocked_percentage: float
    items: List[MigrationReadinessItem]


class FilterOptions(BaseModel):
    cpses: List[str]
    categories: List[str]
    statuses: List[str]


class AnalyticsOverviewResponse(BaseModel):
    summary: AnalyticsSummary
    cpse_distribution: List[CpseDistributionItem]
    harmonization_status: List[HarmonizationStatusItem]
    category_distribution: List[CategoryDistributionItem]
    confidence_distribution: ConfidenceAnalytics
    review: ReviewAnalytics
    common_materials: List[CommonMaterialAnalyticsItem]
    readiness: MigrationReadinessAnalytics
    data_quality: DataQualityAnalytics
    filter_options: FilterOptions
    is_synthetic_dataset: bool = True
