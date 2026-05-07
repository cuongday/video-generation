from routers.keys import router as keys_router
from routers.projects import router as projects_router
from routers.jobs import router as jobs_router
from routers.avatars import router as avatars_router
from routers.spaces import router as spaces_router
from routers.templates import router as templates_router
from routers.generate import router as generate_router
from routers.stitch import router as stitch_router
from routers.prompt import router as prompt_router

__all__ = [
    "keys_router",
    "projects_router",
    "jobs_router",
    "avatars_router",
    "spaces_router",
    "templates_router",
    "generate_router",
    "stitch_router",
    "prompt_router",
]
