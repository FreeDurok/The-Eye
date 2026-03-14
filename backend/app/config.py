from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://theeye:changeme@db:5432/theeye"

    # ── Shodan ────────────────────────────────────────────────────────────────
    shodan_api_key: str = ""

    # ── Censys ────────────────────────────────────────────────────────────────
    censys_api_id: str = ""
    censys_api_secret: str = ""

    # ── Storage ──────────────────────────────────────────────────────────────
    data_dir: str = "/app/data/results"

    # ── Add new module keys below this line ───────────────────────────────────


settings = Settings()
