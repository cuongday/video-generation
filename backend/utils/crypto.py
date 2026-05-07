import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from config import settings


def _get_fernet() -> Fernet:
    try:
        return Fernet(settings.FERNET_KEY.encode())
    except Exception:
        key = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"video_generator_salt_v1",
            iterations=480000,
        ).derive(settings.SECRET_KEY.encode())
        fernet_key = base64.urlsafe_b64encode(key)
        return Fernet(fernet_key)


_fernet = _get_fernet()


def encrypt_api_key(api_key: str) -> str:
    return _fernet.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode()).decode()
