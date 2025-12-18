# Инструкция по запуску SafeRoute

## Запуск бэкенда

Сервер должен быть запущен с активированным виртуальным окружением.

### Способ 1: Использовать скрипт (рекомендуется)
```bash
cd backend
./run_server.sh
```

### Способ 2: Вручную
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Сервер будет доступен по адресу: http://localhost:8000

## Запуск фронтенда

```bash
cd frontend
npm run dev
```

Фронтенд будет доступен по адресу: http://localhost:5173

## Важно

⚠️ **Всегда запускайте бэкенд с активированным виртуальным окружением!**

Если вы видите ошибку `ModuleNotFoundError: No module named 'asyncpg'`, это означает, что:
1. Виртуальное окружение не активировано
2. Или зависимости не установлены

Чтобы установить зависимости:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

## Проверка работы

После запуска обоих серверов:
- Бэкенд: http://localhost:8000/health должен вернуть `{"status":"ok"}`
- Фронтенд: http://localhost:5173 должен открыть страницу входа

