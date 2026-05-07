from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from pathlib import Path


@dataclass
class ImageResult:
    url: str
    revised_prompt: str | None = None
    local_path: str | None = None
    seed: int | None = None


@dataclass
class VideoResult:
    job_id: str
    status: str
    url: str | None = None
    local_path: str | None = None
    error: str | None = None


@dataclass
class JobStatus:
    job_id: str
    status: str  # pending, running, completed, failed
    progress: int = 0
    output_url: str | None = None
    error: str | None = None


class BaseProvider(ABC):
    provider_name: str = "base"

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        *,
        aspect_ratio: str = "1:1",
        quality: str = "standard",
        n: int = 1,
        reference_image: bytes | None = None,
    ) -> list[ImageResult]:
        pass

    @abstractmethod
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
        pass

    @abstractmethod
    async def get_status(self, job_id: str) -> JobStatus:
        pass

    @abstractmethod
    async def download_video(self, job_id: str, output_path: Path) -> Path:
        pass
