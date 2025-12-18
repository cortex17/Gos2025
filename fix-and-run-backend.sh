#!/bin/bash

echo "🔧 Исправление и запуск бэкенда..."

cd "$(dirname "$0")/GOS 2025/backend"

# Убить старые процессы
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1

# Активировать venv
source venv/bin/activate

# Переустановить greenlet
echo "📦 Переустановка greenlet..."
pip uninstall greenlet -y
pip install --force-reinstall greenlet

# Проверить
python -c "import greenlet; print('✅ greenlet OK')" || {
    echo "❌ Проблема с greenlet. Пересоздаю venv..."
    deactivate
    rm -rf venv
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
}

# Запустить бэкенд
echo "🚀 Запуск бэкенда на http://localhost:8000"
python run.py

