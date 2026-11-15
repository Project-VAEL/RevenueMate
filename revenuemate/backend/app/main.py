"""
backend/app/main.py
FastAPI application entry point.
Run with: uvicorn app.main:app --reload
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import settings
from app.services.errors import (
    ConflictError,
    IllegalTransition,
    NotFoundError,
    ProviderUnavailable,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing needed for SQLite-only demo
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="RevenueMate API",
    description="AI-powered merchant sales workflow backend",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(IllegalTransition)
async def illegal_transition_handler(request: Request, exc: IllegalTransition):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ProviderUnavailable)
async def provider_unavailable_handler(request: Request, exc: ProviderUnavailable):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router)
