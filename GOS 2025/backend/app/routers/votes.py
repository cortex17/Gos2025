"""
Voting endpoints for incidents
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, Incident, Vote, VoteType
from app.schemas import VoteCreate, VoteResponse
from app.auth import get_current_user

router = APIRouter()

@router.post("/incidents/{incident_id}/vote", response_model=VoteResponse)
async def vote_incident(
    incident_id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Vote on an incident (upvote or downvote).
    Updates user reputation and incident vote counts.
    """
    # Get incident
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    # Check if user already voted
    existing_vote_result = await db.execute(
        select(Vote).where(
            Vote.user_id == current_user.id,
            Vote.incident_id == incident_id
        )
    )
    existing_vote = existing_vote_result.scalar_one_or_none()
    
    if existing_vote:
        # Update existing vote
        if existing_vote.vote_type == vote_data.vote_type:
            # Same vote type - remove vote
            # Revert reputation change
            incident_owner = await db.get(User, incident.user_id)
            if incident_owner:
                if existing_vote.vote_type == VoteType.upvote:
                    incident.upvotes -= 1
                    incident_owner.reputation -= 1
                else:  # downvote
                    incident.downvotes -= 1
                    incident_owner.reputation += 1
            
            await db.delete(existing_vote)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_200_OK,
                detail="Vote removed"
            )
        else:
            # Change vote type
            # Revert old vote
            incident_owner = await db.get(User, incident.user_id)
            if incident_owner:
                if existing_vote.vote_type == VoteType.upvote:
                    incident.upvotes -= 1
                    incident_owner.reputation -= 1
                else:  # downvote
                    incident.downvotes -= 1
                    incident_owner.reputation += 1
            
            # Apply new vote
            existing_vote.vote_type = vote_data.vote_type
            if vote_data.vote_type == VoteType.upvote:
                incident.upvotes += 1
                if incident_owner:
                    incident_owner.reputation += 1
            else:  # downvote
                incident.downvotes += 1
                if incident_owner:
                    incident_owner.reputation -= 1
            
            await db.commit()
            await db.refresh(existing_vote)
            return existing_vote
    else:
        # Create new vote
        new_vote = Vote(
            user_id=current_user.id,
            incident_id=incident_id,
            vote_type=vote_data.vote_type
        )
        db.add(new_vote)
        
        # Update incident vote counts and owner reputation
        incident_owner = await db.get(User, incident.user_id)
        if vote_data.vote_type == VoteType.upvote:
            incident.upvotes += 1
            if incident_owner:
                incident_owner.reputation += 1
        else:  # downvote
            incident.downvotes += 1
            if incident_owner:
                incident_owner.reputation -= 1
        
        await db.commit()
        await db.refresh(new_vote)
        return new_vote

