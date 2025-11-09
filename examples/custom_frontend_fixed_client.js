/**
 * Fixed marimo-client.js with proper authentication
 *
 * This version includes:
 * - Server token retrieval
 * - Session ID generation
 * - Required headers in all API calls
 */

class MarimoClient {
    constructor() {
        this.config = {
            backendUrl: 'http://localhost:2718',
            serverToken: null,
            sessionId: null,
        };
        this.initialized = false;
    }

    /**
     * Initialize the client by retrieving tokens from marimo backend
     */
    async initialize() {
        try {
            console.log('🔧 Initializing marimo client...');

            // Method 1: Fetch marimo's index page and extract config
            const response = await fetch(this.config.backendUrl);
            const html = await response.text();

            // Extract __MARIMO_MOUNT_CONFIG__ from the HTML
            const configMatch = html.match(/window\.__MARIMO_MOUNT_CONFIG__\s*=\s*'([^']+)'/);

            if (configMatch) {
                const configJson = configMatch[1];
                const config = JSON.parse(configJson);

                this.config.serverToken = config.serverToken;
                console.log('✅ Server token retrieved:', this.config.serverToken);
            } else {
                console.warn('⚠️ Could not find server token in HTML, trying alternative method...');

                // Alternative: Extract from <marimo-server-token> element
                const tokenMatch = html.match(/<marimo-server-token[^>]*data-token="([^"]+)"/);
                if (tokenMatch) {
                    this.config.serverToken = tokenMatch[1];
                    console.log('✅ Server token retrieved from element:', this.config.serverToken);
                }
            }

            // Generate or retrieve session ID
            this.config.sessionId = this.getOrCreateSessionId();
            console.log('✅ Session ID:', this.config.sessionId);

            this.initialized = true;
            console.log('✅ Marimo client initialized successfully');

            return true;

        } catch (error) {
            console.error('❌ Failed to initialize marimo client:', error);
            throw error;
        }
    }

    /**
     * Get or create a session ID
     */
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('marimo-session-id');

        if (!sessionId) {
            // Generate a unique session ID
            sessionId = 'session-' + this.generateUUID();
            localStorage.setItem('marimo-session-id', sessionId);
        }

        return sessionId;
    }

    /**
     * Generate a UUID for session ID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get headers for API requests
     */
    getHeaders() {
        if (!this.initialized) {
            throw new Error('Client not initialized. Call initialize() first.');
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        // Add required marimo headers
        if (this.config.serverToken) {
            headers['Marimo-Server-Token'] = this.config.serverToken;
        }

        if (this.config.sessionId) {
            headers['Marimo-Session-Id'] = this.config.sessionId;
        }

        return headers;
    }

    /**
     * Run a cell
     */
    async runCell(cellId, code) {
        console.log(`▶️ Running cell: ${cellId}`);

        try {
            const url = `${this.config.backendUrl}/api/kernel/run`;
            const headers = this.getHeaders();

            console.log('📤 Request headers:', headers);

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    cell_ids: [cellId],
                    code: code,
                }),
            });

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    const errorData = await response.json().catch(() => ({}));

                    if (errorData.error && errorData.error.includes('Invalid server token')) {
                        console.error('🔄 Version skew detected - server has been updated');

                        if (confirm('The server has been updated. Refresh the page to continue?')) {
                            window.location.reload();
                        }
                        throw new Error('Version skew: Server token mismatch');
                    }

                    if (errorData.error && errorData.error.includes('Missing server token')) {
                        console.error('❌ Server token not sent - check headers');
                        throw new Error('Missing server token in request');
                    }

                    throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unauthorized'}`);
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Cell executed successfully:', data);

            return data;

        } catch (error) {
            console.error('❌ Error running cell:', error);
            throw error;
        }
    }

    /**
     * Get kernel status
     */
    async getStatus() {
        try {
            const url = `${this.config.backendUrl}/api/status`;
            const headers = this.getHeaders();

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('❌ Error getting status:', error);
            throw error;
        }
    }

    /**
     * Generic API call helper
     */
    async apiCall(endpoint, method = 'GET', body = null) {
        try {
            const url = `${this.config.backendUrl}/api${endpoint}`;
            const headers = this.getHeaders();

            const options = {
                method: method,
                headers: headers,
            };

            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`❌ API call failed (${method} ${endpoint}):`, error);
            throw error;
        }
    }
}

// Create a singleton instance
const marimoClient = new MarimoClient();

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await marimoClient.initialize();
        console.log('🚀 Marimo client ready!');

        // Test connection
        const status = await marimoClient.getStatus();
        console.log('📊 Server status:', status);

    } catch (error) {
        console.error('Failed to initialize marimo client:', error);
        alert('Failed to connect to marimo backend. Check console for details.');
    }
});

// Export for use in other scripts
window.marimoClient = marimoClient;

// Example usage:
/*
// Wait for initialization, then run a cell
window.marimoClient.runCell('my-cell-id', 'print("Hello from custom frontend!")');

// Get server status
window.marimoClient.getStatus().then(status => console.log(status));

// Make custom API calls
window.marimoClient.apiCall('/kernel/code', 'GET').then(code => console.log(code));
*/
