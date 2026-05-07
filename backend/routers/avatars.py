import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from database import get_db
from models import AvatarAsset
from services.avatar_service import AvatarService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/avatars", tags=["Avatars"])


class CreateAvatarRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    biometrics: dict = Field(default_factory=dict)
    avatar_type: str = Field(default="ai_generated")
    description: str | None = None
    tags: list[str] = Field(default_factory=list)


class GenerateRefRequest(BaseModel):
    n: int = Field(default=4, ge=1, le=8)
    prompt_override: str | None = Field(default=None, description="Custom prompt to use instead of avatar's default prompt")
    aspect_ratio: str = Field(default="9:16", description="Aspect ratio for generated images (e.g., 1:1, 3:4, 9:16, 16:9)")


class GenerateAnglesRequest(BaseModel):
    angles: list[str] = Field(
        default=["front", "3/4_left", "3/4_right", "profile_left"]
    )


class GenerateOutfitsRequest(BaseModel):
    outfits: list[str] = Field(
        default=["business", "casual", "smart_casual"]
    )


class GenerateVariationsRequest(BaseModel):
    n: int = Field(default=4, ge=1, le=8, description="Number of variations to generate")
    prompt_override: str | None = Field(default=None, description="Custom prompt for variations")
    aspect_ratio: str = Field(default="9:16", description="Aspect ratio for generated images")


async def get_avatar_service(db: AsyncSession = Depends(get_db)) -> AvatarService:
    return AvatarService(db)


@router.get("")
async def list_avatars(
    limit: int = 20,
    offset: int = 0,
    service: AvatarService = Depends(get_avatar_service),
):
    avatars = await service.list_avatars(limit=limit, offset=offset)
    return {"items": [a.to_dict() for a in avatars], "total": len(avatars)}


@router.post("")
async def create_avatar(
    req: CreateAvatarRequest,
    service: AvatarService = Depends(get_avatar_service),
):
    avatar = await service.create_avatar(
        name=req.name,
        biometrics=req.biometrics,
        avatar_type=req.avatar_type,
        description=req.description,
        tags=req.tags,
    )
    return avatar.to_dict(include_biometrics=True)


@router.get("/{avatar_id}")
async def get_avatar(avatar_id: str, service: AvatarService = Depends(get_avatar_service)):
    avatar = await service.get_avatar(avatar_id)
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return avatar.to_dict(include_biometrics=True)


@router.delete("/{avatar_id}")
async def delete_avatar(avatar_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AvatarAsset).where(AvatarAsset.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    avatar.is_active = False
    await db.commit()
    return {"deleted": True}


@router.post("/{avatar_id}/generate-reference")
async def generate_reference_images(
    avatar_id: str,
    req: GenerateRefRequest,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Request to generate {req.n} reference images for avatar {avatar_id}")
    
    result = await db.execute(select(AvatarAsset).where(AvatarAsset.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        logger.warning(f"Avatar {avatar_id} not found")
        raise HTTPException(status_code=404, detail="Avatar not found")

    service = AvatarService(db)

    try:
        logger.info(f"Calling generate_reference_image service...")
        paths = await service.generate_reference_image(
            avatar, 
            n=req.n, 
            prompt_override=req.prompt_override,
            aspect_ratio=req.aspect_ratio,
        )
        await db.refresh(avatar)
        logger.info(f"Successfully generated {len(paths)} reference images")
        
        if len(paths) == 0:
            return JSONResponse(
                status_code=503,
                content={"detail": "Gemini API quota exceeded or model not found. Please check API configuration and try again later."}
            )
        
        return {
            "avatar_id": avatar.id,
            "reference_image_path": avatar.reference_image_path,
            "variations": [str(p) for p in paths],
            "count": len(paths),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating reference images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{avatar_id}/generate-variations")
async def generate_variations(
    avatar_id: str,
    req: GenerateVariationsRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate variations of the avatar using img2img to maintain identity.
    """
    logger.info(f"Request to generate {req.n} variations for avatar {avatar_id}")
    
    result = await db.execute(select(AvatarAsset).where(AvatarAsset.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        logger.warning(f"Avatar {avatar_id} not found")
        raise HTTPException(status_code=404, detail="Avatar not found")

    if not avatar.reference_image_path:
        logger.warning(f"Avatar {avatar_id} has no reference image")
        raise HTTPException(status_code=400, detail="Avatar must have a reference image first")

    service = AvatarService(db)

    try:
        logger.info(f"Calling generate_variations service...")
        paths = await service.generate_variations(
            avatar,
            n=req.n,
            prompt_override=req.prompt_override,
            aspect_ratio=req.aspect_ratio,
        )
        await db.refresh(avatar)
        logger.info(f"Successfully generated {len(paths)} variations")
        
        # Convert paths to URLs
        variations = [str(p).replace('../', '/') for p in paths]
        variations_images = avatar.extra_metadata.get("variations_images", [])

        return {
            "avatar_id": avatar.id,
            "variations": variations,
            "variations_images": variations_images,
            "reference_image_path": avatar.reference_image_path,
            "count": len(paths),
        }
    except Exception as e:
        logger.error(f"Error generating variations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate variations: {str(e)}")


@router.post("/{avatar_id}/generate-angles")
async def generate_multi_angle(
    avatar_id: str,
    req: GenerateAnglesRequest,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Request to generate angles {req.angles} for avatar {avatar_id}")
    
    result = await db.execute(select(AvatarAsset).where(AvatarAsset.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        logger.warning(f"Avatar {avatar_id} not found")
        raise HTTPException(status_code=404, detail="Avatar not found")

    service = AvatarService(db)

    try:
        results = await service.generate_multi_angle(avatar, req.angles)
        await db.refresh(avatar)
        logger.info(f"Successfully generated {len(results)} angle images")

        return {
            "avatar_id": avatar.id,
            "face_images": avatar.face_images,
        }
    except Exception as e:
        logger.error(f"Error generating angles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate angles: {str(e)}")


@router.post("/{avatar_id}/generate-outfits")
async def generate_multi_outfit(
    avatar_id: str,
    req: GenerateOutfitsRequest,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"Request to generate outfits {req.outfits} for avatar {avatar_id}")
    
    result = await db.execute(select(AvatarAsset).where(AvatarAsset.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        logger.warning(f"Avatar {avatar_id} not found")
        raise HTTPException(status_code=404, detail="Avatar not found")

    service = AvatarService(db)

    try:
        results = await service.generate_multi_outfit(avatar, req.outfits)
        await db.refresh(avatar)
        logger.info(f"Successfully generated {len(results)} outfit images")

        return {
            "avatar_id": avatar.id,
            "body_images": avatar.body_images,
        }
    except Exception as e:
        logger.error(f"Error generating outfits: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate outfits: {str(e)}")
