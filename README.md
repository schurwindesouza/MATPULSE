# MATPULSE Backend (SIH Problem Statement 26099)

> **AI-Driven Standardization and Harmonization of Material Codes across CPSEs (Central Public Sector Enterprises)**

---

## Synthetic / Demo Data Notice

> [!IMPORTANT]
> **SYNTHETIC DATASET NOTICE**: All demonstration records and seed data included in this repository (e.g. references to simulated BHEL, NTPC, ONGC, SAIL, IOCL, or Coal India entries) are **strictly synthetic mock data**. 
> They are generated exclusively for testing, software development, schema validation, and solution prototyping until official CPSE master catalog data is provided. They do **not** represent actual, proprietary, or official enterprise catalog data of any CPSE.

---

## Overview

In public sector procurement across India, different CPSEs procure identical or equivalent engineering materials using completely disparate internal material codes, unit classifications, and item descriptions. 

**MATPULSE** is the digital foundation to resolve this challenge:
1. **Preserve CPSE Master Data**: Ingests and maintains each CPSE's authentic material codes, descriptions, and specifications without loss of provenance.
2. **Cross-CPSE Matching & Harmonization**: Accommodates normalized text representations (`normalized_description`) and assignment of a unified **Common National Material Code** (`common_material_code`).
3. **Workflow Lifecycle**: Tracks matching states (`UNMATCHED`, `SUGGESTED`, `MATCHED`, `REVIEWED`, `REJECTED`) for human-in-the-loop review of AI recommendations.
4. **Clean Decoupling**: Strictly material master data and harmonization records—excludes warehouse inventory operations (reorder points, stock locations, min-stock alerts).

---

## Material Model Specification

| Field | Type | Description |
|---|---|---|
| `id` | `Integer` | Primary Key, Auto-increment |
| `cpse` | `String(100)` | CPSE name/acronym (e.g. `BHEL`, `NTPC`, `ONGC`, `SAIL`), required, indexed |
| `material_code` | `String(100)` | Original internal CPSE material code, required, indexed |
| `description` | `Text` | Original material description from CPSE catalog, required |
| `technical_specification`| `Text` | Detailed standards (ASTM/IS/DIN), grades, dimensions (optional) |
| `uom` | `String(50)` | Unit of measurement (e.g. `MT`, `EA`, `MTR`, `KG`) (optional) |
| `category` | `String(100)` | Material category/group (e.g. `Pipes & Tubes`, `Valves`) (optional, indexed) |
| `annual_quantity` | `Float` | Estimated annual procurement volume (optional) |
| `approx_unit_price` | `Float` | Estimated unit price in INR (optional) |
| `normalized_description`| `Text` | Standardized/cleaned text for AI tokenization and embedding matching (optional) |
| `common_material_code` | `String(100)` | Unified Common National Material Code (optional, indexed) |
| `matching_status` | `String(50)` | Default `"UNMATCHED"` (`UNMATCHED`, `SUGGESTED`, `MATCHED`, `REVIEWED`, `REJECTED`) |
| `created_at` | `DateTime` | Record creation timestamp (UTC) |
| `updated_at` | `DateTime` | Record last update timestamp (UTC) |

### Key Database Constraints
- **Materials**: `(cpse, material_code)` composite unique constraint ensures codes are unique within each CPSE, but different CPSEs can independently use identical code strings.
- **Material Matches**: `(material_a_id, material_b_id)` unique constraint with canonical ordering (`material_a_id < material_b_id`) prevents duplicate or reversed pair recommendations.

---

## Material Match Model Specification (`material_matches`)

| Field | Type | Description |
|---|---|---|
| `id` | `Integer` | Primary Key, Auto-increment |
| `material_a_id` | `Integer` | Foreign Key (`materials.id`, ON DELETE CASCADE), canonical min ID |
| `material_b_id` | `Integer` | Foreign Key (`materials.id`, ON DELETE CASCADE), canonical max ID |
| `semantic_score` | `Float` | Cosine similarity of domain embeddings (0 - 100) |
| `technical_score` | `Float` | Deterministic attribute compatibility (0 - 100) |
| `category_score` | `Float` | Category domain compatibility (0 - 100) |
| `uom_score` | `Float` | Unit of measurement compatibility (0 - 100) |
| `final_confidence` | `Float` | Weighted composite confidence score (0 - 100) |
| `classification` | `String(50)` | `HIGH_CONFIDENCE_MATCH`, `REVIEW_REQUIRED`, `LOW_CONFIDENCE` |
| `status` | `String(50)` | Workflow status: `PENDING`, `APPROVED`, `REJECTED` |
| `common_material_code` | `String(100)` | Common National Material Code assigned upon approval |
| `reasons` | `JSON` | List of supporting explainability explanations |
| `warnings` | `JSON` | List of warnings or discrepancies |
| `attribute_comparison` | `JSON` | Detailed dictionary of attribute evaluations |
| `rejection_reason` | `Text` | Reviewer justification if rejected |
| `created_at` | `DateTime` | Recommendation generation timestamp |
| `reviewed_at` | `DateTime` | Timestamp of human approval or rejection |

