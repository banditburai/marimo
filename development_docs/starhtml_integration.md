# StarHTML Integration - API Design

## Overview

This document defines the API design for integrating StarHTML components into marimo notebooks. StarHTML provides reactive UI components with Datastar.js for client-side reactivity.

**Status:** Planning
**Date:** 2025-11-09
**Branch:** `claude/starhtml-marimo-integration-011CUw7Vx2L6EZum97hebSvu`

---

## Design Philosophy

1. **Clean & Concise** - Minimal syntax for common use cases
2. **Explicit Signal Objects** - Leverage StarHTML's `Signal()` for clear API
3. **Direct Attribute Access** - Pythonic access to signal values
4. **Idiomatic** - Follow Python and marimo best practices
5. **No Unnecessary Wrappers** - Keep it simple

---

## Core API

### Creating StarHTML Widgets

```python
import marimo as mo
from starhtml import Div, Button, Signal, Input, Span

# Define component with signals
counter_ui = mo.ui.starhtml(
    Div(
        (counter := Signal("counter", 0)),
        (name := Signal("name", "")),
        Span(data_text=counter),
        Button("+", data_on_click=counter.add(1)),
        Input(data_bind=name)
    )
)

counter_ui  # Display the widget
```

### Accessing Signal Values

**Primary API: Direct attribute access**
```python
# Access individual signals directly
counter_ui.counter  # Returns: 5
counter_ui.name     # Returns: "Alice"

# Use in expressions
doubled = counter_ui.counter * 2

# Use in conditionals
if counter_ui.counter > 10:
    mo.md("Counter is high!")

# Use in f-strings
mo.md(f"Count: {counter_ui.counter}, Name: {counter_ui.name}")
```

**Secondary API: .value dict (for edge cases)**
```python
# Get all signals as dict
counter_ui.value  # Returns: {"counter": 5, "name": "Alice"}

# Iterate over all signals
for signal_name, signal_value in counter_ui.value.items():
    print(f"{signal_name}: {signal_value}")

# Dynamic access
signal_name = "counter"
value = counter_ui.value[signal_name]

# Dict operations
if "counter" in counter_ui.value:
    print("Has counter signal")
```

---

## Complete Examples

### Example 1: Simple Counter

```python
# Cell 1: Define UI
import marimo as mo
from starhtml import Div, Button, Span, Signal

counter = mo.ui.starhtml(
    Div(
        (count := Signal("count", 0)),
        Div(
            Span("Count: ", data_text=count),
            cls="text-xl mb-4"
        ),
        Div(
            Button("+", data_on_click=count.add(1), cls="btn"),
            Button("-", data_on_click=count.sub(1), cls="btn"),
            Button("Reset", data_on_click=count.set(0), cls="btn"),
            cls="flex gap-2"
        )
    )
)
counter

# Cell 2: Use counter value
mo.md(f"## Current Count: {counter.count}")

# Cell 3: Reactive calculation
doubled = counter.count * 2
mo.md(f"Doubled: {doubled}")
```

### Example 2: Form with Validation

```python
# Cell 1: Define form UI
import marimo as mo
from starhtml import Div, Input, Button, Span, Signal

form = mo.ui.starhtml(
    Div(
        (name := Signal("name", "")),
        (email := Signal("email", "")),
        (age := Signal("age", 0)),
        (error := Signal("error", "")),

        Div(
            Input(
                type="text",
                placeholder="Name",
                data_bind=name,
                cls="input"
            ),
            Input(
                type="email",
                placeholder="Email",
                data_bind=email,
                cls="input"
            ),
            Input(
                type="number",
                placeholder="Age",
                data_bind=age,
                cls="input"
            ),
            Span(data_text=error, data_show=error, cls="text-red-500"),
            Button(
                "Submit",
                data_on_click=post("/api/submit"),
                data_attr_disabled=~all(name, email, age),
                cls="btn btn-primary"
            ),
            cls="flex flex-col gap-2"
        )
    )
)
form

# Cell 2: Display form data
mo.md(f"""
## Form Data
- **Name:** {form.name}
- **Email:** {form.email}
- **Age:** {form.age}
""")

# Cell 3: Validation logic
if form.age > 0 and form.age < 18:
    mo.md("⚠️ Must be 18 or older")
elif form.age >= 18:
    mo.md("✅ Valid age")
```

