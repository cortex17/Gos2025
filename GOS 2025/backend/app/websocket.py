import socketio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from app.database import AsyncSessionLocal
from app.models import Alert, User
from jose import JWTError, jwt
from app.config import settings

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=["http://localhost:5173", "http://localhost:3000"],
    async_mode='asgi'
)
sio_app = socketio.ASGIApp(sio)

# Store user locations: {sid: {'user_id': int, 'lat': float, 'lon': float}}
user_locations = {}

async def get_user_from_token(token: str) -> User:
    """Extract user from JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email == email)
            )
            return result.scalar_one_or_none()
    except JWTError:
        return None

@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    if auth and 'token' in auth:
        user = await get_user_from_token(auth['token'])
        if user:
            await sio.save_session(sid, {'user_id': user.id, 'email': user.email})
            user_locations[sid] = {'user_id': user.id, 'lat': None, 'lon': None}
            print(f"User {user.email} connected with sid {sid}")
            return True
    print(f"Connection rejected for sid {sid}")
    return False

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    try:
        session = await sio.get_session(sid)
        print(f"User {session.get('email', 'unknown')} disconnected")
    except:
        print(f"Client {sid} disconnected")
    finally:
        # Remove user location from tracking
        if sid in user_locations:
            del user_locations[sid]

@sio.event
async def update_location(sid, data):
    """Update user's current location"""
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if not user_id:
        return
    
    lat = data.get('lat')
    lon = data.get('lon')
    
    if lat is not None and lon is not None and sid in user_locations:
        user_locations[sid]['lat'] = lat
        user_locations[sid]['lon'] = lon

@sio.event
async def trigger_sos(sid, data):
    """Handle SOS trigger from client - broadcast to users within 500m radius using PostGIS"""
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    
    if not user_id:
        await sio.emit('error', {'message': 'Not authenticated'}, room=sid)
        return
    
    lat = data.get('lat')
    lon = data.get('lon')
    
    if not lat or not lon:
        await sio.emit('error', {'message': 'Missing coordinates'}, room=sid)
        return
    
    # Save alert to database with PostGIS location
    async with AsyncSessionLocal() as db:
        point = from_shape(Point(lon, lat), srid=4326)
        alert = Alert(
            user_id=user_id,
            location=point
        )
        db.add(alert)
        await db.commit()
    
    # Find users within 500m radius using PostGIS
    sos_point = from_shape(Point(lon, lat), srid=4326)
    radius_meters = 500  # 500 meters radius
    
    # Get all connected sessions and check their locations
    sids_in_radius = []
    
    for connected_sid, location_data in user_locations.items():
        if connected_sid == sid:  # Skip sender
            continue
        
        user_lat = location_data.get('lat')
        user_lon = location_data.get('lon')
        
        if user_lat is None or user_lon is None:
            continue  # Skip users without location
        
        # Calculate distance using PostGIS
        async with AsyncSessionLocal() as db:
            query = text("""
                SELECT ST_Distance(
                    ST_SetSRID(ST_MakePoint(:user_lon, :user_lat), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(:sos_lon, :sos_lat), 4326)::geography
                ) as distance
            """)
            result = await db.execute(query, {
                'user_lon': user_lon,
                'user_lat': user_lat,
                'sos_lon': lon,
                'sos_lat': lat
            })
            distance = result.scalar()
            
            if distance is not None and distance <= radius_meters:
                sids_in_radius.append(connected_sid)
    
    # Broadcast alert only to users within radius
    alert_data = {
        'lat': lat,
        'lon': lon,
        'timestamp': data.get('timestamp'),
        'user_id': user_id
    }
    
    if sids_in_radius:
        for target_sid in sids_in_radius:
            await sio.emit('alert', alert_data, room=target_sid)
        print(f"SOS triggered by user {user_id} at ({lat}, {lon}) - sent to {len(sids_in_radius)} users within 500m")
    else:
        print(f"SOS triggered by user {user_id} at ({lat}, {lon}) - no users within 500m radius")

