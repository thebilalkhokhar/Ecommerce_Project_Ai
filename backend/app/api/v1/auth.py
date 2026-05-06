from datetime import datetime, timezone
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.token import (
    AccessTokenResponse,
    FacebookLoginRequest,
    GoogleLoginRequest,
    RefreshRequest,
    Token,
)
from app.schemas.user import UserCreate, UserOut
from app.services.crud import crud_refresh_token, crud_user

router = APIRouter()


def _issue_tokens_for_user(request: Request, db: Session, user: User) -> Token:
    access_token = security.create_access_token({"sub": str(user.id)})
    refresh_token = security.create_refresh_token({"sub": str(user.id)})
    client_host = request.client.host if request.client else None
    crud_refresh_token.create_refresh_token_record(
        db,
        user_id=user.id,
        token=refresh_token,
        device_info=request.headers.get("user-agent"),
        ip_address=client_host,
    )
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    if crud_user.get_user_by_email(db, str(user_in.email)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = crud_user.create_user(db, user_in)
    return UserOut.model_validate(user)


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    email = form_data.username.strip().lower()
    user = crud_user.get_user_by_email(db, email)
    if user is None or not security.verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    access_token = security.create_access_token({"sub": str(user.id)})
    refresh_token = security.create_refresh_token({"sub": str(user.id)})
    client_host = request.client.host if request.client else None
    crud_refresh_token.create_refresh_token_record(
        db,
        user_id=user.id,
        token=refresh_token,
        device_info=request.headers.get("user-agent"),
        ip_address=client_host,
    )
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    crud_refresh_token.revoke_all_for_user(db, current_user.id)


@router.post("/google-login", response_model=Token)
def google_login(
    request: Request,
    body: GoogleLoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    if not settings.GOOGLE_CLIENT_ID.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    try:
        idinfo = id_token.verify_oauth2_token(
            body.credential,
            google_auth_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        ) from exc

    if idinfo.get("email_verified") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email is not verified",
        )

    raw_email = idinfo.get("email")
    if not raw_email or not isinstance(raw_email, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email",
        )
    email = raw_email.strip().lower()
    full_name = (
        idinfo.get("name")
        or idinfo.get("given_name")
        or idinfo.get("family_name")
        or "User"
    )
    if not isinstance(full_name, str):
        full_name = "User"

    user = crud_user.get_user_by_email(db, email)
    if user is None:
        random_password = secrets.token_urlsafe(48)
        user = crud_user.create_google_user(
            db,
            email=email,
            full_name=full_name.strip() or "User",
            password=random_password,
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return _issue_tokens_for_user(request, db, user)


@router.post("/facebook-login", response_model=Token)
async def facebook_login(
    request: Request,
    body: FacebookLoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    graph_url = "https://graph.facebook.com/me"
    params = {
        "fields": "id,name,email",
        "access_token": body.access_token,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(graph_url, params=params)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Facebook",
        ) from exc

    try:
        payload = response.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Facebook",
        )

    if response.status_code != 200:
        err = payload.get("error") if isinstance(payload, dict) else None
        msg = "Invalid Facebook token"
        if isinstance(err, dict) and err.get("message"):
            msg = str(err["message"])
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Facebook",
        )

    if "error" in payload:
        err = payload["error"]
        msg = (
            str(err.get("message", "Facebook error"))
            if isinstance(err, dict)
            else "Facebook error"
        )
        if isinstance(err, dict) and err.get("code") == 190:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=msg,
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=msg,
        )

    raw_email = payload.get("email")
    if not raw_email or not isinstance(raw_email, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Facebook did not return an email; grant email permission or use an account with email",
        )
    email = raw_email.strip().lower()

    full_name = payload.get("name") or "User"
    if not isinstance(full_name, str):
        full_name = "User"

    user = crud_user.get_user_by_email(db, email)
    if user is None:
        random_password = secrets.token_urlsafe(48)
        user = crud_user.create_google_user(
            db,
            email=email,
            full_name=full_name.strip() or "User",
            password=random_password,
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return _issue_tokens_for_user(request, db, user)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_tokens(
    body: RefreshRequest,
    db: Session = Depends(get_db),
) -> AccessTokenResponse:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = jwt.decode(
            body.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        sub = payload.get("sub")
        if sub is None:
            raise credentials_error
        user_id_from_jwt = int(sub)
    except (JWTError, ValueError, TypeError):
        raise credentials_error

    row = crud_refresh_token.get_refresh_token_by_token(db, body.refresh_token)
    now = datetime.now(timezone.utc)
    if (
        row is None
        or row.is_revoked
        or row.user_id != user_id_from_jwt
        or row.expires_at <= now
    ):
        raise credentials_error

    access_token = security.create_access_token({"sub": str(row.user_id)})
    return AccessTokenResponse(access_token=access_token)
