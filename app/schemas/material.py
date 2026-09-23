from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict, Field


class MaterialBase(BaseModel):
    cpse: str = Field(..., min_length=1, max_length=100, description="CPSE Name or Acronym (e.g. BHEL, NTPC, ONGC, SAIL)")
    material_code: str = Field(..., min_length=1, max_length=100, description="Original CPSE internal material code")
    description: str = Field(..., min_length=1, description="Original material description from CPSE catalog")
    technical_specification: Optional[str] = Field(None, description="Technical specifications, standards (e.g. ASTM/IS), dimensions, grade")
    uom: Optional[str] = Field(None, max_length=50, description="Unit of measurement (e.g. MT, EA, MTR, KG)")
    category: Optional[str] = Field(None, max_length=100, description="Category or material group (e.g. Pipes, Valves)")
    annual_quantity: Optional[float] = Field(None, ge=0.0, description="Estimated annual procurement quantity")
    approx_unit_price: Optional[float] = Field(None, ge=0.0, description="Estimated unit price in INR")
    normalized_description: Optional[str] = Field(None, description="Preprocessed/normalized text for AI vector/text matching")
    common_material_code: Optional[str] = Field(None, max_length=100, description="Unified Common National Material Code")
    matching_status: str = Field("UNMATCHED", max_length=50, description="Status: UNMATCHED, SUGGESTED, MATCHED, REVIEWED, REJECTED")


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    cpse: Optional[str] = Field(None, min_length=1, max_length=100)
    material_code: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1)
    technical_specification: Optional[str] = None
    uom: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    annual_quantity: Optional[float] = Field(None, ge=0.0)
    approx_unit_price: Optional[float] = Field(None, ge=0.0)
    normalized_description: Optional[str] = None
    common_material_code: Optional[str] = Field(None, max_length=100)
    matching_status: Optional[str] = Field(None, max_length=50)


class MaterialBulkCreate(BaseModel):
    items: List[MaterialCreate] = Field(..., min_length=1, description="List of materials to bulk insert")


class MaterialResponse(MaterialBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HarmonizationStatsResponse(BaseModel):
    total_materials: int
    distinct_cpses: int
    unmatched_count: int
    matched_count: int
    suggested_count: int
    cpse_breakdown: Dict[str, int]
    status_breakdown: Dict[str, int]
    category_breakdown: Dict[str, int]


class CommonMaterialProvenance(BaseModel):
    match_id: Optional[int] = None
    final_confidence: Optional[float] = None
    classification: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reasons: List[str] = Field(default_factory=list)


class CommonMaterialSummary(BaseModel):
    common_material_code: str
    description: str
    category: Optional[str] = None
    uom: Optional[str] = None
    mappings_count: int
    linked_cpses: List[str]
    linked_materials: List[MaterialResponse]
    provenance: Optional[CommonMaterialProvenance] = None
    total_annual_quantity: float = 0.0
    estimated_spend: float = 0.0


class CommonMaterialCatalogResponse(BaseModel):
    total_codes: int
    total_mapped_materials: int
    items: List[CommonMaterialSummary]

