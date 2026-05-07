# AI Video Generator Tool

A full-stack web application for creating AI-generated videos with a guided workflow system, virtual avatar creation, and template-driven flows.

## Features

- **Template System** — Choose from built-in templates or create custom ones via JSON
- **Virtual Avatar Creator** — Build AI influencers with biometric customization (face, body, outfit), then generate multi-angle and multi-outfit assets
- **Guided Workflow** — Step-by-step wizard makes video creation accessible without technical prompts
- **Multi-Provider Support** — Integrates with nano-banana (Gemini), Sora 2, Kling 3.0, Seedance, DALL-E
- **Video Stitching** — Stitch multiple shots into a single video with transitions
- **Shot Engine** — Generate individual shots from template configurations

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ / FastAPI |
| Frontend | React 18 + Vite + TypeScript |
| Styling | TailwindCSS |
| State | Zustand + React Query |
| Database | SQLite + SQLAlchemy + Alembic |
| Image Gen | nano-banana (Gemini), DALL-E, Flux, Seedance |
| Video Gen | Sora 2, Kling 3.0, Seedance |
| Video Stitch | MoviePy |

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Copy and configure environment
cp .env.example .env
# Edit .env and add your API keys

# Run the server
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will be available at `http://localhost:5173` with API proxy to backend.

## API Keys Required

Create `.env` file in `backend/` and add your API keys:

```env
# nano-banana (Gemini) — primary image provider
# Get from: https://aistudio.google.com/
GEMINI_API_KEY=your_key_here

# OpenAI (Sora 2) — video generation
# Get from: https://platform.openai.com/
OPENAI_API_KEY=sk-your_key_here

# Kuaishou Kling 3.0 — video generation
# Get from: https://www.klingai.com/
KUAIHOU_API_KEY=your_key_here

# Seedance — image & video
# Get from: https://acedata.cloud/
SEEDANCE_API_KEY=your_key_here

# Security (generate with):
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY=your_32_byte_key_here
SECRET_KEY=your_random_secret_key_here
```

## Project Structure

```
video-generator/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # Database models
│   │   ├── api_key.py
│   │   ├── project.py       # Projects, Scenes, Templates
│   │   ├── avatar_asset.py  # Avatars, Spaces
│   │   └── job.py           # Jobs
│   ├── routers/             # API endpoints
│   │   ├── keys.py
│   │   ├── projects.py
│   │   ├── avatars.py
│   │   ├── spaces.py
│   │   ├── templates.py
│   │   ├── generate.py
│   │   ├── stitch.py
│   │   └── prompt.py
│   ├── services/            # Business logic
│   │   ├── base.py
│   │   ├── pattern_synthesizer.py   # Avatar biometrics → prompt
│   │   ├── avatar_service.py        # Avatar creation pipeline
│   │   ├── template_engine.py      # Template parsing
│   │   ├── image_providers/
│   │   │   ├── nano_banana_service.py
│   │   │   └── dalle_service.py
│   │   └── video_providers/
│   │       ├── sora_service.py
│   │       ├── kling_service.py
│   │       └── seedance_service.py
│   └── templates/          # Built-in template JSON files
│       ├── ai_influencer_creator.json
│       ├── affiliate_product_review.json
│       ├── affiliate_unboxing.json
│       ├── affiliate_lifestyle.json
│       ├── cinematic_short_film.json
│       ├── tutorial_howto.json
│       └── story_narrative.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   │   ├── Home.tsx
│   │   │   ├── TemplateGallery.tsx
│   │   │   ├── AvatarCreator.tsx  # 7-step biometric wizard
│   │   │   ├── AvatarLibrary.tsx
│   │   │   ├── FlowRunner.tsx    # Dynamic flow renderer
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── History.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── shared/Layout.tsx
│   │   │   └── ...              # Reusable UI components
│   │   ├── stores/             # Zustand stores
│   │   │   ├── useFlowStore.ts
│   │   │   └── useAvatarStore.ts
│   │   ├── hooks/              # React hooks
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   ├── constants.ts    # UI constants
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   └── package.json
└── outputs/                  # Generated files (gitignored)
    ├── avatars/
    ├── spaces/
    ├── images/
    └── videos/
```

## Available Templates

| Template | Category | Description |
|---|---|---|
| **AI Influencer Creator** | avatar | Build virtual influencers with full biometric customization |
| **Affiliate Product Review** | affiliate | Product review with avatar: intro → closeup → talking → usage → outro |
| **Affiliate Unboxing** | affiliate | Unboxing video: intro → unbox → reveal → examine → use → CTA |
| **Affiliate Lifestyle** | affiliate | Lifestyle-style product promotion |
| **Cinematic Short Film** | cinematic | Cinematic video with multiple scenes |
| **Tutorial / How-to** | educational | Step-by-step tutorial |
| **Story Narrative** | storytelling | Narrative story with scenes |
| **Blank Template** | custom | Start from scratch |

## Avatar Creation Flow

1. **Name** — Set avatar name and tags
2. **Identity** — Select gender + ethnicity
3. **Face** — Customize: face shape, eyes, nose, mouth, ears, skin, hair (18+ attributes)
4. **Body & Outfit** — Body type, height, outfit, accessories
5. **Generate Reference** — Synthesize biometric data into prompt → generate via nano-banana
6. **Multi-Assets** — Generate multi-angle face images + multi-outfit images
7. **Save** — Save to avatar library

## Template System

Templates are JSON files defining the flow, steps, and shot configurations. You can:

- Use built-in templates
- Create custom templates via the Template Editor UI
- Import/Export templates as `.vg-template.json` files
- Share templates with other users

Example template structure:

```json
{
  "id": "my_template",
  "name": "My Template",
  "flow": {
    "steps": [
      { "id": "step1", "title": "Step 1", "components": ["PromptInput"] }
    ]
  },
  "shots_config": { ... },
  "defaults": { "aspect_ratio": "9:16", "provider": "kling" }
}
```

## Development

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "init"
alembic upgrade head
```

### Adding a New Provider

1. Create service in `services/video_providers/` or `services/image_providers/`
2. Implement `BaseProvider` interface
3. Register in `services/__init__.py` `_PROVIDER_MAP`
4. Add to frontend provider selector

### Adding a New Template

1. Create JSON file in `backend/templates/`
2. Define `flow.steps[].components[]` with component IDs
3. Register components in `FlowRenderer.tsx`
4. Reload — template auto-loads on server start

## License

MIT
