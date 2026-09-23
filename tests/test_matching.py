import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.services.normalizer import normalize_text
from app.services.attribute_extractor import extract_attributes
from app.services.matching_rules import compare_category, compare_uom
from app.services.matcher import compare_materials

from tests.conftest import client



def test_normalizer():
    raw_1 = "STAINLESS STEEL HEXAGONAL BOLT 10 MM X 50 MM"
    norm_1 = normalize_text(raw_1)
    assert "SS" in norm_1
    assert "HEX" in norm_1
    assert ("M10" in norm_1 or "10MM" in norm_1)
    assert ("50" in norm_1 or "50MM" in norm_1)

    raw_2 = "SEAMLESS CARBON STEEL PIPE 2 INCH SCHEDULE 40 GRADE B"
    norm_2 = normalize_text(raw_2)
    assert "CS" in norm_2
    assert "SCH 40" in norm_2
    assert "GR B" in norm_2


def test_attribute_extractor():
    attrs = extract_attributes("SS304 HEX BOLT M10 X 50")
    assert attrs["material"] == "stainless steel"
    assert attrs["grade"] == "SS304"
    assert attrs["type"] == "hex bolt"
    assert attrs["diameter"] == "10 mm"
    assert attrs["length"] == "50 mm"

    pipe_attrs = extract_attributes(
        "CS SEAMLESS PIPE 50 NB SCH 40 ASTM A106 GR B",
        technical_specification="2 inch NB, Sch 40, ASTM A106 Grade B",
    )
    assert pipe_attrs["material"] == "carbon steel"
    assert pipe_attrs["type"] == "seamless pipe"
    assert pipe_attrs["nominal_bore"] == "50 NB"
    assert pipe_attrs["schedule"] == "40"
    assert "ASTM A106" in pipe_attrs["standard"]
    assert pipe_attrs["grade"] == "A106 B"


def test_scenario_1_same_material_different_wording():
    """
    TEST 1: Same material, different wording
    SS HEX BOLT M10 X 50 vs STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM
    Expected: HIGH_CONFIDENCE_MATCH (>= 90.0)
    """
    res = compare_materials(
        desc_a="SS HEX BOLT M10 X 50",
        desc_b="STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM",
        category_a="Fasteners",
        category_b="Fasteners",
        uom_a="EA",
        uom_b="PCS",
    )
    assert res["classification"] == "HIGH_CONFIDENCE_MATCH"
    assert res["final_confidence"] >= 90.0
    assert res["attribute_comparison"].get("material") == "MATCH"
    assert res["attribute_comparison"].get("type") == "MATCH"
    assert res["attribute_comparison"].get("diameter") == "MATCH"
    assert res["attribute_comparison"].get("length") == "MATCH"
    assert len(res["reasons"]) > 0


def test_scenario_2_same_pipe_different_wording():
    """
    TEST 2: Same pipe, different wording
    CS SEAMLESS PIPE 50 NB SCH 40 ASTM A106 GR B
    vs
    SEAMLESS CARBON STEEL PIPE 2 INCH SCHEDULE 40 GRADE B
    Expected: HIGH_CONFIDENCE_MATCH or REVIEW_REQUIRED (>= 70.0)
    """
    res = compare_materials(
        desc_a="CS SEAMLESS PIPE 50 NB SCH 40 ASTM A106 GR B",
        desc_b="SEAMLESS CARBON STEEL PIPE 2 INCH SCHEDULE 40 GRADE B",
        category_a="Pipes & Tubes",
        category_b="Piping Material",
        uom_a="MTR",
        uom_b="MTR",
    )
    assert res["classification"] in ["HIGH_CONFIDENCE_MATCH", "REVIEW_REQUIRED"]
    assert res["final_confidence"] >= 75.0
    assert res["attribute_comparison"].get("material") == "MATCH"
    assert res["attribute_comparison"].get("schedule") == "MATCH"
    assert res["attribute_comparison"].get("grade") == "MATCH"


def test_scenario_3_different_material_grade():
    """
    TEST 3: Different material grade
    SS304 HEX BOLT M10 X 50 vs MILD STEEL HEX BOLT M10 X 50
    Expected: NOT HIGH_CONFIDENCE_MATCH
    Must explicitly identify the material/grade mismatch.
    """
    res = compare_materials(
        desc_a="SS304 HEX BOLT M10 X 50",
        desc_b="MILD STEEL HEX BOLT M10 X 50",
        category_a="Fasteners",
        category_b="Fasteners",
        uom_a="EA",
        uom_b="EA",
    )
    assert res["classification"] != "HIGH_CONFIDENCE_MATCH"
    assert res["attribute_comparison"].get("material") == "MISMATCH"
    # Verify warning mentions material mismatch
    assert any("material mismatch" in w.lower() for w in res["warnings"])


