/**
 * Get the skew protection token from marimo's HTML
 * This maintains version protection while using custom frontend
 */
async function getServerToken() {
    try {
        // Fetch marimo's HTML page
        const response = await fetch('http://localhost:2718/');
        const html = await response.text();

        // Extract the serverToken from the HTML
        // Marimo embeds it like: "serverToken": "abc123..."
        const match = html.match(/"serverToken":\s*"([^"]+)"/);

        if (match && match[1]) {
            console.log('✅ Got server token from marimo');
            return match[1];
        } else {
            console.warn('⚠️ Could not extract server token');
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching server token:', error);
        return null;
    }
}

// Global token storage
let serverToken = null;

// Initialize - get token before any requests
async function initializeMarimo() {
    // Get the server token first
    serverToken = await getServerToken();

    if (!serverToken) {
        console.warn('⚠️ No server token - requests may fail');
    }

    // Generate unique session ID
    state.sessionId = generateSessionId();
    console.log('🔌 Initializing marimo session:', state.sessionId);

    // Connect to WebSocket
    connectWebSocket();
}

// Modified fetch to include token
async function runCell(cellId) {
    const cell = state.cells[cellId];
    if (!cell) return;

    console.log('▶️ Running cell:', cellId);
    cell.status = 'running';
    renderCell(cellId);

    state.isExecuting = true;
    updateInterruptButton();

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add server token if available
        if (serverToken) {
            headers['Marimo-Server-Token'] = serverToken;
        }

        const response = await fetch(`${MARIMO_BACKEND_URL}/api/kernel/run`, {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify({
                cell_ids: [cellId],
                codes: [cell.code]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✓ Run request sent');
    } catch (error) {
        console.error('❌ Error running cell:', error);
        cell.status = 'error';
        cell.error = { title: 'Execution Error', message: error.message };
        renderCell(cellId);
        state.isExecuting = false;
        updateInterruptButton();
    }
}
