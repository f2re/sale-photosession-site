from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..database.crud import get_all_packages
from ..schemas.package import PackageResponse
from typing import List

router = APIRouter(prefix="/packages", tags=["packages"])

@router.get("/", response_model=List[PackageResponse])
async def get_packages(db: AsyncSession = Depends(get_db)):
    """Get all available packages"""
    packages = await get_all_packages(db)
    return [PackageResponse.model_validate(pkg) for pkg in packages]
