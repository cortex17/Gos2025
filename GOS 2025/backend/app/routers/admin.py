"""
Admin endpoints for moderation
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.database import get_db
from app.models import User, Incident, IncidentStatus, UserRole
from app.schemas import IncidentStatusUpdate, AdminStatsResponse, UserBlockRequest, UserResponse
from app.auth import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin role"""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.put("/incidents/{incident_id}/validate")
async def validate_incident(
    incident_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Validate an incident (mark as verified by admin)"""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    # Validate incident - keep status as active but mark as validated
    # We can add a validated field later if needed, for now just update status
    if incident.status == IncidentStatus.fake:
        incident.status = IncidentStatus.active
    
    await db.commit()
    await db.refresh(incident)
    return {"message": "Incident validated", "incident_id": incident_id}

@router.put("/incidents/{incident_id}/status")
async def update_incident_status(
    incident_id: int,
    status_update: IncidentStatusUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update incident status (active/resolved/fake)"""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    incident.status = status_update.status
    await db.commit()
    await db.refresh(incident)
    return {"message": "Incident status updated", "incident_id": incident_id, "status": incident.status}

@router.put("/users/{user_id}/block")
async def block_user(
    user_id: int,
    block_request: UserBlockRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Block or unblock a user"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot block yourself"
        )
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_blocked = "true" if block_request.is_blocked else "false"
    await db.commit()
    await db.refresh(user)
    
    action = "blocked" if block_request.is_blocked else "unblocked"
    return {"message": f"User {action}", "user_id": user_id, "is_blocked": user.is_blocked}

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for admin dashboard"""
    # Total incidents
    total_result = await db.execute(select(func.count(Incident.id)))
    total_incidents = total_result.scalar() or 0
    
    # Active incidents (not expired, status active)
    active_result = await db.execute(
        select(func.count(Incident.id)).where(
            Incident.status == IncidentStatus.active,
            (Incident.expires_at.is_(None)) | (Incident.expires_at > func.now())
        )
    )
    active_incidents = active_result.scalar() or 0
    
    # Incidents by type
    type_result = await db.execute(
        select(Incident.type, func.count(Incident.id))
        .group_by(Incident.type)
    )
    incidents_by_type = {row[0].value: row[1] for row in type_result}
    
    # Incidents by status
    status_result = await db.execute(
        select(Incident.status, func.count(Incident.id))
        .group_by(Incident.status)
    )
    incidents_by_status = {row[0].value: row[1] for row in status_result}
    
    # Users with low reputation (< 0)
    low_rep_result = await db.execute(
        select(func.count(User.id)).where(User.reputation < 0)
    )
    low_reputation_users = low_rep_result.scalar() or 0
    
    # Recent incidents (last 24 hours)
    recent_result = await db.execute(
        select(func.count(Incident.id)).where(
            Incident.created_at >= func.now() - text("INTERVAL '24 hours'")
        )
    )
    recent_incidents = recent_result.scalar() or 0
    
    return AdminStatsResponse(
        total_incidents=total_incidents,
        active_incidents=active_incidents,
        incidents_by_type=incidents_by_type,
        incidents_by_status=incidents_by_status,
        low_reputation_users=low_reputation_users,
        recent_incidents=recent_incidents
    )

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

