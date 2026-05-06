from decimal import Decimal
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
        # Empty GOOGLE_CLIENT_ID in the shell/OS must not override a real value from .env
        env_ignore_empty=True,
    )

    DATABASE_URL: str
    SECRET_KEY: str
    GROQ_API_KEY: str
    RESEND_API_KEY: str
    ADMIN_EMAIL: str = ""

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

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    FRONTEND_BASE_URL: str = "http://localhost:3000"

    PAYFLOW_PARTNER: str = ""
    PAYFLOW_VENDOR: str = ""
    PAYFLOW_USER: str = ""
    PAYFLOW_PASSWORD: str = ""
    PAYFLOW_URL: str = "https://pilot-payflowpro.paypal.com"

    GOOGLE_CLIENT_ID: str = ""

    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_PKR_PER_USD: Decimal = Field(
        default=Decimal("280.00"),
        description="PKR per 1 USD (store totals are PKR; PayPal uses USD).",
    )


settings = Settings()
