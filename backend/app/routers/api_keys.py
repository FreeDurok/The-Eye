from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.api_key import ApiKeyStatusOut
from app.services.api_key_service import check_all_keys

router = APIRouter()


@router.get("/status", response_model=list[ApiKeyStatusOut])
async def get_api_key_status(db: AsyncSession = Depends(get_db)):
    """Validate all configured API keys and return their status."""
    return await check_all_keys(db)
