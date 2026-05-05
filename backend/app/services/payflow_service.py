"""PayPal Payflow Pro NVP (server-to-server)."""

from __future__ import annotations

import logging
import urllib.parse
from typing import Any

import requests
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.payment import CreditCardPaymentInput

logger = logging.getLogger(__name__)


def _parse_nvp_response(body: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for pair in body.strip().split("&"):
        if not pair:
            continue
        key, sep, val = pair.partition("=")
        if not sep:
            continue
        k = urllib.parse.unquote_plus(key)
        v = urllib.parse.unquote_plus(val)
        parsed[k] = v
    return parsed


def process_payflow_transaction(
    order_id: int,
    amount: float,
    card_data: CreditCardPaymentInput,
) -> dict[str, Any]:
    required = (
        settings.PAYFLOW_PARTNER,
        settings.PAYFLOW_VENDOR,
        settings.PAYFLOW_USER,
        settings.PAYFLOW_PASSWORD,
        settings.PAYFLOW_URL,
    )
    if not all(required):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payflow is not configured",
        )

    amt = f"{amount:.2f}"
    payload = (
        f"PARTNER={settings.PAYFLOW_PARTNER}&VENDOR={settings.PAYFLOW_VENDOR}&"
        f"USER={settings.PAYFLOW_USER}&PWD={settings.PAYFLOW_PASSWORD}&TRXTYPE=S&TENDER=C&"
        f"AMT={amt}&ACCT={card_data.card_number}&EXPDATE={card_data.expiry_date}&"
        f"CVV2={card_data.cvv}&INVNUM={order_id}"
    )
    payload_redacted = (
        f"PARTNER={settings.PAYFLOW_PARTNER}&VENDOR={settings.PAYFLOW_VENDOR}&"
        f"USER={settings.PAYFLOW_USER}&PWD=***&TRXTYPE=S&TENDER=C&"
        f"AMT={amt}&ACCT={card_data.card_number}&EXPDATE={card_data.expiry_date}&"
        f"CVV2={card_data.cvv}&INVNUM={order_id}"
    )
    print(f"Payflow NVP request (PWD redacted): {payload_redacted}")

    try:
        response = requests.post(
            settings.PAYFLOW_URL,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=60,
        )
        print(f"Payflow Raw Response: {response.text}")
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Payflow HTTP error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway unreachable",
        ) from exc

    parsed = _parse_nvp_response(response.text)
    result = parsed.get("RESULT", "")
    if result != "0":
        msg = parsed.get("RESPMSG") or "Payment declined"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return {
        "success": True,
        "pnref": parsed.get("PNREF", ""),
        "respmsg": parsed.get("RESPMSG", ""),
    }
