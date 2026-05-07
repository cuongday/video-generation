import json
from pathlib import Path
from typing import Any
from services.pattern_synthesizer import AvatarPatternSynthesizer


class TemplateEngine:
    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.synthesizer = AvatarPatternSynthesizer()

    def load_template(self, template_id: str) -> dict | None:
        template_path = self.templates_dir / f"{template_id}.json"
        if not template_path.exists():
            return None
        with open(template_path) as f:
            return json.load(f)

    def load_all_templates(self) -> list[dict]:
        templates = []
        for path in self.templates_dir.glob("*.json"):
            try:
                with open(path) as f:
                    templates.append(json.load(f))
            except Exception:
                pass
        return templates

    def validate_template(self, config: dict) -> tuple[bool, list[str]]:
        errors = []
        required_fields = ["id", "name", "flow"]
        for field in required_fields:
            if field not in config:
                errors.append(f"Missing required field: {field}")

        if "flow" in config:
            flow = config["flow"]
            if "steps" not in flow:
                errors.append("Missing 'flow.steps' in template config")
            else:
                for i, step in enumerate(flow["steps"]):
                    if "id" not in step:
                        errors.append(f"Step {i}: missing 'id'")
                    if "components" not in step:
                        errors.append(f"Step {i}: missing 'components'")
                    if not isinstance(step.get("components", []), list):
                        errors.append(f"Step {i}: 'components' must be an array")

        return len(errors) == 0, errors

    def render_prompt_from_template(
        self,
        template_config: dict,
        context: dict,
    ) -> str:
        prompt_config = template_config.get("prompt_config", {})
        avatar_template = prompt_config.get(
            "avatar_prompt_template",
            "{style} of a {age}-year-old {gender}. {description}."
        )
        return avatar_template.format(**context)

    def render_shot_prompts(
        self,
        template_config: dict,
        shots_config: dict,
        context: dict,
    ) -> dict[str, str]:
        rendered = {}
        shot_defs = shots_config.get("shot_definitions", {})

        for shot_id, shot_def in shot_defs.items():
            template_str = shot_def.get("prompt_template", "")
            # Simple variable substitution
            prompt = template_str
            for key, value in context.items():
                placeholder = f"{{{key}}}"
                prompt = prompt.replace(placeholder, str(value))
            rendered[shot_id] = prompt

        return rendered
