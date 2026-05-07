import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, TimestampMixin


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True)
    scene_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("scenes.id"), nullable=True)
    api_key_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("api_keys.id"), nullable=True)

    job_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # image, video, avatar, space, stitch
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # pending, running, completed, failed
    priority: Mapped[int] = mapped_column(Integer, default=0)

    input_data: Mapped[dict] = mapped_column(JSON, default=dict)
    output_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    progress: Mapped[int] = mapped_column(Integer, default=0)
    estimated_time: Mapped[int | None] = mapped_column(Integer, nullable=True)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    project: Mapped["Project | None"] = relationship("Project", back_populates="jobs")
    scene: Mapped["Scene | None"] = relationship("Scene", back_populates="jobs")
    api_key_rel: Mapped["APIKey | None"] = relationship("APIKey", back_populates="jobs")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "scene_id": self.scene_id,
            "api_key_id": self.api_key_id,
            "job_type": self.job_type,
            "provider": self.provider,
            "provider_job_id": self.provider_job_id,
            "status": self.status,
            "priority": self.priority,
            "input_data": self.input_data,
            "output_path": self.output_path,
            "cost": self.cost,
            "error_message": self.error_message,
            "progress": self.progress,
            "estimated_time": self.estimated_time,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
