import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from database import get_db
from models import Job, Scene
from config import settings


router = APIRouter(prefix="/api/stitch", tags=["Stitch"])


class StitchRequest(BaseModel):
    project_id: str | None = None
    shot_paths: list[str] = Field(..., min_length=1)
    transitions: dict[str, str] = Field(default_factory=dict)
    output_filename: str = Field(default="output")
    aspect_ratio: str = Field(default="9:16")


@router.post("")
async def create_stitch_job(
    req: StitchRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    job = Job(
        id=str(uuid.uuid4()),
        job_type="stitch",
        provider="moviepy",
        input_data={
            "shot_paths": req.shot_paths,
            "transitions": req.transitions,
            "output_filename": req.output_filename,
            "aspect_ratio": req.aspect_ratio,
        },
        project_id=req.project_id,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(_run_stitch, job.id, req, db)

    return {"job_id": job.id, "status": "pending"}


async def _run_stitch(job_id: str, req: StitchRequest, db: AsyncSession):
    from database import async_session_maker

    async with async_session_maker() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        try:
            job.status = "running"
            await session.commit()

            from moviepy import concatenate_videoclips, VideoFileClip
            import numpy as np

            clips = []
            for path_str in req.shot_paths:
                path = Path(path_str)
                if not path.exists():
                    continue
                clip = VideoFileClip(str(path))
                clips.append(clip)

            if not clips:
                raise ValueError("No valid video clips found")

            # Concatenate clips
            final = concatenate_videoclips(clips, method="compose")

            # Save
            output_dir = settings.VIDEOS_DIR / job_id
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{req.output_filename}.mp4"

            final.write_videofile(
                str(output_path),
                codec="libx264",
                audio=False,
                logger=None,
            )

            job.status = "completed"
            job.output_path = str(output_path)
            job.progress = 100
            await session.commit()

            # Clean up clip references
            for clip in clips:
                clip.close()
            final.close()

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            await session.commit()


@router.get("/{job_id}")
async def get_stitch_status(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@router.get("/{job_id}/download")
async def download_stitched(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed" or not job.output_path:
        raise HTTPException(status_code=404, detail="Video not ready")
    from fastapi.responses import FileResponse
    return FileResponse(job.output_path, media_type="video/mp4", filename="stitched.mp4")
