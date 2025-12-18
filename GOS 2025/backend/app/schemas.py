from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime, timedelta
from typing import Optional
from app.models import UserRole, IncidentType, IncidentStatus, VoteType

# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72, description="Password must be between 6 and 72 characters")
    role: UserRole = UserRole.student
    city: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    admin_password: Optional[str] = None  # Required only for admin registration
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes (bcrypt limit)')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    city: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    reputation: int = 0
    city: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    is_blocked: str = "false"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Incident schemas
class IncidentCreate(BaseModel):
    type: IncidentType
    description: Optional[str] = None
    latitude: float
    longitude: float

class IncidentResponse(BaseModel):
    id: int
    user_id: int
    type: IncidentType
    description: Optional[str]
    latitude: float
    longitude: float
    status: IncidentStatus
    created_at: datetime
    expires_at: Optional[datetime] = None
    upvotes: int = 0
    downvotes: int = 0

    class Config:
        from_attributes = True

class IncidentQuery(BaseModel):
    lat: float
    lon: float
    radius: float = Field(default=1000, description="Radius in meters")

# Alert schemas
class AlertCreate(BaseModel):
    lat: float
    lon: float

class AlertResponse(BaseModel):
    id: int
    user_id: int
    lat: float
    lon: float
    timestamp: datetime

    class Config:
        from_attributes = True

class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus

# Vote schemas
class VoteCreate(BaseModel):
    vote_type: VoteType

class VoteResponse(BaseModel):
    id: int
    user_id: int
    incident_id: int
    vote_type: VoteType
    created_at: datetime

    class Config:
        from_attributes = True

# Admin schemas
class AdminStatsResponse(BaseModel):
    total_incidents: int
    active_incidents: int
    incidents_by_type: dict
    incidents_by_status: dict
    low_reputation_users: int
    recent_incidents: int

class UserBlockRequest(BaseModel):
    is_blocked: bool

