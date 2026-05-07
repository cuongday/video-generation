from openai import AsyncOpenAI
import httpx
import base64
from pathlib import Path

from services.base import BaseProvider, ImageResult, VideoResult, JobStatus


class DalleProvider(BaseProvider):
    """OpenAI DALL-E 3 for image generation."""

    provider_name = "dall_e"

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate_image(
        self,
        prompt: str,
        *,
        aspect_ratio: str = "1:1",
        quality: str = "standard",
        n: int = 1,
        reference_image: bytes | None = None,
    ) -> list[ImageResult]:
        raise NotImplementedError("DALL-E image gen not fully implemented — use nano-banana")

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
        raise NotImplementedError("DALL-E does not support video generation")

    async def get_status(self, job_id: str) -> JobStatus:
        return JobStatus(job_id=job_id, status="completed")

    async def download_video(self, job_id: str, output_path: Path) -> Path:
        raise NotImplementedError()