def test_scenario_4_different_dimensions():
    """
    TEST 4: Different dimensions
    SS304 HEX BOLT M10 X 50 vs SS304 HEX BOLT M12 X 50
    Expected: NOT HIGH_CONFIDENCE_MATCH
    Must identify diameter mismatch.
    """
    res = compare_materials(
        desc_a="SS304 HEX BOLT M10 X 50",
        desc_b="SS304 HEX BOLT M12 X 50",
        category_a="Fasteners",
        category_b="Fasteners",
        uom_a="EA",
        uom_b="EA",
    )
    assert res["classification"] != "HIGH_CONFIDENCE_MATCH"
    assert res["attribute_comparison"].get("diameter") == "MISMATCH"
    assert any("diameter mismatch" in w.lower() for w in res["warnings"])


def test_scenario_5_different_categories():
    """
    TEST 5: Different material categories
    SS BALL VALVE 1 INCH vs SS HEX BOLT M10 X 50
    Expected: LOW_CONFIDENCE (< 70.0)
    """
    res = compare_materials(
        desc_a="SS BALL VALVE 1 INCH",
        desc_b="SS HEX BOLT M10 X 50",
        category_a="Valves",
        category_b="Fasteners",
        uom_a="EA",
        uom_b="EA",
    )
    assert res["classification"] == "LOW_CONFIDENCE"
    assert res["final_confidence"] < 70.0
    assert res["category_score"] == 0.0


def test_scenario_6_uom_validation():
    """
    TEST 6: UOM difference
    EA vs PCS -> compatible
    KG vs MTR -> incompatible
    """
    score_compat, _ = compare_uom("EA", "PCS")
    assert score_compat >= 90.0

    score_incompat, _ = compare_uom("KG", "MTR")
    assert score_incompat == 0.0


def test_scenario_7_missing_attributes():
    """
    TEST 7: Missing attributes
    One material has incomplete specs; should mark as UNKNOWN rather than rejecting.
    """
    res = compare_materials(
        desc_a="CS SEAMLESS PIPE 50 NB SCH 40 ASTM A106 GR B",
        desc_b="CS PIPE 50 NB",
        spec_a="ASTM A106 Grade B, Schedule 40",
        spec_b=None,  # incomplete specification
        category_a="Pipes",
        category_b="Pipes",
    )
    # Missing schedule and standard in Material B should be marked as UNKNOWN, not MISMATCH
    assert res["attribute_comparison"].get("schedule") in ["UNKNOWN", "MATCH"]
    # Should not crash or force hard 0 technical score
    assert res["technical_score"] > 50.0


def test_matching_api_endpoint():
    """
    TEST 8: POST /api/v1/matching/compare
    End-to-end integration via FastAPI TestClient
    """
    # Create two materials
    res_a = client.post(
        "/api/v1/materials/",
        json={
            "cpse": "BHEL",
            "material_code": "BOLT-01",
            "description": "SS HEX BOLT M10 X 50",
            "category": "Fasteners",
            "uom": "EA",
        },
    )
    assert res_a.status_code == 201
    id_a = res_a.json()["id"]

    res_b = client.post(
        "/api/v1/materials/",
        json={
            "cpse": "NTPC",
            "material_code": "BOLT-02",
            "description": "STAINLESS STEEL HEXAGONAL BOLT 10MM X 50MM",
            "category": "Fasteners",
            "uom": "PCS",
        },
    )
    assert res_b.status_code == 201
    id_b = res_b.json()["id"]

    # Compare via API
    compare_res = client.post(
        "/api/v1/matching/compare",
        json={"material_a_id": id_a, "material_b_id": id_b},
    )
    assert compare_res.status_code == 200
    data = compare_res.json()
    assert data["material_a_id"] == id_a
    assert data["material_b_id"] == id_b
    assert data["classification"] == "HIGH_CONFIDENCE_MATCH"
    assert data["final_confidence"] >= 90.0
    assert data["semantic_score"] > 80.0
    assert data["technical_score"] == 100.0
    assert len(data["reasons"]) > 0

    # Test 404 for non-existent material ID
    res_404 = client.post(
        "/api/v1/matching/compare",
        json={"material_a_id": 99999, "material_b_id": id_b},
    )
    assert res_404.status_code == 404
