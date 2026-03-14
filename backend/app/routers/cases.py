import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.case import CaseDetailOut, CaseIn, CaseListOut, CaseOut, CaseUpdate
from app.services import case_service

router = APIRouter()


@router.post("", response_model=CaseOut, status_code=201)
async def create_case(data: CaseIn, db: AsyncSession = Depends(get_db)):
    return await case_service.create_case(data, db)


@router.get("", response_model=CaseListOut)
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await case_service.list_cases(db, page=page, page_size=page_size, status=status)


@router.get("/{case_id}", response_model=CaseDetailOut)
async def get_case(case_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    case = await case_service.get_case(case_id, db)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}", response_model=CaseOut)
async def update_case(
    case_id: uuid.UUID, data: CaseUpdate, db: AsyncSession = Depends(get_db)
):
    case = await case_service.update_case(case_id, data, db)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/{case_id}", status_code=204)
async def delete_case(case_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    deleted = await case_service.delete_case(case_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Case not found")


@router.get("/{case_id}/export")
async def export_case(case_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    zip_buffer = await case_service.export_case(case_id, db)
    if zip_buffer is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=case-{case_id}.zip"},
    )


@router.post("/import", response_model=CaseOut, status_code=201)
async def import_case(file: UploadFile, db: AsyncSession = Depends(get_db)):
    raw = await file.read()
    try:
        return await case_service.import_case(raw, db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Import failed: {exc}")
