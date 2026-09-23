import os


class Settings:
    PROJECT_NAME: str = "MATPULSE"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "FastAPI Backend for MATPULSE Materials Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./matpulse.db")



settings = Settings()
