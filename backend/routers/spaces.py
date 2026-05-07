import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from database import get_db
from models import SpaceAsset, APIKey
from utils.crypto import decrypt_api_key
from utils.file_utils import save_image_from_url


router = APIRouter(prefix="/api/spaces", tags=["Spaces"])


class CreateSpaceRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None
    prompt: str | None = None
    style: str | None = None
    lighting: str | None = None
    category: str = Field(default="custom")
    tags: list[str] = Field(default_factory=list)


class GenerateSpaceRequest(BaseModel):
    prompt: str
    style: str = Field(default="modern minimalist")
    lighting: str = Field(default="natural lighting")
    aspect_ratio: str = Field(default="16:9")
    provider: str = Field(default="nano_banana")


@router.get("")
async def list_spaces(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SpaceAsset)
        .where(SpaceAsset.is_active == True)
        .order_by(SpaceAsset.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    spaces = result.scalars().all()
    return {"items": [s.to_dict() for s in spaces], "total": len(spaces)}


@router.post("")
async def create_space(req: CreateSpaceRequest, db: AsyncSession = Depends(get_db)):
    space = SpaceAsset(
        id=str(uuid.uuid4()),
        name=req.name,
        description=req.description,
        prompt=req.prompt,
        style=req.style,
        lighting=req.lighting,
        category=req.category,
        tags=req.tags,
    )
    db.add(space)
    await db.commit()
    await db.refresh(space)
    return space.to_dict()


@router.post("/generate")
async def generate_space(
    req: GenerateSpaceRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    key_result = await db.execute(
        select(APIKey).where(
            APIKey.provider.in_(["nano_banana"]),
            APIKey.is_active == True,
        ).limit(1)
    )
    api_key_record = key_result.scalar_one_or_none()
    if not api_key_record:
        raise HTTPException(status_code=400, detail="No nano-banana API key")

    decrypted = decrypt_api_key(api_key_record.encrypted_key)

    # Generate space image
    from services.image_providers.nano_banana_service import NanoBananaProvider
    provider = NanoBananaProvider(decrypted)

    full_prompt = f"{req.prompt}. {req.style} interior design, {req.lighting}, 8K, hyperrealistic."
    imgs = await provider.generate_image(
        prompt=full_prompt,
        aspect_ratio=req.aspect_ratio,
        quality="hd",
    )

    img = imgs[0]
    if img.url:
        async with httpx.AsyncClient() as client:
            resp = await client.get(img.url)
            content = resp.content
        path = save_image_from_url(content, "spaces")
    elif img.local_path:
        path = img.local_path
    else:
        raise HTTPException(status_code=500, detail="No image output")

    # Save space
    space = SpaceAsset(
        id=str(uuid.uuid4()),
        name=req.prompt[:50],
        prompt=full_prompt,
        image_path=str(path),
        style=req.style,
        lighting=req.lighting,
        category="generated",
    )
    db.add(space)
    await db.commit()
    await db.refresh(space)
    return space.to_dict()


@router.get("/{space_id}")
async def get_space(space_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SpaceAsset).where(SpaceAsset.id == space_id))
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space.to_dict()


@router.delete("/{space_id}")
async def delete_space(space_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SpaceAsset).where(SpaceAsset.id == space_id))
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    space.is_active = False
    await db.commit()
    return {"deleted": True}
