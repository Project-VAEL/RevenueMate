"""
backend/app/main.py
Owner: P1
Purpose: FastAPI application entry point.
Depends on: config.py, db.py, api.router, services.errors
Used by: uvicorn

PROMPT:
Write only this file. Expose a module-level app so uvicorn app.main:app works.

Requirements:
- app = FastAPI(title='RevenueMate API'). Use a lifespan handler that calls
  db.create_all() on startup.
- CORSMiddleware allowing settings.FRONTEND_ORIGIN, all methods, all headers.
- app.include_router(api_router) with no prefix.
- Exception handlers returning {'detail': str(exc)}: IllegalTransition -> 409,
  ConflictError -> 409, NotFoundError -> 404, ProviderUnavailable -> 503.

Do not:
- Define routes here.
- Import any adapter or AI module.
- Put business logic here; it belongs in services/.

Done when: GET /health returns 200 and an illegal transition raised anywhere returns 409
with a JSON detail.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import settings
from app.db import create_all
from app.services.errors import (
    ConflictError,
    IllegalTransition,
    NotFoundError,
    ProviderUnavailable,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    create_all()
    yield


app = FastAPI(title="RevenueMate API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(IllegalTransition)
async def illegal_transition_handler(
    request: Request, exc: IllegalTransition
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc)},
    )


@app.exception_handler(ConflictError)
async def conflict_error_handler(
    request: Request, exc: ConflictError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc)},
    )


@app.exception_handler(NotFoundError)
async def not_found_handler(
    request: Request, exc: NotFoundError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.exception_handler(ProviderUnavailable)
async def provider_unavailable_handler(
    request: Request, exc: ProviderUnavailable
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc)},
    )
