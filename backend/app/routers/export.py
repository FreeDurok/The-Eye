import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models.export_profile import ExportProfile
from app.schemas.export import ExportProfileIn, ExportProfileOut, ExportRequest
from app.services import export_service

router = APIRouter()


@router.post("")
async def export_data(request: ExportRequest, db: AsyncSession = Depends(get_db)) -> StreamingResponse:
    try:
        return await export_service.generate_export(
            result_id=request.result_id,
            fields=request.fields,
            fmt=request.format,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── Export profiles ───────────────────────────────────────────────────────────

@router.get("/profiles", response_model=list[ExportProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(ExportProfile).order_by(ExportProfile.name))).all()
    return rows


@router.post("/profiles", response_model=ExportProfileOut, status_code=201)
async def create_profile(payload: ExportProfileIn, db: AsyncSession = Depends(get_db)):
    profile = ExportProfile(
        name=payload.name,
        format=payload.format,
        fields=payload.fields,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.put("/profiles/{profile_id}", response_model=ExportProfileOut)
async def update_profile(
    profile_id: uuid.UUID,
    payload: ExportProfileIn,
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(ExportProfile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.name = payload.name
    profile.format = payload.format
    profile.fields = payload.fields
    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(profile_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    profile = await db.get(ExportProfile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()
