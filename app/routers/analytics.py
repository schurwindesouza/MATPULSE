from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import analytics as crud_analytics
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AnalyticsSummary,
    CpseDistributionItem,
    HarmonizationStatusItem,
    CategoryDistributionItem,
    ConfidenceAnalytics,
    ReviewAnalytics,
    CommonMaterialAnalyticsItem,
    MigrationReadinessAnalytics,
    DataQualityAnalytics,
)

router = APIRouter()


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Get consolidated cross-CPSE material analytics overview",
    description=(
        "Returns comprehensive real-time analytics computed directly from material masters "
        "and AI match recommendations: summary KPIs, CPSE distribution, harmonization status, "
        "category breakdown, confidence metrics, review activity, common materials, "
        "migration readiness, and data quality metrics."
    ),
)
def get_analytics_overview(
    cpse: Optional[str] = Query(None, description="Filter analytics by CPSE organization"),
    category: Optional[str] = Query(None, description="Filter analytics by material category"),
    matching_status: Optional[str] = Query(None, description="Filter by matching status (e.g. MATCHED, SUGGESTED, UNMATCHED)"),
    review_status: Optional[str] = Query(None, description="Filter match metrics by review status (PENDING, APPROVED, REJECTED)"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum confidence filter"),
    max_confidence: Optional[float] = Query(None, ge=0.0, le=100.0, description="Maximum confidence filter"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_full_analytics_overview(
        db,
        cpse=cpse,
        category=category,
        matching_status=matching_status,
        review_status=review_status,
        min_confidence=min_confidence,
        max_confidence=max_confidence,
    )


@router.get(
    "/summary",
    response_model=AnalyticsSummary,
    summary="Get core material harmonization KPI summary",
    description="Returns aggregate counts: total records, connected CPSEs, matched, suggested, unmatched, harmonization rate.",
)
def get_analytics_summary(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    matching_status: Optional[str] = Query(None, description="Filter by matching status"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_analytics_summary(
        db, cpse=cpse, category=category, matching_status=matching_status
    )


@router.get(
    "/cpse-distribution",
    response_model=List[CpseDistributionItem],
    summary="Get material volume breakdown across CPSEs",
    description="Returns material count and percentage distribution for each participating CPSE enterprise.",
)
def get_cpse_distribution(
    category: Optional[str] = Query(None, description="Filter by category"),
    matching_status: Optional[str] = Query(None, description="Filter by matching status"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_cpse_distribution(
        db, category=category, matching_status=matching_status
    )


@router.get(
    "/harmonization-status",
    response_model=List[HarmonizationStatusItem],
    summary="Get harmonization status distribution",
    description="Returns breakdown of materials by status: MATCHED, SUGGESTED, UNMATCHED, REVIEWED, REJECTED.",
)
def get_harmonization_status_distribution(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_harmonization_status_distribution(
        db, cpse=cpse, category=category
    )


@router.get(
    "/category-distribution",
    response_model=List[CategoryDistributionItem],
    summary="Get category-wise material distribution",
    description="Returns material counts and percentages grouped by industrial category.",
)
def get_category_distribution(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    matching_status: Optional[str] = Query(None, description="Filter by matching status"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_category_distribution(
        db, cpse=cpse, matching_status=matching_status
    )


@router.get(
    "/confidence",
    response_model=ConfidenceAnalytics,
    summary="Get match confidence scoring analytics",
    description="Returns average confidence, high/medium/low confidence counts, and bucketed score distribution.",
)
def get_confidence_analytics(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    review_status: Optional[str] = Query(None, description="Filter by review status"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=100.0),
    max_confidence: Optional[float] = Query(None, ge=0.0, le=100.0),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_confidence_analytics(
        db,
        cpse=cpse,
        category=category,
        review_status=review_status,
        min_confidence=min_confidence,
        max_confidence=max_confidence,
    )


@router.get(
    "/review",
    response_model=ReviewAnalytics,
    summary="Get review queue and decision analytics",
    description="Returns pending, approved, and rejected recommendation counts, approval/rejection rates, and stored rejection reasons.",
)
def get_review_analytics(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_review_analytics(
        db, cpse=cpse, category=category
    )


@router.get(
    "/common-materials",
    response_model=List[CommonMaterialAnalyticsItem],
    summary="Get common national material codes analytics",
    description="Returns Common National Material Codes ranked by cross-CPSE coverage with original code counts and confidence.",
)
def get_common_materials_analytics(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_common_materials_analytics(
        db, cpse=cpse, category=category
    )


@router.get(
    "/readiness",
    response_model=MigrationReadinessAnalytics,
    summary="Get migration & harmonization readiness breakdown",
    description="Returns counts and percentages for Ready / Harmonized, Needs Review, and Unmatched / Blocked states.",
)
def get_migration_readiness_analytics(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_migration_readiness_analytics(
        db, cpse=cpse, category=category
    )


@router.get(
    "/data-quality",
    response_model=DataQualityAnalytics,
    summary="Get catalog data quality and completeness audit",
    description="Returns missing attribute counts, cross-CPSE code collisions, and overall data completeness score.",
)
def get_data_quality_analytics(
    cpse: Optional[str] = Query(None, description="Filter by CPSE"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    return crud_analytics.get_data_quality_analytics(
        db, cpse=cpse, category=category
    )
