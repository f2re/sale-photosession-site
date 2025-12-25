from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Telegram Bot
    BOT_TOKEN: str
    BOT_USERNAME: str
    BOT_NAME: str = "PhotoSession Bot"  # Bot display name for website
    ADMIN_IDS: str

    # Database (shared with bot)
    DATABASE_URL: Optional[str] = None
    # Support both standard and platform variable names
    DB_HOST: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None
    DB_PORT: Optional[int] = None
    POSTGRES_PORT: Optional[int] = None
    DB_NAME: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    DB_USER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None

    # OpenRouter API
    OPENROUTER_API_KEY: str
    PROMPT_MODEL: str = "anthropic/claude-3.5-sonnet"
    IMAGE_MODEL: str = "google/gemini-2.0-flash-001"

    # YooKassa
    YOOKASSA_SHOP_ID: str
    YOOKASSA_SECRET_KEY: str
    YOOKASSA_RETURN_URL: str = "https://yourdomain.com/payment/success"

    # Website Settings
    SITE_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"
    SECRET_KEY: str  # For JWT
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Telegram Auth
    TELEGRAM_BOT_ID: str  # Bot ID for widget verification
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 5

    # Packages
    PACKAGE_1_NAME: str = "Стартовый"
    PACKAGE_1_PHOTOSHOOTS: int = 3
    PACKAGE_1_PRICE: int = 299

    PACKAGE_2_NAME: str = "Бизнес"
    PACKAGE_2_PHOTOSHOOTS: int = 10
    PACKAGE_2_PRICE: int = 799

    PACKAGE_3_NAME: str = "Профессиональный"
    PACKAGE_3_PHOTOSHOOTS: int = 30
    PACKAGE_3_PRICE: int = 1999

    PACKAGE_4_NAME: str = "Безлимитный"
    PACKAGE_4_PHOTOSHOOTS: int = 100
    PACKAGE_4_PRICE: int = 4999

    # Settings
    FREE_PHOTOSHOOTS_COUNT: int = 2
    PHOTOS_PER_PHOTOSHOOT: int = 4
    MAX_SAVED_STYLES: int = 4

    # Logging
    LOG_LEVEL: str = "INFO"

    # Yandex Metrika
    YANDEX_METRIKA_COUNTER_ID: Optional[str] = None
    YANDEX_METRIKA_TOKEN: Optional[str] = None
    METRIKA_GOAL_START: str = "start_bot"
    METRIKA_GOAL_FIRST_PHOTOSHOOT: str = "first_photoshoot"
    METRIKA_GOAL_PURCHASE: str = "purchase"
    METRIKA_UPLOAD_INTERVAL: int = 3600

    # Referral Program
    REFERRAL_REWARD_START: int = 1
    REFERRAL_REWARD_PURCHASE_PERCENT: int = 10

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        # Support both POSTGRES_* and DB_* variable naming
        host = self.DB_HOST or self.POSTGRES_HOST or "localhost"
        port = self.DB_PORT or self.POSTGRES_PORT or 5432
        name = self.DB_NAME or self.POSTGRES_DB or "product_photoshoot_bot"
        user = self.DB_USER or self.POSTGRES_USER or "product_user"
        password = self.DB_PASSWORD or self.POSTGRES_PASSWORD or ""

        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"

    @property
    def admin_ids_list(self) -> List[int]:
        return [int(id.strip()) for id in self.ADMIN_IDS.split(",") if id.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def packages_config(self) -> List[dict]:
        return [
            {
                "name": self.PACKAGE_1_NAME,
                "photoshoots_count": self.PACKAGE_1_PHOTOSHOOTS,
                "price_rub": self.PACKAGE_1_PRICE
            },
            {
                "name": self.PACKAGE_2_NAME,
                "photoshoots_count": self.PACKAGE_2_PHOTOSHOOTS,
                "price_rub": self.PACKAGE_2_PRICE
            },
            {
                "name": self.PACKAGE_3_NAME,
                "photoshoots_count": self.PACKAGE_3_PHOTOSHOOTS,
                "price_rub": self.PACKAGE_3_PRICE
            },
            {
                "name": self.PACKAGE_4_NAME,
                "photoshoots_count": self.PACKAGE_4_PHOTOSHOOTS,
                "price_rub": self.PACKAGE_4_PRICE
            }
        ]

    @property
    def is_metrika_enabled(self) -> bool:
        return bool(self.YANDEX_METRIKA_COUNTER_ID and self.YANDEX_METRIKA_TOKEN)

settings = Settings()
