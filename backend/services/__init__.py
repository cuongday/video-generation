from services.base import BaseProvider
from services.image_providers.nano_banana_service import NanoBananaProvider
from services.image_providers.dalle_service import DalleProvider
from services.video_providers.sora_service import SoraProvider
from services.video_providers.kling_service import KlingProvider
from services.video_providers.seedance_service import SeedanceProvider
from services.video_providers.veo_service import VeoProvider

_PROVIDER_MAP: dict[str, type[BaseProvider]] = {
    "nano_banana": NanoBananaProvider,
    "sora": SoraProvider,
    "kling": KlingProvider,
    "seedance": SeedanceProvider,
    "dall_e": DalleProvider,
    "veo": VeoProvider,
}

_IMAGE_PROVIDERS = {"nano_banana", "dall_e", "seedance"}
_VIDEO_PROVIDERS = {"sora", "kling", "seedance", "veo"}


def get_provider(provider: str, api_key: str) -> BaseProvider:
    cls = _PROVIDER_MAP.get(provider.lower())
    if not cls:
        raise ValueError(f"Unknown provider: {provider}")
    return cls(api_key=api_key)


def get_image_provider(provider: str, api_key: str) -> BaseProvider:
    if provider not in _IMAGE_PROVIDERS:
        provider = "nano_banana"
    return get_provider(provider, api_key)


def get_video_provider(provider: str, api_key: str) -> BaseProvider:
    if provider not in _VIDEO_PROVIDERS:
        provider = "kling"
    return get_provider(provider, api_key)


def list_providers() -> dict:
    return {
        "image": sorted(_IMAGE_PROVIDERS),
        "video": sorted(_VIDEO_PROVIDERS),
    }
