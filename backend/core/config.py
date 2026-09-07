"""
FlowForge AI — Application Configuration

Loads settings dynamically from environment variables / .env file.
Supports OpenAI, Google Gemini, and Simulated AI providers.
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*_args, **_kwargs) -> bool:
        return False

# Load .env from the backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path, override=True)


class Settings:
    """Centralized application settings dynamically reloaded from .env."""

    def _reload(self):
        load_dotenv(_env_path, override=True)

    @property
    def AI_PROVIDER(self) -> str:
        self._reload()
        return os.getenv("AI_PROVIDER", "simulated").strip().lower()

    @property
    def OPENAI_API_KEY(self) -> str:
        self._reload()
        return os.getenv("OPENAI_API_KEY", "").strip()

    @property
    def OPENAI_MODEL(self) -> str:
        self._reload()
        return os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    @property
    def GEMINI_API_KEY(self) -> str:
        self._reload()
        return os.getenv("GEMINI_API_KEY", "").strip()

    @property
    def GEMINI_MODEL(self) -> str:
        self._reload()
        return os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    @property
    def DEFAULT_DATABASE_PATH(self):
        return Path(__file__).resolve().parent.parent / "flowforge.db"

    @property
    def DATABASE_URL(self) -> str:
        return os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{self.DEFAULT_DATABASE_PATH.as_posix()}")

    @property
    def CORS_ORIGINS(self) -> list[str]:
        self._reload()
        return [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173").split(",")
        ]


settings = Settings()
