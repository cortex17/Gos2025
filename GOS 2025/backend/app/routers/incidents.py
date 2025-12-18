from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from app.database import get_db
from app.models import User, Incident, IncidentStatus, UserRole
from app.schemas import IncidentCreate, IncidentResponse, IncidentQuery
from app.auth import get_current_user
from app.utils import calculate_incident_ttl

router = APIRouter()

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    lat: float = Query(..., description="Center latitude"),
    lon: float = Query(..., description="Center longitude"),
    radius: float = Query(default=1000, description="Search radius in meters"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all active incidents within radius using PostGIS ST_DWithin.
    Uses spatial search for accurate distance calculation.
    """
    # Create point from coordinates
    point = from_shape(Point(lon, lat), srid=4326)
    
    # Use PostGIS ST_DWithin for spatial search
    # ST_DWithin uses geography for accurate distance in meters
    # Filter out expired incidents
    query = text("""
        SELECT id, user_id, type, description, location, status, created_at, expires_at
        FROM incidents 
        WHERE status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND ST_DWithin(
            location::geography, 
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
            :radius
        )
    """)
    result = await db.execute(query, {"lon": lon, "lat": lat, "radius": radius})
    
    # Fetch incidents using ORM for proper serialization
    incident_ids = [row[0] for row in result]
    if not incident_ids:
        return []
    
    incidents_result = await db.execute(
        select(Incident).where(Incident.id.in_(incident_ids))
    )
    incidents = incidents_result.scalars().all()
    return incidents

@router.post("/", response_model=IncidentResponse)
async def create_incident(
    incident: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user is blocked
    if current_user.is_blocked == "true":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is blocked. You cannot create incidents."
        )
    
    # Check reputation - block if reputation < 0
    if current_user.reputation < 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your reputation is too low ({current_user.reputation}). You cannot create incidents. Please improve your reputation by creating accurate reports."
        )
    
    # Create PostGIS Point from lat/lon
    point = from_shape(Point(incident.longitude, incident.latitude), srid=4326)
    
    # Calculate TTL based on incident type
    expires_at = calculate_incident_ttl(incident.type)
    
    new_incident = Incident(
        user_id=current_user.id,
        type=incident.type,
        description=incident.description,
        location=point,
        status=IncidentStatus.active,
        expires_at=expires_at
    )
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)
    return new_incident

