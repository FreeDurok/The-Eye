"""
Filesystem-based storage for query result data.

Replaces JSONB storage in PostgreSQL — the DB holds only a path pointer,
the actual JSON data lives on disk.
"""

import json
import uuid
from pathlib import Path

from app.config import settings


def save_result_data(result_id: uuid.UUID, data: dict) -> str:
    """Save raw result data to a JSON file. Returns the absolute file path."""
    path = Path(settings.data_dir) / f"{result_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, default=str), encoding="utf-8")
    return str(path)


def load_result_data(data_path: str) -> dict | None:
    """Load result data from a JSON file. Returns None if file is missing."""
    if not data_path:
        return None
    path = Path(data_path)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def delete_result_data(data_path: str) -> None:
    """Delete the JSON file if it exists."""
    if not data_path:
        return
    path = Path(data_path)
    if path.exists():
        path.unlink()
