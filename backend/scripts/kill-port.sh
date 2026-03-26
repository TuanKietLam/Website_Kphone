#!/bin/bash
# Script để kill process đang chạy trên port 5000

PORT=${1:-5000}

echo "Đang tìm process trên port $PORT..."

# Tìm và kill process trên port
PID=$(lsof -ti:$PORT 2>/dev/null || fuser $PORT/tcp 2>/dev/null | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "Không có process nào đang chạy trên port $PORT"
else
    echo "Tìm thấy process PID: $PID"
    kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    sleep 1
    echo "Đã dừng process trên port $PORT"
fi










