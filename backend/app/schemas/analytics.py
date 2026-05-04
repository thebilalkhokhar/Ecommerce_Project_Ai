from pydantic import BaseModel


class DailyRevenue(BaseModel):
    date: str
    revenue: float


class OrderStatusCount(BaseModel):
    status: str
    count: int


class AnalyticsOut(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_products: int
    revenue_trend: list[DailyRevenue]
    order_statuses: list[OrderStatusCount]
