from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class GenerationStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    ANALYZING = "analyzing"
    GENERATING_PROMPT = "generating_prompt"
    GENERATING_IMAGES = "generating_images"
    COMPLETED = "completed"
    FAILED = "failed"

class GenerationCreate(BaseModel):
    image_base64: str
    style_name: Optional[str] = None
    custom_prompt: Optional[str] = None
    aspect_ratio: str = "1:1"
    style_preset_id: Optional[int] = None

class GenerationResponse(BaseModel):
    id: int
    user_id: int
    style_name: Optional[str]
    prompt_used: Optional[str]
    aspect_ratio: Optional[str]
    is_free: bool
    created_at: datetime
    processed_file_id: Optional[str] = None

    class Config:
        from_attributes = True

class StylePresetCreate(BaseModel):
    name: str
    style_data: Dict

class StylePresetResponse(BaseModel):
    id: int
    user_id: int
    name: str
    style_data: Dict
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
