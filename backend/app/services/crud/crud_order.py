from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import ProductVariant
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services.crud import crud_product


def create_order(db: Session, user: User, order_in: OrderCreate) -> Order:
    try:
        calculated_total = Decimal("0.00")
        resolved_lines: list[
            tuple
        ] = []  # product, qty, unit_price, variant_name, variant | None

        for line in order_in.items:
            product = crud_product.get_product_by_id(db, line.product_id)
            if product is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product id {line.product_id} not found",
                )

            variant: ProductVariant | None = None
            vname: str | None = None
            if line.variant_name and line.variant_name.strip():
                vname = line.variant_name.strip()
                variant = db.scalars(
                    select(ProductVariant).where(
                        ProductVariant.product_id == product.id,
                        ProductVariant.name == vname,
                    ),
                ).first()
                if variant is None:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Variant '{vname}' not found for this product",
                    )
                if variant.stock_quantity < line.quantity:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Insufficient stock",
                    )
                unit_price = product.price + Decimal(str(variant.price_adjustment))
            else:
                if product.stock_quantity < line.quantity:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Insufficient stock",
                    )
                unit_price = product.price

            line_total = unit_price * line.quantity
            calculated_total += line_total
            resolved_lines.append(
                (product, line.quantity, unit_price, vname, variant),
            )

        order = Order(
            user_id=user.id,
            total_price=calculated_total,
            status=OrderStatus.pending,
            is_cod=order_in.is_cod,
        )
        db.add(order)
        db.flush()
        order_pk = order.id

        for product, quantity, unit_price, name_saved, variant in resolved_lines:
            db.add(
                OrderItem(
                    order_id=order_pk,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    variant_name=name_saved,
                )
            )
            if variant is not None:
                variant.stock_quantity -= quantity
            else:
                product.stock_quantity -= quantity

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    stmt = (
        select(Order)
        .where(Order.id == order_pk)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    return db.scalars(stmt).one()


def get_user_orders(db: Session, user_id: int) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
        .order_by(Order.id.desc())
    )
    return list(db.scalars(stmt).unique().all())


def get_order_by_id(db: Session, order_id: int) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    return db.scalars(stmt).unique().first()


def serialize_order_out(
    order: Order,
    db: Session,
    reviewing_user_id: int | None = None,
):
    from app.models.review import Review
    from app.schemas.order import OrderItemOut, OrderOut, OrderUserOut

    product_ids = list({it.product_id for it in order.items})
    reviewed_ids: set[int] = set()
    if reviewing_user_id is not None and product_ids:
        rows = db.scalars(
            select(Review.product_id).where(
                Review.user_id == reviewing_user_id,
                Review.product_id.in_(product_ids),
            ),
        ).all()
        reviewed_ids = {int(pid) for pid in rows}

    items = [
        OrderItemOut(
            id=it.id,
            order_id=it.order_id,
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=it.unit_price,
            variant_name=it.variant_name,
            product_name=it.product.name if it.product is not None else None,
            product_image_url=(
                it.product.image_url if it.product is not None else None
            ),
            has_reviewed=it.product_id in reviewed_ids,
        )
        for it in order.items
    ]
    user_out = None
    if order.user is not None:
        u = order.user
        user_out = OrderUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone_number=u.phone_number,
            address_line_1=u.address_line_1,
            address_line_2=u.address_line_2,
            city=u.city,
            state=u.state,
            postal_code=u.postal_code,
        )
    return OrderOut(
        id=order.id,
        user_id=order.user_id,
        total_price=order.total_price,
        status=order.status,
        payment_status=order.payment_status,
        is_cod=order.is_cod,
        created_at=order.created_at,
        user=user_out,
        items=items,
    )


def get_all_orders(db: Session, skip: int = 0, limit: int = 100) -> list[Order]:
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
        .order_by(Order.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).unique().all())


def update_order_status(db: Session, order_id: int, new_status: OrderStatus) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    order.status = new_status
    db.add(order)
    db.commit()
    stmt = (
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    return db.scalars(stmt).one()


def delete_unpaid_online_order_restore_stock(
    db: Session,
    order_id: int,
    user_id: int,
) -> None:
    """Delete a non-COD order that is still unpaid and restore product/variant stock."""
    order = get_order_by_id(db, order_id)
    if order is None:
        return
    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this order",
        )
    if order.is_cod:
        return
    if order.payment_status == PaymentStatus.paid:
        return

    for it in order.items:
        product = crud_product.get_product_by_id(db, it.product_id)
        if product is None:
            continue
        if it.variant_name and it.variant_name.strip():
            vname = it.variant_name.strip()
            variant = db.scalars(
                select(ProductVariant).where(
                    ProductVariant.product_id == product.id,
                    ProductVariant.name == vname,
                ),
            ).first()
            if variant is not None:
                variant.stock_quantity += it.quantity
                db.add(variant)
        else:
            product.stock_quantity += it.quantity
            db.add(product)

    db.delete(order)
    db.commit()
