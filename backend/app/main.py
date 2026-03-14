from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import api_keys, cases, export, health, modules, queries, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (Alembic handles production migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="The-Eye",
        description="Modular OSINT platform",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["health"])
    app.include_router(modules.router, prefix="/modules", tags=["modules"])
    app.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])
    app.include_router(cases.router, prefix="/cases", tags=["cases"])
    app.include_router(queries.router, prefix="/queries", tags=["queries"])
    app.include_router(stats.router, prefix="/stats", tags=["stats"])
    app.include_router(export.router, prefix="/export", tags=["export"])

    return app


app = create_app()
