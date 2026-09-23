import re
from typing import Dict, Any, Optional

# Standard imperial-to-metric Nominal Bore (NB) mapping for pipes and valves
INCH_TO_NB_MAP = {
    "0.5": "15 NB",
    "1/2": "15 NB",
    "0.75": "20 NB",
    "3/4": "20 NB",
    "1": "25 NB",
    "1.5": "40 NB",
    "1-1/2": "40 NB",
    "2": "50 NB",
    "2.5": "65 NB",
    "2-1/2": "65 NB",
    "3": "80 NB",
    "4": "100 NB",
    "6": "150 NB",
    "8": "200 NB",
    "10": "250 NB",
    "12": "300 NB",
}


def extract_attributes(description: str, technical_specification: Optional[str] = None) -> Dict[str, Any]:
    """
    Extract structured technical attributes from material description and specification.
    
    Supported attributes:
    - material (e.g. stainless steel, carbon steel, mild steel)
    - grade (e.g. SS304, SS316, A106 B, WCB, Fe550D)
    - type (e.g. hex bolt, seamless pipe, gate valve)
    - diameter (e.g. 10mm / M10)
    - length (e.g. 50mm)
    - width (e.g. 200mm)
    - thickness (e.g. 3.91mm)
    - nominal_bore (e.g. 50 NB)
    - schedule (e.g. 40, 80)
    - standard (e.g. ASTM A106, API 600, IS 7098)
    - pressure_rating (e.g. Class 150, 300#)
    - electrical_rating (e.g. 630A, 50kA, 11kV)
    """
    full_text = f"{description or ''} {technical_specification or ''}".upper()
    attributes: Dict[str, Any] = {}

    # 1. MATERIAL
    if re.search(r"\b(STAINLESS\s+STEEL|SS\b|SS\s*\d+|304L?|316L?)\b", full_text):
        attributes["material"] = "stainless steel"
    elif re.search(r"\b(CARBON\s+STEEL|CS\b|A106|A53)\b", full_text):
        attributes["material"] = "carbon steel"
    elif re.search(r"\b(MILD\s+STEEL|MS\b|IS\s*2062)\b", full_text):
        attributes["material"] = "mild steel"
    elif re.search(r"\b(CAST\s+STEEL|WCB\b|A216)\b", full_text):
        attributes["material"] = "cast steel"
    elif re.search(r"\b(ALLOY\s+STEEL|AS\b)\b", full_text):
        attributes["material"] = "alloy steel"
    elif re.search(r"\b(ALUMINIUM|ALUMINUM|AL\b)\b", full_text):
        attributes["material"] = "aluminium"
    elif re.search(r"\b(COPPER|CU\b)\b", full_text):
        attributes["material"] = "copper"

    # 2. GRADE
    grade_match = (
        re.search(r"\b(SS\s*304L|SS\s*316L|SS\s*304|SS\s*316|304L|316L|304|316)\b", full_text)
        or re.search(r"\b(A106\s*(?:GR(?:ADE)?\.?\s*)?B|A106-B|A53\s*B|GR(?:ADE)?\.?\s*B)\b", full_text)
        or re.search(r"\b(WCB|A216\s*WCB)\b", full_text)
        or re.search(r"\b(FE\s*500D|FE\s*550D|FE\s*500|FE\s*415)\b", full_text)
        or re.search(r"\b(GRADE\s+[A-Z0-9]+|GR\.?\s+[A-Z0-9]+)\b", full_text)
    )
    if grade_match:
        raw_grade = grade_match.group(1).upper()
        if "304" in raw_grade:
            attributes["grade"] = "SS304"
        elif "316" in raw_grade:
            attributes["grade"] = "SS316"
        elif "A106" in raw_grade or " B" in raw_grade or "GR B" in raw_grade or "GRADE B" in raw_grade:
            attributes["grade"] = "A106 B"
        elif "WCB" in raw_grade:
            attributes["grade"] = "WCB"
        elif "FE" in raw_grade:
            attributes["grade"] = re.sub(r"\s+", "", raw_grade)
        else:
            attributes["grade"] = raw_grade

    # 3. TYPE
    if re.search(r"\b(HEX(?:AGONAL)?\s+BOLT)\b", full_text):
        attributes["type"] = "hex bolt"
    elif re.search(r"\b(STUD\s+BOLT)\b", full_text):
        attributes["type"] = "stud bolt"
    elif re.search(r"\b(SEAMLESS\s+PIPE|SMLS\s+PIPE)\b", full_text) or (
        "SEAMLESS" in full_text and "PIPE" in full_text
    ):
        attributes["type"] = "seamless pipe"
    elif re.search(r"\b(WELDED\s+PIPE|ERW\s+PIPE)\b", full_text):
        attributes["type"] = "welded pipe"
    elif re.search(r"\b(GATE\s+VALVE)\b", full_text):
        attributes["type"] = "gate valve"
    elif re.search(r"\b(BALL\s+VALVE)\b", full_text):
        attributes["type"] = "ball valve"
    elif re.search(r"\b(GLOBE\s+VALVE)\b", full_text):
        attributes["type"] = "globe valve"
    elif re.search(r"\b(CHECK\s+VALVE)\b", full_text):
        attributes["type"] = "check valve"
    elif re.search(r"\b(AIR\s+CIRCUIT\s+BREAKER|ACB\b)", full_text):
        attributes["type"] = "air circuit breaker"
    elif re.search(r"\b(HT\s+CABLE|XLPE\s+(?:HT\s+)?CABLE|POWER\s+CABLE)\b", full_text):
        attributes["type"] = "power cable"
    elif re.search(r"\b(TMT\s+REBAR|REINFORCEMENT\s+STEEL)\b", full_text):
        attributes["type"] = "tmt rebar"

    # 4. DIMENSIONS (DIAMETER / LENGTH / WIDTH / THICKNESS)
    # Pattern: M10 X 50, 10MM X 50MM, M10X50, 10 X 50 MM
    dim_match = re.search(
        r"\b(?:M|DIA\s*)?(\d+(?:\.\d+)?)\s*(?:MM)?\s*[Xx*]\s*(\d+(?:\.\d+)?)\s*(?:MM)?\b",
        full_text,
    )
    if dim_match:
        d_val = dim_match.group(1)
        l_val = dim_match.group(2)
        attributes["diameter"] = f"{d_val} mm"
        attributes["length"] = f"{l_val} mm"
    else:
        # Standalone diameter: e.g. M10, 10MM DIA, 12MM
        m_dia = re.search(r"\bM(\d+)\b", full_text)
        if m_dia:
            attributes["diameter"] = f"{m_dia.group(1)} mm"
        else:
            dia_raw = re.search(r"\b(\d+(?:\.\d+)?)\s*MM\s*(?:DIA|DIAMETER)?\b", full_text)
            if dia_raw:
                attributes["diameter"] = f"{dia_raw.group(1)} mm"

        # Standalone length: e.g. 50MM LENGTH, 50MM LONG
        len_raw = re.search(r"\b(\d+(?:\.\d+)?)\s*MM\s*(?:LENGTH|LONG|LG)\b", full_text)
        if len_raw:
            attributes["length"] = f"{len_raw.group(1)} mm"

    # Thickness: e.g. 3.91mm, WALL THICKNESS: 3.91MM, WT 3.91
    thk_match = re.search(r"(?:WALL\s+THICKNESS|WT|THICKNESS|THK)[:\s]+(\d+(?:\.\d+)?)\s*(?:MM)?\b", full_text)
    if thk_match:
        attributes["thickness"] = f"{thk_match.group(1)} mm"

    # 5. NOMINAL BORE (NB)
    nb_match = re.search(r"\b(\d+)\s*NB\b", full_text)
    if nb_match:
        attributes["nominal_bore"] = f"{nb_match.group(1)} NB"
    else:
        # Check imperial inch bore: e.g. 2 INCH, 2 IN, 2"
        inch_match = re.search(r'(\d+(?:\.\d+)?|\d+/\d+)\s*(?:INCH|IN|["\u201d\u201c])\s*(?:NB|PIPE|VALVE|BORE)?\b', full_text)
        if inch_match:
            inch_val = inch_match.group(1)
            mapped_nb = INCH_TO_NB_MAP.get(inch_val)
            if mapped_nb:
                attributes["nominal_bore"] = mapped_nb
            else:
                attributes["nominal_bore"] = f"{inch_val} in"

    # 6. SCHEDULE (SCH)
    sch_match = re.search(r"\b(?:SCH(?:EDULE)?|S/)\s*([0-9]+[A-Z]*|XXS|XS|STD)\b", full_text)
    if sch_match:
        attributes["schedule"] = sch_match.group(1)

    # 7. STANDARD / SPECIFICATION
    std_match = (
        re.search(r"\b(ASTM\s+[A-Z0-9]+(?:-[A-Z0-9]+)?)\b", full_text)
        or re.search(r"\b(IS\s+\d+(?:\s+PART\s+\d+)?)\b", full_text)
        or re.search(r"\b(API\s+[0-9A-Z]+)\b", full_text)
        or re.search(r"\b(IEC\s+[0-9A-Z\-]+)\b", full_text)
        or re.search(r"\b(ASME\s+B[0-9\.]+)\b", full_text)
    )
    if std_match:
        attributes["standard"] = std_match.group(1).strip()

    # 8. RATINGS (Pressure / Electrical)
    rating_match = re.search(r"\b(CLASS\s+\d+|CL\s*\d+|\d+\s*#)\b", full_text)
    if rating_match:
        val = rating_match.group(1).replace("#", "").replace("CL", "").replace("CLASS", "").strip()
        attributes["pressure_class"] = f"Class {val}"

    elec_match = re.search(r"\b(\d+)\s*A\b", full_text)
    if elec_match:
        attributes["current_rating"] = f"{elec_match.group(1)}A"

    volt_match = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:KV|VOLT|V)\b", full_text)
    if volt_match:
        attributes["voltage_rating"] = volt_match.group(0).replace(" ", "")

    return attributes
