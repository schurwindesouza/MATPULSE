import io
import json
import openpyxl
import pytest
from tests.conftest import client


def test_parse_and_preview_csv():
    """
    Test 1:
    POST /api/v1/import/preview parses CSV, auto-detects columns, and returns sample rows.
    """
    csv_content = (
        "MAT_CODE,MAT_DESC,TECH_SPEC,UNIT,CATEGORY,ANNUAL_QTY,PRICE\n"
        "BOLT-01,SS HEX BOLT M10 X 50,SS304 M10 50MM,EA,Fasteners,5000,45.5\n"
        "PIPE-01,CS SEAMLESS PIPE 50 NB,ASTM A106 GR B,MTR,Pipes,1200,420.0\n"
    ).encode("utf-8")

    files = {"file": ("catalog.csv", io.BytesIO(csv_content), "text/csv")}
    res = client.post("/api/v1/import/preview", files=files)

    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "catalog.csv"
    assert data["total_rows"] == 2
    assert "MAT_CODE" in data["columns"]
    assert "MAT_DESC" in data["columns"]

    # Verify auto-detected aliases
    mapping = data["suggested_mapping"]
    assert mapping["material_code"] == "MAT_CODE"
    assert mapping["description"] == "MAT_DESC"
    assert mapping["technical_specification"] == "TECH_SPEC"
    assert mapping["uom"] == "UNIT"
    assert mapping["category"] == "CATEGORY"
    assert mapping["annual_quantity"] == "ANNUAL_QTY"
    assert mapping["approx_unit_price"] == "PRICE"
    assert len(data["sample_rows"]) == 2