### Example 3: Real-time Search

```python
# Cell 1: Search UI
import marimo as mo
from starhtml import Div, Input, Signal, Span

search_ui = mo.ui.starhtml(
    Div(
        (query := Signal("query", "")),
        (results_count := Signal("results_count", 0)),

        Input(
            type="search",
            placeholder="Search...",
            data_bind=query,
            cls="input input-lg"
        ),
        Span(
            data_text=f"Found {results_count} results",
            data_show=query,
            cls="text-sm text-gray-600"
        )
    )
)
search_ui

# Cell 2: Perform search when query changes
import pandas as pd

# This cell re-runs when search_ui.query changes
query = search_ui.query

if query:
    # Simulate search
    results = df[df['name'].str.contains(query, case=False)]
    mo.md(f"Found {len(results)} results for '{query}'")
    results
else:
    mo.md("Enter a search query")
```

### Example 4: Multi-Step Form

```python
# Cell 1: Multi-step form UI
import marimo as mo
from starhtml import Div, Button, Input, Signal, match

wizard = mo.ui.starhtml(
    Div(
        (step := Signal("step", 1)),
        (name := Signal("name", "")),
        (email := Signal("email", "")),
        (bio := Signal("bio", "")),

        # Step indicator
        Div(
            f"Step {step.js()} of 3",
            cls="text-center mb-4"
        ),

        # Step 1: Name
        Div(
            Input(data_bind=name, placeholder="Your name"),
            Button("Next", data_on_click=step.set(2)),
            data_show=step == 1
        ),

        # Step 2: Email
        Div(
            Input(data_bind=email, placeholder="Your email", type="email"),
            Button("Back", data_on_click=step.set(1)),
            Button("Next", data_on_click=step.set(3)),
            data_show=step == 2,
            cls="flex gap-2"
        ),

        # Step 3: Bio
        Div(
            Textarea(data_bind=bio, placeholder="About you..."),
            Button("Back", data_on_click=step.set(2)),
            Button("Submit", data_on_click=post("/api/submit")),
            data_show=step == 3,
            cls="flex gap-2"
        )
    )
)
wizard

# Cell 2: Display collected data
mo.md(f"""
## Collected Data (Step {wizard.step})
- Name: {wizard.name}
- Email: {wizard.email}
- Bio: {wizard.bio}
""")
```

---

## Implementation Details

### Signal Extraction

```python
class starhtml(UIElement[dict, dict]):
    """
    Marimo UIElement wrapper for StarHTML components.

    Automatically extracts signals from component HTML and provides
    direct attribute access to signal values.
    """

    def __init__(self, component, on_change=None):
        """
        Args:
            component: StarHTML component (FT object)
            on_change: Optional callback when signals change
        """
        import uuid
        import json
        import re

        self._widget_id = str(uuid.uuid4())
        self._component = component

        # Convert component to HTML string
        html_str = str(component)

        # Extract signals from data-signals attribute in HTML
        # Format: data-signals='{"counter": 0, "name": ""}'
        signals = self._extract_signals(html_str)

        super().__init__(
            component_name="marimo-starhtml",
            initial_value=signals,
            label="",
            args={
                "html": html_str,
                "signals": signals,
                "widget_id": self._widget_id
            },
            on_change=on_change
        )

    def _extract_signals(self, html: str) -> dict:
        """Extract signal definitions from data-signals attribute."""
        # Match: data-signals='{"key": value, ...}'
        match = re.search(r"data-signals='([^']+)'", html)
        if match:
            return json.loads(match.group(1))
        return {}

    def _convert_value(self, value: dict) -> dict:
        """Convert frontend signal updates to Python dict."""
        return value

    def __getattr__(self, name: str) -> Any:
        """
        Direct attribute access to signal values.

        Example:
            widget.counter  # Returns signal value
        """
        # Avoid recursion for internal attributes
        if name.startswith('_') or name in ('value', '_value'):
            return object.__getattribute__(self, name)

        # Access signal value from internal dict
        value = object.__getattribute__(self, '_value')
        if name in value:
            return value[name]

        # Provide helpful error with available signals
        raise AttributeError(
            f"Signal '{name}' not found. "
            f"Available signals: {list(value.keys())}"
        )
```

