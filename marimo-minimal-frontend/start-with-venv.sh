#!/bin/bash

# Marimo Minimal Frontend - Startup with parent venv

NOTEBOOK_FILE="${1:-sample_notebook.py}"

echo "================================================"
echo "🚀 Marimo Minimal Frontend - Startup"
echo "================================================"
echo ""

# Look for venv in parent directory
PARENT_VENV="../venv"
PARENT_VENV_BIN="$PARENT_VENV/bin/activate"

if [ -f "$PARENT_VENV_BIN" ]; then
    echo "✅ Found venv in parent directory"
    source "$PARENT_VENV_BIN"
else
    echo "⚠️  No venv found at $PARENT_VENV"
    echo "Looking for marimo in PATH..."
fi

# Check if marimo is available
if ! command -v marimo &> /dev/null; then
    echo "❌ marimo not found!"
    echo ""
    echo "Please activate your virtual environment first:"
    echo "  cd .."
    echo "  source venv/bin/activate  # or wherever your venv is"
    echo "  cd marimo-minimal-frontend"
    echo "  ./start-with-venv.sh"
    exit 1
fi

echo "✅ marimo found: $(which marimo)"
echo ""

# Kill any existing marimo on port 2718
if lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "🔧 Killing existing process on port 2718..."
    kill $(lsof -t -i:2718) 2>/dev/null || true
    sleep 1
fi

echo "🚀 Starting marimo backend with CORS enabled..."
echo "   File: $NOTEBOOK_FILE"
echo "   Port: 2718"
echo "   CORS: http://localhost:8000"
echo ""

# Start marimo with CORS enabled
marimo edit "$NOTEBOOK_FILE" \
    --port 2718 \
    --headless \
    --allow-origins "http://localhost:8000" \
    --allow-origins "http://127.0.0.1:8000" \
    --no-token \
    > marimo-backend.log 2>&1 &

MARIMO_PID=$!
echo "   Backend PID: $MARIMO_PID"
echo "   Waiting for backend to start..."
sleep 3

# Check if marimo is running
if ! lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "❌ Backend failed to start!"
    echo "   Check marimo-backend.log for errors"
    cat marimo-backend.log
    exit 1
fi

echo "   ✅ Backend started successfully"
echo ""

# Update the JavaScript file with the correct notebook name
echo "🔧 Configuring frontend for file: $NOTEBOOK_FILE"
sed -i.bak "s/const MARIMO_FILE = .*/const MARIMO_FILE = '$NOTEBOOK_FILE';/" static/marimo-client.js

echo ""
echo "🌐 Starting minimal frontend on port 8000..."
echo ""
echo "================================================"
echo "✨ Ready!"
echo "================================================"
echo ""
echo "📝 Open your browser:"
echo "   http://localhost:8000"
echo "   Then do HARD REFRESH: Cmd+Shift+R"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $MARIMO_PID 2>/dev/null || true
    # Restore backup if it exists
    [ -f static/marimo-client.js.bak ] && mv static/marimo-client.js.bak static/marimo-client.js
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start frontend (blocking)
python3 app.py

# Cleanup on normal exit
cleanup
