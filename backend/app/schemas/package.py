from pydantic import BaseModel

class PackageResponse(BaseModel):
    id: int
    name: str
    photoshoots_count: int
    price_rub: float
    is_active: bool

    class Config:
        from_attributes = True
