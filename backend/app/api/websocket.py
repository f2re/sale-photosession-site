from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(connection)

            # Clean up disconnected websockets
            for connection in disconnected:
                self.disconnect(connection, user_id)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = None
):
    """
    WebSocket endpoint for real-time updates
    Connect with: ws://localhost:8000/api/ws?token=<your_jwt_token>
    """
    # Accept connection first
    await websocket.accept()

    user_id = None  # Initialize to avoid NameError in finally block

    try:
        # Authenticate user from token
        if not token:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication token required"
            })
            await websocket.close()
            return

        # Get user from token
        try:
            from ..utils.jwt_handler import decode_access_token
            from ..database.crud import get_user_by_id
            from ..database.session import async_session

            # Decode the token
            token_data = decode_access_token(token)
            if not token_data:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid authentication token"
                })
                await websocket.close()
                return

            # Get user from database
            async with async_session() as db:
                user = await get_user_by_id(db, token_data.user_id)
                if not user:
                    await websocket.send_json({
                        "type": "error",
                        "message": "User not found"
                    })
                    await websocket.close()
                    return

                user_id = user.id
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            await websocket.send_json({
                "type": "error",
                "message": "Authentication failed"
            })
            await websocket.close()
            return

        # Register connection
        if user_id not in manager.active_connections:
            manager.active_connections[user_id] = set()
        manager.active_connections[user_id].add(websocket)

        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connection established",
            "user_id": user_id
        })

        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    })
                elif message.get("type") == "generation_status":
                    # Client requesting generation status update
                    await websocket.send_json({
                        "type": "generation_status",
                        "status": "processing",
                        "message": "Generation in progress"
                    })
                else:
                    # Echo unknown messages
                    await websocket.send_json({
                        "type": "echo",
                        "data": message
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        if user_id in manager.active_connections:
            manager.active_connections[user_id].discard(websocket)
            if not manager.active_connections[user_id]:
                del manager.active_connections[user_id]


async def send_generation_update(user_id: int, status: str, progress: int = 0, message: str = None):
    """
    Send generation status update to user via WebSocket
    """
    await manager.send_personal_message({
        "type": "generation_update",
        "status": status,
        "progress": progress,
        "message": message
    }, user_id)


async def send_payment_update(user_id: int, status: str, amount: float = None):
    """
    Send payment status update to user via WebSocket
    """
    await manager.send_personal_message({
        "type": "payment_update",
        "status": status,
        "amount": amount
    }, user_id)
