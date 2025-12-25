from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from yookassa import Configuration, Payment
from ..database import get_db
from ..database.models import User
from ..database.crud import (
    get_package_by_id,
    create_order,
    get_order_by_invoice_id,
    update_order,
    add_photoshoots_to_user
)
from ..schemas.payment import PaymentCreate, PaymentResponse, OrderResponse
from ..middleware.auth import get_current_user
from ..config import settings
from ..utils.telegram import send_verification_code
from datetime import datetime
import uuid

router = APIRouter(prefix="/payments", tags=["payments"])

# Configure YooKassa
Configuration.account_id = settings.YOOKASSA_SHOP_ID
Configuration.secret_key = settings.YOOKASSA_SECRET_KEY

@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create payment for package purchase"""
    # Get package
    package = await get_package_by_id(db, payment_data.package_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Package not found"
        )

    # Create order in database
    order = await create_order(
        db,
        user_id=current_user.id,
        package_id=package.id,
        amount=float(package.price_rub)
    )

    # Generate unique idempotence key
    idempotence_key = str(uuid.uuid4())

    # Create payment in YooKassa
    try:
        payment = Payment.create({
            "amount": {
                "value": str(package.price_rub),
                "currency": "RUB"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": payment_data.return_url or f"{settings.SITE_URL}/payment/success"
            },
            "capture": True,
            "description": f"Пакет {package.name} - {package.photoshoots_count} фотосессий",
            "metadata": {
                "order_id": order.id,
                "user_id": current_user.id,
                "package_id": package.id
            }
        }, idempotence_key)

        # Update order with payment ID
        await update_order(db, order.id, invoice_id=payment.id)

        return PaymentResponse(
            payment_url=payment.confirmation.confirmation_url,
            order_id=order.id
        )

    except Exception as e:
        # Update order status to failed
        await update_order(db, order.id, status="failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment: {str(e)}"
        )

@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    YooKassa webhook for payment notifications
    https://yookassa.ru/developers/using-api/webhooks
    """
    try:
        data = await request.json()
        event = data.get("event")
        payment_obj = data.get("object")

        if not payment_obj:
            return {"status": "error", "message": "No payment object"}

        payment_id = payment_obj.get("id")
        payment_status = payment_obj.get("status")

        # Find order
        order = await get_order_by_invoice_id(db, payment_id)
        if not order:
            return {"status": "error", "message": "Order not found"}

        # Handle payment success
        if payment_status == "succeeded" and event == "payment.succeeded":
            # Update order status
            await update_order(
                db,
                order.id,
                status="paid",
                paid_at=datetime.utcnow()
            )

            # Add photoshoots to user balance
            await add_photoshoots_to_user(
                db,
                order.user_id,
                order.package.photoshoots_count
            )

            # Send notification to user via Telegram
            try:
                from aiogram import Bot
                bot = Bot(token=settings.BOT_TOKEN)
                message = (
                    f"✅ <b>Оплата прошла успешно!</b>\n\n"
                    f"Пакет: {order.package.name}\n"
                    f"Начислено: {order.package.photoshoots_count} фотосессий\n"
                    f"Сумма: {order.amount}₽\n\n"
                    f"Теперь вы можете генерировать фото как в боте, так и на сайте!"
                )
                await bot.send_message(
                    chat_id=order.user.telegram_id,
                    text=message,
                    parse_mode="HTML"
                )
            except Exception as e:
                print(f"Failed to send Telegram notification: {e}")

        elif payment_status in ["canceled", "cancelled"]:
            await update_order(db, order.id, status="cancelled")

        return {"status": "ok"}

    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/orders/my", response_model=list[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's orders"""
    from sqlalchemy import select
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return [OrderResponse.model_validate(order) for order in orders]
