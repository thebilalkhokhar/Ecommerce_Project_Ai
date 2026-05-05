import re

from pydantic import BaseModel, Field, field_validator

_MMYY = re.compile(r"^\d{4}$")


class CreditCardPaymentInput(BaseModel):
    card_number: str = Field(..., min_length=12, max_length=19)
    expiry_date: str = Field(..., description="Card expiry as MMYY")
    cvv: str = Field(..., min_length=3, max_length=4)

    @field_validator("card_number")
    @classmethod
    def normalize_card_number(cls, v: str) -> str:
        return re.sub(r"\s+", "", v.strip())

    @field_validator("expiry_date")
    @classmethod
    def expiry_mmyy(cls, v: str) -> str:
        s = v.strip()
        if not _MMYY.match(s):
            raise ValueError("expiry_date must be exactly 4 digits (MMYY)")
        month = int(s[:2])
        if month < 1 or month > 12:
            raise ValueError("expiry_date month must be between 01 and 12")
        return s

    @field_validator("cvv")
    @classmethod
    def cvv_digits(cls, v: str) -> str:
        s = v.strip()
        if not s.isdigit():
            raise ValueError("cvv must contain only digits")
        return s