### Frontend Component

```typescript
// frontend/src/plugins/impl/starhtml/StarhtmlPlugin.tsx
import { registerReactComponent } from "@/plugins/core/registerReactComponent";
import { useEffect, useRef } from "react";

registerReactComponent({
  name: "marimo-starhtml",
  render: (props) => {
    const { html, signals, widget_id } = props.args;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      // Render StarHTML HTML
      containerRef.current.innerHTML = html;

      // Datastar.js automatically processes data-* attributes
      // when present in the DOM (loaded globally)

      // Listen for signal changes from Datastar
      const handleSignalChange = (e: CustomEvent) => {
        // Sync signal updates back to marimo
        props.setValue(e.detail);
      };

      containerRef.current.addEventListener(
        'datastar-signal-change',
        handleSignalChange as EventListener
      );

      return () => {
        containerRef.current?.removeEventListener(
          'datastar-signal-change',
          handleSignalChange as EventListener
        );
      };
    }, [html, widget_id]);

    return <div ref={containerRef} />;
  }
});
```

### Datastar.js Injection

```python
# marimo/_server/templates/templates.py

def inject_datastar_script(html: str) -> str:
    """
    Inject Datastar.js CDN script into HTML head.

    Only injects once if not already present.
    """
    if 'datastar.js' in html:
        return html  # Already injected

    datastar_script = '''
    <script type="module"
            src="https://cdn.jsdelivr.net/gh/starfederation/datastar@main/bundles/datastar.js">
    </script>
    '''

    return html.replace('</head>', f'{datastar_script}</head>', 1)

# Modify home_page_template to inject Datastar
def home_page_template(...) -> str:
    html = generate_base_template(...)
    html = inject_datastar_script(html)
    return html
```

---

## Edge Cases & Design Decisions

### 1. Signal Name Conflicts

**Problem:** Signal name conflicts with UIElement methods/properties

```python
# What if signal is named "value"?
ui = mo.ui.starhtml(Div((value := Signal("value", 0))))
```

**Decision:**
- `ui.value` returns dict (UIElement standard)
- Access via dict: `ui.value["value"]` for the signal
- Document reserved names: `value`, `form`, internal methods

### 2. Python Keywords as Signal Names

**Problem:** Signal named with Python keyword

```python
# Signal named "class" or "for"
ui = mo.ui.starhtml(Div((class_ := Signal("class", ""))))
```

**Decision:**
- Use dict access: `ui.value["class"]`
- Document that keywords should use dict access
- StarHTML uses `cls` for class, so less likely

### 3. Dynamic Signal Names

**Problem:** Signal names not known at design time

```python
# Signals created dynamically
signals = {f"field_{i}": i for i in range(10)}
```

**Decision:**
- Use `.value` dict for iteration and dynamic access
- Attribute access for known signals
- Both patterns supported

### 4. Type Hints for IDE Support

**Problem:** IDE doesn't know what signals exist

**Future Enhancement:**
- Explore type stubs or Protocol
- Could use `__dir__` to enable tab completion
- For now, rely on runtime introspection

---

## Dependencies

### Python
- `starhtml>=0.3.0` - StarHTML component library
- Existing marimo dependencies

### JavaScript
- Datastar.js (CDN) - Loaded globally in page head
- No additional bundle size for marimo

---

## Testing Plan

### Unit Tests

