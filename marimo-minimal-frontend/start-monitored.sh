#!/bin/bash

# Marimo Minimal Frontend - Robust Startup with Monitoring

NOTEBOOK_FILE="${1:-sample_notebook.py}"
BACKEND_LOG="marimo-backend.log"
MONITOR_LOG="marimo-monitor.log"

echo "================================================"
echo "🚀 Marimo Minimal Frontend - Startup (UV)"
echo "================================================"
echo ""

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "❌ uv not found!"
    echo "Please install uv: https://docs.astral.sh/uv/"
    exit 1
fi

echo "✅ uv found: $(which uv)"
echo ""

# Kill any existing marimo on port 2718
if lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🔧 Killing existing process on port 2718..."
    kill $(lsof -t -i:2718) 2>/dev/null || true
    sleep 2
fi

# Clear old logs
> "$BACKEND_LOG"
> "$MONITOR_LOG"

echo "🚀 Starting marimo backend with monitoring..."
echo "   File: $NOTEBOOK_FILE"
echo "   Port: 2718"
echo "   CORS: http://localhost:8000"
echo "   Backend log: $BACKEND_LOG"
echo ""

# Start marimo backend
uv run marimo edit "$NOTEBOOK_FILE" \
    --port 2718 \
    --headless \
    --allow-origins "http://localhost:8000" \
    --allow-origins "http://127.0.0.1:8000" \
    --token-password "dev-token-12345" \
    > "$BACKEND_LOG" 2>&1 &

MARIMO_PID=$!
echo "   Backend PID: $MARIMO_PID"

# Wait for backend to start (up to 10 seconds)
echo "   Waiting for backend to start..."
for i in {1..20}; do
    if lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "   ✅ Backend is listening on port 2718"
        break
    fi

    # Check if process is still running
    if ! kill -0 $MARIMO_PID 2>/dev/null; then
        echo "   ❌ Backend process died!"
        echo ""
        echo "   Last 50 lines of $BACKEND_LOG:"
        echo "   =========================================="
        tail -50 "$BACKEND_LOG"
        echo "   =========================================="
        exit 1
    fi

    sleep 0.5
    echo -n "."
done
echo ""

# Final check
if ! lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ❌ Backend failed to listen on port 2718 after 10 seconds"
    echo ""
    echo "   Full $BACKEND_LOG:"
    echo "   =========================================="
    cat "$BACKEND_LOG"
    echo "   =========================================="
    exit 1
fi

echo ""
echo "   ✅ Backend started successfully!"
echo ""

# Show last few lines of backend log
echo "   Backend startup log:"
echo "   ----------------------------------------"
tail -10 "$BACKEND_LOG"
echo "   ----------------------------------------"
echo ""

# Start background monitor to check if marimo stays alive
(
    while true; do
        sleep 5

        # Check if marimo process is still running
        if ! kill -0 $MARIMO_PID 2>/dev/null; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Marimo process $MARIMO_PID died!" | tee -a "$MONITOR_LOG"
            echo "Last 20 lines of $BACKEND_LOG:" | tee -a "$MONITOR_LOG"
            tail -20 "$BACKEND_LOG" | tee -a "$MONITOR_LOG"
            break
        fi

        # Check if port is still listening
        if ! lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Port 2718 is no longer listening!" | tee -a "$MONITOR_LOG"
            break
        fi

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backend healthy (PID: $MARIMO_PID)" >> "$MONITOR_LOG"
    done
) &

MONITOR_PID=$!

# Update the JavaScript file with the correct notebook name
echo "🔧 Configuring frontend for file: $NOTEBOOK_FILE"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/const MARIMO_FILE = .*/const MARIMO_FILE = '$NOTEBOOK_FILE';/" static/marimo-client.js
else
    # Linux
    sed -i "s/const MARIMO_FILE = .*/const MARIMO_FILE = '$NOTEBOOK_FILE';/" static/marimo-client.js
fi

echo ""
echo "🌐 Starting minimal frontend on port 8000..."
echo ""
echo "================================================"
echo "✨ Ready!"
echo "================================================"
echo ""
echo "📝 Open your browser:"
echo "   http://localhost:8000"
echo "   Then do HARD REFRESH: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Linux)"
echo ""
echo "📊 Logs:"
echo "   Backend: tail -f $BACKEND_LOG"
echo "   Monitor: tail -f $MONITOR_LOG"
echo ""
echo "💡 Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."

    # Kill monitor
    kill $MONITOR_PID 2>/dev/null || true

    # Kill marimo backend
    if kill -0 $MARIMO_PID 2>/dev/null; then
        echo "   Stopping marimo backend (PID: $MARIMO_PID)..."
        kill $MARIMO_PID 2>/dev/null || true
        sleep 1

        # Force kill if still running
        if kill -0 $MARIMO_PID 2>/dev/null; then
            echo "   Force killing marimo..."
            kill -9 $MARIMO_PID 2>/dev/null || true
        fi
    fi

    # Kill anything on port 2718 as last resort
    if lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "   Cleaning up port 2718..."
        kill $(lsof -t -i:2718) 2>/dev/null || true
    fi

    echo "   ✅ Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start frontend (blocking)
uv run python app.py

# Cleanup will be called by EXIT trap
