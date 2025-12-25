from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..database.models import User
from ..database.crud import (
    create_processed_image,
    create_style_preset,
    delete_style_preset,
    get_user_by_id
)
from ..schemas.generation import (
    GenerationCreate,
    GenerationResponse,
    StylePresetCreate,
    StylePresetResponse
)
from ..middleware.auth import get_current_user
from ..services.generation_service import generate_images, ConnectionManager
from typing import Dict
import base64
import asyncio

router = APIRouter(prefix="/generation", tags=["generation"])

# WebSocket connection manager
manager = ConnectionManager()

@router.post("/create", response_model=GenerationResponse)
async def create_generation(
    generation_data: GenerationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create image generation"""
    # Check if user has photoshoots remaining
    if current_user.images_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No photoshoots remaining. Please purchase a package."
        )

    # Decode base64 image
    try:
        image_data = base64.b64decode(generation_data.image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image data"
        )

    # Create database record
    processed_image = await create_processed_image(
        db,
        user_id=current_user.id,
        style_name=generation_data.style_name,
        prompt_used=generation_data.custom_prompt,
        aspect_ratio=generation_data.aspect_ratio,
        is_free=False
    )

    # Start generation in background
    asyncio.create_task(
        generate_images(
            db,
            current_user.id,
            processed_image.id,
            image_data,
            generation_data.style_name or generation_data.custom_prompt,
            generation_data.aspect_ratio,
            manager
        )
    )

    return GenerationResponse.model_validate(processed_image)

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket for real-time generation updates"""
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for ping/pong
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@router.post("/style-presets", response_model=StylePresetResponse)
async def create_user_style_preset(
    preset_data: StylePresetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save style preset"""
    from ..config import settings

    # Check max saved styles
    from ..database.crud import get_user_style_presets
    user_presets = await get_user_style_presets(db, current_user.id)
    if len(user_presets) >= settings.MAX_SAVED_STYLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {settings.MAX_SAVED_STYLES} style presets allowed"
        )

    preset = await create_style_preset(
        db,
        user_id=current_user.id,
        name=preset_data.name,
        style_data=preset_data.style_data
    )

    return StylePresetResponse.model_validate(preset)

@router.delete("/style-presets/{preset_id}")
async def delete_user_style_preset(
    preset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete style preset"""
    await delete_style_preset(db, preset_id, current_user.id)
    return {"message": "Style preset deleted"}
