# API Documentation

## Настройка

1. Создайте файл `.env` в корне проекта:
```env
VITE_API_BASE_URL=http://localhost:8000
```

2. Переключите `USE_FAKE_API = false` в `src/api/reports.ts`

3. Перезапустите dev сервер

## Ожидаемые Endpoints

### Аутентификация

#### POST /auth/login
**Request:**
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
  "role": "user" | "admin"
}
```

#### POST /auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Имя пользователя" // опционально
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "user"
}
```

### Отчеты (Reports)

#### GET /reports?status=approved
**Headers:** `Authorization: Bearer <token>` (опционально для публичных отчетов)

**Response:**
```json
[
  {
    "id": "string",
    "type": "no_light" | "dogs" | "ice" | "other",
    "severity": 1-5,
    "lat": 42.9,
    "lng": 71.36,
    "description": "string",
    "status": "approved" | "pending" | "rejected",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /reports/:id
**Headers:** `Authorization: Bearer <token>` (опционально)

**Response:**
```json
{
  "id": "string",
  "type": "no_light",
  "severity": 3,
  "lat": 42.9,
  "lng": 71.36,
  "description": "string",
  "status": "approved",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### POST /reports
**Headers:** `Authorization: Bearer <token>` (обязательно)

**Request:**
```json
{
  "type": "no_light",
  "severity": 3,
  "lat": 42.9,
  "lng": 71.36,
  "description": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "type": "no_light",
  "severity": 3,
  "lat": 42.9,
  "lng": 71.36,
  "description": "string",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### POST /reports/:id/vote
**Headers:** `Authorization: Bearer <token>` (обязательно)

**Request:**
```json
{
  "vote": "confirm" | "fake"
}
```

**Response:**
```json
{
  "success": true,
  "votes": {
    "confirm": 5,
    "fake": 1
  }
}
```

#### GET /reports/:id/votes
**Headers:** `Authorization: Bearer <token>` (опционально)

**Response:**
```json
{
  "confirm": 5,
  "fake": 1,
  "userVote": "confirm" | "fake" | null
}
```

### Админка

#### GET /admin/reports?status=pending
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:** Массив отчетов

#### POST /admin/reports/:id/approve
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:** Обновленный отчет

#### POST /admin/reports/:id/reject
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:** Обновленный отчет

#### GET /admin/users
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:**
```json
[
  {
    "id": "string",
    "email": "user@example.com",
    "role": "user" | "admin",
    "reputation": 75,
    "isBlocked": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /admin/users/:id/block
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:** Обновленный пользователь

#### POST /admin/users/:id/unblock
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:** Обновленный пользователь

#### GET /admin/analytics
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:**
```json
{
  "totalReports": 100,
  "pendingReports": 5,
  "approvedReports": 90,
  "rejectedReports": 5,
  "highRiskZones": [
    {
      "lat": 42.9,
      "lng": 71.36,
      "count": 10,
      "avgSeverity": 4.5
    }
  ]
}
```

### Репутация

#### GET /me/reputation
**Headers:** `Authorization: Bearer <token>` (обязательно)

**Response:**
```json
{
  "userId": "string",
  "score": 75,
  "canCreateReports": true,
  "totalReports": 10,
  "confirmedReports": 8,
  "fakeReports": 2
}
```

#### GET /users/:id/reputation
**Headers:** `Authorization: Bearer <token>` (обязательно, роль: admin)

**Response:** То же, что и `/me/reputation`

### SOS / Panic

#### POST /panic
**Headers:** `Authorization: Bearer <token>` (обязательно)

**Request:**
```json
{
  "lat": 42.9,
  "lng": 71.36
}
```

**Response:**
```json
{
  "id": "string",
  "lat": 42.9,
  "lng": 71.36,
  "active": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-01T01:00:00Z"
}
```

#### POST /panic/guest (опционально, для гостевого SOS)
**Request:**
```json
{
  "lat": 42.9,
  "lng": 71.36,
  "phone": "+77001234567" // опционально
}
```

**Response:** То же, что и `/panic`

#### GET /panic/near?lat=42.9&lng=71.36&radius=500
**Headers:** `Authorization: Bearer <token>` (опционально)

**Response:**
```json
[
  {
    "id": "string",
    "lat": 42.9,
    "lng": 71.36,
    "active": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-01-01T01:00:00Z"
  }
]
```

### WebSocket

#### WS /ws?token=<access_token>
**События:**

1. **sos_alert**
```json
{
  "type": "sos_alert",
  "data": {
    "id": "string",
    "lat": 42.9,
    "lng": 71.36,
    "distance": 500
  }
}
```

2. **new_report**
```json
{
  "type": "new_report",
  "data": {
    "id": "string",
    "type": "no_light",
    "lat": 42.9,
    "lng": 71.36
  }
}
```

3. **report_updated**
```json
{
  "type": "report_updated",
  "data": {
    "id": "string",
    "status": "approved"
  }
}
```

4. **panic_nearby**
```json
{
  "type": "panic_nearby",
  "data": {
    "id": "string",
    "lat": 42.9,
    "lng": 71.36,
    "distance": 300
  }
}
```

## Коды ошибок

- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен (низкая репутация, не админ и т.д.)
- `404` - Не найдено
- `409` - Конфликт (например, email уже существует)
- `422` - Ошибка валидации
- `500` - Ошибка сервера

## Формат ошибок

```json
{
  "detail": "Error message" | [
    {
      "msg": "Error message",
      "field": "email"
    }
  ],
  "message": "Error message", // альтернативный формат
  "error": "Error message" // альтернативный формат
}
```

