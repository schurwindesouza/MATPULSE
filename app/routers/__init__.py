from app.routers.material import router as material_router
from app.routers.matching import router as matching_router
from app.routers.import_data import router as import_router
from app.routers.analytics import router as analytics_router

__all__ = ["material_router", "matching_router", "import_router", "analytics_router"]

