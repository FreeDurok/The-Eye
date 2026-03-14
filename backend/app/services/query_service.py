import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import load_only, selectinload

from app.models.query import QueryRecord, QueryResult
from app.modules import get_module
from app.schemas.query import (
    QueryListOut,
    QueryRecordListItem,
    QueryRecordOut,
    QueryResultOut,
    QueryRequest,
)
from app.services.data_store import load_result_data, save_result_data


async def run_query(request: QueryRequest, db: AsyncSession) -> QueryRecordOut:
    """
    Orchestrate a query:
    1. Validate the module exists
    2. Create a pending QueryRecord
    3. Execute via the module
    4. Save result data to filesystem + metadata to DB
    """
    module = get_module(request.module)
    if module is None:
        raise ValueError(f"Unknown module: {request.module!r}")

    record = QueryRecord(
        module=request.module,
        query=request.query,
        status="pending",
        case_id=request.case_id,
    )
    db.add(record)
    await db.flush()

    module_result = await module.run_query(request.query, request.options)

    record.status = "success" if module_result.success else "error"
    record.error_msg = module_result.error
    record.duration_ms = module_result.duration_ms

    if module_result.success and module_result.data is not None:
        result_id = uuid.uuid4()
        data_path = save_result_data(result_id, module_result.data)
        query_result = QueryResult(
            id=result_id,
            query_record_id=record.id,
            data_path=data_path,
            result_count=module_result.result_count,
        )
        db.add(query_result)

    await db.commit()
    await db.refresh(record, ["result"])

    return _build_record_out(record)


async def get_query(query_id: uuid.UUID, db: AsyncSession) -> QueryRecordOut | None:
    """Get a single query with full result data (loaded from filesystem)."""
    stmt = (
        select(QueryRecord)
        .options(selectinload(QueryRecord.result))
        .where(QueryRecord.id == query_id)
    )
    row = await db.scalar(stmt)
    if row is None:
        return None
    return _build_record_out(row)


async def list_queries(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    module: str | None = None,
) -> QueryListOut:
    """List queries with lightweight result summary (no raw_data)."""
    base = select(QueryRecord).options(
        selectinload(QueryRecord.result).load_only(
            QueryResult.id,
            QueryResult.result_count,
            QueryResult.created_at,
        )
    )

    if module:
        base = base.where(QueryRecord.module == module)

    count_stmt = select(func.count()).select_from(
        select(QueryRecord.id).where(
            QueryRecord.module == module if module else True
        ).subquery()
    )
    total: int = await db.scalar(count_stmt) or 0

    stmt = (
        base.order_by(QueryRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.scalars(stmt)).all()

    return QueryListOut(
        total=total,
        items=[QueryRecordListItem.model_validate(r) for r in rows],
    )


def _build_record_out(record: QueryRecord) -> QueryRecordOut:
    """Build a full QueryRecordOut, loading raw_data from filesystem."""
    result_out = None
    if record.result:
        raw_data = load_result_data(record.result.data_path) if record.result.data_path else None
        result_out = QueryResultOut(
            id=record.result.id,
            raw_data=raw_data or {},
            result_count=record.result.result_count,
            created_at=record.result.created_at,
        )

    return QueryRecordOut(
        id=record.id,
        module=record.module,
        query=record.query,
        status=record.status,
        error_msg=record.error_msg,
        duration_ms=record.duration_ms,
        case_id=record.case_id,
        created_at=record.created_at,
        result=result_out,
    )
