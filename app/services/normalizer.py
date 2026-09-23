import re
from typing import Optional


# Precompiled term replacement rules (ordered by specificity)
TERM_REPLACEMENTS = [
    # Materials
    (r"\bSTAINLESS\s+STEEL\b", "SS"),
    (r"\bCARBON\s+STEEL\b", "CS"),
    (r"\bMILD\s+STEEL\b", "MS"),
    (r"\bCAST\s+STEEL\b", "CS_CAST"),
    (r"\bALLOY\s+STEEL\b", "AS"),
    
    # Fastener / Shape types
    (r"\bHEXAGONAL\b", "HEX"),
    (r"\bHEXAGON\b", "HEX"),
    
    # Standards & Spec prefixes
    (r"\bNOMINAL\s+BORE\b", "NB"),
    (r"\bN\.?B\.?\b", "NB"),
    (r"\bSCHEDULE\b", "SCH"),
    (r"\bSCH\.?\b", "SCH"),
    (r"\bGRADE\b", "GR"),
    (r"\bGR\.?\b", "GR"),
    (r"\bCLASS\b", "CL"),
    (r"\bCL\.?\b", "CL"),
    (r"\bSEAMLESS\b", "SMLS"),
    
    # Electrical
    (r"\b(\d+)\s*[- ]?POLE\b", r"\1P"),
    (r"\bAIR\s+CIRCUIT\s+BREAKER\b", "ACB"),
    (r"\bCIRCUIT\s+BREAKER\b", "CB"),
]


def normalize_text(text: Optional[str]) -> str:
    """
    Standardize engineering material descriptions and specifications.
    
    Handles:
    - Upper/lowercase normalization
    - Punctuation and whitespace cleanup
    - Engineering acronym expansion / standardization (e.g. STAINLESS STEEL -> SS)
    - Unit spacing standardization (e.g. '10 MM' -> '10MM', '2 INCH' / '2"' -> '2IN')
    - Dimension formatting ('M10 X 50', '10MM X 50MM')
    """
    if not text:
        return ""

    # Convert to uppercase for consistent processing
    cleaned = text.upper().strip()

    # Normalize double-quote inch representation: e.g. 2" -> 2IN, 4" -> 4IN
    cleaned = re.sub(r'(\d+(?:\.\d+)?)\s*["\u201d\u201c]', r"\1IN ", cleaned)

    # Standardize Units of Measurement & Dimensions spacing
    cleaned = re.sub(r"\b(\d+(?:\.\d+)?)\s*(?:MILLIMETER|MILLIMETRE|MM)\b", r"\1MM", cleaned)
    cleaned = re.sub(r"\b(\d+(?:\.\d+)?)\s*(?:INCHES|INCH|IN)\b", r"\1IN", cleaned)
    cleaned = re.sub(r"\b(\d+(?:\.\d+)?)\s*(?:MTR|METERS|METER|M)\b", r"\1MTR", cleaned)
    cleaned = re.sub(r"\b(\d+(?:\.\d+)?)\s*(?:KILOGRAM|KILOGRAMS|KGS|KG)\b", r"\1KG", cleaned)
    cleaned = re.sub(r"\b(\d+(?:\.\d+)?)\s*(?:NB)\b", r"\1NB", cleaned)

    # Standardize pressure rating symbols: e.g. 150# -> CL 150
    cleaned = re.sub(r"\b(\d+)\s*#", r"CL \1", cleaned)

    # Apply term replacements
    for pattern, replacement in TERM_REPLACEMENTS:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # Normalize metric fastener diameter shorthand: e.g. 10MM X 50MM or 10MM X 50 -> M10 X 50
    cleaned = re.sub(r"\b(\d+)MM\s*[Xx*]\s*(\d+)(?:MM)?\b", r"M\1 X \2", cleaned)

    # Normalize standalone dimension multiplier formatting between numbers: e.g. '10 X 50'
    cleaned = re.sub(r"(?<=\d)\s*(?:MM)?\s*[Xx*]\s*(?=\d)", " X ", cleaned)

    # Replace punctuation (except hyphens and periods inside codes/dimensions) with spaces
    cleaned = re.sub(r"[^\w\s\.\-]", " ", cleaned)

    # Collapse multiple whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned
