"""
Minimal Distraction-Free Frontend for Marimo
Built with StarHTML - connects to marimo backend via WebSocket + REST API
"""
from starlette.applications import Starlette
from starlette.responses import HTMLResponse, FileResponse
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles
import uvicorn
import os

# HTML template for the minimal UI
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marimo - Minimal Mode</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>marimo</h1>
            <div id="status" class="status-disconnected">Connecting...</div>
        </header>

        <main id="notebook">
            <div id="cells-container"></div>
        </main>

        <div id="controls">
            <button id="add-cell-btn" title="Add Cell (Ctrl+Enter on last cell)">+ Add Cell</button>
            <button id="run-all-btn" title="Run All Cells">▶ Run All</button>
            <button id="interrupt-btn" title="Interrupt Execution" disabled>⏹ Stop</button>
        </div>
    </div>

    <script src="/static/marimo-client.js"></script>
</body>
</html>
"""

async def index(request):
    """Serve the main notebook interface"""
    return HTMLResponse(HTML_TEMPLATE)

async def health(request):
    """Health check endpoint"""
    return HTMLResponse("OK")

# Define routes
routes = [
    Route("/", endpoint=index),
    Route("/health", endpoint=health),
    Mount("/static", StaticFiles(directory="static"), name="static"),
]

# Create Starlette app
app = Starlette(debug=True, routes=routes)

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Marimo Minimal Frontend")
    print("=" * 60)
    print("\n📝 Instructions:")
    print("1. Make sure marimo backend is running:")
    print("   marimo edit notebook.py --port 2718")
    print("\n2. Open your browser:")
    print("   http://localhost:8000")
    print("\n3. Your minimal UI will connect to marimo backend")
    print("=" * 60)
    print()

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
