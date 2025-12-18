"""
Seed script to populate database with test data
"""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.database import AsyncSessionLocal, engine, Base
from app.models import User, Incident, Alert, UserRole, IncidentType, IncidentStatus
from app.auth import get_password_hash
from app.config import settings

# Test users data
TEST_USERS = [
    {
        "email": "student1@test.com",
        "password": "student123",
        "role": UserRole.student,
        "city": "Алматы",
        "first_name": "Айдар",
        "last_name": "Нурланов",
        "phone": "+7 (777) 123-45-67"
    },
    {
        "email": "student2@test.com",
        "password": "student123",
        "role": UserRole.student,
        "city": "Астана",
        "first_name": "Алия",
        "last_name": "Касымова",
        "phone": "+7 (777) 234-56-78"
    },
    {
        "email": "volunteer1@test.com",
        "password": "volunteer123",
        "role": UserRole.volunteer,
        "city": "Алматы",
        "first_name": "Данияр",
        "last_name": "Абдуллаев",
        "phone": "+7 (777) 345-67-89"
    },
    {
        "email": "admin@test.com",
        "password": "admin123",
        "role": UserRole.admin,
        "city": "Алматы",
        "first_name": "Админ",
        "last_name": "Админов",
        "phone": "+7 (777) 999-99-99"
    }
]

# Test incidents data (coordinates for Almaty, Kazakhstan)
TEST_INCIDENTS = [
    {
        "type": IncidentType.lighting,
        "description": "Плохое освещение на парковке возле главного корпуса",
        "latitude": 43.2220,
        "longitude": 76.8512,
        "status": IncidentStatus.active
    },
    {
        "type": IncidentType.dog,
        "description": "Бродячая собака возле столовой",
        "latitude": 43.2230,
        "longitude": 76.8520,
        "status": IncidentStatus.active
    },
    {
        "type": IncidentType.harassment,
        "description": "Подозрительное поведение в библиотеке",
        "latitude": 43.2240,
        "longitude": 76.8530,
        "status": IncidentStatus.active
    },
    {
        "type": IncidentType.lighting,
        "description": "Тусклое освещение в подвале",
        "latitude": 43.2250,
        "longitude": 76.8540,
        "status": IncidentStatus.active
    },
    {
        "type": IncidentType.dog,
        "description": "Агрессивная собака на территории кампуса",
        "latitude": 43.2260,
        "longitude": 76.8550,
        "status": IncidentStatus.resolved
    }
]

async def create_tables():
    """Create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def seed_users():
    """Create test users"""
    async with AsyncSessionLocal() as db:
        created_users = []
        
        for user_data in TEST_USERS:
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"⚠️  User {user_data['email']} already exists, skipping...")
                continue
            
            # Create new user
            hashed_password = get_password_hash(user_data["password"])
            new_user = User(
                email=user_data["email"],
                password_hash=hashed_password,
                role=user_data["role"],
                city=user_data["city"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone=user_data["phone"],
                date_of_birth=datetime(2000, 1, 1).replace(tzinfo=None)
            )
            db.add(new_user)
            created_users.append({
                "email": user_data["email"],
                "password": user_data["password"],
                "role": user_data["role"].value
            })
        
        await db.commit()
        return created_users

async def seed_incidents():
    """Create test incidents"""
    async with AsyncSessionLocal() as db:
        # Get first student user to assign incidents to
        result = await db.execute(
            select(User).where(User.role == UserRole.student).limit(1)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print("⚠️  No student user found, skipping incidents creation")
            return []
        
        created_incidents = []
        
        for incident_data in TEST_INCIDENTS:
            # Create PostGIS Point
            point = from_shape(
                Point(incident_data["longitude"], incident_data["latitude"]),
                srid=4326
            )
            
            new_incident = Incident(
                user_id=user.id,
                type=incident_data["type"],
                description=incident_data["description"],
                location=point,
                status=incident_data["status"]
            )
            db.add(new_incident)
            created_incidents.append({
                "type": incident_data["type"].value,
                "description": incident_data["description"],
                "latitude": incident_data["latitude"],
                "longitude": incident_data["longitude"]
            })
        
        await db.commit()
        return created_incidents

async def main():
    """Main seed function"""
    print("🌱 Starting database seeding...")
    print("=" * 60)
    
    # Create tables if they don't exist
    await create_tables()
    print("✅ Tables created/verified")
    
    # Seed users
    print("\n👥 Creating test users...")
    users = await seed_users()
    print(f"✅ Created {len(users)} users")
    
    # Seed incidents (skip if table structure is different)
    print("\n📍 Creating test incidents...")
    try:
        incidents = await seed_incidents()
        print(f"✅ Created {len(incidents)} incidents")
    except Exception as e:
        print(f"⚠️  Could not create incidents: {e}")
        print("   (This is OK if the table structure is different)")
        incidents = []
    
    print("\n" + "=" * 60)
    print("✅ Database seeding completed!")
    print("\n📋 Created Users:")
    print("-" * 60)
    for user in users:
        print(f"Email: {user['email']}")
        print(f"Password: {user['password']}")
        print(f"Role: {user['role']}")
        print("-" * 60)
    
    print(f"\n📍 Created {len(incidents)} incidents in Almaty area")
    print("\n💡 You can now login with any of these accounts!")

if __name__ == "__main__":
    asyncio.run(main())

