"""Transactional emails via Resend."""

from __future__ import annotations

import html as html_lib
import logging
from decimal import Decimal
from typing import Any

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

# Resend test/sandbox sender (verified when using test API key).
FROM_ADDRESS = "onboarding@resend.dev"

resend.api_key = settings.RESEND_API_KEY


def _format_money(value: Decimal | float) -> str:
    if isinstance(value, Decimal):
        return f"{value:.2f}"
    return f"{float(value):.2f}"


def _html_shell(title: str, inner_body: str) -> str:
    safe_title = html_lib.escape(title)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{safe_title}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 24px 0;border-bottom:1px solid #e5e5e5;">
              <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#666666;">ShopOne</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0 0;font-size:16px;line-height:1.65;color:#111111;">
              {inner_body}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 0 0;font-size:13px;line-height:1.6;color:#666666;border-top:1px solid #e5e5e5;">
              <p style="margin:0;">Thank you for shopping with us.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_email(*, to: list[str], subject: str, html: str) -> None:
    try:
        params: dict[str, Any] = {
            "from": FROM_ADDRESS,
            "to": to,
            "subject": subject,
            "html": html,
        }
        resend.Emails.send(params)
    except Exception as exc:
        logger.warning(
            "Resend send failed (subject=%s, to=%s): %s",
            subject,
            to,
            exc,
            exc_info=True,
        )


def send_order_confirmation_email(
    to_email: str,
    order_id: int,
    total_amount: float,
    items: list[Any],
) -> None:
    """Customer: order placed summary."""
    subject = f"Order Confirmation - Order #{order_id}"
    rows_html: list[str] = []
    for it in items:
        name = getattr(getattr(it, "product", None), "name", None) or f"Product #{getattr(it, 'product_id', '?')}"
        variant = getattr(it, "variant_name", None)
        qty = int(getattr(it, "quantity", 0))
        unit = getattr(it, "unit_price", Decimal("0"))
        line_total = Decimal(str(unit)) * qty
        v_cell = html_lib.escape(variant) if variant else "—"
        rows_html.append(
            f"<tr>"
            f'<td style="padding:10px 8px;border-bottom:1px solid #eeeeee;">{html_lib.escape(str(name))}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #eeeeee;color:#444444;">{v_cell}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #eeeeee;text-align:right;">{qty}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #eeeeee;text-align:right;">{_format_money(unit)}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #eeeeee;text-align:right;font-weight:600;">{_format_money(line_total)}</td>'
            f"</tr>"
        )
    table = (
        '<table role="presentation" width="100%" style="border-collapse:collapse;margin:20px 0;font-size:14px;">'
        "<thead><tr>"
        '<th align="left" style="padding:10px 8px;border-bottom:2px solid #111111;font-weight:600;">Item</th>'
        '<th align="left" style="padding:10px 8px;border-bottom:2px solid #111111;font-weight:600;">Option</th>'
        '<th align="right" style="padding:10px 8px;border-bottom:2px solid #111111;font-weight:600;">Qty</th>'
        '<th align="right" style="padding:10px 8px;border-bottom:2px solid #111111;font-weight:600;">Price</th>'
        '<th align="right" style="padding:10px 8px;border-bottom:2px solid #111111;font-weight:600;">Total</th>'
        "</tr></thead><tbody>"
        + "".join(rows_html)
        + "</tbody></table>"
    )
    inner = f"""
      <p style="margin:0 0 16px 0;">Thank you for your order. We&rsquo;re preparing everything with care.</p>
      <p style="margin:0 0 8px 0;font-size:18px;font-weight:600;">Order #{order_id}</p>
      <p style="margin:0 0 20px 0;color:#444444;">Total: <strong>{_format_money(total_amount)}</strong></p>
      {table}
    """
    html = _html_shell(subject, inner)
    _send_email(to=[to_email], subject=subject, html=html)


def send_admin_new_order_alert(order_id: int, total_amount: float) -> None:
    admin = (settings.ADMIN_EMAIL or "").strip()
    if not admin:
        logger.debug("ADMIN_EMAIL not set; skipping new-order alert for order %s", order_id)
        return
    subject = f"New Order Received - #{order_id}"
    inner = f"""
      <p style="margin:0 0 12px 0;">A new order has been placed.</p>
      <p style="margin:0;"><strong>Order #{order_id}</strong></p>
      <p style="margin:8px 0 0 0;">Total: <strong>{_format_money(total_amount)}</strong></p>
    """
    html = _html_shell(subject, inner)
    _send_email(to=[admin], subject=subject, html=html)


def send_order_status_update_email(
    to_email: str,
    order_id: int,
    new_status: str,
) -> None:
    subject = f"Order Update - #{order_id}"
    safe_status = html_lib.escape(new_status)
    inner = f"""
      <p style="margin:0;">Your order status has been updated to: <strong>{safe_status}</strong>.</p>
    """
    html = _html_shell(subject, inner)
    _send_email(to=[to_email], subject=subject, html=html)
