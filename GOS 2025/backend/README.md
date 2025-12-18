# SafeRoute Backend API

FastAPI бэкенд для платформы безопасности кампуса SafeRoute.

## 🚀 Быстрый старт

### Требования
- Python 3.11+ (рекомендуется 3.11 или 3.12)
- PostgreSQL 14+ с расширением PostGIS
- pip

### Установка

1. **Создайте виртуальное окружение:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. **Установите зависимости:**
```bash
pip install -r requirements.txt
```

3. **Настройте базу данных:**
   - Создайте базу данных PostgreSQL:
   ```sql
   CREATE DATABASE saferoute;
   ```
   - Убедитесь, что PostGIS установлен:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

4. **Настройте переменные окружения:**
   - Создайте файл `.env` в папке `backend/`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/saferoute
   SECRET_KEY=your-secret-key-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ADMIN_REGISTRATION_PASSWORD=hilexahlxa123
   ```

5. **Запустите сервер:**
```bash
python run.py
```

Сервер будет доступен на `http://localhost:8000`

## 📚 API Документация

После запуска сервера доступна автоматическая документация:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔌 API Endpoints

### Аутентификация

#### `POST /auth/register`
Регистрация нового пользователя.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",  // "student" | "volunteer" | "admin"
  "city": "Астана",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+77001234567",
  "date_of_birth": "2000-01-01T00:00:00",
  "admin_password": "hilexahlxa123"  // Только для role="admin"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "student",
  "city": "Астана",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+77001234567",
  "date_of_birth": "2000-01-01T00:00:00"
}
```

#### `POST /auth/login`
Вход в систему.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### `GET /auth/me`
Получить информацию о текущем пользователе.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### `PUT /auth/me`
Обновить профиль пользователя.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+77001234567",
  "date_of_birth": "2000-01-01T00:00:00",
  "city": "Алматы"
}
```

### Инциденты

#### `GET /incidents`
Получить инциденты в области карты.

**Query Parameters:**
- `ne_lat` (float, required) - Северо-восточная широта
- `ne_lon` (float, required) - Северо-восточная долгота
- `sw_lat` (float, required) - Юго-западная широта
- `sw_lon` (float, required) - Юго-западная долгота

**Example:**
```
GET /incidents?ne_lat=51.2&ne_lon=71.5&sw_lat=51.1&sw_lon=71.4
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "lighting",
    "description": "Отсутствует освещение",
    "latitude": 51.169392,
    "longitude": 71.449074,
    "upvotes": 5,
    "created_at": "2025-01-15T10:30:00"
  }
]
```

#### `POST /incidents`
Создать новый инцидент.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "type": "lighting",  // "lighting" | "dog" | "harassment"
  "description": "Отсутствует освещение",
  "latitude": 51.169392,
  "longitude": 71.449074
}
```

## 🔌 WebSocket

### Подключение

**URL:** `ws://localhost:8000/ws`

**Аутентификация:**
При подключении передайте токен в объекте `auth`:
```javascript
const socket = io('http://localhost:8000/ws', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### События

#### `trigger_sos`
Отправить SOS сигнал.

**Emit:**
```javascript
socket.emit('trigger_sos', {
  lat: 51.169392,
  lon: 71.449074,
  timestamp: new Date().toISOString()
});
```

#### `alert`
Получить SOS оповещение.

**Listen:**
```javascript
socket.on('alert', (data) => {
  console.log('SOS Alert:', data);
  // data: { lat, lon, timestamp }
});
```

## 🗄️ Структура базы данных

### Таблица `users`
- `id` (Integer, PK)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: student, volunteer, admin)
- `city` (String, nullable)
- `first_name` (String, nullable)
- `last_name` (String, nullable)
- `phone` (String, nullable)
- `date_of_birth` (DateTime, nullable)

### Таблица `incidents`
- `id` (Integer, PK)
- `user_id` (Integer, FK -> users.id)
- `type` (Enum: lighting, dog, harassment)
- `description` (String, nullable)
- `latitude` (Float)
- `longitude` (Float)
- `upvotes` (Integer, default: 0)
- `created_at` (DateTime)

### Таблица `alerts`
- `id` (Integer, PK)
- `user_id` (Integer, FK -> users.id)
- `lat` (Float)
- `lon` (Float)
- `timestamp` (DateTime)

## 🔒 Безопасность

- Пароли хешируются с помощью `bcrypt`
- JWT токены для аутентификации
- CORS настроен для `http://localhost:5173` и `http://localhost:3000`
- Двойная верификация для регистрации администраторов

## 🛠️ Разработка

### Структура проекта
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # Главный файл приложения
│   ├── config.py         # Конфигурация
│   ├── database.py       # Настройка БД
│   ├── models.py         # SQLAlchemy модели
│   ├── schemas.py        # Pydantic схемы
│   ├── auth.py           # Аутентификация
│   ├── websocket.py      # WebSocket обработка
│   └── routers/          # API роутеры
│       ├── auth.py
│       └── incidents.py
├── requirements.txt
├── run.py
└── .env                  # Переменные окружения (не в git)
```

### Тестирование

Для тестирования API используйте:
- Swagger UI: http://localhost:8000/docs
- Postman
- curl

**Пример запроса:**
```bash
# Регистрация
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "city": "Астана"
  }'

# Вход
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Получить инциденты (с токеном)
curl -X GET "http://localhost:8000/incidents?ne_lat=51.2&ne_lon=71.5&sw_lat=51.1&sw_lon=71.4" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Примечания

- Для продакшена обязательно измените `SECRET_KEY` в `.env`
- Настройте правильные CORS origins для вашего домена
- Рекомендуется использовать переменные окружения для всех настроек

## 🐛 Troubleshooting

**Ошибка подключения к БД:**
- Проверьте, что PostgreSQL запущен
- Убедитесь, что `DATABASE_URL` правильный
- Проверьте права доступа пользователя БД

**Ошибка PostGIS:**
- Убедитесь, что расширение PostGIS установлено:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

**CORS ошибки:**
- Добавьте ваш фронтенд URL в `allow_origins` в `app/main.py`


