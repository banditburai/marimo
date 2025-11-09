#!/bin/bash

echo "================================================"
echo "🔍 Comprehensive Backend Debug"
echo "================================================"
echo ""

echo "1️⃣ Checking if port 2718 is in use..."
if lsof -i :2718 >/dev/null 2>&1; then
    echo "   ✅ Something is listening on port 2718:"
    lsof -i :2718
else
    echo "   ❌ Nothing is listening on port 2718"
    echo "   The marimo backend is NOT running!"
fi
echo ""

echo "2️⃣ Testing HTTP connection..."
HTTP_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:2718/ 2>&1)
if echo "$HTTP_RESPONSE" | grep -q "HTTP_CODE:200"; then
    echo "   ✅ Backend responds to HTTP requests"
    echo "   Response preview (first 500 chars):"
    echo "$HTTP_RESPONSE" | head -c 500
    echo ""
else
    echo "   ❌ Backend not responding properly"
    echo "   Full response:"
    echo "$HTTP_RESPONSE"
fi
echo ""

echo "3️⃣ Checking marimo-backend.log..."
if [ -f marimo-backend.log ]; then
    echo "   📄 Log file exists. Last 30 lines:"
    echo "   ----------------------------------------"
    tail -30 marimo-backend.log
    echo "   ----------------------------------------"
else
    echo "   ❌ marimo-backend.log not found!"
fi
echo ""

echo "4️⃣ Testing WebSocket upgrade request..."
WS_RESPONSE=$(curl -i -s \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    http://localhost:2718/ws?session_id=test-session&file=sample_notebook.py 2>&1 | head -20)

echo "   WebSocket upgrade response:"
echo "   ----------------------------------------"
echo "$WS_RESPONSE"
echo "   ----------------------------------------"
echo ""

echo "5️⃣ Checking if sample_notebook.py exists..."
if [ -f sample_notebook.py ]; then
    echo "   ✅ sample_notebook.py exists"
    echo "   File size: $(wc -c < sample_notebook.py) bytes"
else
    echo "   ❌ sample_notebook.py NOT found!"
fi
echo ""

echo "6️⃣ Testing server token extraction..."
HTML_RESPONSE=$(curl -s http://localhost:2718/)
if echo "$HTML_RESPONSE" | grep -q "serverToken"; then
    echo "   ✅ Found 'serverToken' in HTML"
    echo "   Extract attempt:"
    echo "$HTML_RESPONSE" | grep -o '"serverToken"[^,]*' | head -3
else
    echo "   ❌ 'serverToken' not found in HTML"
    echo "   Searching for __MARIMO_MOUNT_CONFIG__:"
    echo "$HTML_RESPONSE" | grep -o '__MARIMO_MOUNT_CONFIG__[^<]*' | head -3
fi
echo ""

echo "================================================"
echo "Summary:"
echo "================================================"
echo ""

# Summary
PORT_OK=false
HTTP_OK=false
LOG_OK=false
FILE_OK=false

lsof -i :2718 >/dev/null 2>&1 && PORT_OK=true
curl -s http://localhost:2718/ >/dev/null 2>&1 && HTTP_OK=true
[ -f marimo-backend.log ] && LOG_OK=true
[ -f sample_notebook.py ] && FILE_OK=true

echo "Port 2718 listening: $PORT_OK"
echo "HTTP responding: $HTTP_OK"
echo "Log file exists: $LOG_OK"
echo "Notebook file exists: $FILE_OK"
echo ""

if ! $PORT_OK; then
    echo "❌ PROBLEM: Backend is not running!"
    echo ""
    echo "To start it manually:"
    echo "uv run marimo edit sample_notebook.py --port 2718 --headless --allow-origins 'http://localhost:8000' --token-password 'dev-token-12345'"
elif ! $HTTP_OK; then
    echo "❌ PROBLEM: Backend is running but not responding to HTTP"
    echo "Check marimo-backend.log for errors"
else
    echo "✅ Backend appears to be running correctly"
    echo ""
    echo "If WebSocket still fails, the issue might be:"
    echo "  1. CORS configuration"
    echo "  2. WebSocket endpoint path"
    echo "  3. Authentication requirements"
fi
echo ""
echo "================================================"
