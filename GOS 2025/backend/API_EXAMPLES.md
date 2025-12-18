# Примеры использования API

## JavaScript/TypeScript (Fetch API)

### Регистрация
```javascript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    role: 'student',
    city: 'Астана',
    first_name: 'Иван',
    last_name: 'Иванов',
    phone: '+77001234567',
    date_of_birth: '2000-01-01T00:00:00'
  })
});

const user = await response.json();
```

### Вход
```javascript
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
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
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const user = await response.json();
```

### Обновить профиль
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:8000/auth/me', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    first_name: 'Петр',
    city: 'Алматы'
  })
});

const updatedUser = await response.json();
```

### Получить инциденты
```javascript
const ne_lat = 51.2;
const ne_lon = 71.5;
const sw_lat = 51.1;
const sw_lon = 71.4;

const response = await fetch(
  `http://localhost:8000/incidents?ne_lat=${ne_lat}&ne_lon=${ne_lon}&sw_lat=${sw_lat}&sw_lon=${sw_lon}`
);

const incidents = await response.json();
```

### Создать инцидент
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:8000/incidents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'lighting',
    description: 'Отсутствует освещение',
    latitude: 51.169392,
    longitude: 71.449074
  })
});

const incident = await response.json();
```

## WebSocket (Socket.IO)

### Подключение
```javascript
import io from 'socket.io-client';

const token = localStorage.getItem('token');

const socket = io('http://localhost:8000/ws', {
  auth: {
    token: token
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
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
  console.log('SOS Alert received:', data);
  // data: { lat, lon, timestamp }
  // Показать алерт пользователю
});
```

### Обработка ошибок
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Axios (альтернатива)

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

// Использование
const incidents = await api.get('/incidents', {
  params: {
    ne_lat: 51.2,
    ne_lon: 71.5,
    sw_lat: 51.1,
    sw_lon: 71.4
  }
});

const newIncident = await api.post('/incidents', {
  type: 'lighting',
  description: 'Отсутствует освещение',
  latitude: 51.169392,
  longitude: 71.449074
});
```

## React Hook пример

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function useIncidents(bounds) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bounds) return;

    setLoading(true);
    axios.get(`${API_URL}/incidents`, {
      params: {
        ne_lat: bounds.ne.lat,
        ne_lon: bounds.ne.lng,
        sw_lat: bounds.sw.lat,
        sw_lon: bounds.sw.lng
      }
    })
    .then(response => {
      setIncidents(response.data);
    })
    .catch(error => {
      console.error('Error fetching incidents:', error);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [bounds]);

  return { incidents, loading };
}
```


