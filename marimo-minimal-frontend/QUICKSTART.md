# ⚡ Quick Start Guide

Get the marimo minimal frontend running in 60 seconds!

## 📦 Install

```bash
pip install marimo starlette uvicorn
```

## 🚀 Run

### Automatic (Recommended)

```bash
cd marimo-minimal-frontend
./start.sh
```

Then open: **http://localhost:8000**

### Manual (2 Terminals)

**Terminal 1:**
```bash
marimo edit --port 2718
```

**Terminal 2:**
```bash
cd marimo-minimal-frontend
python app.py
```

Then open: **http://localhost:8000**

## ✨ Use

1. **Type code** in a cell
2. **Press Shift+Enter** to run
3. **See output** below

## ⌨️ Shortcuts

- `Shift+Enter` - Run cell
- `Ctrl+Enter` - Run + add new cell
- `Tab` - Insert spaces

## 🎯 Try This

```python
import marimo as mo

mo.md("# Hello World!")
```

Press `Shift+Enter`

---

**That's it!** 🎉

See [README.md](README.md) for full documentation.
See [DEMO.md](DEMO.md) for examples and workflows.
