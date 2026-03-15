import logging
import time
from typing import Any

import httpx

from app.config import settings
from app.modules.base import ModuleInfo, OsintModule, QueryResult

_SHODAN_BASE = "https://api.shodan.io"
_PAGE_SIZE = 100
_ABSOLUTE_MAX = 10_000

logger = logging.getLogger(__name__)


class ShodanModule(OsintModule):

    def get_info(self) -> ModuleInfo:
        return ModuleInfo(
            name="shodan",
            display_name="Shodan",
            description="Search internet-connected devices: hosts, open ports, banners, CVEs.",
            required_keys=["SHODAN_API_KEY"],
            tags=["host", "network", "vulnerability"],
        )

    async def validate_keys(self) -> tuple[bool, str | None]:
        if not settings.shodan_api_key:
            return False, "SHODAN_API_KEY is not set"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{_SHODAN_BASE}/api-info",
                    params={"key": settings.shodan_api_key},
                )
            if response.status_code == 200:
                return True, None
            if response.status_code == 401:
                return False, "Invalid API key"
            return False, f"Unexpected status {response.status_code}"
        except httpx.TimeoutException:
            return False, "Connection timed out"
        except Exception as exc:
            return False, str(exc)

    async def run_query(self, query: str, options: dict[str, Any] | None = None) -> QueryResult:
        start = time.monotonic()
        opts = dict(options or {})

        # max_results: 0 means "all" (capped at _ABSOLUTE_MAX)
        max_results = opts.pop("max_results", _PAGE_SIZE)
        if max_results == 0:
            max_results = _ABSOLUTE_MAX
        max_results = min(max_results, _ABSOLUTE_MAX)

        all_matches: list[dict] = []
        total = 0
        page = 1

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                while len(all_matches) < max_results:
                    params: dict[str, Any] = {
                        "key": settings.shodan_api_key,
                        "query": query,
                        "page": page,
                    }
                    params.update(opts)

                    response = await client.get(
                        f"{_SHODAN_BASE}/shodan/host/search",
                        params=params,
                    )
                    response.raise_for_status()
                    data = response.json()

                    if page == 1:
                        total = data.get("total", 0)

                    page_matches = data.get("matches", [])
                    all_matches.extend(page_matches)

                    logger.info(
                        "Shodan page %d: %d matches (total so far: %d / %d available)",
                        page, len(page_matches), len(all_matches), total,
                    )

                    # Stop conditions
                    if len(page_matches) == 0:
                        break  # empty page
                    if len(all_matches) >= total:
                        break  # fetched everything available
                    page += 1

            # Trim to exact max_results
            all_matches = all_matches[:max_results]

            duration = int((time.monotonic() - start) * 1000)
            return QueryResult(
                success=True,
                data={"total": total, "matches": all_matches},
                error=None,
                result_count=len(all_matches),
                total_available=total,
                duration_ms=duration,
            )

        except httpx.HTTPStatusError as exc:
            duration = int((time.monotonic() - start) * 1000)
            try:
                detail = exc.response.json().get("error", str(exc))
            except Exception:
                detail = str(exc)
            if all_matches:
                return QueryResult(
                    success=True,
                    data={"total": total, "matches": all_matches},
                    error=f"Partial results ({len(all_matches)} fetched): {detail}",
                    result_count=len(all_matches),
                    total_available=total,
                    duration_ms=duration,
                )
            return QueryResult(success=False, data=None, error=detail, result_count=0, total_available=0, duration_ms=duration)

        except Exception as exc:
            duration = int((time.monotonic() - start) * 1000)
            if all_matches:
                return QueryResult(
                    success=True,
                    data={"total": total, "matches": all_matches},
                    error=f"Partial results ({len(all_matches)} fetched): {exc}",
                    result_count=len(all_matches),
                    total_available=total,
                    duration_ms=duration,
                )
            return QueryResult(success=False, data=None, error=str(exc), result_count=0, total_available=0, duration_ms=duration)
