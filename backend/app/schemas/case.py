import uuid
from datetime import datetime

from pydantic import BaseModel


class CaseIn(BaseModel):
    name: str
    description: str | None = None
    notes: str | None = None
    status: str = "open"


class CaseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    notes: str | None = None
    status: str | None = None


class CaseQuerySummary(BaseModel):
    id: uuid.UUID | None = None  # None for imported queries without an id
    module: str
    query: str
    status: str
    result_count: int | None
    total_available: int | None = None
    duration_ms: int | None
    created_at: datetime
    result_file: str | None = None  # relative path inside ZIP (e.g. "results/abc.json")

    model_config = {"from_attributes": True}


class CaseOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    notes: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    query_count: int = 0

    model_config = {"from_attributes": True}


class CaseDetailOut(CaseOut):
    queries: list[CaseQuerySummary] = []


class CaseExport(BaseModel):
    version: str = "1.0"
    exported_at: datetime
    case: CaseIn
    queries: list[CaseQuerySummary]


class CaseListOut(BaseModel):
    total: int
    items: list[CaseOut]
