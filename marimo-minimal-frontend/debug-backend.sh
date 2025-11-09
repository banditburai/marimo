#!/bin/bash

echo "================================================"
echo "🔍 Marimo Backend Debug Script"
echo "================================================"
echo ""

echo "1. Checking if port 2718 is in use..."
if lsof -i :2718 >/dev/null 2>&1; then
    echo "   ✅ Port 2718 is in use"
    lsof -i :2718
else
    echo "   ❌ Port 2718 is NOT in use - backend not running!"
fi
echo ""

echo "2. Testing HTTP connection to backend..."
if curl -s http://localhost:2718/ >/dev/null 2>&1; then
    echo "   ✅ Backend is responding to HTTP"
else
    echo "   ❌ Backend is NOT responding to HTTP"
fi
echo ""

echo "3. Checking marimo-backend.log..."
if [ -f marimo-backend.log ]; then
    echo "   Last 20 lines of marimo-backend.log:"
    tail -20 marimo-backend.log
else
    echo "   ❌ marimo-backend.log not found"
fi
echo ""

echo "4. Testing WebSocket endpoint..."
echo "   Attempting to connect to ws://localhost:2718/ws"
# This will fail but shows us if the endpoint is reachable
curl -i -N \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    http://localhost:2718/ws 2>&1 | head -20
echo ""

echo "================================================"
echo "If backend is not running, start it manually:"
echo "uv run marimo edit sample_notebook.py --port 2718 --headless --allow-origins 'http://localhost:8000' --token-password 'dev-token-12345'"
echo "================================================"
