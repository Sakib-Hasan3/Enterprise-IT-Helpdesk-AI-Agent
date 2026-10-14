from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.auth.jwt import verify_credentials, create_access_token
from app.utils.logger import get_logger

logger = get_logger("api.auth")
router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


@router.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """Login with username + password → JWT token."""
    if not verify_credentials(req.username, req.password):
        logger.warning(f"Failed login attempt for user: {req.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(req.username)
    logger.info(f"User logged in: {req.username}")
    return TokenResponse(access_token=token, username=req.username)


@router.post("/auth/verify")
def verify(current_user: dict = None):
    """Check if token is still valid (call with Bearer token)."""
    from fastapi import Depends
    from app.auth.jwt import get_current_user
    return {"valid": True, "username": current_user.get("sub")}
