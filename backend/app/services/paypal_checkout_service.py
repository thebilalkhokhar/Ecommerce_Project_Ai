"""PayPal REST Checkout (Orders v2): OAuth, create order, capture — used by payments router."""

from __future__ import annotations

import base64
import logging
from decimal import Decimal
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class PayPalAPIError(Exception):
    """Raised when PayPal returns a non-success response."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _paypal_base() -> str:
    return settings.PAYPAL_BASE_URL.rstrip("/")


def _auth_header_basic() -> str:
    raw = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}".encode()
    return base64.b64encode(raw).decode("ascii")


async def paypal_get_access_token(client: httpx.AsyncClient) -> str:
    url = f"{_paypal_base()}/v1/oauth2/token"
    r = await client.post(
        url,
        headers={
            "Authorization": f"Basic {_auth_header_basic()}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials"},
    )
    if r.status_code >= 400:
        detail = _paypal_error_detail(r)
        logger.warning("PayPal OAuth failed: %s", detail)
        raise PayPalAPIError(detail, r.status_code)
    data = r.json()
    token = data.get("access_token")
    if not isinstance(token, str) or not token:
        raise PayPalAPIError("PayPal did not return access_token", r.status_code)
    return token


def _paypal_error_detail(r: httpx.Response) -> str:
    try:
        body = r.json()
    except Exception:
        return r.text or r.reason_phrase
    if isinstance(body, dict):
        msg = body.get("message")
        if isinstance(msg, str) and msg:
            return msg
        details = body.get("details")
        if isinstance(details, list) and details:
            first = details[0]
            if isinstance(first, dict):
                d = first.get("description") or first.get("issue")
                if isinstance(d, str):
                    return d
        err = body.get("error")
        if isinstance(err, str):
            return err
    return str(body)[:500]


def order_total_to_usd_string(total_pkr: Decimal) -> str:
    """Convert shop PKR total to USD string for PayPal (2 decimal places)."""
    rate = settings.PAYPAL_PKR_PER_USD
    if rate <= 0:
        raise ValueError("PAYPAL_PKR_PER_USD must be positive")
    usd = (total_pkr / rate).quantize(Decimal("0.01"))
    if usd < Decimal("0.01"):
        usd = Decimal("0.01")
    return f"{usd:.2f}"


async def paypal_create_order(
    client: httpx.AsyncClient,
    access_token: str,
    *,
    amount_usd: str,
    reference_id: str,
) -> str:
    url = f"{_paypal_base()}/v2/checkout/orders"
    payload: dict[str, Any] = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": reference_id,
                "amount": {"currency_code": "USD", "value": amount_usd},
            },
        ],
    }
    r = await client.post(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        json=payload,
    )
    if r.status_code >= 400:
        raise PayPalAPIError(_paypal_error_detail(r), r.status_code)
    data = r.json()
    oid = data.get("id")
    if not isinstance(oid, str) or not oid:
        raise PayPalAPIError("PayPal did not return order id", r.status_code)
    return oid


async def paypal_capture_order(
    client: httpx.AsyncClient,
    access_token: str,
    paypal_order_id: str,
) -> dict[str, Any]:
    url = f"{_paypal_base()}/v2/checkout/orders/{paypal_order_id}/capture"
    r = await client.post(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
    )
    if r.status_code >= 400:
        raise PayPalAPIError(_paypal_error_detail(r), r.status_code)
    return r.json()


def capture_response_is_completed(payload: dict[str, Any]) -> bool:
    status = payload.get("status")
    if status == "COMPLETED":
        return True
    # Some responses nest status under purchase_units / captures
    units = payload.get("purchase_units")
    if isinstance(units, list) and units:
        u0 = units[0]
        if isinstance(u0, dict):
            payments = u0.get("payments")
            if isinstance(payments, dict):
                caps = payments.get("captures")
                if isinstance(caps, list) and caps:
                    c0 = caps[0]
                    if isinstance(c0, dict) and c0.get("status") == "COMPLETED":
                        return True
    return False
