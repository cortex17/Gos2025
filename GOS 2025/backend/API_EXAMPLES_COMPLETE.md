# Полные примеры использования API SafeRoute

## 🔐 Аутентификация

### Регистрация
```javascript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    role: 'student',
    city: 'Астана',
    first_name: 'Иван',
    last_name: 'Иванов',
    phone: '+77001234567'
  })
});
const user = await response.json();
```

### Вход
```javascript
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { access_token } = await response.json();
localStorage.setItem('token', access_token);
```

### Получить текущего пользователя
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:8000/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const user = await response.json();
// user содержит: id, email, role, reputation, city, first_name, last_name, etc.
```

### Обновить профиль
```javascript
const response = await fetch('http://localhost:8000/auth/me', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Иван',
    last_name: 'Иванов',
    city: 'Алматы',
    phone: '+77001234567'
  })
});
```

## 📍 Инциденты

### Получить инциденты в радиусе
```javascript
const response = await fetch(
  `http://localhost:8000/incidents?lat=51.1694&lon=71.4491&radius=2000`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const incidents = await response.json();
// incidents - массив объектов с полями:
// id, user_id, type, description, latitude, longitude, status, 
// created_at, expires_at, upvotes, downvotes
```

### Создать инцидент
```javascript
const response = await fetch('http://localhost:8000/incidents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'lighting',  // 'lighting' | 'dog' | 'harassment' | 'crime' | 'other'
    description: 'Отсутствует освещение',
    latitude: 51.169392,
    longitude: 71.449074
  })
});
const incident = await response.json();
```

## 👍 Голосование

### Проголосовать за инцидент
```javascript
// Upvote
const response = await fetch(`http://localhost:8000/incidents/${incidentId}/vote`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    vote_type: 'upvote'  // или 'downvote'
  })
});
const vote = await response.json();

// Повторный вызов с тем же vote_type удаляет голос
// Изменение vote_type обновляет голос
```

## 👨‍💼 Админ функции (требует роль admin)

### Валидация инцидента
```javascript
const response = await fetch(`http://localhost:8000/admin/incidents/${incidentId}/validate`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

### Изменить статус инцидента
```javascript
const response = await fetch(`http://localhost:8000/admin/incidents/${incidentId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'resolved'  // 'active' | 'resolved' | 'fake'
  })
});
```

### Блокировка пользователя
```javascript
const response = await fetch(`http://localhost:8000/admin/users/${userId}/block`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    is_blocked: true  // или false для разблокировки
  })
});
```

### Получить статистику
```javascript
const response = await fetch('http://localhost:8000/admin/stats', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const stats = await response.json();
// stats содержит:
// {
//   total_incidents: 100,
//   active_incidents: 50,
//   incidents_by_type: { lighting: 30, dog: 20, ... },
//   incidents_by_status: { active: 50, resolved: 40, ... },
//   low_reputation_users: 5,
//   recent_incidents: 10
// }
```

### Список пользователей
```javascript
const response = await fetch('http://localhost:8000/admin/users', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const users = await response.json();
```

## 🔌 WebSocket

### Подключение
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000/ws', {
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### Обновить местоположение
```javascript
socket.emit('update_location', {
  lat: 51.169392,
  lon: 71.449074
});
```

### Отправить SOS
```javascript
socket.emit('trigger_sos', {
  lat: 51.169392,
  lon: 71.449074,
  timestamp: new Date().toISOString()
});
```

### Получить SOS оповещение
```javascript
socket.on('alert', (data) => {
  console.log('SOS Alert:', data);
  // data: { lat, lon, timestamp, user_id }
  // Показать алерт пользователю
});
```

## 📦 Axios примеры

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Добавить токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Получить инциденты
const incidents = await api.get('/incidents', {
  params: {
    lat: 51.1694,
    lon: 71.4491,
    radius: 2000
  }
});

// Создать инцидент
const newIncident = await api.post('/incidents', {
  type: 'lighting',
  description: 'Отсутствует освещение',
  latitude: 51.169392,
  longitude: 71.449074
});

// Голосовать
await api.post(`/incidents/${incidentId}/vote`, {
  vote_type: 'upvote'
});
```

## ⚠️ Важные замечания

1. **Репутация:** При создании инцидента проверяется `reputation >= 0`. Если репутация отрицательная, запрос будет отклонен.

2. **TTL инцидентов:** Автоматически рассчитывается при создании:
   - `dog`: 2 часа
   - `lighting`: 7 дней
   - `harassment`: 24 часа
   - `crime`: 30 дней
   - `other`: 24 часа

3. **Блокировка:** Пользователи с `is_blocked: "true"` не могут создавать инциденты.

4. **Типы инцидентов:** `lighting`, `dog`, `harassment`, `crime`, `other`

5. **Статусы:** `active`, `resolved`, `fake`

