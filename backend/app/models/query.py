import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if False:  # TYPE_CHECKING
    from app.models.case import Case  # noqa: F401


class QueryRecord(Base):
    __tablename__ = "query_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    module: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="pending", index=True
    )
    error_msg: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    result: Mapped["QueryResult | None"] = relationship(
        "QueryResult", back_populates="record", uselist=False, cascade="all, delete-orphan"
    )
    case: Mapped["Case | None"] = relationship("Case", back_populates="queries")


class QueryResult(Base):
    __tablename__ = "query_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    query_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("query_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    data_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    result_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_available: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    record: Mapped[QueryRecord] = relationship("QueryRecord", back_populates="result")
