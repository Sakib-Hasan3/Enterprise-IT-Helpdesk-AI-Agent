import secrets
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("auth.jwt")
security = HTTPBearer()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def create_access_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": username, "exp": expire, "iat": datetime.utcnow()}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None


def verify_credentials(username: str, password: str) -> bool:
    """Timing-safe credential comparison."""
    return (
        secrets.compare_digest(username, settings.ADMIN_USERNAME)
        and secrets.compare_digest(password, settings.ADMIN_PASSWORD)
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
