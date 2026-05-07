from openai import AsyncOpenAI
from pathlib import Path
import httpx

from services.base import BaseProvider, ImageResult, VideoResult, JobStatus


class SeedanceProvider(BaseProvider):
    """
    Seedance (AceDataCloud) for image and video generation.
    """

    provider_name = "seedance"

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.acedata.cloud/seedance/v1",
        )
        self._jobs: dict[str, dict] = {}

    async def generate_image(
        self,
        prompt: str,
        *,
        aspect_ratio: str = "1:1",
        quality: str = "standard",
        n: int = 1,
        reference_image: bytes | None = None,
    ) -> list[ImageResult]:
        size = {
            "1:1": "1024x1024",
            "4:3": "1024x768",
            "3:4": "768x1024",
            "16:9": "1024x1024",  # approximate
            "9:16": "768x1024",
        }.get(aspect_ratio, "1024x1024")

        kwargs: dict = {
            "model": "seedance-i2v",
            "prompt": prompt,
            "n": n,
            "size": size,
        }
        if reference_image:
            import base64
            kwargs["image"] = f"data:image/png;base64,{base64.b64encode(reference_image).decode()}"

        response = await self.client.images.generate(**kwargs)
        return [
            ImageResult(
                url=r.url or "",
                revised_prompt=getattr(r, "revised_prompt", None),
            )
            for r in response.data
        ]

    async def generate_video(
        self,
        prompt: str,
        *,
        source_image: Path | None = None,
        duration: int = 5,
        aspect_ratio: str = "16:9",
        camera: str | None = None,
        motion: str | None = None,
    ) -> VideoResult:
        kwargs: dict = {
            "model": "seedance-i2v",
            "prompt": prompt,
            "duration": duration,
        }
        if source_image and source_image.exists():
            import base64
            kwargs["image"] = f"data:image/png;base64,{base64.b64encode(source_image.read_bytes()).decode()}"

        try:
            response = await self.client.videos.generate(**kwargs)
            job_id = getattr(response, "id", "unknown")
            self._jobs[job_id] = {"status": "pending"}
            return VideoResult(job_id=job_id, status="pending")
        except Exception as e:
            return VideoResult(job_id="", status="failed", error=str(e))

    async def get_status(self, job_id: str) -> JobStatus:
        try:
            response = await self.client.videos.retrieve(job_id)
            return JobStatus(
                job_id=job_id,
                status=getattr(response, "status", "pending"),
                progress=100,
                output_url=getattr(response, "url", None),
            )
        except Exception as e:
            return JobStatus(job_id=job_id, status="failed", error=str(e))

    async def download_video(self, job_id: str, output_path: Path) -> Path:
        status = await self.get_status(job_id)
        if not status.output_url:
            raise ValueError("No video URL available")
        async with httpx.AsyncClient() as client:
            response = await client.get(status.output_url, timeout=120.0)
            response.raise_for_status()
            output_path.write_bytes(response.content)
        return output_path
