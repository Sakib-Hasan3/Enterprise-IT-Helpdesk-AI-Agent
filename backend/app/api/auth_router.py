from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.auth.jwt import verify_credentials, create_access_token, get_current_user
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
    """Authenticate with username + password → returns JWT token."""
    if not verify_credentials(req.username, req.password):
        logger.warning(f"Failed login attempt: {req.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(req.username)
    logger.info(f"✅ Login: {req.username}")
    return TokenResponse(access_token=token, username=req.username)


@router.get("/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    """Returns the currently authenticated user info."""
    return {"username": current_user.get("sub"), "valid": True}
