# 🔧 Исправление ошибки greenlet

## Проблема
```
ValueError: the greenlet library is required to use this function. No module named 'greenlet._greenlet'
```

## ✅ Решение

### Шаг 1: Откройте терминал и перейдите в папку бэкенда
```bash
cd "/Users/nurdaulettauekel/Desktop/SOSMap/GOS 2025/backend"
```

### Шаг 2: Активируйте виртуальное окружение
```bash
source venv/bin/activate
```

### Шаг 3: Переустановите greenlet
```bash
pip uninstall greenlet -y
pip install greenlet
```

### Шаг 4: Если не помогло, переустановите все зависимости
```bash
pip install --upgrade --force-reinstall greenlet sqlalchemy asyncpg
```

### Шаг 5: Или переустановите все зависимости из requirements.txt
```bash
pip install --upgrade --force-reinstall -r requirements.txt
```

### Шаг 6: Проверьте установку
```bash
python -c "import greenlet; print('greenlet OK')"
```

### Шаг 7: Запустите бэкенд
```bash
python run.py
```

## 🎯 Альтернатива: Использовать Fake API

Если проблема не решается, используйте Fake API для фронтенда:

1. Создайте `.env` в корне проекта:
```env
VITE_USE_FAKE_API=true
```

2. Перезапустите фронтенд:
```bash
npm run dev
```

## 📝 Примечание

Эта ошибка часто возникает при:
- Несовместимости версий Python и greenlet
- Неправильной установке зависимостей
- Проблемах с виртуальным окружением

**Рекомендуется переустановить виртуальное окружение:**
```bash
cd "GOS 2025/backend"
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

