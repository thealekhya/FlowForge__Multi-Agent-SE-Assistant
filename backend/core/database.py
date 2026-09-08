"""
FlowForge AI — Database Engine & Session Management

Async SQLAlchemy engine backed by SQLite (aiosqlite).
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def init_db() -> None:
    """Create all tables if they don't exist, and seed baseline workflows if empty."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Automatically seed baseline workflows if database is newly initialized (e.g. on Render deploys)
    async with async_session() as session:
        from models.workflow import Workflow, StageResult
        from sqlalchemy import func, select
        try:
            count_res = await session.execute(select(func.count()).select_from(Workflow))
            count = count_res.scalar() or 0
            if count == 0:
                import json
                from pathlib import Path
                seed_file = Path(__file__).resolve().parent.parent / "seed_data.json"
                if seed_file.exists():
                    with open(seed_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    for w_dict in data.get("workflows", []):
                        wf = Workflow(
                            id=w_dict["id"],
                            user_id=w_dict.get("user_id"),
                            feature_request=w_dict["feature_request"],
                            status=w_dict.get("status", "completed"),
                        )
                        session.add(wf)
                    await session.flush()
                    for s_dict in data.get("stages", []):
                        sr = StageResult(
                            id=s_dict["id"],
                            workflow_id=s_dict["workflow_id"],
                            stage_name=s_dict["stage_name"],
                            order_index=s_dict.get("order_index", 0),
                            status=s_dict.get("status", "completed"),
                            input_context=s_dict.get("input_context", "{}"),
                            output=s_dict.get("output", "{}"),
                            duration_seconds=s_dict.get("duration_seconds", 1.5),
                        )
                        session.add(sr)
                    await session.commit()
                    print("Successfully seeded baseline workflow history into database.")
        except Exception as e:
            await session.rollback()
            print(f"Notice: database seed check skipped: {e}")


async def get_session() -> AsyncSession:  # type: ignore[misc]
    """FastAPI dependency that yields an async DB session."""
    async with async_session() as session:
        yield session
