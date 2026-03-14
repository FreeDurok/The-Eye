from pydantic import BaseModel


class ApiKeyStatusOut(BaseModel):
    module: str
    display_name: str
    is_configured: bool
    is_valid: bool | None  # None = not checked yet
    error_msg: str | None
    required_keys: list[str]
