"""Import external OSINT data files (JSONL, JSON, gzip) into The Eye."""

import gzip
import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.query import QueryRecord, QueryResult
from app.schemas.query import QueryRecordOut
from app.services.data_store import save_result_data
from app.services.query_service import _build_record_out


async def import_file(
    file_content: bytes,
    filename: str,
    module: str | None,
    query: str,
    case_id: uuid.UUID | None,
    db: AsyncSession,
) -> QueryRecordOut:
    """
    Import an external data file and create QueryRecord + QueryResult.

    Supports:
    - JSONL (one JSON object per line)
    - JSON (full structure or bare array)
    - Gzip-compressed versions of the above
    """
    # 1. Decompress if gzip
    raw = file_content
    if raw[:2] == b"\x1f\x8b":
        try:
            raw = gzip.decompress(raw)
        except Exception as exc:
            raise ValueError(f"Failed to decompress gzip file: {exc}")

    # 2. Decode
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"File is not valid UTF-8: {exc}")

    # 3. Parse: detect JSONL vs JSON
    data = _parse_content(text)

    # 4. Detect module and wrap data
    module, wrapped, item_count = _detect_and_wrap(data, module)

    # 5. Create records (same pattern as query_service.run_query)
    record = QueryRecord(
        module=module,
        query=query,
        status="success",
        case_id=case_id,
        duration_ms=None,
    )
    db.add(record)
    await db.flush()

    result_id = uuid.uuid4()
    data_path = save_result_data(result_id, wrapped)
    query_result = QueryResult(
        id=result_id,
        query_record_id=record.id,
        data_path=data_path,
        result_count=item_count,
        total_available=item_count,
    )
    db.add(query_result)

    await db.commit()
    await db.refresh(record, ["result"])

    return _build_record_out(record)


def _parse_content(text: str) -> list | dict:
    """Parse text as JSONL or JSON."""
    stripped = text.strip()
    if not stripped:
        raise ValueError("File is empty")

    # Try JSON first (single object or array)
    if stripped.startswith("{") or stripped.startswith("["):
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            pass

    # Try JSONL (multiple lines, each a JSON object)
    items = []
    for i, line in enumerate(stripped.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            items.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON on line {i}: {exc}")

    if not items:
        raise ValueError("No valid JSON objects found in file")

    return items


def _detect_and_wrap(data: list | dict, module: str | None) -> tuple[str, dict, int]:
    """
    Detect module from data structure and wrap into module-specific format.
    Returns (module_name, wrapped_data, item_count).
    """
    # Already a wrapped dict (e.g. full Shodan/Censys API response)
    if isinstance(data, dict):
        if "matches" in data:
            mod = module or "shodan"
            items = data["matches"]
            return mod, data, len(items)
        if "hits" in data:
            mod = module or "censys"
            items = data["hits"]
            return mod, data, len(items)
        # Unknown dict structure
        if module:
            return module, data, 1
        raise ValueError(
            "Cannot auto-detect module from JSON structure. "
            "Please specify the module."
        )

    # List of items (from JSONL or JSON array)
    if isinstance(data, list):
        if len(data) == 0:
            raise ValueError("File contains no data items")

        detected = module or _detect_module_from_item(data[0])
        if detected is None:
            raise ValueError(
                "Cannot auto-detect module from data fields. "
                "Please specify the module."
            )

        wrapped = _wrap_items(detected, data)
        return detected, wrapped, len(data)

    raise ValueError("Unexpected data format")


def _detect_module_from_item(item: dict) -> str | None:
    """Inspect a single item to guess which OSINT module produced it."""
    if not isinstance(item, dict):
        return None
    # Shodan banner objects typically have ip_str + port
    if "ip_str" in item and "port" in item:
        return "shodan"
    # Censys host objects have services + autonomous_system
    if "services" in item and "autonomous_system" in item:
        return "censys"
    return None


def _wrap_items(module: str, items: list) -> dict:
    """Wrap a list of items into the module-specific structure."""
    if module == "censys":
        return {"total": len(items), "hits": items}
    # Default to Shodan-style wrapping
    return {"total": len(items), "matches": items}
