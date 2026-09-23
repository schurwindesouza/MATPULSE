import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

from tests.conftest import client, TestingSessionLocal



def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "MATPULSE"
    assert res.json()["status"] == "online"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_create_material_master():
    payload = {
        "cpse": "BHEL",
        "material_code": "BHEL-PP-201",
        "description": "PIPE CS SEAMLESS 50 NB SCH 40 ASTM A106 GR B",
        "technical_specification": "50mm NB, Sch 40, ASTM A106 Grade B, Plain Ends",
        "uom": "MTR",
        "category": "Pipes & Tubes",
        "annual_quantity": 15000.0,
        "approx_unit_price": 420.0,
        "normalized_description": "pipe carbon steel seamless 50 nb schedule 40 astm a106 grade b",
        "common_material_code": None,
        "matching_status": "UNMATCHED",
    }
    response = client.post("/api/v1/materials/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["cpse"] == "BHEL"
    assert data["material_code"] == "BHEL-PP-201"
    assert data["matching_status"] == "UNMATCHED"
    assert data["annual_quantity"] == 15000.0
    assert data["approx_unit_price"] == 420.0
    assert data["created_at"] is not None


def test_composite_unique_code_behavior():
    """
    Two different CPSEs can have the same material code string.
    However, the same CPSE cannot have duplicate material codes.
    """
    item_bhel = {
        "cpse": "BHEL",
        "material_code": "MAT-001",
        "description": "BHEL 50mm Carbon Steel Pipe",
    }
    res1 = client.post("/api/v1/materials/", json=item_bhel)
    assert res1.status_code == 201

    # Same CPSE + same code -> must fail with 400
    res_dup = client.post("/api/v1/materials/", json=item_bhel)
    assert res_dup.status_code == 400
    assert "already exists for CPSE" in res_dup.json()["detail"]

    # Different CPSE + same code -> must succeed
    item_ntpc = {
        "cpse": "NTPC",
        "material_code": "MAT-001",
        "description": "NTPC High Pressure Boiler Tube",
    }
    res_diff_cpse = client.post("/api/v1/materials/", json=item_ntpc)
    assert res_diff_cpse.status_code == 201
    assert res_diff_cpse.json()["cpse"] == "NTPC"
    assert res_diff_cpse.json()["material_code"] == "MAT-001"


def test_bulk_create_materials():
    payload = {
        "items": [
            {
                "cpse": "SAIL",
                "material_code": "SAIL-STL-101",
                "description": "TMT Rebar 12mm Fe500D",
                "uom": "MT",
                "category": "Steel",
            },
            {
                "cpse": "SAIL",
                "material_code": "SAIL-STL-102",
                "description": "TMT Rebar 16mm Fe500D",
                "uom": "MT",
                "category": "Steel",
            },
        ]
    }
    res = client.post("/api/v1/materials/bulk", json=payload)
    assert res.status_code == 201
    assert len(res.json()) == 2


def test_cross_cpse_filtering_and_search():
    # Insert multiple cross-CPSE items
    items = [
        {
            "cpse": "BHEL",
            "material_code": "B-01",
            "description": "Seamless Carbon Steel Pipe 50 NB",
            "technical_specification": "ASTM A106 Gr B",
            "category": "Pipes",
            "common_material_code": "NMC-PIP-50",
            "matching_status": "MATCHED",
        },
        {
            "cpse": "NTPC",
            "material_code": "N-01",
            "description": "CS Seamless Pipe 2 inch Sch 40",
            "technical_specification": "ASTM A106 Grade B",
            "category": "Piping",
            "common_material_code": "NMC-PIP-50",
            "matching_status": "MATCHED",
        },
        {
            "cpse": "ONGC",
            "material_code": "O-01",
            "description": "Ball Valve 2 inch Class 300",
            "technical_specification": "API 6D",
            "category": "Valves",
            "matching_status": "UNMATCHED",
        },
    ]
    for item in items:
        client.post("/api/v1/materials/", json=item)

    # Filter by CPSE
    res_cpse = client.get("/api/v1/materials/?cpse=BHEL")
    assert res_cpse.status_code == 200
    assert len(res_cpse.json()) == 1
    assert res_cpse.json()[0]["cpse"] == "BHEL"

    # Filter by matching_status
    res_status = client.get("/api/v1/materials/?matching_status=MATCHED")
    assert res_status.status_code == 200
    assert len(res_status.json()) == 2

    # Filter by common_material_code
    res_common = client.get("/api/v1/materials/?common_material_code=NMC-PIP-50")
    assert res_common.status_code == 200
    assert len(res_common.json()) == 2

    # Search by technical_specification keyword ("API 6D")
    res_search = client.get("/api/v1/materials/?search=API 6D")
    assert res_search.status_code == 200
    assert len(res_search.json()) == 1
    assert res_search.json()[0]["material_code"] == "O-01"


def test_update_material_harmonization_workflow():
    """Simulate recommending and approving a common code."""
    res = client.post(
        "/api/v1/materials/",
        json={
            "cpse": "IOCL",
            "material_code": "IOCL-VAL-01",
            "description": "Gate Valve 4 inch Class 150",
            "matching_status": "UNMATCHED",
        },
    )
    mat_id = res.json()["id"]

    # Step 1: AI recommends a match
    update_1 = client.put(
        f"/api/v1/materials/{mat_id}",
        json={
            "common_material_code": "NMC-VLV-GT-100",
            "matching_status": "SUGGESTED",
        },
    )
    assert update_1.status_code == 200
    assert update_1.json()["common_material_code"] == "NMC-VLV-GT-100"
    assert update_1.json()["matching_status"] == "SUGGESTED"

    # Step 2: Human user approves the recommendation
    update_2 = client.put(
        f"/api/v1/materials/{mat_id}",
        json={"matching_status": "MATCHED"},
    )
    assert update_2.status_code == 200
    assert update_2.json()["matching_status"] == "MATCHED"


def test_get_materials_by_common_code_endpoint():
    # Insert materials with shared common code
    client.post(
        "/api/v1/materials/",
        json={
            "cpse": "BHEL",
            "material_code": "B-VAL",
            "description": "Gate Valve 100 NB Class 150",
            "common_material_code": "NMC-VLV-100",
            "matching_status": "MATCHED",
        },
    )
    client.post(
        "/api/v1/materials/",
        json={
            "cpse": "NTPC",
            "material_code": "N-VAL",
            "description": "4 inch Class 150 Gate Valve",
            "common_material_code": "NMC-VLV-100",
            "matching_status": "MATCHED",
        },
    )

    res = client.get("/api/v1/materials/common/NMC-VLV-100")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 2
    cpses = {item["cpse"] for item in items}
    assert cpses == {"BHEL", "NTPC"}


def test_delete_material():
    res = client.post(
        "/api/v1/materials/",
        json={"cpse": "SAIL", "material_code": "DEL-01", "description": "To be deleted"},
    )
    mat_id = res.json()["id"]

    del_res = client.delete(f"/api/v1/materials/{mat_id}")
    assert del_res.status_code == 200

    # Ensure 404 on subsequent get
    assert client.get(f"/api/v1/materials/{mat_id}").status_code == 404


def test_harmonization_stats():
    # Ingest diverse materials across CPSEs
    client.post(
        "/api/v1/materials/",
        json={
            "cpse": "BHEL",
            "material_code": "M-1",
            "description": "Item 1",
            "category": "Pipes",
            "matching_status": "MATCHED",
        },
    )
    client.post(
        "/api/v1/materials/",
        json={
            "cpse": "NTPC",
            "material_code": "M-2",
            "description": "Item 2",
            "category": "Pipes",
            "matching_status": "SUGGESTED",
        },
    )
    client.post(
        "/api/v1/materials/",
        json={
            "cpse": "ONGC",
            "material_code": "M-3",
            "description": "Item 3",
            "category": "Valves",
            "matching_status": "UNMATCHED",
        },
    )

    stats_res = client.get("/api/v1/materials/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_materials"] == 3
    assert stats["distinct_cpses"] == 3
    assert stats["matched_count"] == 1
    assert stats["suggested_count"] == 1
    assert stats["unmatched_count"] == 1
    assert stats["cpse_breakdown"] == {"BHEL": 1, "NTPC": 1, "ONGC": 1}
    assert stats["category_breakdown"] == {"Pipes": 2, "Valves": 1}