---

## Project Structure

```
MATPULSE/
├── app/
│   ├── __init__.py          # Package declaration
│   ├── config.py            # Settings (DB URL, API prefix)
│   ├── database.py          # SQLAlchemy SQLite engine & session dependency
│   ├── models/              # SQLAlchemy database models
│   │   ├── __init__.py
│   │   ├── material.py      # Material master ORM model
│   │   └── match.py         # Material match recommendation ORM model
│   ├── schemas/             # Pydantic v2 validation models
│   │   ├── __init__.py
│   │   ├── material.py      # Material CRUD schemas
│   │   └── matching.py      # Matching, batch, and review workflow schemas
│   ├── crud/                # Data access layer
│   │   ├── __init__.py
│   │   ├── material.py      # Material CRUD & stats
│   │   └── match.py         # Match recommendation CRUD & workflow actions
│   ├── services/            # AI matching services
│   │   ├── __init__.py
│   │   ├── normalizer.py    # Industrial text preprocessing
│   │   ├── attribute_extractor.py # Regex/domain attribute extraction
│   │   ├── matcher.py       # Pairwise AI scoring & validation
│   │   └── candidate_matcher.py   # Cross-CPSE candidate generation & ranking
│   ├── routers/             # API routes
│   │   ├── __init__.py
│   │   ├── material.py      # Material endpoints (/api/v1/materials)
│   │   └── matching.py      # Matching & workflow endpoints (/api/v1/matching)
│   └── main.py              # Application entrypoint & CORS configuration
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Shared test fixtures & in-memory SQLite DB
│   ├── test_materials.py    # Material master CRUD tests
│   ├── test_matching.py     # Pairwise AI matching tests
│   ├── test_batch_matching.py # Candidate generation & ranking tests
│   └── test_review_workflow.py # Persistence & human review workflow tests
├── seed.py                  # Demo synthetic cross-CPSE data seeder
├── requirements.txt         # Core dependencies
└── README.md                # Documentation & instructions
```

---

## Exact Commands

### 1. Install Dependencies

Open a PowerShell terminal in `d:\projects\MATPULSE`:

```powershell
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### 2. Database Setup & Synthetic Seeding

Initialize the SQLite database schema and populate synthetic test records:

```powershell
python seed.py
```

### 3. Run Automated Tests

Execute the automated test suite (uses isolated in-memory SQLite):

```powershell
.\.venv\Scripts\pytest -v
```

### 4. Run the Backend Server

Start the FastAPI development server:

```powershell
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

### 5. Verify the API via Interactive Swagger UI

Open your browser and navigate to:
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## API Reference

### Material Endpoints (`/api/v1/materials`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/materials/` | List and search materials across CPSEs (supports `cpse`, `category`, `matching_status`, `common_material_code`, `search`, pagination) |
| `POST` | `/api/v1/materials/` | Ingest a single material master record |
| `POST` | `/api/v1/materials/bulk` | Bulk upload CPSE catalog items |
| `GET` | `/api/v1/materials/stats` | Harmonization stats (totals, CPSE breakdown, status distribution) |
| `GET` | `/api/v1/materials/common/{common_code}` | Get all CPSE items harmonized under a National Material Code |
| `GET` | `/api/v1/materials/{id}` | Retrieve single material details |
| `PUT` | `/api/v1/materials/{id}` | Update material (assign common code, update matching status) |
| `DELETE` | `/api/v1/materials/{id}` | Remove material |

### AI Matching & Review Workflow Endpoints (`/api/v1/matching`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/matching/compare` | Pairwise comparison of two materials by ID with explainable scores |
| `POST` | `/api/v1/matching/batch` | Read-only batch matching with candidate generation and ranking (`top_k`, `min_confidence`, `cpse`) |
| `POST` | `/api/v1/matching/generate` | Generate and persist AI match recommendations as `PENDING` into `material_matches` table |
| `GET` | `/api/v1/matching/review-queue` | Retrieve review queue with filters (`status`, `min_confidence`, `classification`, `cpse`, pagination) |
| `GET` | `/api/v1/matching/{match_id}` | Detailed inspection of recommendation with full materials and metrics |
| `POST` | `/api/v1/matching/{match_id}/approve` | Approve recommendation and assign Common National Material Code to both materials |
| `POST` | `/api/v1/matching/{match_id}/reject` | Reject recommendation with optional reason (preserves master records intact) |

