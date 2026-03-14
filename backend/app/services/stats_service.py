from datetime import date, timedelta

from sqlalchemy import Date, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.query import QueryRecord


async def get_overview(db: AsyncSession) -> dict:
    """Aggregate counts and success rate across all query records."""
    stmt = select(
        func.count().label("total"),
        func.sum(case((QueryRecord.status == "success", 1), else_=0)).label("success"),
        func.sum(case((QueryRecord.status == "error", 1), else_=0)).label("error"),
        func.avg(QueryRecord.duration_ms).label("avg_duration_ms"),
    )
    row = (await db.execute(stmt)).one()

    total = row.total or 0
    success = int(row.success or 0)
    error = int(row.error or 0)
    success_rate = round((success / total * 100), 1) if total > 0 else 0.0

    return {
        "total_queries": total,
        "successful": success,
        "failed": error,
        "success_rate": success_rate,
        "avg_duration_ms": round(float(row.avg_duration_ms or 0), 1),
    }


async def get_timeline(db: AsyncSession, days: int = 30) -> list[dict]:
    """Return queries-per-day for the last N days, grouped by module."""
    since = date.today() - timedelta(days=days - 1)

    stmt = (
        select(
            cast(QueryRecord.created_at, Date).label("day"),
            QueryRecord.module,
            func.count().label("count"),
        )
        .where(QueryRecord.created_at >= since)
        .group_by("day", QueryRecord.module)
        .order_by("day")
    )

    rows = (await db.execute(stmt)).all()
    return [{"day": str(r.day), "module": r.module, "count": r.count} for r in rows]


async def get_module_breakdown(db: AsyncSession) -> list[dict]:
    """Return query counts grouped by module."""
    stmt = (
        select(QueryRecord.module, func.count().label("count"))
        .group_by(QueryRecord.module)
        .order_by(func.count().desc())
    )
    rows = (await db.execute(stmt)).all()
    return [{"module": r.module, "count": r.count} for r in rows]
