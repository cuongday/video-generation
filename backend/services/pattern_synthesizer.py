from dataclasses import dataclass, field
from typing import Literal


@dataclass
class AvatarBiometrics:
    # Identity
    gender: Literal["female", "male", "non-binary"] = "female"
    ethnicity: Literal[
        "african", "asian", "southeast_asian", "european",
        "indian", "middle_eastern", "latin", "mixed"
    ] = "asian"
    age: int = 25

    # Face
    face_shape: str = "oval"
    eye_shape: str = "almond"
    eye_color: str = "dark_brown"
    eye_size: str = "medium"
    nose_shape: str = "small"
    nose_width: str = "medium"
    lip_shape: str = "medium"
    lip_volume: str = "natural"
    ear_shape: str = "attached"
    ear_size: str = "medium"
    ear_protrusion: str = "flat"
    skin_color: str = "medium_brown"
    skin_undertone: str = "warm"

    # Hair
    hair_style: str = "straight"
    hair_length: str = "shoulder_length"
    hair_color: str = "black"
    bangs: str = "none"

    # Features
    eyebrows: str = "arched"
    freckles: str = "none"
    dimples: str = "none"
    mole_location: str | None = None
    glasses: str | None = None
    expression: str = "slight_smile"

    # Body
    body_type: str = "average"
    height: str = "average"
    bust_cm: int | None = None
    waist_cm: int | None = None
    hips_cm: int | None = None

    # Outfit - user inputs directly
    outfit_description: str = ""
    outfit_top: str = ""
    outfit_bottom: str = ""
    shoes: str = "sneakers"
    accessories: dict = field(default_factory=dict)

    # Style - Influencer specific
    shooting_style: Literal["portrait", "half_body", "full_body", "lifestyle", "product_shot"] = "full_body"
    environment: str = "modern urban cafe with natural lighting, outdoor terrace"
    pose_description: str = "standing confidently, natural pose"
    camera_angle: Literal["eye_level", "low_angle", "high_angle", "dramatic"] = "eye_level"
    additional_details: str = "warm golden hour lighting, shallow depth of field, bokeh background"

    # Style (legacy)
    style: str = "photorealistic portrait"
    lighting: str = "professional studio lighting, soft key light from left, subtle rim light"
    background: str = "clean studio white background"


@dataclass
class AvatarPattern:
    main_prompt: str
    face_prompt: str
    hair_prompt: str
    body_prompt: str
    full_body_prompt: str  # Full influencer shot with environment
    variation_prompt: str  # Prompt for creating variations using reference image
    angle_prompts: dict[str, str] = field(default_factory=dict)
    outfit_prompts: dict[str, str] = field(default_factory=dict)
    metadata: AvatarBiometrics = field(default_factory=AvatarBiometrics)


