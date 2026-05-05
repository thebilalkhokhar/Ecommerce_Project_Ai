"""Payment integrations: Stripe Checkout, PayPal Payflow Pro, and webhooks."""

from __future__ import annotations

import logging
from decimal import Decimal

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.order import Order, PaymentStatus
from app.models.user import User
from app.schemas.payment import CreditCardPaymentInput
from app.services import payflow_service
from app.services.crud import crud_order

import app.services.stripe_service  # noqa: F401

logger = logging.getLogger(__name__)

router = APIRouter()


class CheckoutSessionResponse(BaseModel):
    url: str


class PayflowCheckoutOut(BaseModel):
    success: bool = True
    message: str = "Payment processed successfully"


def _unit_amount_pkr(unit_price: Decimal) -> int:
    """PKR amount in the smallest unit (paisa)."""
    paisa = (unit_price * Decimal(100)).quantize(Decimal("1"))
    return int(paisa)


@router.post(
    "/create-checkout-session/{order_id}",
    response_model=CheckoutSessionResponse,
)
def create_checkout_session(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured",
        )

    order = crud_order.get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this order",
        )
    if order.is_cod:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order uses cash on delivery. Card checkout is only for online payment orders.",
        )
    if order.payment_status != PaymentStatus.unpaid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid",
        )

    line_items: list[dict] = []
    for oi in order.items:
        product = oi.product
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Order item missing product",
            )
        label = product.name
        if oi.variant_name:
            label = f"{label} ({oi.variant_name})"
        line_label = label[:500]

        line_items.append(
            {
                "quantity": oi.quantity,
                "price_data": {
                    "currency": "pkr",
                    "unit_amount": _unit_amount_pkr(oi.unit_price),
                    "product_data": {"name": line_label},
                },
            },
        )

    base = settings.FRONTEND_BASE_URL.rstrip("/")
    success_url = f"{base}/orders/{order_id}?success=true"
    cancel_url = f"{base}/checkout"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=order.user.email if order.user is not None else None,
            metadata={"order_id": str(order.id)},
        )
    except stripe.error.StripeError as exc:
        logger.warning("Stripe Checkout session failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not start payment session",
        ) from exc

    checkout_url = session.url
    if not checkout_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe did not return a checkout URL",
        )
    return CheckoutSessionResponse(url=checkout_url)


@router.post(
    "/payflow-checkout/{order_id}",
    response_model=PayflowCheckoutOut,
)
def payflow_checkout(
    order_id: int,
    body: CreditCardPaymentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PayflowCheckoutOut:
    order = crud_order.get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this order",
        )
    if order.is_cod:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order is cash on delivery. Use Payflow only for card checkout orders.",
        )
    if order.payment_status != PaymentStatus.unpaid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid",
        )

    try:
        payflow_service.process_payflow_transaction(
            order_id,
            float(order.total_price),
            body,
        )
    except HTTPException:
        db.rollback()
        crud_order.delete_unpaid_online_order_restore_stock(
            db,
            order_id,
            current_user.id,
        )
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Payflow error for order %s", order_id)
        try:
            crud_order.delete_unpaid_online_order_restore_stock(
                db,
                order_id,
                current_user.id,
            )
        except Exception:
            logger.exception(
                "Could not restore stock / delete order %s after Payflow failure",
                order_id,
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment could not be completed",
        ) from exc

    row = db.get(Order, order_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Order not found after payment",
        )
    row.payment_status = PaymentStatus.paid
    db.add(row)
    db.commit()
    return PayflowCheckoutOut()


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, bool]:
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook secret not configured",
        )

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        ) from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        ) from exc

    try:
        event_type = event["type"]
    except (KeyError, TypeError):
        event_type = getattr(event, "type", None)

    if event_type == "checkout.session.completed":
        try:
            session_obj = event["data"]["object"]
        except (KeyError, TypeError):
            data = getattr(event, "data", None)
            session_obj = getattr(data, "object", None) if data is not None else None

        order_id_str: str | int | None = None
        if session_obj is not None and hasattr(session_obj, "metadata") and session_obj.metadata:
            md = session_obj.metadata
            if isinstance(md, dict):
                order_id_str = md.get("order_id")
            elif hasattr(md, "get"):
                order_id_str = md.get("order_id")
            else:
                order_id_str = getattr(md, "order_id", None)

        if order_id_str is None:
            logger.warning("checkout.session.completed missing order_id in metadata")
        else:
            try:
                oid = int(order_id_str)
            except (TypeError, ValueError):
                logger.warning(
                    "Invalid order_id in webhook metadata: %s",
                    order_id_str,
                )
            else:
                order = db.get(Order, oid)
                if order is None:
                    logger.warning("Webhook references unknown order id=%s", oid)
                elif order.payment_status == PaymentStatus.paid:
                    logger.debug("Order %s already marked paid", oid)
                else:
                    order.payment_status = PaymentStatus.paid
                    db.add(order)
                    db.commit()

    return {"received": True}
