import json
from typing import Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.importer import (
    parse_file_records,
    detect_column_mappings,
    validate_dataset,
    execute_import,
    TARGET_FIELDS,
)

router = APIRouter()

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit


def _validate_file_size(file_bytes: bytes):
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )


@router.post(
    "/preview",
    summary="Inspect uploaded CPSE catalog file and auto-detect columns",
    description="Parses CSV or Excel (.xlsx) file, identifies headers, proposes column mappings, and returns sample rows.",
)
async def preview_import_file(
    file: UploadFile = File(..., description="CSV or XLSX material catalog file"),
):
    contents = await file.read()
    _validate_file_size(contents)

    try:
        headers, records = parse_file_records(contents, file.filename or "uploaded.csv")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process file: {str(e)}",
        )

    if not headers or not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File contains no data rows or recognizable header columns.",
        )

    suggested_mapping = detect_column_mappings(headers)

    return {
        "filename": file.filename,
        "total_rows": len(records),
        "columns": headers,
        "suggested_mapping": suggested_mapping,
        "target_fields": TARGET_FIELDS,
        "sample_rows": records[:8],
    }


@router.post(
    "/validate",
    summary="Validate dataset against mapped Material Master schema",
    description="Dry-run validation checking required fields, intra-file duplicates, and existing database duplicates.",
)
async def validate_import_dataset(
    file: UploadFile = File(..., description="CSV or XLSX catalog file"),
    mapping: str = Form(..., description="JSON serialized column mapping: { target_field: uploaded_column }"),
    default_cpse: Optional[str] = Form(None, description="Fallback CPSE name if not present in file"),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    _validate_file_size(contents)

    try:
        col_mapping = json.loads(mapping)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON structure in column mapping parameter.",
        )

    try:
        _, records = parse_file_records(contents, file.filename or "uploaded.csv")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    val_res = validate_dataset(
        records=records,
        mapping=col_mapping,
        default_cpse=default_cpse,
        db=db,
    )

    # Return validation report without full raw objects to keep payload clean
    return {
        "filename": file.filename,
        "total_rows": val_res["total_rows"],
        "valid_count": val_res["valid_count"],
        "invalid_count": val_res["invalid_count"],
        "duplicate_count": val_res["duplicate_count"],
        "warnings": val_res["warnings"],
        "preview_records": val_res["preview_records"],
        "invalid_samples": val_res["invalid_samples"],
        "duplicate_samples": val_res["duplicate_samples"],
    }


@router.post(
    "/execute",
    summary="Execute validated material catalog ingestion into database",
    description="Ingests all valid non-duplicate rows into the Material Master database, making them immediately available for AI matching.",
)
async def execute_import_dataset(
    file: UploadFile = File(..., description="CSV or XLSX catalog file"),
    mapping: str = Form(..., description="JSON serialized column mapping"),
    default_cpse: Optional[str] = Form(None, description="Fallback CPSE name"),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    _validate_file_size(contents)

    try:
        col_mapping = json.loads(mapping)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON structure in column mapping parameter.",
        )

    try:
        _, records = parse_file_records(contents, file.filename or "uploaded.csv")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    val_res = validate_dataset(
        records=records,
        mapping=col_mapping,
        default_cpse=default_cpse,
        db=db,
    )

    if val_res["valid_count"] == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid records to import. Please check file format and column mappings.",
        )

    import_res = execute_import(valid_records=val_res["valid_records"], db=db)

    return {
        "filename": file.filename,
        "records_processed": import_res["records_processed"],
        "records_imported": import_res["records_imported"],
        "records_skipped": import_res["records_skipped"] + val_res["duplicate_count"],
        "records_rejected": import_res["records_rejected"] + val_res["invalid_count"],
        "status": "COMPLETED",
    }
