import logging
import time
from typing import Any

import httpx

from app.config import settings
from app.modules.base import ModuleInfo, OsintModule, QueryResult

_CENSYS_BASE = "https://search.censys.io/api"
_PAGE_SIZE = 100
_ABSOLUTE_MAX = 10_000

logger = logging.getLogger(__name__)


class CensysModule(OsintModule):

    def get_info(self) -> ModuleInfo:
        return ModuleInfo(
            name="censys",
            display_name="Censys",
            description="Search internet hosts, certificates, and domain data using the Censys Search API.",
            required_keys=["CENSYS_API_ID", "CENSYS_API_SECRET"],
            tags=["host", "certificate", "network"],
        )

    async def validate_keys(self) -> tuple[bool, str | None]:
        if not settings.censys_api_id or not settings.censys_api_secret:
            missing = []
            if not settings.censys_api_id:
                missing.append("CENSYS_API_ID")
            if not settings.censys_api_secret:
                missing.append("CENSYS_API_SECRET")
            return False, f"{', '.join(missing)} not set"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{_CENSYS_BASE}/v1/account",
                    auth=(settings.censys_api_id, settings.censys_api_secret),
                )
            if response.status_code == 200:
                return True, None
            if response.status_code == 401:
                return False, "Invalid credentials"
            return False, f"Unexpected status {response.status_code}"
        except httpx.TimeoutException:
            return False, "Connection timed out"
        except Exception as exc:
            return False, str(exc)

    async def run_query(self, query: str, options: dict[str, Any] | None = None) -> QueryResult:
        start = time.monotonic()
        opts = dict(options or {})

        index = opts.pop("index", "hosts")
        max_results = opts.pop("max_results", _PAGE_SIZE)
        if max_results == 0:
            max_results = _ABSOLUTE_MAX
        max_results = min(max_results, _ABSOLUTE_MAX)

        per_page = min(max_results, _PAGE_SIZE)
        all_hits: list[dict] = []
        total = 0
        cursor: str | None = None
        page_num = 0

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                while len(all_hits) < max_results:
                    payload: dict[str, Any] = {"q": query, "per_page": per_page}
                    payload.update({k: v for k, v in opts.items()})
                    if cursor:
                        payload["cursor"] = cursor

                    response = await client.post(
                        f"{_CENSYS_BASE}/v2/{index}/search",
                        json=payload,
                        auth=(settings.censys_api_id, settings.censys_api_secret),
                    )
                    response.raise_for_status()
                    data = response.json()

                    result = data.get("result", {})
                    page_num += 1

                    if page_num == 1:
                        total = result.get("total", 0)

                    page_hits = result.get("hits", [])
                    all_hits.extend(page_hits)

                    logger.info(
                        "Censys page %d: %d hits (total so far: %d / %d available)",
                        page_num, len(page_hits), len(all_hits), total,
                    )

                    # Get next cursor
                    next_cursor = result.get("links", {}).get("next", "")
                    if not next_cursor or not page_hits:
                        break
                    cursor = next_cursor

            all_hits = all_hits[:max_results]

            duration = int((time.monotonic() - start) * 1000)
            return QueryResult(
                success=True,
                data={"total": total, "hits": all_hits},
                error=None,
                result_count=len(all_hits),
                duration_ms=duration,
            )

        except httpx.HTTPStatusError as exc:
            duration = int((time.monotonic() - start) * 1000)
            try:
                detail = exc.response.json().get("error", {}).get("details", str(exc))
            except Exception:
                detail = str(exc)
            if all_hits:
                return QueryResult(
                    success=True,
                    data={"total": total, "hits": all_hits},
                    error=f"Partial results ({len(all_hits)} fetched): {detail}",
                    result_count=len(all_hits),
                    duration_ms=duration,
                )
            return QueryResult(success=False, data=None, error=detail, result_count=0, duration_ms=duration)

        except Exception as exc:
            duration = int((time.monotonic() - start) * 1000)
            if all_hits:
                return QueryResult(
                    success=True,
                    data={"total": total, "hits": all_hits},
                    error=f"Partial results ({len(all_hits)} fetched): {exc}",
                    result_count=len(all_hits),
                    duration_ms=duration,
                )
            return QueryResult(success=False, data=None, error=str(exc), result_count=0, duration_ms=duration)
