import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, TimestampMixin


class Template(Base, TimestampMixin):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    icon: Mapped[str] = mapped_column(String(50), default="video")
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    projects: Mapped[list["Project"]] = relationship("Project", back_populates="template")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "icon": self.icon,
            "is_builtin": self.is_builtin,
            "version": self.version,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("templates.id"), nullable=True)
    flow_type: Mapped[str] = mapped_column(String(50), nullable=False)
    flow_data: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True)
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aspect_ratio: Mapped[str] = mapped_column(String(10), default="9:16")
    duration: Mapped[int] = mapped_column(Integer, default=10)

    template: Mapped[Template | None] = relationship("Template", back_populates="projects")
    scenes: Mapped[list["Scene"]] = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "template_id": self.template_id,
            "template_name": self.template.name if self.template else None,
            "template_config": self.template.config if self.template else None,
            "flow_type": self.flow_type,
            "flow_data": self.flow_data,
            "status": self.status,
            "provider": self.provider,
            "aspect_ratio": self.aspect_ratio,
            "duration": self.duration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Scene(Base, TimestampMixin):
    __tablename__ = "scenes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(255), default="Scene")
    scene_type: Mapped[str] = mapped_column(String(50), default="shot")
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    enhanced_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mood: Mapped[str | None] = mapped_column(String(100), nullable=True)
    camera: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    duration: Mapped[int] = mapped_column(Integer, default=5)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    transition: Mapped[str | None] = mapped_column(String(50), nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="scenes")
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="scene", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "order_index": self.order_index,
            "name": self.name,
            "scene_type": self.scene_type,
            "config": self.config,
            "prompt": self.prompt,
            "enhanced_prompt": self.enhanced_prompt,
            "style": self.style,
            "mood": self.mood,
            "camera": self.camera,
            "image_path": self.image_path,
            "video_path": self.video_path,
            "duration": self.duration,
            "status": self.status,
            "transition": self.transition,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
