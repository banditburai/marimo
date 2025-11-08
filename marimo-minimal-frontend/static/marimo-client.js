/**
 * Minimal Marimo Frontend - WebSocket Client
 * Connects to marimo backend for real-time notebook execution
 */

// Configuration
const MARIMO_BACKEND_URL = 'http://localhost:2718';
const MARIMO_WS_URL = 'ws://localhost:2718/ws';
const MARIMO_FILE = 'notebook.py'; // Default file name - change this to match your notebook

// State
let state = {
    sessionId: null,
    ws: null,
    cells: {},
    cellOrder: [],
    isConnected: false,
    isExecuting: false,
    file: MARIMO_FILE
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeMarimo();
    setupEventListeners();
});

/**
 * Initialize connection to marimo backend
 */
function initializeMarimo() {
    // Generate unique session ID
    state.sessionId = generateSessionId();
    console.log('🔌 Initializing marimo session:', state.sessionId);

    // Connect to WebSocket
    connectWebSocket();
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
    return 'session-' + crypto.randomUUID();
}

/**
 * Connect to marimo WebSocket
 */
function connectWebSocket() {
    // IMPORTANT: marimo requires both session_id AND file parameters
    const wsUrl = `${MARIMO_WS_URL}?session_id=${state.sessionId}&file=${state.file}`;
    console.log('🔌 Connecting to:', wsUrl);

    updateStatus('Connecting...', 'disconnected');

    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = handleWSOpen;
    state.ws.onmessage = handleWSMessage;
    state.ws.onerror = handleWSError;
    state.ws.onclose = handleWSClose;
}

/**
 * WebSocket event handlers
 */
function handleWSOpen(event) {
    console.log('✅ WebSocket connected');
    state.isConnected = true;
    updateStatus('Connected', 'connected');
}

function handleWSMessage(event) {
    try {
        const message = JSON.parse(event.data);
        console.log('📨 Received:', message.op, message);

        switch (message.op) {
            case 'kernel-ready':
                handleKernelReady(message.data);
                break;
            case 'cell-op':
                handleCellOperation(message.data);
                break;
            case 'alert':
                handleAlert(message.data);
                break;
            case 'completed-run':
                handleCompletedRun(message.data);
                break;
            case 'interrupted':
                handleInterrupted(message.data);
                break;
            default:
                console.log('ℹ️ Unhandled message type:', message.op);
        }
    } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
    }
}

function handleWSError(event) {
    console.error('❌ WebSocket error:', event);
    updateStatus('Connection Error', 'error');
}

function handleWSClose(event) {
    console.log('🔌 WebSocket closed');
    state.isConnected = false;
    updateStatus('Disconnected', 'disconnected');

    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        connectWebSocket();
    }, 3000);
}

/**
 * Handle kernel-ready message (initial state)
 */
function handleKernelReady(data) {
    console.log('🚀 Kernel ready!', data);

    // Initialize cells from kernel state
    state.cells = {};
    state.cellOrder = data.cell_ids || [];

    data.cell_ids.forEach((cellId, index) => {
        state.cells[cellId] = {
            id: cellId,
            code: data.codes[index] || '',
            status: 'idle',
            output: null,
            error: null,
            config: data.configs?.[index] || {}
        };
    });

    // If no cells exist, create one
    if (state.cellOrder.length === 0) {
        addNewCell();
    }

    renderAllCells();
    updateStatus('Ready', 'ready');
}

/**
 * Handle cell operation message (execution updates)
 */
function handleCellOperation(data) {
    const cellId = data.cell_id;

    if (!state.cells[cellId]) {
        console.warn('⚠️ Received update for unknown cell:', cellId);
        return;
    }

    const cell = state.cells[cellId];

    // Update cell status
    if (data.status) {
        cell.status = data.status;
    }

    // Update output
    if (data.output) {
        cell.output = data.output;
    }

    // Update error
    if (data.error) {
        cell.error = data.error;
    }

    // Check if still executing
    state.isExecuting = Object.values(state.cells).some(c => c.status === 'running');
    updateInterruptButton();

    // Re-render the cell
    renderCell(cellId);
}

/**
 * Handle alert message
 */
function handleAlert(data) {
    console.log('🔔 Alert:', data);
    showNotification(data.title || 'Alert', data.description || '', data.variant || 'info');
}

/**
 * Handle completed run
 */
function handleCompletedRun(data) {
    console.log('✅ Run completed');
    state.isExecuting = false;
    updateInterruptButton();
}

/**
 * Handle interrupted execution
 */