def test_parse_and_preview_excel():
    """
    Test 2:
    POST /api/v1/import/preview parses Excel (.xlsx) file and returns headers and rows.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Material Code", "Description", "Category", "UOM"])
    ws.append(["EXCEL-001", "Ball Valve 2 inch 150#", "Valves", "EA"])
    ws.append(["EXCEL-002", "Gate Valve 4 inch 300#", "Valves", "EA"])

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)

    files = {"file": ("catalog.xlsx", bio, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    res = client.post("/api/v1/import/preview", files=files)

    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 2
    assert "Material Code" in data["columns"]
    assert data["suggested_mapping"]["material_code"] == "Material Code"
    assert data["suggested_mapping"]["description"] == "Description"


def test_validate_dataset_with_duplicates_and_missing_fields():
    """
    Test 3:
    POST /api/v1/import/validate identifies valid rows, invalid rows (missing fields),
    and duplicate material codes within the file.
    """
    csv_content = (
        "Code,Desc,Category\n"
        "VALID-01,Valid description 1,Fasteners\n"
        "VALID-01,Duplicate code row,Fasteners\n"  # Duplicate within file
        ",Missing code description,Fasteners\n"     # Missing required code
        "VALID-02,,Fasteners\n"                     # Missing required description
        "VALID-03,Valid description 3,Fasteners\n"
    ).encode("utf-8")

    mapping = {
        "material_code": "Code",
        "description": "Desc",
        "category": "Category",
    }

    files = {"file": ("test_val.csv", io.BytesIO(csv_content), "text/csv")}
    data_form = {
        "mapping": json.dumps(mapping),
        "default_cpse": "BHEL",
    }

    res = client.post("/api/v1/import/validate", files=files, data=data_form)
    assert res.status_code == 200
    val_data = res.json()

    assert val_data["total_rows"] == 5
    assert val_data["valid_count"] == 2  # VALID-01 (first instance) and VALID-03
    assert val_data["duplicate_count"] == 1  # Second VALID-01
    assert val_data["invalid_count"] == 2  # Missing code + missing desc
    assert len(val_data["warnings"]) >= 1


def test_execute_import_into_database():
    """
    Test 4:
    POST /api/v1/import/execute ingests valid records into SQLite,
    makes them queryable in materials API, and skips duplicate attempts.
    """
    csv_content = (
        "cpse,material_code,description,technical_specification,uom,category\n"
        "TEST_ORG,IMP-001,Stainless Steel Hex Bolt M12,SS316 M12x60,EA,Fasteners\n"
        "TEST_ORG,IMP-002,Carbon Steel Seamless Pipe 2 IN,ASTM A106 GR B,MTR,Pipes\n"
    ).encode("utf-8")

    mapping = {
        "cpse": "cpse",
        "material_code": "material_code",
        "description": "description",
        "technical_specification": "technical_specification",
        "uom": "uom",
        "category": "category",
    }

    files = {"file": ("import.csv", io.BytesIO(csv_content), "text/csv")}
    data_form = {"mapping": json.dumps(mapping)}

    # 1. First execution -> imports 2 records
    res = client.post("/api/v1/import/execute", files=files, data=data_form)
    assert res.status_code == 200
    imp_data = res.json()
    assert imp_data["records_imported"] == 2
    assert imp_data["records_skipped"] == 0

    # Verify queryable in materials API
    mat_res = client.get("/api/v1/materials/?cpse=TEST_ORG")
    assert mat_res.status_code == 200
    materials = mat_res.json()
    assert len(materials) == 2
    codes = [m["material_code"] for m in materials]
    assert "IMP-001" in codes
    assert "IMP-002" in codes
    # Matching status is initialized to UNMATCHED
    assert materials[0]["matching_status"] == "UNMATCHED"
    assert materials[0]["common_material_code"] is None

    # 2. Second execution with same file -> skips duplicates
    files2 = {"file": ("import.csv", io.BytesIO(csv_content), "text/csv")}
    res2 = client.post("/api/v1/import/execute", files=files2, data=data_form)
    assert res2.status_code == 400  # No valid non-duplicate records to import
    assert "No valid records to import" in res2.json()["detail"]


def test_imported_materials_available_for_ai_matching():
    """
    Test 5:
    Imported materials from different CPSEs are immediately picked up by
    the AI matching engine and candidate pairs are generated and evaluated.
    """
    # Ingest 2 equivalent materials under distinct CPSEs
    csv_cpse_a = (
        "material_code,description,category,uom\n"
        "AI-IMP-A1,SS HEX BOLT M10 X 50,Fasteners,EA\n"
    ).encode("utf-8")
    mapping = {"material_code": "material_code", "description": "description", "category": "category", "uom": "uom"}

    client.post(
        "/api/v1/import/execute",
        files={"file": ("a.csv", io.BytesIO(csv_cpse_a), "text/csv")},
        data={"mapping": json.dumps(mapping), "default_cpse": "CPSE_ALPHA"},
    )

    csv_cpse_b = (
        "material_code,description,category,uom\n"
        "AI-IMP-B1,STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM,Fasteners,PCS\n"
    ).encode("utf-8")
    client.post(
        "/api/v1/import/execute",
        files={"file": ("b.csv", io.BytesIO(csv_cpse_b), "text/csv")},
        data={"mapping": json.dumps(mapping), "default_cpse": "CPSE_BETA"},
    )

    # Trigger batch matching
    gen_res = client.post(
        "/api/v1/matching/generate",
        json={"top_k": 5, "min_confidence": 70.0},
    )
    assert gen_res.status_code == 201
    gen_data = gen_res.json()
    assert gen_data["total_candidates"] >= 1

    # Check review queue contains recommendation between CPSE_ALPHA and CPSE_BETA
    q_res = client.get("/api/v1/matching/review-queue?cpse=CPSE_ALPHA")
    assert q_res.status_code == 200
    queue = q_res.json()
    assert len(queue) >= 1
    match = queue[0]
    matched_codes = [match["material_a"]["material_code"], match["material_b"]["material_code"]]
    assert "AI-IMP-A1" in matched_codes
    assert "AI-IMP-B1" in matched_codes
    assert match["final_confidence"] >= 80.0
