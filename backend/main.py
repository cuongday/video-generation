from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from config import settings
from database import init_db, close_db
from routers import (
    keys_router,
    projects_router,
    jobs_router,
    avatars_router,
    spaces_router,
    templates_router,
    generate_router,
    stitch_router,
    prompt_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

# Disable noisy loggers
for logger_name in ['sqlalchemy.engine', 'sqlalchemy.pool', 'sqlalchemy.dialects', 'sqlalchemy.orm', 'httpx', 'httpcore', 'google_genai', 'google.api_core']:
    logging.getLogger(logger_name).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _load_builtin_templates()
    yield
    await close_db()


async def _load_builtin_templates():
    from database import async_session_maker
    from models import Template
    from services.template_engine import TemplateEngine
    from sqlalchemy import select

    engine = TemplateEngine(settings.OUTPUTS_DIR.parent / "backend" / "templates")
    templates = engine.load_all_templates()

    async with async_session_maker() as db:
        for config in templates:
            result = await db.execute(select(Template).where(Template.id == config["id"]))
            existing = result.scalar_one_or_none()
            if not existing:
                template = Template(
                    id=config["id"],
                    name=config["name"],
                    description=config.get("description"),
                    category=config.get("category", "custom"),
                    icon=config.get("icon", "video"),
                    config=config,
                    is_builtin=True,
                    version=config.get("version", "1.0"),
                )
                db.add(template)
        await db.commit()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static outputs
app.mount("/outputs", StaticFiles(directory=str(settings.OUTPUTS_DIR)), name="outputs")

# Include routers
app.include_router(keys_router)
app.include_router(projects_router)
app.include_router(jobs_router)
app.include_router(avatars_router)
app.include_router(spaces_router)
app.include_router(templates_router)
app.include_router(generate_router)
app.include_router(stitch_router)
app.include_router(prompt_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/providers")
async def list_providers():
    from services import list_providers
    return list_providers()


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "path": str(request.url),
        }
    )
