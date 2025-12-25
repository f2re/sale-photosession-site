from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .api import (
    auth_router,
    users_router,
    packages_router,
    payments_router,
    generation_router
)
from .database import engine
from .database.crud import create_packages_from_config
from .database.session import async_session

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Initialize packages from config
    async with async_session() as db:
        await create_packages_from_config(db)
    yield
    # Shutdown: Close database connections
    await engine.dispose()

app = FastAPI(
    title="PhotoSession Website API",
    description="API for AI photo generation website with Telegram authentication",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(packages_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(generation_router, prefix="/api")

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "message": "PhotoSession Website API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
