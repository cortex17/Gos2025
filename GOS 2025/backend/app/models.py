from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    student = "student"
    volunteer = "volunteer"
    admin = "admin"

class IncidentType(str, enum.Enum):
    lighting = "lighting"
    dog = "dog"
    harassment = "harassment"
    crime = "crime"
    other = "other"

class VoteType(str, enum.Enum):
    upvote = "upvote"
    downvote = "downvote"

class IncidentStatus(str, enum.Enum):
    active = "active"
    resolved = "resolved"
    fake = "fake"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.student)
    reputation = Column(Integer, default=0, nullable=False)  # Reputation score
    city = Column(String, nullable=True)  # City in Kazakhstan
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    is_blocked = Column(String, default="false", nullable=False)  # "true" or "false" as string for compatibility

    incidents = relationship("Incident", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    votes = relationship("Vote", back_populates="user")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SQLEnum(IncidentType), nullable=False)
    description = Column(String)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.active, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # TTL for incidents
    upvotes = Column(Integer, default=0, nullable=False)  # Count of upvotes
    downvotes = Column(Integer, default=0, nullable=False)  # Count of downvotes

    user = relationship("User", back_populates="incidents")
    votes = relationship("Vote", back_populates="incident", cascade="all, delete-orphan")
    
    # Keep lat/lon for backward compatibility (computed properties)
    @property
    def latitude(self):
        if self.location:
            from geoalchemy2.shape import to_shape
            point = to_shape(self.location)
            return point.y
        return None
    
    @property
    def longitude(self):
        if self.location:
            from geoalchemy2.shape import to_shape
            point = to_shape(self.location)
            return point.x
        return None

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alerts")
    
    # Keep lat/lon for backward compatibility (computed properties)
    @property
    def lat(self):
        if self.location:
            from geoalchemy2.shape import to_shape
            point = to_shape(self.location)
            return point.y
        return None
    
    @property
    def lon(self):
        if self.location:
            from geoalchemy2.shape import to_shape
            point = to_shape(self.location)
            return point.x
        return None

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    vote_type = Column(SQLEnum(VoteType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="votes")
    incident = relationship("Incident", back_populates="votes")

    __table_args__ = (
        UniqueConstraint('user_id', 'incident_id', name='unique_user_incident_vote'),
    )

