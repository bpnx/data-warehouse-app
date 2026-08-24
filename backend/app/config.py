"""Configuration settings for the Data Warehouse application."""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/data_warehouse",
        description="PostgreSQL database connection URL"
    )
    
    SECRET_KEY: str = Field(
        default="your-secret-key-here",
        description="Secret key for JWT and security"
    )
    
    DEBUG: bool = Field(
        default=False,
        description="Enable debug mode"
    )
    
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        description="Allowed CORS origins"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Create settings instance
settings = Settings()
