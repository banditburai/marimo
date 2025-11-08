#!/bin/bash

# Marimo Minimal Frontend - Quick Start Script

echo "================================================"
echo "🚀 Marimo Minimal Frontend - Quick Start"
echo "================================================"
echo ""

# Check if requirements are installed
echo "📦 Checking dependencies..."
python3 -c "import marimo" 2>/dev/null || {
    echo "❌ marimo not found. Installing dependencies..."
    pip install -r requirements.txt
}

python3 -c "import starlette" 2>/dev/null || {
    echo "❌ starlette not found. Installing dependencies..."
    pip install -r requirements.txt
}

echo "✅ Dependencies OK"
echo ""

# Check if marimo backend is already running on port 2718
if lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Marimo backend already running on port 2718"
else
    echo "🔧 Starting marimo backend on port 2718..."
    echo "   Running: marimo edit sample_notebook.py --port 2718"
    echo ""

    # Start marimo in background
    nohup marimo edit sample_notebook.py --port 2718 --headless > marimo.log 2>&1 &
    MARIMO_PID=$!

    echo "   PID: $MARIMO_PID"
    echo "   Waiting for backend to start..."
    sleep 3

    if lsof -Pi :2718 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "   ✅ Backend started successfully"
    else
        echo "   ❌ Backend failed to start. Check marimo.log"
        exit 1
    fi
fi

echo ""
echo "🌐 Starting minimal frontend on port 8000..."
echo "   Running: python3 app.py"
echo ""
echo "================================================"
echo "✨ Ready!"
echo "================================================"
echo ""
echo "📝 Open your browser:"
echo "   http://localhost:8000"
echo ""
echo "🔧 Marimo backend:"
echo "   http://localhost:2718"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start frontend (blocking)
python3 app.py
