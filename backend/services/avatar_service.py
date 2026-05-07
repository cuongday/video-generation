import uuid
import json
import logging
import asyncio
from pathlib import Path
from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models import AvatarAsset
from services.pattern_synthesizer import AvatarPatternSynthesizer, AvatarBiometrics
from services.image_providers.nano_banana_service import NanoBananaProvider
from utils.file_utils import save_avatar_file, save_image_from_url
from config import settings

logger = logging.getLogger(__name__)


class AvatarService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.synthesizer = AvatarPatternSynthesizer()

    async def create_avatar(
        self,
        name: str,
        biometrics: dict,
        avatar_type: str = "ai_generated",
        description: str | None = None,
        tags: list[str] | None = None,
    ) -> AvatarAsset:
        logger.info(f"Creating avatar: {name} with biometrics: {biometrics}")
        
        pattern = self.synthesizer.synthesize(biometrics)
        logger.info(f"Synthesized pattern - full_body_prompt: {pattern.full_body_prompt[:200]}...")

        avatar = AvatarAsset(
            id=str(uuid.uuid4()),
            name=name,
            description=description or pattern.full_body_prompt[:500],
            avatar_type=avatar_type,
            biometrics=biometrics,
            tags=tags or [],
            extra_metadata={
                "pattern": {
                    "main_prompt": pattern.main_prompt,
                    "full_body_prompt": pattern.full_body_prompt,
                    "variation_prompt": pattern.variation_prompt,
                    "face_prompt": pattern.face_prompt,
                    "angle_prompts": pattern.angle_prompts,
                    "outfit_prompts": pattern.outfit_prompts,
                }
            },
        )
        self.db.add(avatar)
        await self.db.commit()
        await self.db.refresh(avatar)
        logger.info(f"Avatar created with id: {avatar.id}")
        return avatar

    async def generate_reference_image(
        self,
        avatar: AvatarAsset,
        api_key: str | None = None,
        n: int = 4,
        prompt_override: str | None = None,
        aspect_ratio: str = "9:16",
    ) -> list[Path]:
        """
        Generate reference image(s) for the avatar.
        Creates multiple variations of the same person by calling API multiple times.
        """
        logger.info(f"Generating {n} reference images for avatar {avatar.id} with aspect_ratio={aspect_ratio}")
        
        provider = NanoBananaProvider()
        pattern_data = avatar.extra_metadata.get("pattern", {})
        base_prompt = prompt_override or pattern_data.get("full_body_prompt", avatar.description or "")
        
        logger.info(f"Using prompt: {base_prompt[:300]}...")

        saved_paths = []
        
        # Generate N images by calling API multiple times
        # Each call will produce a different variation of the same person
        for i in range(n):
            try:
                logger.info(f"Generating image {i+1}/{n}...")
                results = await provider.generate_image(
                    prompt=base_prompt,
                    aspect_ratio=aspect_ratio,
                )
                logger.info(f"Image {i+1} generation returned {len(results)} results")

                # Only take the FIRST image from each API call to match N requested
                r = results[0]
                if r.local_path:
                    p = Path(r.local_path)
                elif r.url:
                    import httpx
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(r.url)
                        img_bytes = resp.content
                    p = save_image_from_url(img_bytes, f"avatars/{avatar.id}")
                else:
                    logger.warning("No local_path or url in result")
                    continue
                saved_paths.append(p)
                logger.info(f"Saved image: {p}")
                
                # Delay between API calls to avoid quota issues
                if i < n - 1:
                    await asyncio.sleep(3)
                    
            except Exception as e:
                error_str = str(e)
                logger.error(f"Error generating image {i+1}: {error_str}")
                
                # Check if it's a model not found error
                if "NOT_FOUND" in error_str or "404" in error_str:
                    raise Exception(f"Gemini model not found. Please check API configuration. Error: {error_str}")
                
                # Continue with other images even if one fails
                continue
        
        # Save first image as reference (only if not already set)
        if saved_paths:
            if not avatar.reference_image_path:
                avatar.reference_image_path = str(saved_paths[0])
                logger.info(f"Set reference image: {saved_paths[0]}")
            else:
                logger.info(f"Keeping existing reference image: {avatar.reference_image_path}")
            
            # Also save to face_images for consistency (use set to avoid duplicates)
            existing_face_images = avatar.face_images or []
            seen = set(existing_face_images)
            new_images = []
            for p in saved_paths:
                path_str = str(p)
                if path_str not in seen:
                    seen.add(path_str)
                    new_images.append(path_str)
            avatar.face_images = existing_face_images + new_images
            logger.info(f"Updated face_images: added {len(new_images)} new images, total: {len(avatar.face_images)}")

        await self.db.commit()
        logger.info(f"Completed generating {len(saved_paths)} reference images out of {n} requested")
        return saved_paths

    async def generate_variations(
        self,
        avatar: AvatarAsset,
        n: int = 4,
        prompt_override: str | None = None,
        aspect_ratio: str = "9:16",
    ) -> list[Path]:
        """
        Generate variations of the avatar.
        Uses img2img with the ORIGINAL reference image to maintain identity.
        Creates exactly N images (not 2N or more).
        """
        logger.info(f"Generating {n} variations for avatar {avatar.id}")

        if not avatar.reference_image_path:
            raise ValueError("Avatar must have a reference image first")

        ref_path = Path(avatar.reference_image_path)
        if not ref_path.exists():
            raise ValueError(f"Reference image not found: {avatar.reference_image_path}")

        provider = NanoBananaProvider()
        pattern_data = avatar.extra_metadata.get("pattern", {})

        base_prompt = pattern_data.get("variation_prompt", avatar.description or "")
        if prompt_override:
            base_prompt = prompt_override

        # Prompts to create different variations while keeping the same person
        variation_modifiers = [
            "Different pose, different angle, same person.",
            "Standing in a new location, different background, same person.",
            "New expression, candid moment, same person.",
            "Different outfit, relaxed pose, same person.",
            "Outdoor setting, natural lighting, same person.",
            "Indoor setting, casual pose, same person.",
            "Action pose, energetic, same person.",
            "Close-up portrait, same person.",
        ]

        saved_paths = []

        for i in range(n):
            modifier = variation_modifiers[i % len(variation_modifiers)]
            prompt = f"{base_prompt} {modifier} CRITICAL: Keep the EXACT same facial features, body proportions, skin tone, hair - this is the SAME person, not a different one."

            logger.info(f"Generating variation {i+1}/{n} with img2img...")

            try:
                imgs = await provider.generate_image(
                    prompt=prompt,
                    aspect_ratio=aspect_ratio,
                    reference_image=ref_path,
                )
                logger.info(f"Variation {i+1} returned {len(imgs)} results")

                for r in imgs:
                    if r.local_path:
                        p = Path(r.local_path)
                    elif r.url:
                        import httpx
                        async with httpx.AsyncClient() as client:
                            resp = await client.get(r.url)
                            img_bytes = resp.content
                        p = save_image_from_url(img_bytes, f"avatars/{avatar.id}")
                    else:
                        continue
                    saved_paths.append(p)
                    logger.info(f"Saved variation: {p}")
                    break  # Only take first result per variation

            except Exception as e:
                logger.error(f"Error generating variation {i+1}: {str(e)}")
                continue

        # Save variations to variations_images (not face_images)
        if saved_paths:
            existing_variations = avatar.extra_metadata.get("variations_images", [])
            seen = set(existing_variations)
            new_variations = []
            for p in saved_paths:
                path_str = str(p)
                if path_str not in seen:
                    seen.add(path_str)
                    new_variations.append(path_str)
            avatar.extra_metadata["variations_images"] = existing_variations + new_variations
            avatar.extra_metadata = avatar.extra_metadata  # trigger ORM update
            await self.db.commit()
            logger.info(f"Saved {len(new_variations)} new variations. Total: {len(avatar.extra_metadata.get('variations_images', []))}")

        logger.info(f"Completed generating {len(saved_paths)} variations")
        return saved_paths

    async def generate_multi_angle(
        self,
        avatar: AvatarAsset,
        api_key: str | None = None,
        angles: list[str] | None = None,
    ) -> dict[str, Path]:
        """Generate different face angles using img2img."""
        if not avatar.reference_image_path:
            raise ValueError("Avatar must have a reference image first")

        logger.info(f"Generating angles {angles} for avatar {avatar.id}")
        
        provider = NanoBananaProvider()
        pattern_data = avatar.extra_metadata.get("pattern", {})
        angle_prompts = pattern_data.get("angle_prompts", {})
        variation_prompt = pattern_data.get("variation_prompt", "")

        saved: dict[str, Path] = {}

        for angle in angles or []:
            base_prompt = angle_prompts.get(angle, avatar.description or "")
            prompt = f"{base_prompt}. Maintain the exact same facial features and identity as the reference image."

            logger.info(f"Generating angle: {angle}")
            try:
                imgs = await provider.generate_image(
                    prompt=prompt,
                    aspect_ratio="1:1",
                    reference_image=Path(avatar.reference_image_path),
                )
            except Exception as e:
                logger.error(f"Error generating angle {angle}: {str(e)}")
                raise Exception(f"Failed to generate angle {angle}: {str(e)}")
            
            for r in imgs:
                if r.local_path:
                    p = Path(r.local_path)
                elif r.url:
                    import httpx
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(r.url)
                        img_bytes = resp.content
                    p = save_image_from_url(img_bytes, f"avatars/{avatar.id}")
                else:
                    continue
                saved[angle] = str(p)
                break

        avatar.face_images = (avatar.face_images or []) + list(saved.values())
        await self.db.commit()
        return saved

    async def generate_multi_outfit(
        self,
        avatar: AvatarAsset,
        api_key: str | None = None,
        outfits: list[str] | None = None,
    ) -> dict[str, Path]:
        """Generate different outfits using img2img with user's custom outfit input."""
        if not avatar.reference_image_path:
            raise ValueError("Avatar must have a reference image first")

        logger.info(f"Generating outfits {outfits} for avatar {avatar.id}")

        provider = NanoBananaProvider()
        pattern_data = avatar.extra_metadata.get("pattern", {})
        outfit_prompts = pattern_data.get("outfit_prompts", {})
        variation_prompt = pattern_data.get("variation_prompt", avatar.description or "")

        saved: dict[str, Path] = {}

        for outfit in outfits or []:
            # Prefer user's custom outfit input
            bio = avatar.biometrics or {}
            custom_top = bio.get("outfit_top", "")
            custom_bottom = bio.get("outfit_bottom", "")
            custom_desc = bio.get("outfit_description", "")

            outfit_parts = []
            if custom_top:
                outfit_parts.append(custom_top)
            if custom_bottom:
                outfit_parts.append(custom_bottom)
            if custom_desc:
                outfit_parts.append(custom_desc)

            if outfit_parts:
                base_prompt = f"{variation_prompt}. Outfit: {', '.join(outfit_parts)}."
            else:
                base_prompt = outfit_prompts.get(outfit, "")
                if not base_prompt:
                    continue

            prompt = f"{base_prompt} Keep the exact same person - same face, body proportions, skin tone, hair. Just changing the outfit to reflect the described clothing."

            logger.info(f"Generating outfit '{outfit}': {prompt[:100]}...")

            logger.info(f"Generating outfit: {outfit}")
            try:
                imgs = await provider.generate_image(
                    prompt=prompt,
                    aspect_ratio="3:4",
                    reference_image=Path(avatar.reference_image_path),
                )
            except Exception as e:
                logger.error(f"Error generating outfit {outfit}: {str(e)}")
                raise Exception(f"Failed to generate outfit {outfit}: {str(e)}")
            
            for r in imgs:
                if r.local_path:
                    p = Path(r.local_path)
                elif r.url:
                    import httpx
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(r.url)
                        img_bytes = resp.content
                    p = save_image_from_url(img_bytes, f"avatars/{avatar.id}")
                else:
                    continue
                saved[outfit] = str(p)
                break

        avatar.body_images = (avatar.body_images or []) + list(saved.values())
        await self.db.commit()
        return saved

    async def list_avatars(self, limit: int = 20, offset: int = 0) -> list[AvatarAsset]:
        result = await self.db.execute(
            select(AvatarAsset)
            .where(AvatarAsset.is_active == True)
            .order_by(AvatarAsset.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_avatar(self, avatar_id: str) -> AvatarAsset | None:
        result = await self.db.execute(
            select(AvatarAsset).where(AvatarAsset.id == avatar_id)
        )
        return result.scalar_one_or_none()
