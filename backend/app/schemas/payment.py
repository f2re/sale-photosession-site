from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    package_id: int
    return_url: Optional[str] = None

class PaymentResponse(BaseModel):
    payment_url: str
    order_id: int

class OrderResponse(BaseModel):
    id: int
    user_id: int
    package_id: int
    amount: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True
