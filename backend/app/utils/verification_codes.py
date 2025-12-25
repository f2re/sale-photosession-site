import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict
from ..config import settings

# In-memory storage for verification codes
# In production, use Redis or database
verification_codes: Dict[str, Dict] = {}

def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def store_verification_code(username: str, code: str, telegram_id: int):
    """Store verification code with expiration"""
    expires_at = datetime.utcnow() + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES)
    verification_codes[username.lower()] = {
        "code": code,
        "telegram_id": telegram_id,
        "expires_at": expires_at
    }

def verify_code(username: str, code: str) -> Optional[int]:
    """
    Verify code and return telegram_id if valid
    Returns None if invalid or expired
    """
    username = username.lower()
    if username not in verification_codes:
        return None

    stored_data = verification_codes[username]

    # Check expiration
    if datetime.utcnow() > stored_data["expires_at"]:
        del verification_codes[username]
        return None

    # Check code
    if stored_data["code"] != code:
        return None

    # Valid code - remove it and return telegram_id
    telegram_id = stored_data["telegram_id"]
    del verification_codes[username]
    return telegram_id

def cleanup_expired_codes():
    """Remove expired codes"""
    now = datetime.utcnow()
    expired_usernames = [
        username for username, data in verification_codes.items()
        if now > data["expires_at"]
    ]
    for username in expired_usernames:
        del verification_codes[username]
