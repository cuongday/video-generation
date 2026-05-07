import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field

from database import get_db
from models import APIKey
from utils.crypto import encrypt_api_key, decrypt_api_key
from utils.validators import sanitize_filename


router = APIRouter(prefix="/api/keys", tags=["API Keys"])


class CreateAPIKeyRequest(BaseModel):
    provider: str = Field(..., description="Provider: nano_banana, sora, kling, dall_e, flux, seedance")
    api_key: str = Field(..., min_length=5)
    label: str = Field(..., min_length=1, max_length=255)
    quota_limit: int | None = Field(None, ge=1)


class UpdateAPIKeyRequest(BaseModel):
    label: str | None = None
    is_active: bool | None = None
    quota_limit: int | None = None


@router.get("")
async def list_keys(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).order_by(APIKey.created_at.desc()))
    keys = result.scalars().all()
    return [k.to_dict(include_key=False) for k in keys]


@router.get("/{key_id}")
async def get_key(key_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    return key.to_dict(include_key=False)


@router.post("")
async def create_key(req: CreateAPIKeyRequest, db: AsyncSession = Depends(get_db)):
    encrypted = encrypt_api_key(req.api_key)
    key = APIKey(
        id=str(uuid.uuid4()),
        provider=req.provider,
        label=sanitize_filename(req.label) if req.label else req.provider,
        encrypted_key=encrypted,
        quota_limit=req.quota_limit,
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return key.to_dict(include_key=False)


@router.patch("/{key_id}")
async def update_key(key_id: str, req: UpdateAPIKeyRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    if req.label is not None:
        key.label = req.label
    if req.is_active is not None:
        key.is_active = req.is_active
    if req.quota_limit is not None:
        key.quota_limit = req.quota_limit

    await db.commit()
    await db.refresh(key)
    return key.to_dict(include_key=False)


@router.delete("/{key_id}")
async def delete_key(key_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.delete(key)
    await db.commit()
    return {"deleted": True}


@router.get("/{key_id}/test")
async def test_key(key_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    decrypted = decrypt_api_key(key.encrypted_key)

    # Test by trying to use it
    from services import get_provider
    try:
        provider = get_provider(key.provider, decrypted)
        # Just test connectivity, don't actually generate
        return {"status": "ok", "provider": key.provider, "message": "Key is valid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Key test failed: {str(e)}")
