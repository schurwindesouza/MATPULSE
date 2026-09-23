import io
import csv
from typing import List, Dict, Any, Tuple, Optional
import openpyxl
from sqlalchemy.orm import Session
from app.models.material import Material
from app.crud.material import get_material_by_cpse_and_code, create_material
from app.schemas.material import MaterialCreate

# Target field definitions for MATPULSE Material Master
TARGET_FIELDS = {
    "material_code": {"label": "Material Code", "required": True},
    "description": {"label": "Description", "required": True},
    "cpse": {"label": "CPSE Organization", "required": True},
    "technical_specification": {"label": "Technical Specification", "required": False},
    "uom": {"label": "Unit of Measure (UOM)", "required": False},
    "category": {"label": "Category / Group", "required": False},
    "annual_quantity": {"label": "Annual Quantity", "required": False},
    "approx_unit_price": {"label": "Approx Unit Price (INR)", "required": False},
}

# Known common column aliases across CPSE enterprise catalogs
COLUMN_ALIASES: Dict[str, List[str]] = {
    "material_code": [
        "material code", "mat_code", "material_code", "code", "item code",
        "item_code", "matcode", "item_no", "part_no", "part number"
    ],
    "description": [
        "description", "material description", "mat_desc", "item description",
        "short description", "desc", "item_desc", "item_name", "material_name"
    ],
    "cpse": [
        "cpse", "organization", "enterprise", "company", "org", "plant",
        "division", "psu"
    ],
    "technical_specification": [
        "technical specification", "tech_spec", "specification", "specs",
        "technical_spec", "specifications", "spec", "standard", "item_spec"
    ],
    "uom": [
        "uom", "unit", "unit of measure", "unit_of_measure", "meas_unit",
        "base_uom", "order_uom"
    ],
    "category": [
        "category", "material_group", "group", "material group", "mat_group",
        "cat", "class", "commodity"
    ],
    "annual_quantity": [
        "annual quantity", "annual_qty", "yearly_quantity", "quantity",
        "qty", "annual_volume", "est_qty", "annual_procurement_qty"
    ],
    "approx_unit_price": [
        "approx unit price", "unit_price", "price", "rate", "unit price",
        "estimated_price", "est_unit_price", "approx_price", "unit_rate"
    ],
}


