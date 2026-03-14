import asyncio
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKeyAudit
from app.modules import get_all_modules
from app.schemas.api_key import ApiKeyStatusOut


async def check_all_keys(db: AsyncSession) -> list[ApiKeyStatusOut]:
    """
    Validate API keys for every registered module concurrently.
    Writes an audit record for each check.
    """
    modules = get_all_modules()

    async def _check(module) -> ApiKeyStatusOut:
        info = module.get_info()
        is_valid, error_msg = await module.validate_keys()

        # Determine if any key is at least configured (non-empty)
        is_configured = all(
            _key_is_set(key_name) for key_name in info.required_keys
        )

        audit = ApiKeyAudit(
            module=info.name,
            is_valid=is_valid if is_configured else False,
            error_msg=error_msg,
        )
        db.add(audit)

        return ApiKeyStatusOut(
            module=info.name,
            display_name=info.display_name,
            is_configured=is_configured,
            is_valid=is_valid if is_configured else None,
            error_msg=error_msg,
            required_keys=info.required_keys,
        )

    results = await asyncio.gather(*[_check(m) for m in modules])
    await db.commit()
    return list(results)


def _key_is_set(env_var_name: str) -> bool:
    """Check if the env var corresponding to a key name has a non-empty value."""
    from app.config import settings

    # Map env var names to settings attributes
    mapping: dict[str, Any] = {
        "SHODAN_API_KEY": settings.shodan_api_key,
        "CENSYS_API_ID": settings.censys_api_id,
        "CENSYS_API_SECRET": settings.censys_api_secret,
    }
    value = mapping.get(env_var_name, "")
    return bool(value)
