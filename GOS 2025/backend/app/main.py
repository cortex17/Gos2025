from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import asynccontextmanager
import asyncio
from app.database import engine, Base, AsyncSessionLocal
from app.routers import auth, incidents, votes, admin
from app.websocket import sio_app
from app.models import Incident, IncidentStatus
from sqlalchemy import select, and_

async def cleanup_expired_incidents():
    """Background task to mark expired incidents as resolved"""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                from datetime import datetime, timezone
                # Find expired incidents that are still active
                result = await db.execute(
                    select(Incident).where(
                        and_(
                            Incident.status == IncidentStatus.active,
                            Incident.expires_at.isnot(None),
                            Incident.expires_at < datetime.now(timezone.utc)
                        )
                    )
                )
                expired_incidents = result.scalars().all()
                
                for incident in expired_incidents:
                    incident.status = IncidentStatus.resolved
                
                if expired_incidents:
                    await db.commit()
                    print(f"Marked {len(expired_incidents)} expired incidents as resolved")
        except Exception as e:
            print(f"Error in cleanup task: {e}")
        
        # Run every hour
        await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Enable PostGIS extension
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        except Exception as e:
            print(f"Note: PostGIS extension may require superuser or already exists: {e}")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create GIST indexes for spatial queries
    async with engine.begin() as conn:
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_incidents_location 
                ON incidents USING GIST (location);
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_alerts_location 
                ON alerts USING GIST (location);
            """))
        except Exception as e:
            print(f"Note: GIST indexes may already exist: {e}")
    
    # Start background task
    cleanup_task = asyncio.create_task(cleanup_expired_incidents())
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="SafeRoute API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174",  # Vite может использовать другой порт
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(votes.router, tags=["votes"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

# Mount WebSocket app
app.mount("/ws", sio_app)

@app.get("/")
async def root():
    return {"message": "SafeRoute API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

