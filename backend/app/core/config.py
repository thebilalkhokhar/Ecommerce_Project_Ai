from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (parent of app/)
_BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=_BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    DATABASE_URL: str
    SECRET_KEY: str
    GROQ_API_KEY: str
    RESEND_API_KEY: str

    CLOUD_NAME: str
    CLOUD_API_KEY: str = Field(
        validation_alias=AliasChoices("CLOUD_API_KEY", "API_KEY"),
    )
    CLOUD_API_SECRET: str = Field(
        validation_alias=AliasChoices("CLOUD_API_SECRET", "API_SECRET"),
    )

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


settings = Settings()
