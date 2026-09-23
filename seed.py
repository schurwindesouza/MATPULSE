"""
========================================================================================
SYNTHETIC / DEMO DATASET DISCLAIMER:
The records defined in this file are completely synthetic mock entries generated purely
for software development, testing, schema validation, and demonstration purposes for
SIH Problem Statement 26099 (MATPULSE).

THEY DO NOT REPRESENT ACTUAL, OFFICIAL, OR PROPRIETARY MASTER DATA OF BHEL, NTPC, ONGC,
SAIL, IOCL, COAL INDIA, OR ANY OTHER CPSE.

All material codes, descriptions, and estimated pricing values are illustrative examples
designed to model how equivalent items with divergent naming schemes across different
organizations can be standardized under Common National Material Codes.
========================================================================================
"""
from app.database import engine, SessionLocal, Base
from app.models.material import Material
from app.crud.material import create_material
from app.schemas.material import MaterialCreate


# SYNTHETIC DEMONSTRATION DATASET
SYNTHETIC_CPSE_MATERIALS = [
    # Synthetic Cluster 1: Equivalent Seamless Carbon Steel Pipes across simulated CPSE catalogs
    {
        "cpse": "BHEL",
        "material_code": "SYN-BHEL-PP-201",
        "description": "[SYNTHETIC DEMO] PIPE CS SEAMLESS 50 NB SCH 40 ASTM A106 GR B",
        "technical_specification": "Synthetic spec: 50mm NB (2 inch), Sch 40, Wall Thickness: 3.91mm, Standard: ASTM A106 Grade B, Ends: Plain/Beveled",
        "uom": "MTR",
        "category": "Pipes & Tubes",
        "annual_quantity": 15000.0,
        "approx_unit_price": 420.0,
        "normalized_description": "pipe carbon steel seamless 50 nb schedule 40 astm a106 grade b",
        "common_material_code": "NMC-PIP-CS-50NB-40",
        "matching_status": "MATCHED",
    },
    {
        "cpse": "NTPC",
        "material_code": "SYN-NTPC-P-44021",
        "description": "[SYNTHETIC DEMO] Seamless Carbon Steel Pipe 2\" NB Schedule 40 Grade B",
        "technical_specification": "Synthetic spec: Nominal Bore: 2 inch (50mm), Schedule: 40, Specification: ASTM A106 Gr. B, IBR Certified",
        "uom": "MTR",
        "category": "Piping Material",
        "annual_quantity": 22000.0,
        "approx_unit_price": 415.0,
        "normalized_description": "pipe carbon steel seamless 50 nb schedule 40 astm a106 grade b",
        "common_material_code": "NMC-PIP-CS-50NB-40",
        "matching_status": "MATCHED",
    },
    {
        "cpse": "ONGC",
        "material_code": "SYN-ONGC-PIPE-02",
        "description": "[SYNTHETIC DEMO] LINE PIPE CS 2 IN SCH 40 BE A106-B SMLS",
        "technical_specification": "Synthetic spec: 2 inch Nominal Bore, Sch 40, ASTM A106-B, SMLS, Beveled Ends, NACE MR0175 compliant",
        "uom": "MTR",
        "category": "Line Pipes",
        "annual_quantity": 8000.0,
        "approx_unit_price": 440.0,
        "normalized_description": "pipe carbon steel seamless 50 nb schedule 40 astm a106 grade b",
        "common_material_code": "NMC-PIP-CS-50NB-40",
        "matching_status": "MATCHED",
    },

    # Synthetic Cluster 2: Equivalent Gate Valves across simulated CPSE catalogs
    {
        "cpse": "SAIL",
        "material_code": "SYN-SAIL-VLV-100",
        "description": "[SYNTHETIC DEMO] CAST STEEL GATE VALVE 100 NB CLASS 150 FLANGED",
        "technical_specification": "Synthetic spec: Size: 100mm (4 inch), Rating: ASME Class 150, Body: ASTM A216 Gr WCB, Trim: 13% Cr (Trim 8), Flanged Ends ASME B16.5 RF",
        "uom": "EA",
        "category": "Valves",
        "annual_quantity": 45.0,
        "approx_unit_price": 14500.0,
        "normalized_description": "valve gate cast steel 100 nb class 150 flanged wcb trim 8",
        "common_material_code": "NMC-VLV-GT-100NB-150",
        "matching_status": "MATCHED",
    },
    {
        "cpse": "IOCL",
        "material_code": "SYN-IOCL-VAL-4IN",
        "description": "[SYNTHETIC DEMO] Valve Gate 4\" 150# Flanged WCB Trim 8 OS&Y",
        "technical_specification": "Synthetic spec: 4 inch Class 150 Bolted Bonnet, Outside Screw and Yoke (OS&Y), Body WCB, Trim 8, API 600 design",
        "uom": "EA",
        "category": "Process Valves",
        "annual_quantity": 60.0,
        "approx_unit_price": 14800.0,
        "normalized_description": "valve gate cast steel 100 nb class 150 flanged wcb trim 8",
        "common_material_code": "NMC-VLV-GT-100NB-150",
        "matching_status": "MATCHED",
    },

    # Synthetic Cluster 3: Unmatched & Suggested items pending AI matching
    {
        "cpse": "BHEL",
        "material_code": "SYN-BHEL-ACB-630",
        "description": "[SYNTHETIC DEMO] Air Circuit Breaker 630A 3 Pole 50kA Drawout Type",
        "technical_specification": "Synthetic spec: Rated Current: 630A, Breaking Capacity: 50kA at 415V AC, 3 Pole, Microprocessor trip unit, IEC 60947-2",
        "uom": "EA",
        "category": "Electrical Switchgear",
        "annual_quantity": 30.0,
        "approx_unit_price": 68000.0,
        "normalized_description": "air circuit breaker 630a 3 pole 50ka drawout",
        "common_material_code": None,
        "matching_status": "UNMATCHED",
    },
    {
        "cpse": "NTPC",
        "material_code": "SYN-NTPC-ACB-01",
        "description": "[SYNTHETIC DEMO] 3P 630A 50kA Drawout ACB with Microprocessor Release",
        "technical_specification": "Synthetic spec: 415V AC 50Hz, 3-pole 630 Amp Air Circuit Breaker, 50kA fault level, drawout cradle included",
        "uom": "EA",
        "category": "Electrical",
        "annual_quantity": 25.0,
        "approx_unit_price": 69500.0,
        "normalized_description": "air circuit breaker 630a 3 pole 50ka drawout",
        "common_material_code": None,
        "matching_status": "SUGGESTED",
    },
    {
        "cpse": "COAL_INDIA",
        "material_code": "SYN-CIL-CBL-11KV",
        "description": "[SYNTHETIC DEMO] 11KV XLPE HT Cable 3 Core 300 sq mm Armoured Aluminium",
        "technical_specification": "Synthetic spec: IS 7098 Part 2, 11kV (E) grade, 3Cx300 sq.mm, stranded compacted Aluminium conductor, XLPE insulated, round GI wire armoured",
        "uom": "MTR",
        "category": "Cables",
        "annual_quantity": 12000.0,
        "approx_unit_price": 1850.0,
        "normalized_description": "cable xlpe 11kv 3 core 300 sqmm aluminium armoured",
        "common_material_code": None,
        "matching_status": "UNMATCHED",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created_count = 0
        for item in SYNTHETIC_CPSE_MATERIALS:
            existing = (
                db.query(Material)
                .filter(
                    Material.cpse == item["cpse"],
                    Material.material_code == item["material_code"],
                )
                .first()
            )
            if not existing:
                create_material(db, MaterialCreate(**item))
                created_count += 1
        print("=" * 80)
        print("DEMO / SYNTHETIC DATASET NOTICE:")
        print("All records populated here are purely synthetic mock data for demonstration.")
        print("They do NOT reflect actual or official data of any CPSE.")
        print(f"Successfully seeded {created_count} synthetic demonstration records into SQLite.")
        print("=" * 80)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
