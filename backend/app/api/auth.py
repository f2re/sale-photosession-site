from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..database.crud import get_user_by_telegram_id, get_user_by_username, create_user
from ..schemas.auth import (
    TelegramAuthData,
    TelegramCodeRequest,
    TelegramCodeVerify,
    AuthResponse
)
from ..schemas.user import UserCreate, UserResponse
from ..utils.telegram import verify_telegram_auth, send_verification_code
from ..utils.jwt_handler import create_access_token
from ..utils.verification_codes import (
    generate_verification_code,
    store_verification_code,
    verify_code
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/telegram-widget", response_model=AuthResponse)
async def login_with_telegram_widget(
    auth_data: TelegramAuthData,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with Telegram Login Widget
    Verifies the data signature from Telegram
    """
    # Verify telegram auth data
    auth_dict = auth_data.model_dump()
    if not verify_telegram_auth(auth_dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )

    # Get or create user
    user = await get_user_by_telegram_id(db, auth_data.id)

    if not user:
        # Create new user
        user_create = UserCreate(
            telegram_id=auth_data.id,
            username=auth_data.username,
            first_name=auth_data.first_name,
            last_name=auth_data.last_name
        )
        user = await create_user(db, user_create)

    # Create access token
    access_token = create_access_token(data={"user_id": user.id})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )

@router.post("/request-code")
async def request_verification_code(
    request: TelegramCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request verification code via Telegram bot
    User must have started the bot and have username set
    """
    # Find user by username
    username = request.username.lstrip('@').lower()
    user = await get_user_by_username(db, username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please start the bot first: @" + username
        )

    # Generate code
    code = generate_verification_code()

    # Store code
    store_verification_code(username, code, user.telegram_id)

    # Send code via bot
    success = await send_verification_code(user.telegram_id, code)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code. Please try again."
        )

    return {
        "message": "Verification code sent to your Telegram",
        "expires_in_minutes": 5
    }

@router.post("/verify-code", response_model=AuthResponse)
async def verify_telegram_code(
    verify_data: TelegramCodeVerify,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify code sent by bot and login
    """
    username = verify_data.username.lstrip('@').lower()

    # Verify code
    telegram_id = verify_code(username, verify_data.code)

    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification code"
        )

    # Get user
    user = await get_user_by_telegram_id(db, telegram_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create access token
    access_token = create_access_token(data={"user_id": user.id})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )

@router.get("/bot-info")
async def get_bot_info():
    """Get bot information for frontend"""
    from ..config import settings
    return {
        "bot_username": settings.BOT_USERNAME,
        "bot_name": settings.BOT_NAME,
        "bot_id": settings.TELEGRAM_BOT_ID if hasattr(settings, 'TELEGRAM_BOT_ID') else None
    }
