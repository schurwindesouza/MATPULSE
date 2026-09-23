from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # ensure models are registered with Base.metadata
from app.routers import material_router, matching_router, import_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create SQLite database tables on startup if they don't exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Enable CORS for local development and integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(
    material_router,
    prefix=f"{settings.API_V1_STR}/materials",
    tags=["Materials"],
)
app.include_router(
    matching_router,
    prefix=f"{settings.API_V1_STR}/matching",
    tags=["AI Matching"],
)
app.include_router(
    import_router,
    prefix=f"{settings.API_V1_STR}/import",
    tags=["Dataset Import"],
)



@app.get("/", tags=["General"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.get("/health", tags=["General"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
