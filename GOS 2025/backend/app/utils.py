"""
Utility functions for SafeRoute
"""
from datetime import datetime, timedelta, timezone
from app.models import IncidentType

def calculate_incident_ttl(incident_type: IncidentType) -> datetime:
    """
    Calculate expiration time for incident based on type.
    TTL rules:
    - dog: 2 hours
    - lighting: 7 days
    - harassment: 24 hours
    - crime: 30 days
    - other: 24 hours
    """
    now = datetime.now(timezone.utc)
    
    ttl_map = {
        IncidentType.dog: timedelta(hours=2),
        IncidentType.lighting: timedelta(days=7),
        IncidentType.harassment: timedelta(hours=24),
        IncidentType.crime: timedelta(days=30),
        IncidentType.other: timedelta(hours=24),
    }
    
    ttl = ttl_map.get(incident_type, timedelta(hours=24))
    return now + ttl

