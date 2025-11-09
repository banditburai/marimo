#!/bin/bash

echo "=============================================="
echo "🔍 Marimo Minimal Frontend - Debug Info"
echo "=============================================="
echo ""

echo "1️⃣ Checking running processes:"
echo "-------------------------------------------"
echo "Marimo processes:"
ps aux | grep -i marimo | grep -v grep || echo "  None found"
echo ""

echo "Port 2718 (marimo backend):"
lsof -i :2718 || echo "  Nothing listening"
echo ""

echo "Port 8000 (frontend):"
lsof -i :8000 || echo "  Nothing listening"
echo ""

echo "2️⃣ Checking marimo sessions:"
echo "-------------------------------------------"
if [ -d ~/.marimo ]; then
    echo "Marimo config directory exists"
    echo "Session files:"
    find ~/.marimo -name "*.session" 2>/dev/null || echo "  None found"
    echo ""
    echo "Session directories:"
    ls -la ~/.marimo/sessions 2>/dev/null || echo "  Directory doesn't exist"
else
    echo "No ~/.marimo directory found"
fi
echo ""

echo "3️⃣ Checking log files:"
echo "-------------------------------------------"
if [ -f marimo-backend.log ]; then
    echo "✅ marimo-backend.log exists (last 20 lines):"
    tail -20 marimo-backend.log
else
    echo "❌ marimo-backend.log not found"
fi
echo ""

echo "4️⃣ Checking JavaScript configuration:"
echo "-------------------------------------------"
if [ -f static/marimo-client.js ]; then
    echo "MARIMO_FILE setting:"
    grep "const MARIMO_FILE" static/marimo-client.js
    echo ""
    echo "MARIMO_BACKEND_URL:"
    grep "const MARIMO_BACKEND_URL" static/marimo-client.js
else
    echo "❌ static/marimo-client.js not found"
fi
echo ""

echo "5️⃣ Network connections:"
echo "-------------------------------------------"
echo "All connections to port 2718:"
lsof -i :2718 -n || echo "  None"
echo ""

echo "=============================================="
echo "🎯 Recommendations:"
echo "=============================================="
echo ""

if lsof -i :2718 >/dev/null 2>&1; then
    echo "⚠️  Port 2718 is in use. Kill it with:"
    echo "   kill $(lsof -t -i:2718)"
fi

if lsof -i :8000 >/dev/null 2>&1; then
    echo "⚠️  Port 8000 is in use. Kill it with:"
    echo "   kill $(lsof -t -i:8000)"
fi

if [ -d ~/.marimo/sessions ] && [ "$(ls -A ~/.marimo/sessions 2>/dev/null)" ]; then
    echo "⚠️  Old sessions exist. Clean them with:"
    echo "   rm -rf ~/.marimo/sessions/*"
fi

echo ""
echo "To start completely fresh:"
echo "  1. pkill -9 -f marimo"
echo "  2. pkill -9 -f uvicorn"
echo "  3. rm -rf ~/.marimo/sessions/*"
echo "  4. rm -f marimo-backend.log"
echo "  5. ./start-uv.sh sample_notebook.py"
echo ""
