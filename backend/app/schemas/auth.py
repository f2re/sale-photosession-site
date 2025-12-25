from pydantic import BaseModel, Field
from typing import Optional
from .user import UserResponse

class TelegramAuthData(BaseModel):
    """Telegram Login Widget auth data"""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

class TelegramCodeRequest(BaseModel):
    """Request verification code"""
    username: str = Field(..., description="Telegram username (without @)")

class TelegramCodeVerify(BaseModel):
    """Verify code sent by bot"""
    username: str
    code: str = Field(..., min_length=6, max_length=6)

class TokenData(BaseModel):
    user_id: int

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
