from .auth import router as auth_router
from .users import router as users_router
from .packages import router as packages_router
from .payments import router as payments_router
from .generation import router as generation_router
from .websocket import router as websocket_router

__all__ = [
    "auth_router",
    "users_router",
    "packages_router",
    "payments_router",
    "generation_router",
    "websocket_router"
]
