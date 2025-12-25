from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from typing import Dict
from ..database.models import ProcessedImage, User
from ..config import settings
import aiohttp
import asyncio

class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_status(self, user_id: int, data: dict):
        """Send status update to user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(data)
            except Exception as e:
                print(f"Error sending status to user {user_id}: {e}")
                self.disconnect(user_id)

async def generate_images(
    db: AsyncSession,
    user_id: int,
    image_id: int,
    image_data: bytes,
    style_prompt: str,
    aspect_ratio: str,
    manager: ConnectionManager
):
    """
    Generate images using AI
    Sends real-time updates via WebSocket
    """
    try:
        # Step 1: Uploading
        await manager.send_status(user_id, {
            "status": "uploading",
            "progress": 10,
            "message": "Загрузка изображения..."
        })

        # TODO: Upload image to storage (S3, etc.)
        await asyncio.sleep(1)  # Simulate upload

        # Step 2: Analyzing
        await manager.send_status(user_id, {
            "status": "analyzing",
            "progress": 30,
            "message": "Анализ продукта..."
        })

        # Analyze product with AI (using Claude via OpenRouter)
        product_analysis = await analyze_product(image_data)
        await asyncio.sleep(1)

        # Step 3: Generating prompt
        await manager.send_status(user_id, {
            "status": "generating_prompt",
            "progress": 50,
            "message": "Создание промпта для AI..."
        })

        # Generate enhanced prompt
        enhanced_prompt = await generate_prompt(product_analysis, style_prompt)
        await asyncio.sleep(1)

        # Step 4: Generating images
        await manager.send_status(user_id, {
            "status": "generating_images",
            "progress": 70,
            "message": "Генерация изображений..."
        })

        # Generate images with Gemini
        generated_images = await generate_with_gemini(
            enhanced_prompt,
            aspect_ratio,
            count=settings.PHOTOS_PER_PHOTOSHOOT
        )

        # Step 5: Complete
        await manager.send_status(user_id, {
            "status": "completed",
            "progress": 100,
            "message": "Готово!",
            "images": generated_images,
            "image_id": image_id
        })

        # Update database
        await db.execute(
            update(ProcessedImage)
            .where(ProcessedImage.id == image_id)
            .values(
                prompt_used=enhanced_prompt,
                processed_file_id=",".join(generated_images)  # Store as comma-separated
            )
        )

        # Decrease user balance
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                images_remaining=User.images_remaining - 1,
                total_images_processed=User.total_images_processed + settings.PHOTOS_PER_PHOTOSHOOT
            )
        )

        await db.commit()

    except Exception as e:
        print(f"Generation error: {e}")
        await manager.send_status(user_id, {
            "status": "failed",
            "progress": 0,
            "message": f"Ошибка генерации: {str(e)}"
        })

async def analyze_product(image_data: bytes) -> str:
    """Analyze product using Claude via OpenRouter"""
    try:
        # Convert image to base64
        import base64
        image_b64 = base64.b64encode(image_data).decode()

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.PROMPT_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze this product image and describe it in detail for photoshoot generation."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_b64}"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ) as response:
                result = await response.json()
                return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Analysis error: {e}")
        return "Product image"

async def generate_prompt(product_analysis: str, style_prompt: str) -> str:
    """Generate enhanced prompt using Claude"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.PROMPT_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Create a detailed image generation prompt for: {product_analysis}\nStyle: {style_prompt}\nMake it suitable for Gemini image generation."
                        }
                    ]
                }
            ) as response:
                result = await response.json()
                return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Prompt generation error: {e}")
        return f"{product_analysis} in {style_prompt} style"

async def generate_with_gemini(prompt: str, aspect_ratio: str, count: int = 4) -> list:
    """Generate images using Gemini via OpenRouter"""
    try:
        images = []
        async with aiohttp.ClientSession() as session:
            for i in range(count):
                async with session.post(
                    "https://openrouter.ai/api/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.IMAGE_MODEL,
                        "prompt": prompt,
                        "aspect_ratio": aspect_ratio,
                        "n": 1
                    }
                ) as response:
                    result = await response.json()
                    if "data" in result and len(result["data"]) > 0:
                        images.append(result["data"][0]["url"])

        return images
    except Exception as e:
        print(f"Image generation error: {e}")
        return []
