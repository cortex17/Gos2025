"""
Migration script to add missing features:
- reputation field to users
- expires_at, upvotes, downvotes to incidents
- votes table
- is_blocked to users
- GIST indexes
"""
import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    """Run migration to add missing features"""
    async with engine.begin() as conn:
        print("Starting migration...")
        
        # Add reputation to users if not exists
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0 NOT NULL;
            """))
            print("✅ Added reputation column to users")
        except Exception as e:
            print(f"Note: reputation column may already exist: {e}")
        
        # Add is_blocked to users if not exists
        try:
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS is_blocked VARCHAR DEFAULT 'false' NOT NULL;
            """))
            print("✅ Added is_blocked column to users")
        except Exception as e:
            print(f"Note: is_blocked column may already exist: {e}")
        
        # Add expires_at to incidents if not exists
        try:
            await conn.execute(text("""
                ALTER TABLE incidents 
                ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
            """))
            print("✅ Added expires_at column to incidents")
        except Exception as e:
            print(f"Note: expires_at column may already exist: {e}")
        
        # Add upvotes and downvotes to incidents if not exists
        try:
            await conn.execute(text("""
                ALTER TABLE incidents 
                ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0 NOT NULL;
            """))
            print("✅ Added upvotes column to incidents")
        except Exception as e:
            print(f"Note: upvotes column may already exist: {e}")
        
        try:
            await conn.execute(text("""
                ALTER TABLE incidents 
                ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0 NOT NULL;
            """))
            print("✅ Added downvotes column to incidents")
        except Exception as e:
            print(f"Note: downvotes column may already exist: {e}")
        
        # Create votes table if not exists
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS votes (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                    vote_type VARCHAR NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, incident_id)
                );
            """))
            print("✅ Created votes table")
        except Exception as e:
            print(f"Note: votes table may already exist: {e}")
        
        # Create indexes
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_votes_incident_id ON votes(incident_id);
            """))
            print("✅ Created indexes on votes table")
        except Exception as e:
            print(f"Note: indexes may already exist: {e}")
        
        # Create GIST indexes for spatial queries
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_incidents_location 
                ON incidents USING GIST (location);
            """))
            print("✅ Created GIST index on incidents.location")
        except Exception as e:
            print(f"Note: GIST index may already exist: {e}")
        
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_alerts_location 
                ON alerts USING GIST (location);
            """))
            print("✅ Created GIST index on alerts.location")
        except Exception as e:
            print(f"Note: GIST index may already exist: {e}")
        
        # Update existing users to have default reputation
        try:
            await conn.execute(text("""
                UPDATE users SET reputation = 0 WHERE reputation IS NULL;
            """))
            print("✅ Updated existing users with default reputation")
        except Exception as e:
            print(f"Note: Could not update reputation: {e}")
        
        # Update existing incidents to have default vote counts
        try:
            await conn.execute(text("""
                UPDATE incidents SET upvotes = 0 WHERE upvotes IS NULL;
            """))
            await conn.execute(text("""
                UPDATE incidents SET downvotes = 0 WHERE downvotes IS NULL;
            """))
            print("✅ Updated existing incidents with default vote counts")
        except Exception as e:
            print(f"Note: Could not update vote counts: {e}")
        
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())

