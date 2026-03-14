import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class QueryRequest(BaseModel):
    module: str
    query: str
    options: dict[str, Any] | None = None
    case_id: uuid.UUID | None = None


# ── Full schemas (used by GET /queries/{id}) ──────────────────────────────────

class QueryResultOut(BaseModel):
    id: uuid.UUID
    raw_data: dict[str, Any]
    result_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QueryRecordOut(BaseModel):
    id: uuid.UUID
    module: str
    query: str
    status: str
    error_msg: str | None
    duration_ms: int | None
    case_id: uuid.UUID | None = None
    created_at: datetime
    result: QueryResultOut | None = None

    model_config = {"from_attributes": True}


# ── Light schemas (used by GET /queries list — no raw_data) ───────────────────

class QueryResultSummary(BaseModel):
    """Result metadata only — excludes raw_data."""
    id: uuid.UUID
    result_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QueryRecordListItem(BaseModel):
    """Light schema for query lists."""
    id: uuid.UUID
    module: str
    query: str
    status: str
    error_msg: str | None
    duration_ms: int | None
    case_id: uuid.UUID | None = None
    created_at: datetime
    result: QueryResultSummary | None = None

    model_config = {"from_attributes": True}


class QueryListOut(BaseModel):
    total: int
    items: list[QueryRecordListItem]
