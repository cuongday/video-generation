import re
from pathlib import Path


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024  # 500MB


def sanitize_filename(filename: str) -> str:
    filename = re.sub(r"[^\w\s\-_.]", "", filename)
    filename = re.sub(r"[\s]+", "_", filename)
    return filename[:200]


def allowed_image(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_IMAGE_EXTENSIONS


def allowed_video(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_VIDEO_EXTENSIONS


def validate_prompt(prompt: str) -> bool:
    if not prompt or len(prompt.strip()) < 3:
        return False
    if len(prompt) > 10000:
        return False
    return True


def validate_template_config(config: dict) -> list[str]:
    errors = []
    required_fields = ["id", "name", "flow"]
    for field in required_fields:
        if field not in config:
            errors.append(f"Missing required field: {field}")
    if "flow" in config and "steps" in config["flow"]:
        for i, step in enumerate(config["flow"]["steps"]):
            if "id" not in step:
                errors.append(f"Step {i}: missing 'id' field")
            if "components" not in step:
                errors.append(f"Step {i}: missing 'components' field")
    return errors
