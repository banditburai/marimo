# Marimo Minimal Frontend

A **clean, distraction-free frontend** for [marimo](https://github.com/marimo-team/marimo) built with vanilla JavaScript and Starlette. This minimal interface connects to marimo's backend via WebSocket and REST API, providing full notebook functionality with a simple, focused UI.

## ✨ Features

- 🎯 **Distraction-free** - Minimal UI, maximum focus
- 🚀 **Full marimo backend** - All execution and state management
- ⚡ **Real-time updates** - WebSocket for instant feedback
- 📱 **Responsive** - Works on desktop and mobile
- 🎨 **Clean design** - Simple, modern interface
- ⌨️ **Keyboard shortcuts** - Efficient workflow

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  Starlette Frontend (Port 8000)    │
│  - Serves HTML/CSS/JS               │
│  - Static file hosting              │
└─────────────────────────────────────┘
              ↓
   Browser (JavaScript Client)
              ↓
┌─────────────────────────────────────┐
│  Marimo Backend (Port 2718)         │
│  - WebSocket: /ws (execution)       │
│  - REST API: /api/kernel/* (cmds)   │
└─────────────────────────────────────┘
```

The frontend serves a minimal UI that connects directly to marimo's backend. No React, no build system, just clean HTML/CSS/JavaScript.

## 📋 Prerequisites

- Python 3.8+
- marimo installed (`pip install marimo`)
- Starlette and Uvicorn (`pip install starlette uvicorn`)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install marimo starlette uvicorn
```

### 2. Start Marimo Backend

In one terminal, start marimo with a notebook:

```bash
# Create a sample notebook if you don't have one
echo "import marimo as mo" > notebook.py

# Start marimo backend on port 2718
marimo edit notebook.py --port 2718
```

Or create an empty notebook:

```bash
marimo edit --port 2718
```

### 3. Start Minimal Frontend

In another terminal, from the `marimo-minimal-frontend` directory:

```bash
python app.py
```

This starts the frontend server on `http://localhost:8000`

### 4. Open Your Browser

Navigate to:

```
http://localhost:8000
```

You should see the minimal marimo interface connected to your backend!

## ⌨️ Keyboard Shortcuts

- **Shift + Enter** - Run current cell
- **Ctrl + Enter** - Run cell and create new cell below
- **Tab** - Insert 4 spaces (indentation)

## 🎮 UI Controls

### Cell Controls (hover over cell)

- **▶ Run** - Execute the cell
- **+ Add** - Add new cell below
- **× Delete** - Remove the cell

### Bottom Controls

- **+ Add Cell** - Add new cell at the end
- **▶ Run All** - Execute all cells in order
- **⏹ Stop** - Interrupt running execution

## 📁 Project Structure

```
marimo-minimal-frontend/
├── app.py                 # Starlette server
├── static/
│   ├── marimo-client.js   # WebSocket client & logic
│   └── styles.css         # Minimal UI styles
└── README.md              # This file
```

## 🔧 Configuration

### Change Backend URL

Edit `static/marimo-client.js`:

```javascript
const MARIMO_BACKEND_URL = 'http://localhost:2718';
const MARIMO_WS_URL = 'ws://localhost:2718/ws';
```

### Change Frontend Port

Edit `app.py`:

```python
uvicorn.run(
    "app:app",
    host="0.0.0.0",
    port=8000,  # Change this
    reload=True,
)
```

## 🌐 How It Works

### WebSocket Communication

The frontend connects to marimo's WebSocket endpoint for real-time updates:

```javascript
// Connect with unique session ID
const ws = new WebSocket('ws://localhost:2718/ws?session_id=...');

// Receive execution updates
ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    switch (msg.op) {
        case 'kernel-ready': // Initial state
        case 'cell-op':      // Execution updates
        case 'alert':        // Notifications
    }
};
```

### REST API Commands

Commands are sent via HTTP POST:

```javascript
// Execute cell
await fetch('http://localhost:2718/api/kernel/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        cell_ids: ['cell-123'],
        codes: ['print("Hello")']
    })
});
```

Results come back via WebSocket, not HTTP response!

## 🎨 Customization

### Modify the UI

Edit `static/styles.css` to customize colors, fonts, spacing, etc.

Example - Change accent color:

```css
:root {
    --accent-color: #ff6b6b;  /* Red instead of blue */
}
```

### Add Features

Edit `static/marimo-client.js` to add functionality:

- Code completion
- Variable inspector
- Search and replace
- Custom output renderers
- Themes

## 🐛 Troubleshooting

### "Connection Error" or "Disconnected"

- Make sure marimo backend is running on port 2718
- Check console for WebSocket errors
- Verify CORS settings if running on different domains

### Cells don't execute

- Check browser console for errors
- Verify marimo backend is accessible at `http://localhost:2718/api/kernel/run`
- Make sure session ID is being sent correctly

### Output not displaying

- Check that output has correct MIME type
- Look for errors in browser console
- Verify WebSocket messages are being received

## 📊 Supported Output Types

The minimal frontend supports:

- ✅ Plain text (`text/plain`)
- ✅ HTML (`text/html`)
- ✅ Markdown (`text/markdown`)
- ✅ Images (`image/png`, `image/jpeg`, `image/svg+xml`)
- ✅ JSON (`application/json`)
- ⚠️ Custom marimo widgets (requires additional rendering)

## 🚧 Limitations

This is a **minimal prototype** and doesn't include:

- ❌ Code completion / autocomplete
- ❌ Variable inspector
- ❌ File browser
- ❌ Package manager
- ❌ AI assistant
- ❌ Advanced marimo UI elements (some may not render)
- ❌ Real-time collaboration
- ❌ Debugging tools

These features exist in marimo's full frontend but are intentionally excluded for simplicity.

## 🔮 Future Enhancements

Possible additions:

- [ ] Code editor syntax highlighting (CodeMirror or Monaco)
- [ ] Better markdown rendering (marked.js)
- [ ] Themes (light/dark mode)
- [ ] Cell folding
- [ ] Export to HTML/PDF
- [ ] Keyboard shortcut customization
- [ ] Save/load notebooks
- [ ] Better error display

## 📚 Resources

- [Marimo Documentation](https://docs.marimo.io)
- [Marimo GitHub](https://github.com/marimo-team/marimo)
- [Marimo Protocol Documentation](https://github.com/marimo-team/marimo/tree/main/marimo/_server)

## 🤝 Contributing

This is a prototype! Feel free to:

- Fork and customize
- Add features
- Improve the design
- Report issues
- Share your modifications

## 📝 License

This project is provided as-is for educational and experimental purposes. Marimo is licensed under Apache 2.0.

## 🙏 Acknowledgments

- Built on [marimo](https://github.com/marimo-team/marimo) - the reactive Python notebook
- Uses [Starlette](https://www.starlette.io/) for the web server
- Inspired by the need for a distraction-free coding environment

---

**Made with ❤️ for focused coding**

Enjoy your minimal marimo experience! 🎯
