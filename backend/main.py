"""
FlowForge AI — FastAPI Application Entry Point

Configures CORS, registers routers, and initializes the database on startup.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import init_db
from pipeline.ai_provider import get_ai_provider
from routers.architecture import router as architecture_router
from routers.research import router as research_router
from routers.workflow import router as workflow_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize database tables."""
    await init_db()
    yield


app = FastAPI(
    title="FlowForge AI",
    description="AI-driven workflow orchestrator for software feature requests",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(workflow_router)
app.include_router(research_router)
app.include_router(architecture_router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    ai_provider = get_ai_provider()
    return {
        "status": "healthy",
        "service": "FlowForge AI",
        "configured_ai_provider": settings.AI_PROVIDER,
        "effective_ai_provider": getattr(ai_provider, "provider_name", "unknown"),
        "provider_fallback_reason": getattr(ai_provider, "fallback_reason", None),
    }
