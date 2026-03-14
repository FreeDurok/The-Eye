from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.services import stats_service

router = APIRouter()


@router.get("/overview")
async def stats_overview(db: AsyncSession = Depends(get_db)):
    return await stats_service.get_overview(db)


@router.get("/timeline")
async def stats_timeline(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    return await stats_service.get_timeline(db, days=days)


@router.get("/modules")
async def stats_modules(db: AsyncSession = Depends(get_db)):
    return await stats_service.get_module_breakdown(db)
