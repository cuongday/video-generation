from pathlib import Path
import os
from typing import Any
import logging
import asyncio

from google import genai
from google.genai import types
from google.genai.types import Modality

from services.base import BaseProvider, ImageResult, VideoResult, JobStatus

logger = logging.getLogger(__name__)


class NanoBananaProvider(BaseProvider):
    """
    nano-banana = Gemini API image generation via google-genai SDK
    Model: gemini-2.5-flash-image (Nano Banana)
    Uses ADC (Application Default Credentials) for authentication.
    Supports both text-to-image and image-to-image (img2img) generation.
    """

    provider_name = "nano_banana"

    def __init__(self, model: str = "gemini-3.1-flash-image-preview"):
        logger.info(f"Initializing NanoBananaProvider with model: {model}")
        self.client = genai.Client(
            vertexai=True,
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "global"),
        )
        self.model = model
        self._pending_jobs: dict[str, str] = {}

    async def generate_image(
        self,
        prompt: str,
        *,
        aspect_ratio: str = "9:16",
        n: int = 1,
        reference_image: Path | bytes | None = None,
        **kwargs,
    ) -> list[ImageResult]:
        """
        Generate image(s) using Gemini.
        """
        logger.info(f"Generating image with aspect_ratio={aspect_ratio}, has_reference={reference_image is not None}")
        logger.debug(f"Prompt: {prompt[:200]}...")
        
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                if reference_image:
                    contents = await self._build_img2img_contents(prompt, reference_image)
                    config = types.GenerateContentConfig(
                        response_modalities=[Modality.TEXT, Modality.IMAGE],
                        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
                    )
                else:
                    contents = prompt
                    config = types.GenerateContentConfig(
                        response_modalities=[Modality.TEXT, Modality.IMAGE],
                        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
                    )

                logger.info(f"Calling Gemini API (attempt {attempt + 1}/{max_retries})")
                response = await self.client.aio.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config,
                )

                results = []
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        img_bytes = part.inline_data.data
                        from utils.file_utils import save_image_from_url
                        path = save_image_from_url(img_bytes, "images")
                        results.append(ImageResult(url="", revised_prompt=None, local_path=str(path)))
                        logger.info(f"Saved image: {path}")

                logger.info(f"Generated {len(results)} images")
                return results
                
            except Exception as e:
                error_str = str(e)
                logger.error(f"Error generating image (attempt {attempt + 1}): {error_str}")
                
                if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)
                        logger.warning(f"Quota exceeded. Retrying in {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        raise Exception(f"Gemini API quota exceeded. Please wait a few minutes and try again.")
                
                raise Exception(f"NanoBanana API error: {error_str}")

    async def _build_img2img_contents(self, prompt: str, reference_image: Path | bytes) -> str:
        if isinstance(reference_image, Path):
            img_bytes = reference_image.read_bytes()
        else:
            img_bytes = reference_image

        if img_bytes[:2] == b'\xff\xd8':
            mime_type = "image/jpeg"
        elif img_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            mime_type = "image/png"
        else:
            mime_type = "image/jpeg"

        image_part = types.Part(
            inline_data=types.Blob(data=img_bytes, mime_type=mime_type)
        )
        text_part = types.Part(text=prompt)
        
        return [image_part, text_part]

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
        raise NotImplementedError("Use Kling or Sora for video generation")

    async def get_status(self, job_id: str) -> JobStatus:
        return JobStatus(job_id=job_id, status="completed")

    async def download_video(self, job_id: str, output_path: Path) -> Path:
        raise NotImplementedError("Use Kling or Sora for video")
