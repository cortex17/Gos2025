#!/bin/bash

# Script to run SafeRoute backend server
cd "$(dirname "$0")"

# Free port 8000 if it's in use
PORT=8000
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
    echo "Освобождаю порт $PORT (процесс $PID)..."
    kill -9 $PID 2>/dev/null
    sleep 1
fi

# Activate virtual environment
source venv/bin/activate

# Run the server
echo "Запуск сервера на http://127.0.0.1:$PORT"
uvicorn app.main:app --reload --host 127.0.0.1 --port $PORT