class AvatarPatternSynthesizer:
    def synthesize(self, bio: AvatarBiometrics | dict) -> AvatarPattern:
        if isinstance(bio, dict):
            bio = AvatarBiometrics(**{k: v for k, v in bio.items() if k in AvatarBiometrics.__annotations__})

        face = self._build_face_description(bio)
        hair = self._build_hair_description(bio)
        body = self._build_body_description(bio)
        accessories = self._build_accessories_description(bio)
        
        # Base portrait prompt
        prompt = self._compose_prompt(bio, face, hair, body, accessories)
        
        # Full body influencer prompt with environment
        full_body = self._build_full_body_influencer_prompt(bio, face, hair, accessories)
        
        # Prompt for creating variations using reference image
        variation = self._build_variation_prompt(bio, face, hair)
        
        angle_prompts = self._generate_angle_prompts(prompt, bio)
        outfit_prompts = self._generate_outfit_prompts(prompt, bio)

        return AvatarPattern(
            main_prompt=prompt,
            face_prompt=face,
            hair_prompt=hair,
            body_prompt=body,
            full_body_prompt=full_body,
            variation_prompt=variation,
            angle_prompts=angle_prompts,
            outfit_prompts=outfit_prompts,
            metadata=bio,
        )

    def _build_face_description(self, bio: AvatarBiometrics) -> str:
        parts = [
            f"{bio.age}-year-old",
            f"{bio.gender}",
            f"with {bio.ethnicity.replace('_', ' ')} features",
            f"{bio.face_shape} face shape",
            f"{bio.eye_size} {bio.eye_shape}-shaped {bio.eye_color} eyes",
            f"{bio.nose_shape} {bio.nose_width}-width nose",
            f"{bio.lip_volume} {bio.lip_shape} lips",
            f"{bio.skin_color} skin with {bio.skin_undertone} undertone",
            f"{bio.eyebrows} eyebrows",
            f"{bio.ear_size} {bio.ear_shape} ears, {bio.ear_protrusion} protrusion",
            f"natural {bio.expression} expression",
        ]
        if bio.freckles != "none":
            parts.append(f"with {bio.freckles} freckles")
        if bio.dimples != "none":
            parts.append(f"with {bio.dimples} dimples")
        if bio.mole_location:
            parts.append(f"beauty mark near {bio.mole_location}")
        if bio.glasses:
            parts.append(f"wearing {bio.glasses} glasses")
        return ", ".join(parts)

    def _build_hair_description(self, bio: AvatarBiometrics) -> str:
        return f"{bio.hair_length} {bio.hair_style} {bio.hair_color} hair, {bio.bangs} bangs"

    def _build_body_description(self, bio: AvatarBiometrics) -> str:
        parts = [f"{bio.body_type} {bio.height} body"]
        if bio.bust_cm:
            parts.append(f"bust {bio.bust_cm}cm")
        if bio.waist_cm:
            parts.append(f"waist {bio.waist_cm}cm")
        if bio.hips_cm:
            parts.append(f"hips {bio.hips_cm}cm")
        outfit_parts = []
        if bio.outfit_top:
            outfit_parts.append(bio.outfit_top)
        if bio.outfit_bottom:
            outfit_parts.append(bio.outfit_bottom)
        if bio.outfit_description:
            outfit_parts.append(bio.outfit_description)
        if outfit_parts:
            parts.append(f"wearing {', '.join(outfit_parts)}")
        return ", ".join(parts)

    def _build_accessories_description(self, bio: AvatarBiometrics) -> str:
        items = []
        for zone, item in (bio.accessories or {}).items():
            if item and item != "none":
                items.append(f"{zone}: {item}")
        return ", ".join(items) if items else "no accessories"

    def _build_full_body_influencer_prompt(self, bio: AvatarBiometrics, face: str, hair: str, accessories: str) -> str:
        """Build a full body influencer-style prompt with environment"""
        # Shooting style modifiers
        shooting_modifiers = {
            "portrait": "head and shoulders portrait, tight framing",
            "half_body": "from waist up, casual upper body shot",
            "full_body": "full body shot, person standing in environment",
            "lifestyle": "lifestyle shot, person in natural setting, candid moment",
            "product_shot": "influencer product showcase pose, confident stance",
        }
        shooting = shooting_modifiers.get(bio.shooting_style, "full body shot")
        
        # Camera angle modifiers
        camera_modifiers = {
            "eye_level": "shot at eye level",
            "low_angle": "shot from below, slightly upward angle, empowering perspective",
            "high_angle": "shot from above, flattering perspective",
            "dramatic": "dramatic low angle, cinematic lighting",
        }
        camera = camera_modifiers.get(bio.camera_angle, "shot at eye level")
        
        # Compose outfit description from user input
        outfit_parts = []
        if bio.outfit_top:
            outfit_parts.append(bio.outfit_top)
        if bio.outfit_bottom:
            outfit_parts.append(bio.outfit_bottom)
        if bio.outfit_description:
            outfit_parts.append(bio.outfit_description)
        outfit_str = ", ".join(outfit_parts) if outfit_parts else "casual outfit"

        return (
            f"Full body influencer photo of a {face}. "
            f"{hair}. "
            f"Standing pose: {bio.pose_description}. "
            f"Wearing: {outfit_str}, {bio.shoes}. "
            f"Accessories: {accessories}. "
            f"Setting: {bio.environment}. "
            f"Shooting style: {shooting}, {camera}. "
            f"Photo quality: {bio.additional_details}. "
            f"Hyperrealistic, high-end smartphone camera quality, popular lifestyle influencer aesthetic, 4K resolution."
        )

    def _build_variation_prompt(self, bio: AvatarBiometrics, face: str, hair: str) -> str:
        """Build a prompt for creating variations using reference image (img2img)"""
        body_desc = f"{bio.body_type} {bio.height} build"
        if bio.bust_cm:
            body_desc += f", bust {bio.bust_cm}cm"
        if bio.waist_cm:
            body_desc += f", waist {bio.waist_cm}cm"
        if bio.hips_cm:
            body_desc += f", hips {bio.hips_cm}cm"

        outfit_parts = []
        if bio.outfit_top:
            outfit_parts.append(bio.outfit_top)
        if bio.outfit_bottom:
            outfit_parts.append(bio.outfit_bottom)
        if bio.outfit_description:
            outfit_parts.append(bio.outfit_description)
        outfit_str = ", ".join(outfit_parts) if outfit_parts else bio.outfit_description or "casual outfit"

        return (
            f"Same person: {face}. {hair}. "
            f"{body_desc}. "
            f"Wearing: {outfit_str}. "
            f"Maintain the same facial features, body proportions, skin tone, hair, and overall appearance. "
            f"Create a new pose and different setting. "
            f"Keep the identity consistent - this is the SAME person. "
            f"Hyperrealistic, consistent identity with reference image."
        )

    def _compose_prompt(self, bio: AvatarBiometrics, face: str, hair: str, body: str, accessories: str) -> str:
        return (
            f"{bio.style} of a {face}. "
            f"{hair}. "
            f"{body}. "
            f"Accessories: {accessories}. "
            f"{bio.lighting}. "
            f"{bio.background}. "
            f"Hyperrealistic, detailed skin texture, natural look, 8K resolution, sharp focus."
        )

    def _generate_angle_prompts(self, base_prompt: str, bio: AvatarBiometrics) -> dict[str, str]:
        modifiers = {
            "front": "facing camera directly, centered, professional portrait, slight smile",
            "3/4_left": "turned 45 degrees to the left, showing right side of face clearly",
            "3/4_right": "turned 45 degrees to the right, showing left side of face clearly",
            "profile_left": "in left profile view, full left side of face visible",
            "profile_right": "in right profile view, full right side of face visible",
            "looking_up": "gazing slightly upward, gentle perspective, hopeful expression",
            "looking_down": "looking downward thoughtfully, contemplative pose",
            "tilt_left": "head tilted gently to the left, relaxed casual angle",
            "tilt_right": "head tilted gently to the right, relaxed casual angle",
        }
        return {angle: f"{base_prompt}. {mod}. High detail face portrait." for angle, mod in modifiers.items()}

    def _generate_outfit_prompts(self, base_prompt: str, bio: AvatarBiometrics) -> dict[str, str]:
        outfits = {
            "business": "professional navy blazer over white dress shirt, dress pants, leather belt, polished look",
            "casual": "casual plain white t-shirt, blue jeans, white sneakers, relaxed look",
            "smart_casual": "light-colored blazer over casual shirt, chinos, loafers, refined casual",
            "active": "athletic fitted top, sports leggings, running shoes, energetic look",
            "evening": "elegant formal evening wear, sophisticated look, premium fabric",
            "traditional": f"culturally appropriate traditional attire for {bio.ethnicity.replace('_', ' ')} heritage",
        }
        # Remove the outfit portion from base prompt
        import re
        base = re.sub(r"wearing [^,]+\. ", "", base_prompt)
        return {name: f"{base} wearing {desc}. {bio.lighting}." for name, desc in outfits.items()}
