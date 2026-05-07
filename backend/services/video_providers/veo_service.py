from pathlib import Path
import httpx
import asyncio
import base64
import os

from google import genai
from google.genai import types

from services.base import BaseProvider, ImageResult, VideoResult, JobStatus

logger_name = "veo_service"


class VeoProvider(BaseProvider):
    """
    Google Veo 3.1 video generation via Gemini API + google-genai SDK.
    Supports text-to-video and image-to-video (up to 8 seconds, 720p/1080p/4k).
    Uses ADC (Application Default Credentials) + Vertex AI for authentication.
    """

    provider_name = "veo"

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "veo-3.1-generate-preview",
    ):
        self.client = genai.Client(
            vertexai=True,
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "global"),
        )
        self.model = model
        self._operations: dict[str, types.GenerateVideosOperation] = {}

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
        aspect_map = {
            "16:9": "16:9",
            "9:16": "9:16",
            "1:1": "16:9",
            "4:3": "16:9",
        }
        resolved_aspect = aspect_map.get(aspect_ratio, "16:9")

        duration_map = {4: "4", 5: "4", 6: "6", 7: "6", 8: "8"}
        resolved_duration = duration_map.get(min(duration, 8), "4")

        config = types.GenerateVideosConfig(
            aspect_ratio=resolved_aspect,
            duration_seconds=resolved_duration,
        )

        image_obj = None
        if source_image and source_image.exists():
            img_bytes = source_image.read_bytes()
            mime_type = "image/png" if img_bytes[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
            image_obj = types.Image(
                inline_data=types.Blob(data=img_bytes, mime_type=mime_type)
            )

        try:
            operation = self.client.models.generate_videos(
                model=self.model,
                prompt=prompt,
                image=image_obj,
                config=config,
            )
            op_name = getattr(operation, "name", None) or str(id(operation))
            self._operations[op_name] = operation
            return VideoResult(job_id=op_name, status="pending")
        except Exception as e:
            return VideoResult(job_id="", status="failed", error=str(e))

    async def get_status(self, job_id: str) -> JobStatus:
        if job_id not in self._operations:
            return JobStatus(job_id=job_id, status="failed", error="Operation not found")

        try:
            operation = self._operations[job_id]
            refreshed = self.client.operations.get(operation)
            self._operations[job_id] = refreshed

            if refreshed.done:
                if hasattr(refreshed, "response") and refreshed.response is not None:
                    return JobStatus(
                        job_id=job_id,
                        status="completed",
                        progress=100,
                        output_url=self._extract_video_uri(refreshed),
                    )
                elif hasattr(refreshed, "error") and refreshed.error:
                    return JobStatus(
                        job_id=job_id,
                        status="failed",
                        error=str(refreshed.error),
                    )
                else:
                    return JobStatus(job_id=job_id, status="running", progress=50)
            else:
                return JobStatus(job_id=job_id, status="running", progress=50)

        except Exception as e:
            return JobStatus(job_id=job_id, status="failed", error=str(e))

    def _extract_video_uri(self, operation) -> str | None:
        try:
            resp = operation.response
            if hasattr(resp, "generated_videos") and resp.generated_videos:
                video = resp.generated_videos[0]
                if hasattr(video, "video") and video.video:
                    if hasattr(video.video, "uri") and video.video.uri:
                        return video.video.uri
                    if hasattr(video.video, "video_bytes"):
                        return None
            return None
        except Exception:
            return None

    async def download_video(self, job_id: str, output_path: Path) -> Path:
        if job_id not in self._operations:
            raise ValueError("Operation not found, cannot download")

        operation = self._operations[job_id]
        if not operation.done:
            raise ValueError("Operation not yet complete")

        try:
            resp = operation.response
            video_obj = None
            if hasattr(resp, "generated_videos") and resp.generated_videos:
                video_obj = resp.generated_videos[0].video

            if video_obj is None:
                raise ValueError("No video in operation response")

            if hasattr(video_obj, "video_bytes") and video_obj.video_bytes:
                output_path.write_bytes(video_obj.video_bytes)
            else:
                self.client.files.download(file=video_obj)
                if hasattr(video_obj, "uri") and video_obj.uri:
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(video_obj.uri)
                        resp.raise_for_status()
                        output_path.write_bytes(resp.content)
                else:
                    raise ValueError("No URI or bytes available for download")

            return output_path
        except Exception as e:
            raise RuntimeError(f"Download failed: {e}")
