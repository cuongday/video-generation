import json
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from database import get_db
from models import Template
from services.template_engine import TemplateEngine
from config import settings


router = APIRouter(prefix="/api/templates", tags=["Templates"])


def get_engine() -> TemplateEngine:
    return TemplateEngine(settings.OUTPUTS_DIR.parent / "backend" / "templates")


@router.get("")
async def list_templates(
    category: str | None = None,
    engine: TemplateEngine = Depends(get_engine),
):
    templates = engine.load_all_templates()
    if category:
        templates = [t for t in templates if t.get("category") == category]
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t.get("description"),
            "category": t.get("category"),
            "icon": t.get("icon", "video"),
            "is_builtin": t.get("is_builtin", True),
            "version": t.get("version", "1.0"),
        }
        for t in templates
    ]


@router.get("/{template_id}")
async def get_template(
    template_id: str,
    engine: TemplateEngine = Depends(get_engine),
):
    template = engine.load_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/validate")
async def validate_template(
    config: dict,
    engine: TemplateEngine = Depends(get_engine),
):
    valid, errors = engine.validate_template(config)
    return {"valid": valid, "errors": errors}


@router.post("/import")
async def import_template(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    engine: TemplateEngine = Depends(get_engine),
):
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Must be a .json file")

    content = await file.read()
    try:
        config = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    valid, errors = engine.validate_template(config)
    if not valid:
        raise HTTPException(status_code=422, detail=f"Invalid template: {errors}")

    # Save to DB
    template = Template(
        id=config.get("id", str(uuid.uuid4())),
        name=config["name"],
        description=config.get("description"),
        category=config.get("category", "custom"),
        icon=config.get("icon", "video"),
        config=config,
        is_builtin=False,
        version=config.get("version", "1.0"),
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template.to_dict()


@router.get("/{template_id}/export")
async def export_template(
    template_id: str,
    engine: TemplateEngine = Depends(get_engine),
):
    template = engine.load_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template
