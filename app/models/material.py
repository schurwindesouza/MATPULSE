from sqlalchemy import Column, Integer, String, Float, Text, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class Material(Base):
    """
    Material Master Record for SIH Problem Statement 26099:
    AI-driven standardization and harmonization of material codes across CPSEs.
    """
    __tablename__ = "materials"
    __table_args__ = (
        UniqueConstraint("cpse", "material_code", name="uix_cpse_material_code"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cpse = Column(String(100), index=True, nullable=False)  # e.g., BHEL, NTPC, ONGC, SAIL, IOCL
    material_code = Column(String(100), index=True, nullable=False)  # Original CPSE internal code
    description = Column(Text, nullable=False)  # Original CPSE description
    technical_specification = Column(Text, nullable=True)  # Detailed standards, grades, dimensions
    uom = Column(String(50), nullable=True)  # Unit of Measurement (e.g. MT, EA, MTR, KG)
    category = Column(String(100), index=True, nullable=True)  # e.g. Pipes & Fittings, Valves
    annual_quantity = Column(Float, nullable=True)  # Annual procurement volume
    approx_unit_price = Column(Float, nullable=True)  # Estimated unit price in INR
    normalized_description = Column(Text, nullable=True)  # Cleaned / tokenized text for AI matching
    common_material_code = Column(String(100), index=True, nullable=True)  # Unified National Material Code
    matching_status = Column(String(50), default="UNMATCHED", nullable=False)  # UNMATCHED, SUGGESTED, MATCHED, REVIEWED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Material(id={self.id}, cpse='{self.cpse}', code='{self.material_code}', status='{self.matching_status}')>"
