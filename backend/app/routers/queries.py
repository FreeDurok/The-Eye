import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.query import QueryListOut, QueryRecordOut, QueryRequest
from app.services import query_service

router = APIRouter()


@router.post("", response_model=QueryRecordOut, status_code=201)
async def run_query(request: QueryRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await query_service.run_query(request, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=QueryListOut)
async def list_queries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    module: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await query_service.list_queries(db, page=page, page_size=page_size, module=module)


@router.get("/{query_id}", response_model=QueryRecordOut)
async def get_query(query_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    record = await query_service.get_query(query_id, db)
    if record is None:
        raise HTTPException(status_code=404, detail="Query not found")
    return record
