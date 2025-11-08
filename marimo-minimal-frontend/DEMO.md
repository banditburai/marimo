# Marimo Minimal Frontend - Demo Guide

This guide shows you how to use the minimal marimo frontend and what you can do with it.

## 🚀 Quick Start

### Option 1: Automatic Start (Easiest)

```bash
cd marimo-minimal-frontend
./start.sh
```

This script will:
1. Check and install dependencies
2. Start marimo backend on port 2718
3. Start minimal frontend on port 8000
4. Open both in your browser

### Option 2: Manual Start

**Terminal 1 - Start Marimo Backend:**
```bash
cd marimo-minimal-frontend
marimo edit sample_notebook.py --port 2718
```

**Terminal 2 - Start Minimal Frontend:**
```bash
cd marimo-minimal-frontend
python app.py
```

**Browser:**
```
http://localhost:8000
```

## 📖 Using the Interface

### Basic Workflow

1. **Write code** in a cell
2. **Press Shift+Enter** to run
3. **See output** appear below
4. **Continue** to next cell

### Creating Cells

- Click **"+ Add Cell"** at the bottom
- Or press **Ctrl+Enter** after running a cell
- Or click **"+"** button on any cell to add below it

### Running Code

**Single Cell:**
- Press **Shift+Enter** in the code editor
- Or click the **▶** button on the cell

**All Cells:**
- Click **"▶ Run All"** at the bottom

**Stop Execution:**
- Click **"⏹ Stop"** while code is running

### Deleting Cells

- Hover over a cell
- Click the **×** button

## 🎯 Example Workflows

### Example 1: Simple Calculation

```python
# Cell 1
x = 10
y = 20
x + y
```

**Output:** `30`

### Example 2: Data Visualization

```python
# Cell 1
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
```

**Output:** A matplotlib plot

### Example 3: Working with DataFrames

```python
# Cell 1
import pandas as pd

df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'city': ['NYC', 'LA', 'SF']
})

df
```

**Output:** Formatted DataFrame

### Example 4: Markdown Documentation

```python
# Cell 1
import marimo as mo

mo.md("""
# My Analysis

This is a **markdown** cell with:
- Bullet points
- _Italic text_
- **Bold text**
""")
```

**Output:** Rendered markdown

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift + Enter` | Run current cell |
| `Ctrl + Enter` | Run cell and create new below |
| `Tab` | Insert 4 spaces (indentation) |

## 🎨 UI Elements

### Status Indicator (Top Right)

- **Connecting...** - Attempting to connect to backend
- **Connected** - Connected but not ready
- **Ready** - Ready to execute code
- **Disconnected** - Connection lost

### Cell Status (Colored Dot)

- **Gray** - Idle (not running)
- **Blue** (pulsing) - Running
- **Red** - Error

### Cell Border

- **Left blue border** - Currently running
- **Left red border** - Error occurred

## 🔍 Supported Output Types

| Type | Example |
|------|---------|
| **Text** | `print("Hello")` |
| **HTML** | `mo.html("<h1>Title</h1>")` |
| **Markdown** | `mo.md("# Title")` |
| **Images** | Matplotlib plots, PIL images |
| **JSON** | `{"key": "value"}` |
| **DataFrames** | Pandas DataFrames |

## 🐛 Common Issues

### "Disconnected" Status

**Problem:** Frontend can't connect to marimo backend

**Solution:**
1. Make sure marimo is running: `marimo edit --port 2718`
2. Check the backend URL in `static/marimo-client.js`
3. Look for errors in browser console (F12)

### No Output Shown

**Problem:** Cell runs but no output appears

**Solution:**
1. Make sure cell returns a value or uses `print()`
2. Check browser console for errors
3. Try a simple test: `1 + 1`

### Cell Won't Run

**Problem:** Clicking run does nothing

**Solution:**
1. Check WebSocket connection (status should be "Ready")
2. Look for errors in browser console
3. Verify marimo backend is accessible

## 🎓 Tips & Tricks

### 1. Reactive Execution

Marimo automatically runs dependent cells:

```python
# Cell 1
x = 10

# Cell 2
y = x * 2  # This runs automatically when cell 1 changes

# Cell 3
print(y)  # This runs when cell 2 changes
```

### 2. Use Markdown for Documentation

```python
import marimo as mo

mo.md("""
## Analysis Steps
1. Load data
2. Clean data
3. Visualize
""")
```

### 3. Quick Debugging

```python
# Add print statements
print(f"x = {x}")
print(f"type: {type(x)}")
```

### 4. Cell Organization

- One logical operation per cell
- Document with markdown cells
- Keep cells small and focused

## 📊 Sample Workflows

### Data Analysis Pipeline

```python
# Cell 1: Load data
import pandas as pd
df = pd.read_csv('data.csv')

# Cell 2: Clean data
df_clean = df.dropna()

# Cell 3: Analyze
summary = df_clean.describe()

# Cell 4: Visualize
import matplotlib.pyplot as plt
df_clean['column'].hist()
plt.show()
```

### Interactive Widgets

```python
# Cell 1: Create slider
import marimo as mo
slider = mo.ui.slider(0, 100, value=50)
slider

# Cell 2: Use slider value
value = slider.value
print(f"Selected: {value}")
```

## 🚧 Current Limitations

This minimal frontend **does not** include:

- ❌ Code autocompletion
- ❌ Variable inspector
- ❌ File browser
- ❌ Package manager
- ❌ Advanced marimo UI widgets
- ❌ Themes (only light mode)
- ❌ Cell folding
- ❌ Search/replace

These features exist in the full marimo frontend but are excluded for simplicity.

## 🔮 Possible Enhancements

Want to add features? Here are some ideas:

1. **Syntax Highlighting** - Integrate CodeMirror or Monaco Editor
2. **Dark Mode** - Add theme toggle
3. **Export** - Save notebook as HTML or PDF
4. **Cell Folding** - Hide/show cell outputs
5. **Search** - Find text across cells
6. **Undo/Redo** - Track edit history

## 📚 Next Steps

1. **Try the sample notebook** - `sample_notebook.py`
2. **Create your own** - Start fresh with `marimo edit`
3. **Customize the UI** - Edit `static/styles.css`
4. **Add features** - Modify `static/marimo-client.js`
5. **Share feedback** - What would you like to see?

## 🎬 Video Walkthrough

*(Add a video demo here if you create one)*

## 📸 Screenshots

### Main Interface
- Clean, minimal notebook view
- Cells with code and output
- Bottom controls for actions

### Running Code
- Blue border on running cells
- Real-time output updates
- Reactive execution

### Error Display
- Red border on errors
- Stack trace shown
- Clear error messages

---

**Happy coding! 🎉**

Enjoy your distraction-free marimo experience!
