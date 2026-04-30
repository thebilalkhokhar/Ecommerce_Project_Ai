import re

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

_PK_PHONE_RE = re.compile(r"^(?:\+92|0)-?3\d{2}-?\d{7}$")


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str
    address_line_1: str
    address_line_2: str | None = None
    city: str
    state: str
    postal_code: str
    is_admin: bool = False

    @field_validator("phone_number")
    @classmethod
    def validate_pk_phone(cls, v: str) -> str:
        if not _PK_PHONE_RE.fullmatch(v):
            raise ValueError(
                "Phone number must be a valid Pakistani mobile (e.g. +923134432915, 03134432915)."
            )
        return v


class UserUpdate(BaseModel):
    """Partial profile update; excludes email, password, and is_admin."""

    full_name: str | None = None
    phone_number: str | None = None
    address_line_1: str | None = None
    address_line_2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None

    @field_validator("phone_number")
    @classmethod
    def validate_pk_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not _PK_PHONE_RE.fullmatch(v):
            raise ValueError(
                "Phone number must be a valid Pakistani mobile (e.g. +923134432915, 03134432915)."
            )
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    phone_number: str
    address_line_1: str
    address_line_2: str | None
    city: str
    state: str
    postal_code: str
    is_active: bool
    is_admin: bool
