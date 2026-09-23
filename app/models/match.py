from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MaterialMatch(Base):
    """
    Persistent Match Recommendation for SIH Problem Statement 26099:
    AI-driven standardization and harmonization of material codes across CPSEs.
    """
    __tablename__ = "material_matches"
    __table_args__ = (
        UniqueConstraint("material_a_id", "material_b_id", name="uix_material_match_pair"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_a_id = Column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    material_b_id = Column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    semantic_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    category_score = Column(Float, nullable=False)
    uom_score = Column(Float, nullable=False)
    final_confidence = Column(Float, nullable=False, index=True)

    classification = Column(String(50), nullable=False)  # HIGH_CONFIDENCE_MATCH, REVIEW_REQUIRED, LOW_CONFIDENCE
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    common_material_code = Column(String(100), nullable=True, index=True)

    reasons = Column(JSON, nullable=True)  # List[str] serialized as JSON
    warnings = Column(JSON, nullable=True)  # List[str] serialized as JSON
    attribute_comparison = Column(JSON, nullable=True)  # Dict[str, str] serialized as JSON
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relational navigation
    material_a = relationship("Material", foreign_keys=[material_a_id], lazy="joined")
    material_b = relationship("Material", foreign_keys=[material_b_id], lazy="joined")

    def __repr__(self) -> str:
        return (
            f"<MaterialMatch(id={self.id}, pair=({self.material_a_id}, {self.material_b_id}), "
            f"conf={self.final_confidence}%, status='{self.status}')>"
        )