def parse_file_records(file_bytes: bytes, filename: str) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Safely parse CSV or Excel (.xlsx) file into column headers and raw row dictionaries.
    """
    fn = filename.lower()

    if fn.endswith(".csv") or fn.endswith(".txt"):
        # Try common encodings
        text = None
        for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
            try:
                text = file_bytes.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            raise ValueError("Unable to decode CSV file. Please ensure it is saved in UTF-8 format.")

        # Determine delimiter (sniffer or fallback to comma)
        sample = text[:4096]
        delimiter = ","
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample, delimiters=",;\t|")
            delimiter = dialect.delimiter
        except Exception:
            # Fallback heuristic
            if ";" in sample and sample.count(";") > sample.count(","):
                delimiter = ";"
            elif "\t" in sample and sample.count("\t") > sample.count(","):
                delimiter = "\t"

        reader = csv.reader(io.StringIO(text), delimiter=delimiter)
        raw_rows = list(reader)
        if not raw_rows:
            return [], []

        headers = [h.strip() for h in raw_rows[0] if h is not None]
        headers = [h if h else f"Column_{i+1}" for i, h in enumerate(headers)]

        records = []
        for row in raw_rows[1:]:
            if not row or all(c.strip() == "" for c in row):
                continue
            row_dict = {}
            for i, h in enumerate(headers):
                val = row[i].strip() if i < len(row) else ""
                row_dict[h] = val
            records.append(row_dict)

        return headers, records

    elif fn.endswith(".xlsx"):
        try:
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
            sheet = wb.active
            rows_iter = sheet.iter_rows(values_only=True)

            first_row = next(rows_iter, None)
            if not first_row:
                return [], []

            headers = [str(c).strip() if c is not None else f"Column_{i+1}" for i, c in enumerate(first_row)]
            records = []
            for row in rows_iter:
                if not row or all(c is None or str(c).strip() == "" for c in row):
                    continue
                row_dict = {}
                for i, h in enumerate(headers):
                    val = row[i] if i < len(row) else ""
                    row_dict[h] = str(val).strip() if val is not None else ""
                records.append(row_dict)

            wb.close()
            return headers, records
        except Exception as e:
            raise ValueError(f"Failed to parse Excel (.xlsx) file: {str(e)}")

    else:
        raise ValueError("Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx) file.")


def detect_column_mappings(columns: List[str]) -> Dict[str, Optional[str]]:
    """
    Propose best-guess mapping between target MATPULSE fields and uploaded columns.
    Returns: { target_field: matched_uploaded_column_name or None }
    """
    mapping: Dict[str, Optional[str]] = {target: None for target in TARGET_FIELDS}
    normalized_cols = {col.strip().lower().replace("_", " ").replace("-", " "): col for col in columns}

    for target, aliases in COLUMN_ALIASES.items():
        # Check exact matches or aliases
        for alias in aliases:
            norm_alias = alias.replace("_", " ").replace("-", " ")
            if norm_alias in normalized_cols:
                mapping[target] = normalized_cols[norm_alias]
                break
        if mapping[target] is None:
            # Check substring matches
            for norm_c, orig_c in normalized_cols.items():
                if target.replace("_", " ") in norm_c or norm_c in target.replace("_", " "):
                    mapping[target] = orig_c
                    break

    return mapping


def validate_dataset(
    records: List[Dict[str, Any]],
    mapping: Dict[str, Optional[str]],
    default_cpse: Optional[str] = None,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Dry-run validation of uploaded dataset against mapped fields.
    Checks:
    - Required fields: material_code, description, cpse
    - Intra-file duplicates (cpse, material_code)
    - Existing database duplicates (cpse, material_code)
    - Number format parsing (annual_quantity, approx_unit_price)
    """
    total_rows = len(records)
    valid_records: List[Dict[str, Any]] = []
    invalid_rows: List[Dict[str, Any]] = []
    duplicate_rows: List[Dict[str, Any]] = []
    warnings: List[str] = []

    seen_keys = set()

    for idx, row in enumerate(records, start=1):
        row_errors = []

        # Extract values according to mapping
        item: Dict[str, Any] = {}
        for target in TARGET_FIELDS:
            col_name = mapping.get(target)
            val = row.get(col_name) if col_name else None
            item[target] = val.strip() if isinstance(val, str) else val

        # Handle CPSE fallback
        if not item.get("cpse") and default_cpse:
            item["cpse"] = default_cpse.strip()

        # Required fields validation
        if not item.get("cpse"):
            row_errors.append("Missing required CPSE organization")
        if not item.get("material_code"):
            row_errors.append("Missing required Material Code")
        if not item.get("description"):
            row_errors.append("Missing required Description")

        # Numeric validations
        if item.get("annual_quantity"):
            try:
                item["annual_quantity"] = float(str(item["annual_quantity"]).replace(",", ""))
                if item["annual_quantity"] < 0:
                    row_errors.append("Annual quantity must be non-negative")
            except (ValueError, TypeError):
                row_errors.append(f"Invalid numeric value for annual quantity: '{item.get('annual_quantity')}'")
                item["annual_quantity"] = None

        if item.get("approx_unit_price"):
            try:
                item["approx_unit_price"] = float(str(item["approx_unit_price"]).replace(",", ""))
                if item["approx_unit_price"] < 0:
                    row_errors.append("Approx unit price must be non-negative")
            except (ValueError, TypeError):
                row_errors.append(f"Invalid numeric value for approx unit price: '{item.get('approx_unit_price')}'")
                item["approx_unit_price"] = None

        # Check for intra-file duplicates
        cpse = item.get("cpse")
        code = item.get("material_code")
        if cpse and code:
            pair_key = (cpse.lower(), code.lower())
            if pair_key in seen_keys:
                duplicate_rows.append({
                    "row_number": idx,
                    "cpse": cpse,
                    "material_code": code,
                    "reason": f"Duplicate material code '{code}' for CPSE '{cpse}' within uploaded file",
                })
                continue
            seen_keys.add(pair_key)

            # Check database for existing duplicate
            if db:
                existing = get_material_by_cpse_and_code(db, cpse=cpse, material_code=code)
                if existing:
                    duplicate_rows.append({
                        "row_number": idx,
                        "cpse": cpse,
                        "material_code": code,
                        "reason": f"Material code '{code}' already exists in database for CPSE '{cpse}'",
                    })
                    continue

        if row_errors:
            invalid_rows.append({
                "row_number": idx,
                "cpse": cpse or "Unknown",
                "material_code": code or "Unknown",
                "errors": row_errors,
            })
        else:
            valid_records.append(item)

    if duplicate_rows:
        warnings.append(f"Found {len(duplicate_rows)} duplicate material codes that will be skipped.")
    if invalid_rows:
        warnings.append(f"Found {len(invalid_rows)} invalid rows with missing or malformed required fields.")

    return {
        "total_rows": total_rows,
        "valid_count": len(valid_records),
        "invalid_count": len(invalid_rows),
        "duplicate_count": len(duplicate_rows),
        "warnings": warnings,
        "preview_records": valid_records[:15],
        "invalid_samples": invalid_rows[:5],
        "duplicate_samples": duplicate_rows[:5],
        "valid_records": valid_records,
    }


def execute_import(
    valid_records: List[Dict[str, Any]],
    db: Session,
) -> Dict[str, Any]:
    """
    Ingest validated records into the SQLite materials table.
    """
    imported_count = 0
    skipped_count = 0
    rejected_count = 0

    for item in valid_records:
        try:
            # Check duplicate one last time to prevent race conditions
            existing = get_material_by_cpse_and_code(db, cpse=item["cpse"], material_code=item["material_code"])
            if existing:
                skipped_count += 1
                continue

            create_data = MaterialCreate(
                cpse=item["cpse"],
                material_code=item["material_code"],
                description=item["description"],
                technical_specification=item.get("technical_specification"),
                uom=item.get("uom"),
                category=item.get("category"),
                annual_quantity=item.get("annual_quantity"),
                approx_unit_price=item.get("approx_unit_price"),
                normalized_description=None,  # AI pipeline normalizes as needed
                common_material_code=None,
                matching_status="UNMATCHED",
            )
            create_material(db, create_data)
            imported_count += 1
        except Exception:
            rejected_count += 1

    return {
        "records_processed": len(valid_records),
        "records_imported": imported_count,
        "records_skipped": skipped_count,
        "records_rejected": rejected_count,
    }
