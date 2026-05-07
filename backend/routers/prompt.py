import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.template_engine import TemplateEngine
from services.pattern_synthesizer import AvatarPatternSynthesizer
from config import settings


router = APIRouter(prefix="/api/prompt", tags=["Prompt"])


class EnhancePromptRequest(BaseModel):
    raw_description: str
    flow_type: str = "text_to_video"
    style: str | None = None
    mood: str | None = None
    camera: str | None = None
    avatar_biometrics: dict | None = None


class SynthesizeAvatarRequest(BaseModel):
    biometrics: dict


@router.post("/enhance")
async def enhance_prompt(req: EnhancePromptRequest):
    """Enhance a raw text description into a structured video prompt."""
    synthesizer = AvatarPatternSynthesizer()

    if req.avatar_biometrics:
        # Full avatar pattern synthesis
        pattern = synthesizer.synthesize(req.avatar_biometrics)
        return {
            "enhanced_prompt": pattern.full_body_prompt or pattern.main_prompt,
            "main_prompt": pattern.main_prompt,
            "full_body_prompt": pattern.full_body_prompt,
            "variation_prompt": pattern.variation_prompt,
            "face_prompt": pattern.face_prompt,
            "body_prompt": pattern.body_prompt,
            "angle_prompts": pattern.angle_prompts,
            "outfit_prompts": pattern.outfit_prompts,
        }

    # Simple text enhancement
    enhanced = _simple_enhance(req.raw_description, req.flow_type, req.style, req.mood, req.camera)
    return {"enhanced_prompt": enhanced}


def _simple_enhance(text: str, flow_type: str, style: str | None, mood: str | None, camera: str | None) -> str:
    parts = [text.strip()]

    if camera:
        camera_map = {
            "wide": "wide shot",
            "medium": "medium shot",
            "closeup": "close-up shot",
            "cinematic": "cinematic camera movement",
            "dolly": "smooth dolly shot",
            "orbit": "slow orbit around subject",
            "tracking": "tracking shot following subject",
        }
        parts.append(camera_map.get(camera, camera))

    if mood:
        mood_map = {
            "happy": "warm, joyful atmosphere",
            "mysterious": "dark, mysterious mood",
            "dramatic": "dramatic lighting and atmosphere",
            "peaceful": "calm, peaceful environment",
            "energetic": "dynamic, energetic atmosphere",
            "professional": "professional business setting",
        }
        parts.append(mood_map.get(mood, mood))

    if style:
        parts.append(style)

    parts.append("high quality, 8K resolution")
    parts.append("cinematic color grading")

    return ". ".join(parts)


@router.post("/synthesize-avatar")
async def synthesize_avatar_pattern(req: SynthesizeAvatarRequest):
    """Synthesize avatar pattern from biometrics data."""
    synthesizer = AvatarPatternSynthesizer()
    pattern = synthesizer.synthesize(req.biometrics)
    return {
        "main_prompt": pattern.main_prompt,
        "full_body_prompt": pattern.full_body_prompt,
        "variation_prompt": pattern.variation_prompt,
        "face_prompt": pattern.face_prompt,
        "hair_prompt": pattern.hair_prompt,
        "body_prompt": pattern.body_prompt,
        "angle_prompts": pattern.angle_prompts,
        "outfit_prompts": pattern.outfit_prompts,
    }


@router.post("/validate-prompt")
async def validate_prompt_safety(prompt: str):
    """Basic prompt safety validation."""
    blocked_words = ["nsfw", "explicit", "violence", "illegal"]
    lower = prompt.lower()
    found = [w for w in blocked_words if w in lower]
    return {
        "valid": len(found) == 0,
        "flagged_words": found,
        "message": "Prompt contains blocked content" if found else "Prompt looks safe",
    }
