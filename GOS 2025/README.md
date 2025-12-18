# SafeRoute - Campus Safety Platform

MVP платформы безопасности кампуса с картой опасностей и системой SOS-оповещений в реальном времени.

## Технологии

- **Backend:** FastAPI (Python) + SQLAlchemy (Async) + PostgreSQL (PostGIS)
- **Frontend:** React (Vite) + Tailwind CSS + React Leaflet
- **Real-time:** WebSockets (python-socketio + socket.io-client)
- **Auth:** JWT (OAuth2 Password Bearer) + bcrypt

## Быстрый старт

### Предварительные требования

- **Python 3.11 или 3.12** (рекомендуется) или Python 3.13
- **PostgreSQL 14+** с расширением **PostGIS**
- **Node.js 18+** и npm

### Запуск Backend

```bash
cd backend
source venv/bin/activate  # или venv\Scripts\activate на Windows
python run.py
```

Backend будет доступен на `http://localhost:8000`

### Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

## Особенности

- ✅ Регистрация с выбором роли (Студент, Волонтер, Администратор)
- ✅ Двойная верификация для администраторов (пароль: `hilexahlxa123`)
- ✅ Выбор города в Казахстане при регистрации
- ✅ Карта автоматически центрируется на выбранном городе
- ✅ Профиль пользователя с возможностью редактирования
- ✅ Система SOS с real-time оповещениями
- ✅ Сообщения об опасностях с маркерами на карте

## API Endpoints

- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/me` - Текущий пользователь
- `PUT /auth/me` - Обновление профиля
- `GET /incidents` - Получить инциденты в области карты
- `POST /incidents` - Создать новый инцидент
- `WS /ws` - WebSocket для SOS сигналов

## Структура проекта

```
GOS 2025/
├── backend/
│   ├── app/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── websocket.py
│   │   ├── routers/
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── data/
│   └── package.json
└── docker-compose.yml
```

