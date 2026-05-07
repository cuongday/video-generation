import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, TimestampMixin


class AvatarAsset(Base, TimestampMixin):
    __tablename__ = "avatar_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_type: Mapped[str] = mapped_column(String(50), nullable=False)  # ai_generated, real_face
    biometrics: Mapped[dict] = mapped_column(JSON, default=dict)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    extra_metadata: Mapped[dict] = mapped_column(JSON, default=dict)

    reference_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    face_images: Mapped[list] = mapped_column(JSON, default=list)
    body_images: Mapped[list] = mapped_column(JSON, default=list)
    video_clips: Mapped[list] = mapped_column(JSON, default=list)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def to_dict(self, include_biometrics: bool = False) -> dict:
        d = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "avatar_type": self.avatar_type,
            "tags": self.tags,
            "extra_metadata": self.extra_metadata,
            "reference_image_path": self.reference_image_path,
            "face_images": self.face_images,
            "body_images": self.body_images,
            "video_clips": self.video_clips,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_biometrics:
            d["biometrics"] = self.biometrics
        return d


class SpaceAsset(Base, TimestampMixin):
    __tablename__ = "space_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lighting: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="custom")
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_path": self.image_path,
            "prompt": self.prompt,
            "style": self.style,
            "lighting": self.lighting,
            "category": self.category,
            "tags": self.tags,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
