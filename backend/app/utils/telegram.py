import hashlib
import hmac
from typing import Dict
from ..config import settings
import aiohttp

def verify_telegram_auth(auth_data: Dict[str, any]) -> bool:
    """
    Verify Telegram Login Widget authentication data
    https://core.telegram.org/widgets/login#checking-authorization
    """
    check_hash = auth_data.get('hash')
    if not check_hash:
        return False

    # Create data check string
    data_check_arr = []
    for key, value in sorted(auth_data.items()):
        if key != 'hash':
            data_check_arr.append(f"{key}={value}")
    data_check_string = '\n'.join(data_check_arr)

    # Create secret key
    secret_key = hashlib.sha256(settings.BOT_TOKEN.encode()).digest()

    # Calculate hash
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    return calculated_hash == check_hash

async def send_verification_code(telegram_id: int, code: str) -> bool:
    """
    Send verification code to user via Telegram bot
    """
    try:
        url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage"
        message = (
            f"🔐 <b>Код для входа на сайт</b>\n\n"
            f"Ваш код: <code>{code}</code>\n\n"
            f"Код действителен {settings.VERIFICATION_CODE_EXPIRE_MINUTES} минут.\n"
            f"Не сообщайте этот код никому!"
        )

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={
                "chat_id": telegram_id,
                "text": message,
                "parse_mode": "HTML"
            }) as response:
                result = await response.json()
                return result.get("ok", False)
    except Exception as e:
        print(f"Error sending verification code: {e}")
        return False

async def get_telegram_user_by_username(username: str) -> Dict:
    """
    Get Telegram user info by username
    Note: This is a simplified version. In production, you would need to:
    1. Search in your database for users with this username
    2. Or ask users to start the bot first to get their telegram_id
    """
    # For now, we'll return None and rely on users starting the bot first
    return None
