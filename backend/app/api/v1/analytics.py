from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, cast, Date, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.analytics import AnalyticsOut, DailyRevenue, OrderStatusCount

router = APIRouter()


def _parse_ymd(value: str, field: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid {field}, expected YYYY-MM-DD",
        ) from exc


def _order_range_clause(
    start_dt: datetime | None,
    end_dt: datetime | None,
):
    parts = []
    if start_dt is not None:
        parts.append(Order.created_at >= start_dt)
    if end_dt is not None:
        parts.append(Order.created_at <= end_dt)
    if not parts:
        return None
    return and_(*parts)


@router.get("", response_model=AnalyticsOut)
def get_analytics(
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
) -> AnalyticsOut:
    start_dt: datetime | None = None
    end_dt: datetime | None = None

    if start_date:
        sd = _parse_ymd(start_date, "start_date")
        start_dt = datetime.combine(sd, time.min, tzinfo=timezone.utc)
    if end_date:
        ed = _parse_ymd(end_date, "end_date")
        end_dt = datetime.combine(
            ed,
            time(23, 59, 59, 999999),
            tzinfo=timezone.utc,
        )

    if start_dt and end_dt and start_dt > end_dt:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )

    clause = _order_range_clause(start_dt, end_dt)

    rev_stmt = select(func.coalesce(func.sum(Order.total_price), 0))
    if clause is not None:
        rev_stmt = rev_stmt.where(clause)
    total_revenue_dec = db.scalar(rev_stmt) or 0

    count_stmt = select(func.count(Order.id))
    if clause is not None:
        count_stmt = count_stmt.where(clause)
    total_orders = int(db.scalar(count_stmt) or 0)

    total_customers = int(db.scalar(select(func.count()).select_from(User)) or 0)
    total_products = int(db.scalar(select(func.count()).select_from(Product)) or 0)

    day_col = cast(Order.created_at, Date)
    trend_stmt = (
        select(day_col, func.coalesce(func.sum(Order.total_price), 0))
        .group_by(day_col)
        .order_by(day_col.asc())
    )
    if clause is not None:
        trend_stmt = trend_stmt.where(clause)
    trend_rows = db.execute(trend_stmt).all()
    revenue_trend = [
        DailyRevenue(
            date=row[0].isoformat() if isinstance(row[0], date) else str(row[0]),
            revenue=float(row[1] or 0),
        )
        for row in trend_rows
    ]

    status_stmt = select(Order.status, func.count(Order.id)).group_by(Order.status)
    if clause is not None:
        status_stmt = status_stmt.where(clause)
    status_rows = db.execute(status_stmt).all()
    order_statuses = [
        OrderStatusCount(
            status=row[0].value if hasattr(row[0], "value") else str(row[0]),
            count=int(row[1]),
        )
        for row in status_rows
    ]

    return AnalyticsOut(
        total_revenue=float(total_revenue_dec),
        total_orders=total_orders,
        total_customers=total_customers,
        total_products=total_products,
        revenue_trend=revenue_trend,
        order_statuses=order_statuses,
    )
