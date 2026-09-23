"""
MATPULSE AI Material Matching Services Package.
Provides text normalization, technical attribute extraction, semantic embeddings,
technical matching rules, pairwise matching, and batch candidate matching.
"""

from app.services.normalizer import normalize_text
from app.services.attribute_extractor import extract_attributes
from app.services.embedding_service import embedding_service
from app.services.matching_rules import compare_attributes, compare_category, compare_uom
from app.services.matcher import compare_materials
from app.services.candidate_matcher import generate_candidate_pairs, find_material_matches

__all__ = [
    "normalize_text",
    "extract_attributes",
    "embedding_service",
    "compare_attributes",
    "compare_category",
    "compare_uom",
    "compare_materials",
    "generate_candidate_pairs",
    "find_material_matches",
]
