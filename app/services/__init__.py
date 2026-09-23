"""
MATPULSE AI Material Matching Services Package.
Provides text normalization, technical attribute extraction, semantic embeddings,
technical matching rules, and combined confidence scoring.
"""

from app.services.normalizer import normalize_text
from app.services.attribute_extractor import extract_attributes
from app.services.embedding_service import embedding_service
from app.services.matching_rules import compare_attributes, compare_category, compare_uom
from app.services.matcher import compare_materials

__all__ = [
    "normalize_text",
    "extract_attributes",
    "embedding_service",
    "compare_attributes",
    "compare_category",
    "compare_uom",
    "compare_materials",
]
