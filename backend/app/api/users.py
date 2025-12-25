from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..database.models import User
from ..database.crud import get_user_images, get_user_style_presets
from ..schemas.user import UserResponse
from ..schemas.generation import GenerationResponse, StylePresetResponse
from ..middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)

@router.get("/me/images", response_model=List[GenerationResponse])
async def get_my_images(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's generated images"""
    images = await get_user_images(db, current_user.id, limit, offset)
    return [GenerationResponse.model_validate(img) for img in images]

@router.get("/me/style-presets", response_model=List[StylePresetResponse])
async def get_my_style_presets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's saved style presets"""
    presets = await get_user_style_presets(db, current_user.id)
    return [StylePresetResponse.model_validate(preset) for preset in presets]
