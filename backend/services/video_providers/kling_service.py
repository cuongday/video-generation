from openai import AsyncOpenAI
from pathlib import Path
import httpx
import asyncio

from services.base import BaseProvider, ImageResult, VideoResult, JobStatus
from config import settings


class KlingProvider(BaseProvider):
    """
    Kuaishou Kling 3.0 API for video generation.
    """

    provider_name = "kling"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.kling.ai/v1"
        self._jobs: dict[str, str] = {}

    async def generate_image(
        self,
        prompt: str,
        *,
        aspect_ratio: str = "1:1",
        quality: str = "standard",
        n: int = 1,
        reference_image: bytes | None = None,
    ) -> list[ImageResult]:
        raise NotImplementedError("Use nano-banana or DALL-E for image generation")

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
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        aspect_map = {
            "16:9": "16:9",
            "9:16": "9:16",
            "1:1": "1:1",
            "4:3": "4:3",
        }

        data: dict = {
            "prompt": prompt,
            "aspect_ratio": aspect_map.get(aspect_ratio, "16:9"),
            "duration": min(duration, 10),
            "model": "kling-v3-0",
        }

        if source_image and source_image.exists():
            import base64
            b64 = base64.b64encode(source_image.read_bytes()).decode()
            data["image"] = f"data:image/png;base64,{b64}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/video/generations",
                    json=data,
                    headers=headers,
                    timeout=30.0,
                )
                if response.status_code != 200:
                    return VideoResult(job_id="", status="failed", error=response.text)
                result = response.json()
                job_id = result.get("id", "")
                self._jobs[job_id] = "pending"
                return VideoResult(job_id=job_id, status="pending")
        except Exception as e:
            return VideoResult(job_id="", status="failed", error=str(e))

    async def get_status(self, job_id: str) -> JobStatus:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/video/generations/{job_id}",
                    headers=headers,
                    timeout=30.0,
                )
                if response.status_code != 200:
                    return JobStatus(job_id=job_id, status="failed", error=response.text)
                result = response.json()
                status = result.get("status", "pending")
                output_url = result.get("video", {}).get("url") if status == "completed" else None
                return JobStatus(
                    job_id=job_id,
                    status=status,
                    progress=100 if status == "completed" else 50,
                    output_url=output_url,
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
