import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "AI Video Generator"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./video_generator.db"
    DATABASE_PATH: Path = Path("./video_generator.db")

    # Security
    SECRET_KEY: str = "change-me-in-production-use-strong-random-key"
    FERNET_KEY: str = "change-me-in-production-use-32-byte-base64-key"

    # Storage
    OUTPUTS_DIR: Path = Path("../outputs")
    AVATARS_DIR: Path = Path("../outputs/avatars")
    SPACES_DIR: Path = Path("../outputs/spaces")
    IMAGES_DIR: Path = Path("../outputs/images")
    VIDEOS_DIR: Path = Path("../outputs/videos")

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # File limits
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 500

    # Job cleanup (days)
    FAILED_JOB_CLEANUP_DAYS: int = 7
    COMPLETED_JOB_CLEANUP_DAYS: int = 30

    # API Providers - API keys set via environment variables
    OPENAI_API_KEY: str | None = None
    KUAIHOU_API_KEY: str | None = None
    SEEDANCE_API_KEY: str | None = None
    FLUX_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    def ensure_dirs(self) -> None:
        for d in [self.OUTPUTS_DIR, self.AVATARS_DIR, self.SPACES_DIR, self.IMAGES_DIR, self.VIDEOS_DIR]:
            d.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