```python
# tests/_plugins/ui/_impl/test_starhtml.py

def test_starhtml_signal_extraction():
    """Test that signals are extracted from component HTML."""
    from starhtml import Div, Signal

    component = Div((counter := Signal("counter", 0)))
    ui = mo.ui.starhtml(component)

    assert ui.value == {"counter": 0}
    assert ui.counter == 0

def test_starhtml_attribute_access():
    """Test direct attribute access to signals."""
    from starhtml import Div, Signal

    component = Div(
        (counter := Signal("counter", 5)),
        (name := Signal("name", "test"))
    )
    ui = mo.ui.starhtml(component)

    assert ui.counter == 5
    assert ui.name == "test"
    assert ui.value == {"counter": 5, "name": "test"}

def test_starhtml_unknown_signal():
    """Test error handling for unknown signals."""
    from starhtml import Div, Signal

    component = Div((counter := Signal("counter", 0)))
    ui = mo.ui.starhtml(component)

    with pytest.raises(AttributeError, match="Signal 'foo' not found"):
        _ = ui.foo
```

### Integration Tests

```python
# tests/_smoke_tests/starhtml_basic.py
import marimo as mo
from starhtml import Div, Button, Signal

counter = mo.ui.starhtml(
    Div(
        (count := Signal("count", 0)),
        Button("+", data_on_click=count.add(1))
    )
)

# Test that widget displays
assert counter is not None

# Test signal access
assert counter.count == 0
assert counter.value == {"count": 0}
```

### Example Notebooks

Create comprehensive examples:
- `examples/starhtml/counter.py` - Basic counter
- `examples/starhtml/form.py` - Form with validation
- `examples/starhtml/dashboard.py` - Multi-widget dashboard

---

## Future Enhancements (Phase 2+)

### SSE Streaming

Add support for Python → Browser updates via SSE:

```python
# Future API idea
@counter.stream
async def update_counter():
    """Stream updates from Python to browser."""
    from starhtml import signals

    for i in range(10):
        await asyncio.sleep(1)
        yield signals(count=i)
```

### Event Handlers

Python callbacks for specific events:

```python
# Future API idea
@counter.on_click("increment_btn")
def handle_increment():
    # Python logic on button click
    return some_computation()
```

### Signal Subscriptions

More granular reactivity:

```python
# Future API idea
@counter.on_change("count")
def handle_count_change(new_value):
    print(f"Count changed to {new_value}")
```

---

## Questions & Decisions Log

### Q1: Should `.value` return dict or something else?
**Decision:** Dict for consistency with other marimo widgets (batch, dictionary)

### Q2: How to handle signal name conflicts?
**Decision:** Reserved names use `.value` dict access, document clearly

### Q3: Need SSE for Phase 1?
**Decision:** No - Phase 1 is pure client-side reactivity. SSE in Phase 2.

### Q4: Auto-formatter or explicit wrapper?
**Decision:** Explicit `mo.ui.starhtml()` for clarity and control

### Q5: Support `mo.starhtml()` (non-ui) for static rendering?
**Decision:** Later - focus on interactive widgets first

---

## Implementation Phases

### Phase 1: Core Widget (MVP)
- ✅ API design (this document)
- ⬜ Add `starhtml` dependency
- ⬜ Inject Datastar.js into templates
- ⬜ Implement `mo.ui.starhtml()` UIElement
- ⬜ Implement frontend component
- ⬜ Signal extraction from HTML
- ⬜ Direct attribute access via `__getattr__`
- ⬜ Basic tests
- ⬜ Example notebooks

### Phase 2: SSE Streaming (Future)
- ⬜ SSE endpoint infrastructure
- ⬜ Python → Browser updates
- ⬜ Streaming API design
- ⬜ Advanced examples

### Phase 3: Advanced Features (Future)
- ⬜ Event callbacks
- ⬜ Signal subscriptions
- ⬜ Built-in handlers (scroll, drag, persist)
- ⬜ Type stubs for IDE support

---

## References

- [StarHTML Repository](https://github.com/banditburai/starhtml)
- [Datastar Documentation](https://data-star.dev/)
- [marimo anywidget Integration](../marimo/_plugins/ui/_impl/from_anywidget.py)
- [marimo UIElement Base](../marimo/_plugins/ui/_core/ui_element.py)
