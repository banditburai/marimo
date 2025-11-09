# Troubleshooting Guide

## 🐛 Common Issues and Fixes

### Issue 1: "Disconnected" Status - WebSocket Closes Immediately

**Symptoms:**
- Status shows "Connecting..." then "Disconnected"
- Console shows: `✅ WebSocket connected` followed by `🔌 WebSocket closed`
- Connection keeps reconnecting

**Cause:** Missing `file` query parameter in WebSocket URL

**Fix:** The WebSocket connection now includes the `file` parameter. Make sure you're using the updated `marimo-client.js`.

**What changed:**
```javascript
// OLD (broken):
ws://localhost:2718/ws?session_id=xxx

// NEW (fixed):
ws://localhost:2718/ws?session_id=xxx&file=notebook.py
```

---

### Issue 2: CORS Error - "Failed to fetch"

**Symptoms:**
- Console error: `Access to fetch at 'http://localhost:2718/api/kernel/run' from origin 'http://localhost:8000' has been blocked by CORS policy`
- Cells won't run
- Error: `Failed to fetch`

**Cause:** Marimo backend not configured to allow requests from localhost:8000

**Fix:** Start marimo with `--allow-origins` flag:

```bash
marimo edit notebook.py --port 2718 --headless \
    --allow-origins "http://localhost:8000" \
    --no-token
```

**Or use the fixed startup script:**
```bash
./start-fixed.sh notebook.py
```

---

### Issue 3: StarHTML vs Starlette

**Question:** Is this using StarHTML?

**Answer:** No, the current implementation uses **Starlette** (a lightweight ASGI framework), not StarHTML. This was chosen for simplicity.

**If you want StarHTML:** We can convert it! StarHTML would work the same way - it just serves the static HTML/CSS/JS files that connect to marimo backend.

---

### Issue 4: Python Environment - "externally-managed-environment"

**Symptoms:**
- Error: `externally-managed-environment`
- Can't install packages with pip

**Cause:** macOS/Homebrew Python prevents system-wide package installation

**Fix Option 1 - Virtual Environment (Recommended):**
```bash
cd marimo-minimal-frontend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Fix Option 2 - Use pipx:**
```bash
brew install pipx
pipx install marimo
```

**Fix Option 3 - User install:**
```bash
pip install --user marimo starlette uvicorn
```

---

## ✅ Complete Working Setup

### Step 1: Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install marimo starlette uvicorn
```

### Step 2: Start Servers

**Option A - Use Fixed Script (Easiest):**
```bash
./start-fixed.sh sample_notebook.py
```

**Option B - Manual Start:**

Terminal 1 - Backend with CORS:
```bash
marimo edit sample_notebook.py \
    --port 2718 \
    --headless \
    --allow-origins "http://localhost:8000" \
    --no-token
```

Terminal 2 - Frontend:
```bash
python app.py
```

### Step 3: Open Browser
```
http://localhost:8000
```

---

## 🔍 Debugging Checklist

### WebSocket Issues

- [ ] Check backend is running: `curl http://localhost:2718/api/health` should return OK
- [ ] Check WebSocket URL includes `file` parameter
- [ ] Check browser console for WebSocket errors
- [ ] Verify marimo backend logs: `cat marimo-backend.log`

### CORS Issues

- [ ] Check marimo started with `--allow-origins "http://localhost:8000"`
- [ ] Check browser console for CORS errors
- [ ] Try `--allow-origins "*"` for testing (not for production!)
- [ ] Verify both HTTP and WebSocket use same origin

### Connection Troubleshooting

**Test backend directly:**
```bash
# Test HTTP endpoint
curl http://localhost:2718/api/health

# Check if marimo is listening
lsof -i :2718

# View backend logs
tail -f marimo-backend.log
```

**Test WebSocket:**
Open browser console and run:
```javascript
const ws = new WebSocket('ws://localhost:2718/ws?session_id=test&file=notebook.py');
ws.onopen = () => console.log('Connected!');
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
ws.onerror = (e) => console.log('Error:', e);
```

---

## 🎯 Quick Fixes

### Fix: Frontend won't load

```bash
# Check if frontend is running
lsof -i :8000

# If not, start it
python app.py
```

### Fix: Backend not accepting connections

```bash
# Kill existing backend
kill $(lsof -t -i:2718)

# Restart with CORS
marimo edit sample_notebook.py --port 2718 --headless --allow-origins "*" --no-token
```

### Fix: "No file key" error

Update `static/marimo-client.js` to set the correct file:
```javascript
const MARIMO_FILE = 'your_notebook.py';  // Change this!
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│  Browser (http://localhost:8000)   │
│                                     │
│  JavaScript makes requests to:      │
│  ├─ WebSocket: ws://localhost:2718/ws?session_id=X&file=Y
│  └─ REST API: http://localhost:2718/api/kernel/*
│                                     │
│  REQUIRES:                          │
│  ✅ CORS header from backend        │
│  ✅ file parameter in WebSocket     │
│  ✅ session_id in both              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Marimo Backend (:2718)             │
│                                     │
│  MUST be started with:              │
│  --allow-origins "http://localhost:8000"
│  --headless                         │
│  --no-token (optional)              │
└─────────────────────────────────────┘
```

---

## 💡 Tips

1. **Always check both servers are running**
   - Frontend on :8000
   - Backend on :2718

2. **Use the fixed startup script**
   - It handles CORS automatically
   - Sets the correct file parameter
   - Manages both processes

3. **Check browser console**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

4. **Start fresh**
   ```bash
   # Kill everything
   kill $(lsof -t -i:2718)
   kill $(lsof -t -i:8000)

   # Start fresh
   ./start-fixed.sh sample_notebook.py
   ```

---

## 🆘 Still Not Working?

1. **Check marimo version:**
   ```bash
   marimo --version
   ```
   Should be >= 0.9.0

2. **Check logs:**
   ```bash
   # Backend logs
   cat marimo-backend.log

   # Frontend logs
   # Check terminal where you ran python app.py
   ```

3. **Test marimo independently:**
   ```bash
   marimo edit sample_notebook.py
   # Open http://localhost:2718 in browser
   # If this doesn't work, marimo installation is the issue
   ```

4. **Verify file exists:**
   ```bash
   ls -la sample_notebook.py
   ```

5. **Check file permissions:**
   ```bash
   chmod 644 sample_notebook.py
   ```

---

## 📝 Known Limitations

- ❌ File must exist before connecting
- ❌ Can only connect to one file at a time
- ❌ No hot-reloading of notebook file
- ❌ Session ID must be unique per connection

---

## ✨ Success Indicators

You'll know it's working when:

- ✅ Status shows "Ready" (not "Disconnected")
- ✅ You see cells from your notebook
- ✅ Running a cell shows output
- ✅ No errors in browser console
- ✅ No CORS errors
- ✅ WebSocket stays connected

---

Need more help? Check the main [README.md](README.md) or marimo docs at https://docs.marimo.io
