"""
Database initialization script
Run this to create all database tables
"""
import asyncio
from app.database.models import Base
from app.database.session import engine

async def init_db():
    """Create all database tables"""
    async with engine.begin() as conn:
        # Drop all tables (comment out in production!)
        # await conn.run_sync(Base.metadata.drop_all)

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database tables created successfully")

if __name__ == "__main__":
    print("🔧 Initializing database...")
    asyncio.run(init_db())
    print("✅ Done!")
