import os
import shutil
import uuid
from pathlib import Path

from config import settings


def save_uploaded_file(file_content: bytes, subdir: str, filename: str) -> Path:
    dir_path = settings.OUTPUTS_DIR / subdir
    dir_path.mkdir(parents=True, exist_ok=True)
    ext = Path(filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = dir_path / unique_name
    file_path.write_bytes(file_content)
    return file_path


def save_avatar_file(content: bytes, avatar_id: str, filename: str) -> Path:
    dir_path = settings.AVATARS_DIR / avatar_id
    dir_path.mkdir(parents=True, exist_ok=True)
    file_path = dir_path / filename
    file_path.write_bytes(content)
    return file_path


def save_image_from_url(content: bytes, subdir: str) -> Path:
    import hashlib
    dir_path = settings.OUTPUTS_DIR / subdir
    dir_path.mkdir(parents=True, exist_ok=True)
    unique_name = f"{hashlib.md5(content).hexdigest()}.png"
    file_path = dir_path / unique_name
    file_path.write_bytes(content)
    return file_path


def delete_file(path: Path | str) -> None:
    p = Path(path) if isinstance(path, str) else path
    if p.exists() and p.is_file():
        p.unlink()


def delete_directory(path: Path | str) -> None:
    p = Path(path) if isinstance(path, str) else path
    if p.exists() and p.is_dir():
        shutil.rmtree(p)


def get_file_size(path: Path | str) -> int:
    p = Path(path) if isinstance(path, str) else path
    return p.stat().st_size if p.exists() else 0


def list_files(dir_path: Path | str, pattern: str = "*") -> list[Path]:
    p = Path(dir_path) if isinstance(dir_path, str) else dir_path
    return list(p.glob(pattern)) if p.exists() else []
