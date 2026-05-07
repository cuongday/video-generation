import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Any

from database import get_db
from models import Job, Scene, AvatarAsset, APIKey
from services import get_provider
from utils.crypto import decrypt_api_key


router = APIRouter(prefix="/api/generate", tags=["Generation"])


class ImageGenRequest(BaseModel):
    prompt: str
    style: str | None = None
    aspect_ratio: str = Field(default="1:1")
    quality: str = Field(default="standard")
    n: int = Field(default=1, ge=1, le=4)
    provider: str = Field(default="nano_banana")
    api_key_id: str | None = None
    scene_id: str | None = None
    project_id: str | None = None


class VideoGenRequest(BaseModel):
    prompt: str
    source_image_path: str | None = None
    duration: int = Field(default=5, ge=1, le=30)
    aspect_ratio: str = Field(default="16:9")
    camera: str | None = None
    motion: str | None = None
    provider: str = Field(default="kling")
    api_key_id: str | None = None
    scene_id: str | None = None
    project_id: str | None = None


async def get_api_key(db: AsyncSession, key_id: str | None, provider: str) -> tuple[str, APIKey]:
    if key_id:
        result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    else:
        result = await db.execute(
            select(APIKey).where(
                APIKey.provider == provider,
                APIKey.is_active == True,
            ).limit(1)
        )
    key_record = result.scalar_one_or_none()
    if not key_record:
        raise HTTPException(status_code=400, detail=f"No active API key for {provider}")
    return decrypt_api_key(key_record.encrypted_key), key_record


@router.post("/image")
async def generate_image(
    req: ImageGenRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    api_key_str, key_record = await get_api_key(db, req.api_key_id, req.provider)
    provider = get_provider(req.provider, api_key_str)

    # Create job
    job = Job(
        id=str(uuid.uuid4()),
        job_type="image",
        provider=req.provider,
        input_data={
            "prompt": req.prompt,
            "style": req.style,
            "aspect_ratio": req.aspect_ratio,
            "quality": req.quality,
            "n": req.n,
        },
        scene_id=req.scene_id,
        project_id=req.project_id,
        status="pending",
    )
    db.add(job)
    key_record.quota_used += 1
    await db.commit()
    await db.refresh(job)

    # Run generation in background
    background_tasks.add_task(_run_image_generation, job.id, req, api_key_str, db)

    return {"job_id": job.id, "status": "pending"}


async def _run_image_generation(job_id: str, req: ImageGenRequest, api_key_str: str, db: AsyncSession):
    from database import async_session_maker

    async with async_session_maker() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        try:
            job.status = "running"
            await session.commit()

            provider = get_provider(req.provider, api_key_str)
            imgs = await provider.generate_image(
                prompt=req.prompt,
                aspect_ratio=req.aspect_ratio,
                quality=req.quality,
                n=req.n,
            )

            paths = []
            for i, img in enumerate(imgs):
                if img.local_path:
                    paths.append(img.local_path)
                elif img.url:
                    import httpx, base64
                    if img.url.startswith("data:"):
                        b64 = img.url.split(",")[1]
                        content = base64.b64decode(b64)
                    else:
                        async with httpx.AsyncClient() as client:
                            resp = await client.get(img.url)
                            content = resp.content
                    from utils.file_utils import save_image_from_url
                    p = save_image_from_url(content, "images")
                    paths.append(str(p))

            job.status = "completed"
            job.output_path = paths[0] if paths else None
            job.progress = 100
            job.input_data = {
                **job.input_data,
                "results": paths,
                "revised_prompt": imgs[0].revised_prompt if imgs else None,
            }

            # Update scene if linked
            if job.scene_id:
                scene_result = await session.execute(select(Scene).where(Scene.id == job.scene_id))
                scene = scene_result.scalar_one_or_none()
                if scene and paths:
                    scene.image_path = paths[0]
                    scene.status = "completed"

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
        finally:
            await session.commit()


@router.post("/video")
async def generate_video(
    req: VideoGenRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    api_key_str, key_record = await get_api_key(db, req.api_key_id, req.provider)
    provider = get_provider(req.provider, api_key_str)

    job = Job(
        id=str(uuid.uuid4()),
        job_type="video",
        provider=req.provider,
        input_data={
            "prompt": req.prompt,
            "source_image_path": req.source_image_path,
            "duration": req.duration,
            "aspect_ratio": req.aspect_ratio,
            "camera": req.camera,
            "motion": req.motion,
        },
        scene_id=req.scene_id,
        project_id=req.project_id,
        status="pending",
    )
    db.add(job)
    key_record.quota_used += 1
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(_run_video_generation, job.id, req, api_key_str, db)

    return {"job_id": job.id, "status": "pending"}


async def _run_video_generation(job_id: str, req: VideoGenRequest, api_key_str: str, db: AsyncSession):
    from database import async_session_maker

    async with async_session_maker() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        try:
            job.status = "running"
            await session.commit()

            provider = get_provider(req.provider, api_key_str)
            source_image = Path(req.source_image_path) if req.source_image_path else None

            video_result = await provider.generate_video(
                prompt=req.prompt,
                source_image=source_image,
                duration=req.duration,
                aspect_ratio=req.aspect_ratio,
                camera=req.camera,
                motion=req.motion,
            )

            job.provider_job_id = video_result.job_id
            job.status = "running"
            job.input_data = {
                **job.input_data,
                "provider_job_id": video_result.job_id,
            }
            await session.commit()

            # Poll for completion
            import asyncio
            for _ in range(60):  # max 5 min polling
                await asyncio.sleep(5)
                status = await provider.get_status(video_result.job_id)
                job.progress = 50 if status.status == "running" else 100

                if status.status == "completed":
                    job.status = "completed"
                    if status.output_url:
                        import httpx
                        async with httpx.AsyncClient() as client:
                            resp = await client.get(status.output_url)
                            content = resp.content
                        from utils.file_utils import save_image_from_url
                        p = save_image_from_url(content, "videos")
                        job.output_path = str(p)
                    break
                elif status.status == "failed":
                    job.status = "failed"
                    job.error_message = status.error
                    break

            # Update scene
            if job.scene_id:
                scene_result = await session.execute(select(Scene).where(Scene.id == job.scene_id))
                scene = scene_result.scalar_one_or_none()
                if scene:
                    scene.video_path = job.output_path
                    scene.status = job.status

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
        finally:
            await session.commit()


@router.get("/status/{job_id}")
async def get_status(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@router.get("/output/{job_id}")
async def get_output(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.output_path:
        raise HTTPException(status_code=404, detail="Output not available yet")
    from fastapi.responses import FileResponse
    return FileResponse(job.output_path, media_type="video/mp4" if ".mp4" in job.output_path else "image/png")
