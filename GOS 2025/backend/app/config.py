from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # DATABASE_URL может быть без пароля (если PostgreSQL настроен без пароля)
    # или с паролем: postgresql+asyncpg://postgres:password@localhost:5432/saferoute
    DATABASE_URL: str = "postgresql+asyncpg://postgres@localhost:5432/saferoute"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_REGISTRATION_PASSWORD: str = "hilexahlxa123"  # Password required for admin registration

    class Config:
        env_file = ".env"
        # Позволяем переопределить DATABASE_URL через переменные окружения
        case_sensitive = False

settings = Settings()

