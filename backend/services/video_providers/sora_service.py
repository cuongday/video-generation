from openai import AsyncOpenAI
from pathlib import Path
import httpx

from services.base import BaseProvider, ImageResult, VideoResult, JobStatus


class SoraProvider(BaseProvider):
    """
    OpenAI Sora 2 API for video generation.
    Uses OpenAI SDK.
    """

    provider_name = "sora"

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
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
        # Sora is primarily video, use DALL-E for images
        raise NotImplementedError("Use DALL-E or nano-banana for image generation")

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
        size_map = {
            "16:9": "1920x1080",
            "9:16": "1080x1920",
            "1:1": "1024x1024",
            "4:3": "1024x768",
        }
        size = size_map.get(aspect_ratio, "1920x1080")

        kwargs: dict = {
            "model": "sora-2-realtime",
            "prompt": prompt,
            "duration": min(duration, 20),
            "aspect_ratio": aspect_ratio,
        }
        if source_image and source_image.exists():
            import base64
            b64 = source_image.read_bytes()
            kwargs["image"] = f"data:image/png;base64,{base64.b64encode(b64).decode()}"

        try:
            response = await self.client.video.generate(**kwargs)
            job_id = response.id
            self._jobs[job_id] = {"status": "pending", "prompt": prompt}
            return VideoResult(job_id=job_id, status="pending")
        except Exception as e:
            return VideoResult(job_id="", status="failed", error=str(e))

    async def get_status(self, job_id: str) -> JobStatus:
        try:
            response = await self.client.video.generations.retrieve(job_id)
            status_map = {
                "pending": "pending",
                "processing": "running",
                "completed": "completed",
                "failed": "failed",
            }
            return JobStatus(
                job_id=job_id,
                status=status_map.get(response.status, "pending"),
                progress=100 if response.status == "completed" else 50,
                output_url=getattr(response, "url", None),
            )
        except Exception as e:
            return JobStatus(job_id=job_id, status="failed", error=str(e))

    async def download_video(self, job_id: str, output_path: Path) -> Path:
        status = await self.get_status(job_id)
        if not status.output_url:
            raise ValueError("No video URL available")
        async with httpx.AsyncClient() as client:
            response = await client.get(status.output_url)
            response.raise_for_status()
            output_path.write_bytes(response.content)
        return output_path
