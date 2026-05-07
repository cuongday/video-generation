import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from database import get_db
from models import Project, Scene, Template


router = APIRouter(prefix="/api/projects", tags=["Projects"])


class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    template_id: str | None = None
    flow_type: str = Field(default="text_to_video")
    aspect_ratio: str = Field(default="9:16")
    duration: int = Field(default=10, ge=5, le=60)
    flow_data: dict[str, Any] | None = Field(default=None)
    status: str | None = Field(default=None)


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    flow_data: dict[str, Any] | None = None
    status: str | None = None
    provider: str | None = None
    aspect_ratio: str | None = None
    duration: int | None = None


@router.get("")
async def list_projects(
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).options(selectinload(Project.template)).order_by(Project.updated_at.desc())
    if status:
        query = query.where(Project.status == status)
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    projects = result.scalars().all()

    count_result = await db.execute(select(Project.id))
    total = len(count_result.scalars().all())

    return {
        "items": [p.to_dict() for p in projects],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post("")
async def create_project(req: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    template = None
    if req.template_id:
        result = await db.execute(select(Template).where(Template.id == req.template_id))
        template = result.scalar_one_or_none()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    project = Project(
        id=str(uuid.uuid4()),
        name=req.name,
        description=req.description,
        template_id=req.template_id,
        flow_type=req.flow_type,
        aspect_ratio=req.aspect_ratio,
        duration=req.duration,
        status=req.status or "draft",
        flow_data=req.flow_data or {},
        provider=None,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project.to_dict()


@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.template), selectinload(Project.scenes))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.to_dict()


@router.patch("/{project_id}")
async def update_project(project_id: str, req: UpdateProjectRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.name is not None:
        project.name = req.name
    if req.description is not None:
        project.description = req.description
    if req.flow_data is not None:
        project.flow_data = {**project.flow_data, **req.flow_data}
    if req.status is not None:
        project.status = req.status
    if req.provider is not None:
        project.provider = req.provider
    if req.aspect_ratio is not None:
        project.aspect_ratio = req.aspect_ratio
    if req.duration is not None:
        project.duration = req.duration

    await db.commit()
    await db.refresh(project)
    return project.to_dict()


@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return {"deleted": True}


# --- Scenes ---

class CreateSceneRequest(BaseModel):
    name: str = Field(default="Scene")
    scene_type: str = Field(default="shot")
    order_index: int = 0
    config: dict[str, Any] = Field(default_factory=dict)
    duration: int = Field(default=5, ge=1, le=60)
    transition: str | None = None


class UpdateSceneRequest(BaseModel):
    name: str | None = None
    config: dict[str, Any] | None = None
    prompt: str | None = None
    enhanced_prompt: str | None = None
    style: str | None = None
    mood: str | None = None
    camera: str | None = None
    image_path: str | None = None
    video_path: str | None = None
    duration: int | None = None
    status: str | None = None
    transition: str | None = None


@router.get("/{project_id}/scenes")
async def list_scenes(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Scene)
        .where(Scene.project_id == project_id)
        .order_by(Scene.order_index)
    )
    scenes = result.scalars().all()
    return [s.to_dict() for s in scenes]


@router.post("/{project_id}/scenes")
async def create_scene(project_id: str, req: CreateSceneRequest, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scene = Scene(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=req.name,
        scene_type=req.scene_type,
        order_index=req.order_index,
        config=req.config,
        duration=req.duration,
        transition=req.transition,
    )
    db.add(scene)
    await db.commit()
    await db.refresh(scene)
    return scene.to_dict()


@router.put("/{project_id}/scenes/{scene_id}")
async def update_scene(
    project_id: str,
    scene_id: str,
    req: UpdateSceneRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Scene).where(Scene.id == scene_id, Scene.project_id == project_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(scene, field, value)

    await db.commit()
    await db.refresh(scene)
    return scene.to_dict()


@router.delete("/{project_id}/scenes/{scene_id}")
async def delete_scene(project_id: str, scene_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scene).where(Scene.id == scene_id, Scene.project_id == project_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    await db.delete(scene)
    await db.commit()
    return {"deleted": True}


@router.post("/{project_id}/scenes/reorder")
async def reorder_scenes(project_id: str, scene_ids: list[str], db: AsyncSession = Depends(get_db)):
    for i, scene_id in enumerate(scene_ids):
        result = await db.execute(select(Scene).where(Scene.id == scene_id, Scene.project_id == project_id))
        scene = result.scalar_one_or_none()
        if scene:
            scene.order_index = i
    await db.commit()
    return {"reordered": True}
