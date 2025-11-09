# Custom Frontend Integration Guide

This guide shows how to integrate a custom frontend (like starhtml) with marimo's backend while maintaining proper authentication and skew protection.

## Architecture

```
Custom Frontend (localhost:8000)
    ↓ CORS requests
Marimo Backend (localhost:2718)
    ↓ Validates tokens
Marimo Python Runtime
```

## Step 1: Configure Marimo Backend

### Option A: CLI (Development)

```bash
marimo edit app.py \
  --host 0.0.0.0 \
  --port 2718 \
  --allow-origins "http://localhost:8000" \
  --allow-origins "http://127.0.0.1:8000" \
  --token-password "your-secure-token-here" \
  # Keep skew protection enabled (default)
```

### Option B: Programmatic (Production)

```python
# start_marimo.py
from marimo import create_asgi_app
import uvicorn

# Create marimo ASGI app with security enabled
server = create_asgi_app(
    # Token for session authentication
    token="your-secure-token-here",

    # Skew protection enabled (prevents version mismatch)
    skew_protection=True,

    # Include code in API responses (if needed)
    include_code=True,
).with_app(path="/", root="app.py")

app = server.build()

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=2718,
        # CORS will be handled by marimo's CORSMiddleware
        # configured via CLI or in create_asgi_app
    )
```

## Step 2: Custom Frontend - Retrieve Tokens

### Method 1: Embed in HTML Template

If you're serving the custom frontend alongside marimo, you can inject tokens into your HTML:

```html
<!-- custom_frontend.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Custom Marimo Frontend</title>
</head>
<body>
    <div id="app"></div>

    <!-- Embed marimo configuration -->
    <script>
        window.__MARIMO_CONFIG__ = {
            serverToken: "{{ server_token }}",  // From marimo backend
            sessionId: "{{ session_id }}",       // Generate or retrieve
            backendUrl: "http://localhost:2718",
            authToken: "{{ auth_token }}"        // Optional
        };
    </script>

    <script src="/static/app.js"></script>
</body>
</html>
```

### Method 2: Fetch from API Endpoint

Create a dedicated endpoint in marimo to expose configuration:

```python
# In your marimo app or custom server wrapper
from starlette.responses import JSONResponse
from marimo._server.api.deps import AppState

async def get_config(request):
    """Endpoint to retrieve frontend configuration."""
    app_state = AppState(request)

    return JSONResponse({
        "serverToken": str(app_state.skew_protection_token),
        "sessionId": str(app_state.get_current_session_id() or ""),
        "version": app_state.version,
    })
```

### Method 3: Extract from marimo's HTML

If using marimo's built-in HTML, parse the mount config:

```javascript
// custom_frontend.js
async function getMarimoConfig() {
    // Fetch marimo's index page
    const response = await fetch('http://localhost:2718/');
    const html = await response.text();

    // Extract __MARIMO_MOUNT_CONFIG__
    const match = html.match(/window\.__MARIMO_MOUNT_CONFIG__\s*=\s*'(.+?)'/);
    if (!match) {
        throw new Error('Could not find marimo config');
    }

    // Parse the JSON
    const config = JSON.parse(match[1]);

    return {
        serverToken: config.serverToken,
        sessionId: generateSessionId(), // Generate client-side
        backendUrl: 'http://localhost:2718'
    };
}

function generateSessionId() {
    // Generate a unique session ID (or retrieve from localStorage)
    let sessionId = localStorage.getItem('marimo-session-id');
    if (!sessionId) {
        sessionId = 'session-' + Math.random().toString(36).substring(2);
        localStorage.setItem('marimo-session-id', sessionId);
    }
    return sessionId;
}
```

## Step 3: Custom Frontend - Store Tokens

```javascript
// config-manager.js
class MarimoConfigManager {
    constructor() {
        this.config = null;
    }

    async initialize() {
        // Use one of the methods above
        this.config = await getMarimoConfig();
        console.log('Marimo config loaded:', this.config);
    }

    getHeaders() {
        if (!this.config) {
            throw new Error('Config not initialized');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Marimo-Server-Token': this.config.serverToken,
            'Marimo-Session-Id': this.config.sessionId,
        };

        // Optional: Add auth token for remote backends
        if (this.config.authToken) {
            headers['Authorization'] = `Bearer ${this.config.authToken}`;
        }

        return headers;
    }

    getBackendUrl() {
        return this.config?.backendUrl || 'http://localhost:2718';
    }
}

// Singleton instance
export const configManager = new MarimoConfigManager();
```

## Step 4: Custom Frontend - Pass Tokens in Requests

### Basic Fetch Wrapper

