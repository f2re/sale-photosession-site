from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from typing import Optional, List
from datetime import datetime
from .models import User, Package, Order, ProcessedImage, StylePreset
from ..schemas.user import UserCreate

# User CRUD
async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int) -> Optional[User]:
    """Get user by telegram_id"""
    result = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """Get user by id"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()

async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    """Get user by username"""
    result = await db.execute(
        select(User).where(User.username == username.lower())
    )
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Create new user"""
    from ..config import settings

    user = User(
        telegram_id=user_data.telegram_id,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        images_remaining=settings.FREE_PHOTOSHOOTS_COUNT,
        utm_source=user_data.utm_source,
        utm_medium=user_data.utm_medium,
        utm_campaign=user_data.utm_campaign,
        utm_content=user_data.utm_content,
        utm_term=user_data.utm_term
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_user_activity(db: AsyncSession, user_id: int):
    """Update user's last activity timestamp"""
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(updated_at=datetime.utcnow())
    )
    await db.commit()

# Package CRUD
async def get_all_packages(db: AsyncSession) -> List[Package]:
    """Get all active packages"""
    result = await db.execute(
        select(Package).where(Package.is_active == True).order_by(Package.price_rub)
    )
    return result.scalars().all()

async def get_package_by_id(db: AsyncSession, package_id: int) -> Optional[Package]:
    """Get package by id"""
    result = await db.execute(
        select(Package).where(and_(Package.id == package_id, Package.is_active == True))
    )
    return result.scalar_one_or_none()

async def create_packages_from_config(db: AsyncSession):
    """Create packages from config if they don't exist"""
    from ..config import settings

    for pkg_config in settings.packages_config:
        # Check if package exists
        result = await db.execute(
            select(Package).where(Package.name == pkg_config["name"])
        )
        existing = result.scalar_one_or_none()

        if not existing:
            package = Package(
                name=pkg_config["name"],
                photoshoots_count=pkg_config["photoshoots_count"],
                price_rub=pkg_config["price_rub"],
                is_active=True
            )
            db.add(package)

    await db.commit()

# Order CRUD
async def create_order(
    db: AsyncSession,
    user_id: int,
    package_id: int,
    amount: float
) -> Order:
    """Create new order"""
    order = Order(
        user_id=user_id,
        package_id=package_id,
        amount=amount,
        status="pending"
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order

async def get_order_by_id(db: AsyncSession, order_id: int) -> Optional[Order]:
    """Get order by id"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    return result.scalar_one_or_none()

async def get_order_by_invoice_id(db: AsyncSession, invoice_id: str) -> Optional[Order]:
    """Get order by invoice_id"""
    result = await db.execute(
        select(Order).where(Order.invoice_id == invoice_id)
    )
    return result.scalar_one_or_none()

async def update_order(
    db: AsyncSession,
    order_id: int,
    invoice_id: Optional[str] = None,
    status: Optional[str] = None,
    paid_at: Optional[datetime] = None
):
    """Update order"""
    update_data = {}
    if invoice_id:
        update_data["invoice_id"] = invoice_id
    if status:
        update_data["status"] = status
    if paid_at:
        update_data["paid_at"] = paid_at

    await db.execute(
        update(Order)
        .where(Order.id == order_id)
        .values(**update_data)
    )
    await db.commit()

async def add_photoshoots_to_user(db: AsyncSession, user_id: int, photoshoots: int):
    """Add photoshoots to user balance"""
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(images_remaining=User.images_remaining + photoshoots)
    )
    await db.commit()

# ProcessedImage CRUD
async def create_processed_image(
    db: AsyncSession,
    user_id: int,
    style_name: Optional[str],
    prompt_used: Optional[str],
    aspect_ratio: str,
    is_free: bool = False
) -> ProcessedImage:
    """Create processed image record"""
    image = ProcessedImage(
        user_id=user_id,
        style_name=style_name,
        prompt_used=prompt_used,
        aspect_ratio=aspect_ratio,
        is_free=is_free
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image

async def get_user_images(
    db: AsyncSession,
    user_id: int,
    limit: int = 50,
    offset: int = 0
) -> List[ProcessedImage]:
    """Get user's processed images"""
    result = await db.execute(
        select(ProcessedImage)
        .where(ProcessedImage.user_id == user_id)
        .order_by(ProcessedImage.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()

# StylePreset CRUD
async def create_style_preset(
    db: AsyncSession,
    user_id: int,
    name: str,
    style_data: dict
) -> StylePreset:
    """Create style preset"""
    preset = StylePreset(
        user_id=user_id,
        name=name,
        style_data=style_data
    )
    db.add(preset)
    await db.commit()
    await db.refresh(preset)
    return preset

async def get_user_style_presets(
    db: AsyncSession,
    user_id: int
) -> List[StylePreset]:
    """Get user's style presets"""
    result = await db.execute(
        select(StylePreset)
        .where(and_(
            StylePreset.user_id == user_id,
            StylePreset.is_active == True
        ))
        .order_by(StylePreset.created_at.desc())
    )
    return result.scalars().all()

async def delete_style_preset(db: AsyncSession, preset_id: int, user_id: int):
    """Delete style preset"""
    await db.execute(
        update(StylePreset)
        .where(and_(
            StylePreset.id == preset_id,
            StylePreset.user_id == user_id
        ))
        .values(is_active=False)
    )
    await db.commit()
