"""
Export service: generates downloadable files from query results.

Supported formats: json, csv, excel
Field selection uses dot-notation paths (e.g. "matches[].ip_str").
Array segments are indicated with [] and cause row explosion.
"""

import csv
import io
import json
import uuid
from typing import Any

import openpyxl
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.query import QueryResult


async def generate_export(
    result_id: uuid.UUID,
    fields: list[str],
    fmt: str,
    db: AsyncSession,
) -> StreamingResponse:
    from app.services.data_store import load_result_data

    stmt = select(QueryResult).where(QueryResult.id == result_id)
    result = await db.scalar(stmt)
    if result is None:
        raise ValueError(f"Result {result_id} not found")

    raw_data = load_result_data(result.data_path) if result.data_path else None
    if raw_data is None:
        raise ValueError(f"Result data file not found for {result_id}")

    rows = _extract_rows(raw_data, fields)

    if fmt == "json":
        return _to_json(rows)
    if fmt == "csv":
        return _to_csv(rows, fields)
    if fmt == "excel":
        return _to_excel(rows, fields)

    raise ValueError(f"Unsupported format: {fmt!r}")


# ── Row extraction ─────────────────────────────────────────────────────────────

def _extract_rows(data: dict[str, Any], fields: list[str]) -> list[dict[str, Any]]:
    """
    Walk the data using the provided field paths and produce a flat list of rows.
    Paths with [] cause the containing array to be exploded into individual rows.
    """
    # Separate array paths from scalar paths
    array_paths = [f for f in fields if "[]" in f]
    scalar_paths = [f for f in fields if "[]" not in f]

    if not array_paths:
        # No arrays — single row
        row = {path: _get_value(data, path) for path in scalar_paths}
        return [row]

    # Find the common array prefix shared by the array paths
    prefix = _common_array_prefix(array_paths)
    items = _get_value(data, prefix)
    if not isinstance(items, list):
        items = [items] if items is not None else []

    rows = []
    scalar_values = {path: _get_value(data, path) for path in scalar_paths}

    for item in items:
        row = dict(scalar_values)
        for path in array_paths:
            # Strip the array prefix + "[]." to get the sub-path
            sub_path = path[len(prefix) + 3:]  # remove "prefix[]."
            row[path] = _get_value(item, sub_path) if sub_path else item
        rows.append(row)

    return rows if rows else [scalar_values]


def _common_array_prefix(paths: list[str]) -> str:
    """Extract the part of the path before the first []."""
    return paths[0].split("[]")[0].rstrip(".")


def _get_value(obj: Any, path: str) -> Any:
    """Navigate a nested dict/list using a dot-notation path."""
    if not path:
        return obj
    parts = path.split(".")
    current = obj
    for part in parts:
        if current is None:
            return None
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            # If we hit a list unexpectedly, return a comma-joined string
            current = ", ".join(str(_get_value(item, part)) for item in current)
        else:
            return None
    return current


# ── Format writers ─────────────────────────────────────────────────────────────

def _to_json(rows: list[dict]) -> StreamingResponse:
    content = json.dumps(rows, indent=2, default=str).encode("utf-8")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=export.json"},
    )


def _to_csv(rows: list[dict], fields: list[str]) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    content = buffer.getvalue().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=export.csv"},
    )


def _to_excel(rows: list[dict], fields: list[str]) -> StreamingResponse:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Export"

    # Header row
    ws.append(fields)

    for row in rows:
        ws.append([str(row.get(f, "")) for f in fields])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=export.xlsx"},
    )
