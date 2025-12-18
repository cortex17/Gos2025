# Отсутствующие функции в бэкенде SafeRoute

## Критические (по ТЗ)

### 1. **UUID вместо Integer ID**
- ❌ Сейчас: `Integer` для всех ID
- ✅ Требуется: `UUID` для `users.id`, `incidents.id`, `alerts.id`
- **Файлы:** `backend/app/models.py`

### 2. **PostGIS GEOMETRY вместо lat/lon**
- ❌ Сейчас: `latitude` и `longitude` как `Float`
- ✅ Требуется: `GEOMETRY(Point, 4326)` для `incidents.location` и `alerts.location`
- **Файлы:** `backend/app/models.py`, `backend/app/routers/incidents.py`, `backend/app/websocket.py`
- **Библиотека:** `geoalchemy2` (уже в requirements.txt)

### 3. **Система репутации (reputation)**
- ❌ Отсутствует поле `reputation` в таблице `users`
- ✅ Требуется: `reputation: Integer` с дефолтом 0
- **Логика:** 
  - Растет при подтверждении отчетов (upvote)
  - Падает при опровержении (downvote)
  - Блокировка создания инцидентов при `reputation < 0`

### 4. **Статус и TTL для инцидентов**
- ❌ Отсутствуют поля `status` и `expires_at`
- ✅ Требуется:
  - `status: Enum(active, resolved, fake)`
  - `expires_at: Timestamp` (автоматический расчет на основе типа)
- **TTL по типам:**
  - Собака: 2 часа
  - Освещение: 7 дней
  - Преступление: 30 дней
  - Другое: 24 часа

### 5. **Система голосования**
- ❌ Отсутствует endpoint `POST /incidents/{id}/vote`
- ✅ Требуется:
  - Таблица `votes` (user_id, incident_id, vote_type: upvote/downvote)
  - Обновление `reputation` пользователя при голосовании
  - Обновление `upvotes` инцидента

### 6. **Пространственный поиск с радиусом**
- ❌ Сейчас: поиск по viewport (ne_lat, ne_lon, sw_lat, sw_lon)
- ✅ Требуется: `GET /incidents?lat=...&lon=...&radius=...` с использованием PostGIS `ST_DWithin`
- **Пример:**
  ```sql
  SELECT * FROM incidents 
  WHERE ST_DWithin(
    location::geography, 
    ST_MakePoint(lon, lat)::geography, 
    radius
  )
  ```

### 7. **SOS с радиусом 500м**
- ❌ Сейчас: рассылка всем подключенным пользователям
- ✅ Требуется: фильтрация пользователей в радиусе 500м от точки SOS
- **Использовать:** PostGIS `ST_DWithin` для поиска пользователей в радиусе

### 8. **Расширение типов инцидентов**
- ❌ Сейчас: `lighting`, `dog`, `harassment`
- ✅ Требуется: добавить `crime`, `other`
- **Полный список:** `lighting`, `dog`, `crime`, `harassment`, `other`

## Функциональные требования

### 9. **Модераторские функции**
- ❌ Отсутствуют endpoints для модераторов
- ✅ Требуется:
  - `PUT /incidents/{id}/validate` - валидация инцидента
  - `PUT /incidents/{id}/status` - изменение статуса (active/resolved/fake)
  - `PUT /users/{id}/block` - блокировка пользователя
  - `GET /admin/stats` - статистика по опасным зонам

### 10. **Статистика для модераторов**
- ❌ Отсутствует
- ✅ Требуется: `GET /admin/stats` с данными:
  - Самые опасные зоны (кластеризация инцидентов)
  - Количество инцидентов по типам
  - Пользователи с низким рейтингом
  - Активные инциденты за период

### 11. **Автоматическая очистка истекших инцидентов**
- ❌ Отсутствует
- ✅ Требуется: фоновый task (Celery или asyncio) для удаления инцидентов где `expires_at < NOW()`

### 12. **Блокировка при низком рейтинге**
- ❌ Отсутствует проверка reputation при создании инцидента
- ✅ Требуется: в `POST /incidents` проверять `if user.reputation < 0: raise HTTPException`

### 13. **Таблица votes**
- ❌ Отсутствует
- ✅ Требуется: таблица для отслеживания голосов
  ```python
  class Vote(Base):
      user_id: UUID (FK)
      incident_id: UUID (FK)
      vote_type: Enum(upvote, downvote)
      created_at: Timestamp
  ```

## Технические улучшения

### 14. **Пространственные индексы (GIST)**
- ❌ Не создаются автоматически
- ✅ Требуется: создать GIST индекс на `location` колонках для быстрого поиска
  ```sql
  CREATE INDEX idx_incidents_location ON incidents USING GIST (location);
  ```

### 15. **Кластеризация на бэкенде (опционально)**
- ❌ Отсутствует endpoint для кластеризации
- ✅ Опционально: `GET /incidents/clusters?zoom=...` для предварительной кластеризации меток

## Приоритет реализации

1. **Высокий приоритет:**
   - PostGIS GEOMETRY (критично для гео-запросов)
   - Система репутации
   - Статус и TTL инцидентов
   - Система голосования
   - SOS с радиусом 500м

2. **Средний приоритет:**
   - UUID вместо Integer
   - Пространственный поиск с радиусом
   - Модераторские функции
   - Блокировка при низком рейтинге

3. **Низкий приоритет:**
   - Статистика для модераторов
   - Автоматическая очистка истекших
   - Кластеризация на бэкенде