function handleInterrupted(data) {
    console.log('⏹️ Execution interrupted');
    state.isExecuting = false;
    updateInterruptButton();
}

/**
 * API Functions - Send commands to marimo backend
 */
async function runCell(cellId) {
    const cell = state.cells[cellId];
    if (!cell) return;

    console.log('▶️ Running cell:', cellId);
    cell.status = 'running';
    renderCell(cellId);

    state.isExecuting = true;
    updateInterruptButton();

    try {
        const response = await fetch(`${MARIMO_BACKEND_URL}/api/kernel/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cell_ids: [cellId],
                codes: [cell.code]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Note: Actual execution results come via WebSocket, not HTTP response
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

async function runAllCells() {
    console.log('▶️ Running all cells');

    const cellIds = state.cellOrder;
    const codes = cellIds.map(id => state.cells[id].code);

    // Mark all as running
    cellIds.forEach(id => {
        state.cells[id].status = 'running';
        renderCell(id);
    });

    state.isExecuting = true;
    updateInterruptButton();

    try {
        const response = await fetch(`${MARIMO_BACKEND_URL}/api/kernel/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cell_ids: cellIds,
                codes: codes
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✓ Run all request sent');
    } catch (error) {
        console.error('❌ Error running all cells:', error);
        showNotification('Error', error.message, 'error');
        state.isExecuting = false;
        updateInterruptButton();
    }
}

async function interruptExecution() {
    console.log('⏹️ Interrupting execution');

    try {
        const response = await fetch(`${MARIMO_BACKEND_URL}/api/kernel/interrupt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✓ Interrupt request sent');
    } catch (error) {
        console.error('❌ Error interrupting:', error);
        showNotification('Error', error.message, 'error');
    }
}

/**
 * Cell Management
 */
function addNewCell(afterCellId = null) {
    const newCellId = 'cell-' + crypto.randomUUID();

    state.cells[newCellId] = {
        id: newCellId,
        code: '',
        status: 'idle',
        output: null,
        error: null,
        config: {}
    };

    // Insert in order
    if (afterCellId && state.cellOrder.includes(afterCellId)) {
        const index = state.cellOrder.indexOf(afterCellId);
        state.cellOrder.splice(index + 1, 0, newCellId);
    } else {
        state.cellOrder.push(newCellId);
    }

    renderAllCells();

    // Focus the new cell
    setTimeout(() => {
        const textarea = document.querySelector(`#cell-${newCellId} textarea`);
        if (textarea) textarea.focus();
    }, 100);
}

async function deleteCell(cellId) {
    if (state.cellOrder.length <= 1) {
        showNotification('Info', 'Cannot delete the last cell', 'info');
        return;
    }

    // Remove from state
    delete state.cells[cellId];
    state.cellOrder = state.cellOrder.filter(id => id !== cellId);

    renderAllCells();

    // Optionally send delete to backend
    try {
        await fetch(`${MARIMO_BACKEND_URL}/api/kernel/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cell_id: cellId })
        });
    } catch (error) {
        console.error('❌ Error deleting cell:', error);
    }
}

/**
 * Rendering Functions
 */
function renderAllCells() {
    const container = document.getElementById('cells-container');
    container.innerHTML = '';

    state.cellOrder.forEach(cellId => {
        const cellElement = createCellElement(cellId);
        container.appendChild(cellElement);
    });
}

function renderCell(cellId) {
    const existingElement = document.getElementById(`cell-${cellId}`);
    if (existingElement) {
        const newElement = createCellElement(cellId);
        existingElement.replaceWith(newElement);
    }
}

function createCellElement(cellId) {
    const cell = state.cells[cellId];
    const cellDiv = document.createElement('div');
    cellDiv.id = `cell-${cellId}`;
    cellDiv.className = `cell cell-${cell.status}`;

    // Status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `cell-status cell-status-${cell.status}`;
    statusIndicator.title = cell.status;

    // Code editor
    const codeEditor = document.createElement('textarea');
    codeEditor.className = 'cell-code';
    codeEditor.value = cell.code;
    codeEditor.placeholder = 'Enter Python code...';
    codeEditor.spellcheck = false;

    // Auto-resize textarea
    codeEditor.addEventListener('input', (e) => {
        cell.code = e.target.value;
        autoResizeTextarea(e.target);
    });

    // Keyboard shortcuts
    codeEditor.addEventListener('keydown', (e) => {
        // Shift+Enter: Run cell
        if (e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            runCell(cellId);
        }
        // Ctrl+Enter: Run cell and add new
        else if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runCell(cellId);
            addNewCell(cellId);
        }
        // Tab: Insert spaces
        else if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.substring(0, start) + '    ' + e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 4;
            cell.code = e.target.value;
        }
    });

    // Initial resize
    setTimeout(() => autoResizeTextarea(codeEditor), 0);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'cell-controls';

    const runBtn = document.createElement('button');
    runBtn.className = 'cell-btn cell-btn-run';
    runBtn.innerHTML = '▶';
    runBtn.title = 'Run (Shift+Enter)';
    runBtn.onclick = () => runCell(cellId);

    const addBtn = document.createElement('button');
    addBtn.className = 'cell-btn cell-btn-add';
    addBtn.innerHTML = '+';
    addBtn.title = 'Add Cell Below (Ctrl+Enter)';
    addBtn.onclick = () => addNewCell(cellId);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'cell-btn cell-btn-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete Cell';
    deleteBtn.onclick = () => deleteCell(cellId);

    controls.appendChild(runBtn);
    controls.appendChild(addBtn);
    controls.appendChild(deleteBtn);

    // Output area
    const outputDiv = document.createElement('div');
    outputDiv.className = 'cell-output';

    if (cell.output) {
        outputDiv.appendChild(renderOutput(cell.output));
    }

    if (cell.error) {
        outputDiv.appendChild(renderError(cell.error));
    }

    // Assemble cell
    const editorContainer = document.createElement('div');
    editorContainer.className = 'cell-editor';
    editorContainer.appendChild(statusIndicator);
    editorContainer.appendChild(codeEditor);
    editorContainer.appendChild(controls);

    cellDiv.appendChild(editorContainer);
    cellDiv.appendChild(outputDiv);

    return cellDiv;
}

function renderOutput(output) {
    const outputElement = document.createElement('div');
    outputElement.className = 'output-content';

    const mimetype = output.mimetype;
    const data = output.data;

    if (mimetype === 'text/plain') {
        const pre = document.createElement('pre');
        pre.textContent = data;
        outputElement.appendChild(pre);
    } else if (mimetype === 'text/html') {
        outputElement.innerHTML = data;
    } else if (mimetype === 'text/markdown') {
        // Simple markdown rendering (you could use a library like marked.js)
        const div = document.createElement('div');
        div.innerHTML = data; // Note: In production, use a proper markdown parser
        outputElement.appendChild(div);
    } else if (mimetype.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = `data:${mimetype};base64,${data}`;
        img.style.maxWidth = '100%';
        outputElement.appendChild(img);
    } else if (mimetype === 'application/json') {
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(JSON.parse(data), null, 2);
        outputElement.appendChild(pre);
    } else {
        const pre = document.createElement('pre');
        pre.textContent = `[${mimetype}]\n${data}`;
        outputElement.appendChild(pre);
    }

    return outputElement;
}

function renderError(error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'output-error';

    const title = document.createElement('div');
    title.className = 'error-title';
    title.textContent = error.title || 'Error';

    const message = document.createElement('pre');
    message.className = 'error-message';
    message.textContent = error.message || error.msg || '';

    errorElement.appendChild(title);
    errorElement.appendChild(message);

    return errorElement;
}

/**
 * UI Helpers
 */
function updateStatus(text, status) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = text;
        statusElement.className = `status-${status}`;
    }
}

function updateInterruptButton() {
    const interruptBtn = document.getElementById('interrupt-btn');
    if (interruptBtn) {
        interruptBtn.disabled = !state.isExecuting;
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function showNotification(title, message, variant = 'info') {
    // Simple notification (could be enhanced with a toast library)
    console.log(`[${variant.toUpperCase()}] ${title}: ${message}`);
    alert(`${title}\n${message}`);
}

/**
 * Event Listeners
 */
function setupEventListeners() {
    // Add cell button
    const addCellBtn = document.getElementById('add-cell-btn');
    if (addCellBtn) {
        addCellBtn.onclick = () => addNewCell();
    }

    // Run all button
    const runAllBtn = document.getElementById('run-all-btn');
    if (runAllBtn) {
        runAllBtn.onclick = () => runAllCells();
    }

    // Interrupt button
    const interruptBtn = document.getElementById('interrupt-btn');
    if (interruptBtn) {
        interruptBtn.onclick = () => interruptExecution();
    }
}

// Export for debugging
window.marimoState = state;
window.marimoDebug = {
    runCell,
    runAllCells,
    addNewCell,
    deleteCell
};

console.log('✨ Marimo client initialized');
