import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ExportRequest(BaseModel):
    result_id: uuid.UUID
    fields: list[str]  # dot-notation paths, e.g. ["matches[].ip_str", "matches[].port"]
    format: Literal["json", "csv", "excel"]


class ExportProfileIn(BaseModel):
    name: str
    format: Literal["json", "csv", "excel"]
    fields: list[str]


class ExportProfileOut(BaseModel):
    id: uuid.UUID
    name: str
    format: str
    fields: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
