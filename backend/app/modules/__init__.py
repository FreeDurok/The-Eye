"""
Module registry.

To register a new OSINT module:
1. Create app/modules/<name>/module.py implementing OsintModule
2. Import it here and append an instance to _REGISTRY
3. Add the required env vars to config.py and .env.example

No other files need to change.
"""

from app.modules.base import OsintModule
from app.modules.censys.module import CensysModule
from app.modules.shodan.module import ShodanModule

_REGISTRY: list[OsintModule] = [
    ShodanModule(),
    CensysModule(),
    # ── Register new modules here ────────────────────────────────────────────
]


def get_all_modules() -> list[OsintModule]:
    return list(_REGISTRY)


def get_module(name: str) -> OsintModule | None:
    return next((m for m in _REGISTRY if m.get_info().name == name), None)
