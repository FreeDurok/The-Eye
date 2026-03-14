from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ModuleInfo:
    name: str           # unique identifier, e.g. "shodan"
    display_name: str   # human-readable, e.g. "Shodan"
    description: str
    required_keys: list[str]  # env var names, e.g. ["SHODAN_API_KEY"]
    version: str = "1.0.0"
    tags: list[str] = field(default_factory=list)  # e.g. ["host", "network"]


@dataclass
class QueryResult:
    success: bool
    data: dict[str, Any] | None
    error: str | None
    result_count: int
    duration_ms: int


class OsintModule(ABC):
    """
    Abstract base class for all OSINT modules.

    To add a new module:
    1. Create a subclass in app/modules/<name>/module.py
    2. Implement the three abstract methods below
    3. Register the instance in app/modules/__init__.py

    No other files need to change.
    """

    @abstractmethod
    def get_info(self) -> ModuleInfo:
        """Return static metadata about this module."""
        ...

    @abstractmethod
    async def validate_keys(self) -> tuple[bool, str | None]:
        """
        Probe the API with the configured credentials.

        Returns:
            (True, None) if the keys are valid.
            (False, error_message) otherwise.

        Must never raise — catch all exceptions internally.
        """
        ...

    @abstractmethod
    async def run_query(self, query: str, options: dict[str, Any] | None = None) -> QueryResult:
        """
        Execute the OSINT query and return a normalised result.

        Must never raise — return QueryResult(success=False, ...) on failure.
        """
        ...
