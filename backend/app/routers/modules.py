from fastapi import APIRouter

from app.modules import get_all_modules

router = APIRouter()


@router.get("")
async def list_modules():
    """Return metadata for all registered OSINT modules."""
    modules = get_all_modules()
    return [
        {
            "name": m.get_info().name,
            "display_name": m.get_info().display_name,
            "description": m.get_info().description,
            "required_keys": m.get_info().required_keys,
            "tags": m.get_info().tags,
            "version": m.get_info().version,
        }
        for m in modules
    ]
