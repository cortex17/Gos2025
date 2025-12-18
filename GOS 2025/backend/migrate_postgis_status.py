"""
Migration script to add PostGIS location and status to incidents and alerts tables.
Run this script after ensuring PostGIS extension is enabled.
"""
import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Starting migration...")
        
        # 1. Add status column to incidents if not exists
        try:
            await conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='incidents' AND column_name='status') THEN
                        ALTER TABLE incidents ADD COLUMN status VARCHAR DEFAULT 'active';
                    END IF;
                END $$;
            """))
            print("✅ Added status column to incidents")
        except Exception as e:
            print(f"⚠️  Status column may already exist: {e}")
        
        # 2. Create incidentstatus enum if not exists
        try:
            await conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incidentstatus') THEN
                        CREATE TYPE incidentstatus AS ENUM ('active', 'resolved', 'fake');
                    END IF;
                END $$;
            """))
            print("✅ Created IncidentStatus enum")
        except Exception as e:
            print(f"⚠️  Enum may already exist: {e}")
        
        # 3. Convert status column to enum type
        try:
            await conn.execute(text("""
                ALTER TABLE incidents 
                ALTER COLUMN status TYPE incidentstatus 
                USING status::incidentstatus;
            """))
            print("✅ Converted status to enum type")
        except Exception as e:
            print(f"⚠️  Status conversion: {e}")
        
        # 4. Add location column to incidents (PostGIS Point)
        try:
            await conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='incidents' AND column_name='location') THEN
                        ALTER TABLE incidents ADD COLUMN location GEOMETRY(Point, 4326);
                    END IF;
                END $$;
            """))
            print("✅ Added location column to incidents")
        except Exception as e:
            print(f"⚠️  Location column may already exist: {e}")
        
        # 5. Migrate existing lat/lon data to location (if any)
        try:
            await conn.execute(text("""
                UPDATE incidents 
                SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
                WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
            """))
            print("✅ Migrated existing lat/lon to location")
        except Exception as e:
            print(f"⚠️  Data migration: {e}")
        
        # 6. Add location column to alerts (PostGIS Point)
        try:
            await conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='alerts' AND column_name='location') THEN
                        ALTER TABLE alerts ADD COLUMN location GEOMETRY(Point, 4326);
                    END IF;
                END $$;
            """))
            print("✅ Added location column to alerts")
        except Exception as e:
            print(f"⚠️  Location column may already exist: {e}")
        
        # 7. Migrate existing lat/lon data to location in alerts (if any)
        try:
            await conn.execute(text("""
                UPDATE alerts 
                SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                WHERE location IS NULL AND lat IS NOT NULL AND lon IS NOT NULL;
            """))
            print("✅ Migrated existing lat/lon to location in alerts")
        except Exception as e:
            print(f"⚠️  Data migration: {e}")
        
        # 8. Create spatial indexes for better performance
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_incidents_location 
                ON incidents USING GIST (location);
            """))
            print("✅ Created spatial index on incidents.location")
        except Exception as e:
            print(f"⚠️  Index creation: {e}")
        
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_alerts_location 
                ON alerts USING GIST (location);
            """))
            print("✅ Created spatial index on alerts.location")
        except Exception as e:
            print(f"⚠️  Index creation: {e}")
        
        print("\n✅ Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate())


