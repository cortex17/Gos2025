from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from app.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_user_by_email,
    oauth2_scheme
)
from app.config import settings

def create_token_fixed(data: dict, expires_delta: timedelta = None):
    """Fixed token creation with proper timezone handling"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    exp_timestamp = int(expire.timestamp())
    to_encode.update({"exp": exp_timestamp})
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Debug logging
    import sys
    current_ts = int(datetime.now(timezone.utc).timestamp())
    print(f"[TOKEN DEBUG] Now: {current_ts}, Exp: {exp_timestamp}, Valid: {exp_timestamp > current_ts}", file=sys.stderr)
    
    return token

router = APIRouter()

def to_naive_datetime(dt: datetime | None) -> datetime | None:
    """Convert timezone-aware datetime to naive datetime for PostgreSQL TIMESTAMP WITHOUT TIME ZONE."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC first, then remove timezone info
        from datetime import timezone
        utc_dt = dt.astimezone(timezone.utc)
        return utc_dt.replace(tzinfo=None)
    return dt

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Double verification for admin registration
    if user_data.role == UserRole.admin:
        if not user_data.admin_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin registration requires admin password"
            )
        if user_data.admin_password != settings.ADMIN_REGISTRATION_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin registration password"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        reputation=0,  # Default reputation
        city=user_data.city,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        date_of_birth=to_naive_datetime(user_data.date_of_birth),
        is_blocked="false"  # Default not blocked
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Use fixed token creation function
    access_token = create_token_fixed(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/test-token")
async def test_token(token: str = Depends(oauth2_scheme)):
    """Test endpoint to debug token extraction"""
    from jose import jwt
    from app.config import settings
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return {"decoded": payload, "token_preview": token[:50] + "..."}
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__, "token_preview": token[:50] + "..."}

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Update user fields
    if user_data.first_name is not None:
        current_user.first_name = user_data.first_name
    if user_data.last_name is not None:
        current_user.last_name = user_data.last_name
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    if user_data.date_of_birth is not None:
        current_user.date_of_birth = to_naive_datetime(user_data.date_of_birth)
    if user_data.city is not None:
        current_user.city = user_data.city
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