```javascript
// api-client.js
import { configManager } from './config-manager.js';

class MarimoAPIClient {
    async post(endpoint, data) {
        const url = `${configManager.getBackendUrl()}/api${endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: configManager.getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            if (response.status === 401) {
                const error = await response.json();
                if (error.error.includes('server token')) {
                    throw new Error('Version mismatch: Please refresh the page');
                }
                throw new Error('Authentication failed');
            }
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }

    async get(endpoint) {
        const url = `${configManager.getBackendUrl()}/api${endpoint}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: configManager.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }
}

export const apiClient = new MarimoAPIClient();
```

### Usage in Your Custom Frontend

```javascript
// app.js
import { configManager } from './config-manager.js';
import { apiClient } from './api-client.js';

async function initializeApp() {
    try {
        // Initialize config (fetch tokens)
        await configManager.initialize();

        // Now you can make API calls
        const status = await apiClient.get('/status');
        console.log('Server status:', status);

        // Execute code
        const result = await apiClient.post('/kernel/run', {
            cell_ids: ['cell-1'],
            code: 'print("Hello from custom frontend!")'
        });

        console.log('Execution result:', result);

    } catch (error) {
        console.error('Failed to initialize:', error);

        // Handle version skew errors
        if (error.message.includes('Version mismatch')) {
            alert('The server has been updated. Please refresh the page.');
        }
    }
}

// Start the app
initializeApp();
```

## Step 5: Handle WebSocket Connections

For WebSocket connections, pass tokens via query parameters:

```javascript
// websocket-client.js
import { configManager } from './config-manager.js';

function connectWebSocket() {
    const { serverToken, sessionId, backendUrl } = configManager.config;

    // Convert http to ws
    const wsUrl = backendUrl.replace('http', 'ws');

    // Add tokens to query string
    const params = new URLSearchParams({
        'session_id': sessionId,
    });

    const ws = new WebSocket(`${wsUrl}/ws?${params}`);

    ws.onopen = () => {
        console.log('WebSocket connected');

        // Send initial handshake with server token
        ws.send(JSON.stringify({
            type: 'handshake',
            serverToken: serverToken
        }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };

    return ws;
}
```

## Step 6: Error Handling

### Handle Skew Protection Errors

```javascript
// error-handler.js
export function handleMarimoError(error, response) {
    if (response?.status === 401) {
        const errorData = await response.json();

        if (errorData.error.includes('Invalid server token')) {
            // Version skew detected
            console.error('Version skew detected - server code has changed');

            // Reload the page to get new tokens
            if (confirm('The server has been updated. Refresh to continue?')) {
                window.location.reload();
            }
            return;
        }

        if (errorData.error.includes('Missing server token')) {
            console.error('Server token not sent - check headers');
            return;
        }
    }

    // Other error handling
    console.error('API Error:', error);
}
```

## Step 7: Testing

### Test Token Flow

```javascript
// test-tokens.js
import { configManager } from './config-manager.js';
import { apiClient } from './api-client.js';

async function testTokens() {
    console.log('Testing token flow...');

    // 1. Initialize and retrieve tokens
    await configManager.initialize();
    console.log('✓ Tokens retrieved');

    // 2. Test headers are correct
    const headers = configManager.getHeaders();
    console.log('Headers:', headers);

    if (!headers['Marimo-Server-Token']) {
        throw new Error('Missing Marimo-Server-Token header');
    }
    if (!headers['Marimo-Session-Id']) {
        throw new Error('Missing Marimo-Session-Id header');
    }
    console.log('✓ Headers configured correctly');

    // 3. Test API call
    try {
        const status = await apiClient.get('/status');
        console.log('✓ API call successful:', status);
    } catch (error) {
        console.error('✗ API call failed:', error);
        throw error;
    }

    console.log('All tests passed!');
}

// Run tests
testTokens().catch(console.error);
```

## Common Issues

### Issue 1: "Missing server token" Error

**Cause:** Headers not being sent or stripped by proxy

**Solution:**
```javascript
// Ensure headers are set on every request
const headers = {
    'Marimo-Server-Token': serverToken,  // Required!
    'Marimo-Session-Id': sessionId,      // Required!
};
```

### Issue 2: "Invalid server token" Error

**Cause:** Server restarted or code changed, tokens are stale

**Solution:**
```javascript
// Refresh tokens on 401 errors
if (response.status === 401) {
    await configManager.initialize();  // Re-fetch tokens
    // Retry request
}
```

### Issue 3: CORS Errors

**Cause:** Origin not whitelisted

**Solution:**
```bash
# Add your frontend origin
marimo edit --allow-origins "http://localhost:8000"
```

### Issue 4: Headers Stripped by Reverse Proxy

**Cause:** Nginx/Apache removing custom headers

**Solution (nginx):**
```nginx
location /api {
    proxy_pass http://localhost:2718;
    proxy_set_header Marimo-Server-Token $http_marimo_server_token;
    proxy_set_header Marimo-Session-Id $http_marimo_session_id;
}
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Use strong token passwords** (`--token-password`)
3. **Whitelist specific origins** (never use `"*"` in production)
4. **Validate tokens on every request**
5. **Implement token refresh** on version skew
6. **Store tokens securely** (not in localStorage if sensitive)
7. **Use CSP headers** to prevent XSS

## Example: Full Integration

```javascript
// main.js - Complete example
import { configManager } from './config-manager.js';
import { apiClient } from './api-client.js';

class CustomMarimoFrontend {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        try {
            // Step 1: Get tokens from marimo
            await configManager.initialize();

            // Step 2: Connect to backend
            this.initialized = true;

            console.log('✓ Custom frontend initialized');
            return true;

        } catch (error) {
            console.error('Initialization failed:', error);
            return false;
        }
    }

    async executeCell(code) {
        if (!this.initialized) {
            throw new Error('Frontend not initialized');
        }

        // Tokens are automatically included via configManager
        return await apiClient.post('/kernel/run', {
            code: code,
            cell_id: 'custom-cell-' + Date.now()
        });
    }

    async getStatus() {
        return await apiClient.get('/status');
    }
}

// Export singleton
export const frontend = new CustomMarimoFrontend();

// Auto-initialize on load
window.addEventListener('DOMContentLoaded', async () => {
    const success = await frontend.initialize();
    if (success) {
        // Your custom UI code here
        console.log('Ready to use marimo backend!');
    }
});
```

## References

- marimo/_server/tokens.py:8-62 - Token implementation
- marimo/_server/api/middleware.py:116-174 - Skew protection validation
- frontend/src/core/runtime/runtime.ts:251-266 - Official frontend headers
- frontend/src/core/network/api.ts:22-104 - Official API client
