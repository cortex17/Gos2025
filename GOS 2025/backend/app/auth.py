from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.config import settings
from app.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def _truncate_password(password: str) -> bytes:
    """Truncate password to 72 bytes (bcrypt limit)"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        return password_bytes[:72]
    return password_bytes

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        password_bytes = _truncate_password(plain_password)
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = _truncate_password(password)
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    # Use timezone-aware datetime for proper timestamp calculation
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # JWT expects exp as a timestamp (int), not datetime
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError as e:
        # Log the error for debugging
        import sys
        print(f"JWT Error: {type(e).__name__}: {e}", file=sys.stderr)
        raise credentials_exception
    except Exception as e:
        import sys
        print(f"Unexpected error: {type(e).__name__}: {e}", file=sys.stderr)
        raise credentials_exception
    
    user = await get_user_by_email(db, email=token_data.email)
    if user is None:
        print(f"User not found for email: {token_data.email}")
        raise credentials_exception
    return user

