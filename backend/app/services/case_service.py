import io
import json
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.case import Case
from app.models.query import QueryRecord, QueryResult
from app.schemas.case import (
    CaseDetailOut,
    CaseExport,
    CaseIn,
    CaseListOut,
    CaseOut,
    CaseQuerySummary,
    CaseUpdate,
)
from app.services.data_store import load_result_data, save_result_data


async def create_case(data: CaseIn, db: AsyncSession) -> CaseOut:
    case = Case(
        name=data.name,
        description=data.description,
        notes=data.notes,
        status=data.status,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return _to_case_out(case)


async def get_case(case_id: uuid.UUID, db: AsyncSession) -> CaseDetailOut | None:
    stmt = (
        select(Case)
        .options(selectinload(Case.queries).selectinload(QueryRecord.result))
        .where(Case.id == case_id)
    )
    case = await db.scalar(stmt)
    if case is None:
        return None
    return _to_case_detail(case)


async def list_cases(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
) -> CaseListOut:
    base = select(Case)
    if status:
        base = base.where(Case.status == status)

    count_stmt = select(func.count()).select_from(base.subquery())
    total: int = await db.scalar(count_stmt) or 0

    stmt = (
        base.options(selectinload(Case.queries))
        .order_by(Case.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.scalars(stmt)).all()

    return CaseListOut(
        total=total,
        items=[_to_case_out(c) for c in rows],
    )


async def update_case(
    case_id: uuid.UUID, data: CaseUpdate, db: AsyncSession
) -> CaseOut | None:
    case = await db.get(Case, case_id)
    if case is None:
        return None
    if data.name is not None:
        case.name = data.name
    if data.description is not None:
        case.description = data.description
    if data.notes is not None:
        case.notes = data.notes
    if data.status is not None:
        case.status = data.status
    await db.commit()
    stmt = (
        select(Case)
        .options(selectinload(Case.queries))
        .where(Case.id == case_id)
    )
    case = await db.scalar(stmt)
    return _to_case_out(case)


async def delete_case(case_id: uuid.UUID, db: AsyncSession) -> bool:
    case = await db.get(Case, case_id)
    if case is None:
        return False
    await db.delete(case)
    await db.commit()
    return True


async def export_case(case_id: uuid.UUID, db: AsyncSession) -> io.BytesIO | None:
    """Export a case as ZIP: case.json + results/*.json."""
    stmt = (
        select(Case)
        .options(selectinload(Case.queries).selectinload(QueryRecord.result))
        .where(Case.id == case_id)
    )
    case = await db.scalar(stmt)
    if case is None:
        return None

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        query_summaries = []
        for q in sorted(case.queries, key=lambda q: q.created_at):
            result_file = None

            # If query has result data on disk, include it
            if q.result and q.result.data_path:
                raw_data = load_result_data(q.result.data_path)
                if raw_data is not None:
                    result_filename = f"results/{q.result.id}.json"
                    zf.writestr(result_filename, json.dumps(raw_data, default=str))
                    result_file = result_filename

            query_summaries.append(CaseQuerySummary(
                module=q.module,
                query=q.query,
                status=q.status,
                result_count=q.result.result_count if q.result else None,
                duration_ms=q.duration_ms,
                created_at=q.created_at,
                result_file=result_file,
            ))

        export = CaseExport(
            version="1.0",
            exported_at=datetime.now(timezone.utc),
            case=CaseIn(
                name=case.name,
                description=case.description,
                notes=case.notes,
                status=case.status,
            ),
            queries=query_summaries,
        )
        zf.writestr("case.json", export.model_dump_json(indent=2))

    buf.seek(0)
    return buf


async def import_case(raw_bytes: bytes, db: AsyncSession) -> CaseOut:
    """
    Import a case from either:
    - ZIP file (case.json + results/*.json) → full import with result data
    - JSON file (legacy format) → metadata only, no results
    """
    # Detect format
    if raw_bytes[:2] == b"PK":
        return await _import_from_zip(raw_bytes, db)
    else:
        data = json.loads(raw_bytes)
        return await _import_from_json(data, db)


async def _import_from_zip(raw_bytes: bytes, db: AsyncSession) -> CaseOut:
    """Import from ZIP with full result data."""
    buf = io.BytesIO(raw_bytes)
    with zipfile.ZipFile(buf, "r") as zf:
        case_json = json.loads(zf.read("case.json"))
        case_data = case_json.get("case", {})

        case = Case(
            name=case_data.get("name", "Imported case"),
            description=case_data.get("description"),
            notes=case_data.get("notes"),
            status=case_data.get("status", "open"),
        )
        db.add(case)
        await db.flush()

        for q in case_json.get("queries", []):
            record = QueryRecord(
                module=q.get("module", ""),
                query=q.get("query", ""),
                status=q.get("status", "success"),
                duration_ms=q.get("duration_ms"),
                case_id=case.id,
            )
            db.add(record)
            await db.flush()

            # Restore result data from ZIP
            result_file = q.get("result_file")
            if result_file and result_file in zf.namelist():
                raw_data = json.loads(zf.read(result_file))
                result_id = uuid.uuid4()
                data_path = save_result_data(result_id, raw_data)
                query_result = QueryResult(
                    id=result_id,
                    query_record_id=record.id,
                    data_path=data_path,
                    result_count=q.get("result_count"),
                )
                db.add(query_result)

    await db.commit()
    stmt = (
        select(Case)
        .options(selectinload(Case.queries))
        .where(Case.id == case.id)
    )
    case = await db.scalar(stmt)
    return _to_case_out(case)


async def _import_from_json(data: dict, db: AsyncSession) -> CaseOut:
    """Legacy import from plain JSON (metadata only, no results)."""
    case_data = data.get("case", {})
    case = Case(
        name=case_data.get("name", "Imported case"),
        description=case_data.get("description"),
        notes=case_data.get("notes"),
        status=case_data.get("status", "open"),
    )
    db.add(case)
    await db.flush()

    for q in data.get("queries", []):
        record = QueryRecord(
            module=q.get("module", ""),
            query=q.get("query", ""),
            status=q.get("status", "success"),
            duration_ms=q.get("duration_ms"),
            case_id=case.id,
        )
        db.add(record)

    await db.commit()
    stmt = (
        select(Case)
        .options(selectinload(Case.queries))
        .where(Case.id == case.id)
    )
    case = await db.scalar(stmt)
    return _to_case_out(case)


def _to_case_out(case: Case) -> CaseOut:
    return CaseOut(
        id=case.id,
        name=case.name,
        description=case.description,
        notes=case.notes,
        status=case.status,
        created_at=case.created_at,
        updated_at=case.updated_at,
        query_count=len(case.queries) if case.queries else 0,
    )


def _to_case_detail(case: Case) -> CaseDetailOut:
    return CaseDetailOut(
        id=case.id,
        name=case.name,
        description=case.description,
        notes=case.notes,
        status=case.status,
        created_at=case.created_at,
        updated_at=case.updated_at,
        query_count=len(case.queries) if case.queries else 0,
        queries=[
            CaseQuerySummary(
                module=q.module,
                query=q.query,
                status=q.status,
                result_count=q.result.result_count if q.result else None,
                duration_ms=q.duration_ms,
                created_at=q.created_at,
            )
            for q in sorted(case.queries, key=lambda q: q.created_at, reverse=True)
        ],
    )
