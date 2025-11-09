#!/bin/bash

# Simple startup - manually start marimo backend, then frontend

NOTEBOOK_FILE="${1:-sample_notebook.py}"

echo "================================================"
echo "🚀 Marimo Minimal Frontend - Simple Start"
echo "================================================"
echo ""
echo "Starting marimo backend with CORS..."
echo "File: $NOTEBOOK_FILE"
echo ""
echo "Run this command in TERMINAL 1:"
echo ""
echo "marimo edit $NOTEBOOK_FILE --port 2718 --headless --allow-origins 'http://localhost:8000' --token-password 'dev-token-12345'"
echo ""
echo "Or if using pipx:"
echo "pipx run marimo edit $NOTEBOOK_FILE --port 2718 --headless --allow-origins 'http://localhost:8000' --token-password 'dev-token-12345'"
echo ""
echo "Then press Enter here to continue..."
read

echo ""
echo "Starting frontend server..."
echo "Open browser to: http://localhost:8000"
echo "Then do HARD REFRESH: Cmd+Shift+R"
echo ""

python3 app.py
