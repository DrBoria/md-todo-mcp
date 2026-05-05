// MCP Todo App - Interactive UI
class TodoApp {
    constructor() {
        this.todos = [];
        this.agents = [];
        this.init();
    }

    async init() {
        // Listen for MCP context data
        window.addEventListener('message', this.handleMessage.bind(this));
        
        // Request context data
        window.parent.postMessage({
            type: 'mcp-context-request'
        }, '*');

        await this.loadTodos();
        this.setupEventListeners();
    }

    handleMessage(event) {
        if (event.data.type === 'mcp-context') {
            this.agents = event.data.data?.agents || [];
            this.populateAgentDropdown();
            return;
        }

        // ── Handle DOM query (from DevtoolProvider find_element) ──────────
        if (event.data.type === 'dom-query') {
            const req = event.data;
            if (req.command === 'serialize') {
                // Return the full innerHTML for the parent to parse and serialize
                const html = document.body ? document.body.innerHTML : '';
                event.source.postMessage({
                    type: 'dom-response',
                    requestId: req.requestId,
                    result: { html }
                }, '*');
            }
            return;
        }

        // ── Handle DOM action (from DevtoolProvider click/type/drag/scroll) ──
        if (event.data.type === 'dom-action') {
            const req = event.data;
            const el = req.selector ? document.querySelector(req.selector) : null;
            if (!el) {
                event.source.postMessage({
                    type: 'dom-response',
                    requestId: req.requestId,
                    error: `Element not found: ${req.selector}`
                }, '*');
                return;
            }

            switch (req.command) {
                case 'click': {
                    if (typeof el.click === 'function') {
                        el.click();
                    } else {
                        // Dispatch pointer events for complex components
                        const rect = el.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy };
                        el.dispatchEvent(new PointerEvent('pointerdown', opts));
                        el.dispatchEvent(new PointerEvent('pointerup', opts));
                        el.dispatchEvent(new MouseEvent('mousedown', opts));
                        el.dispatchEvent(new MouseEvent('mouseup', opts));
                        el.dispatchEvent(new MouseEvent('click', opts));
                    }
                    event.source.postMessage({
                        type: 'dom-response',
                        requestId: req.requestId,
                        result: { success: true, message: `Clicked ${req.selector}` }
                    }, '*');
                    break;
                }
                case 'type': {
                    const text = req.text || '';
                    const submit = req.submit === true;

                    if (typeof el.focus === 'function') el.focus();

                    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                        const proto = Object.getPrototypeOf(el);
                        const nativeSetter = Object.getOwnPropertyDescriptor(proto.constructor.prototype, 'value')?.set;
                        if (nativeSetter) {
                            nativeSetter.call(el, text);
                        } else {
                            el.value = text;
                        }
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    } else if (el.getAttribute('contenteditable') === 'true') {
                        const selection = window.getSelection();
                        if (selection) {
                            const range = document.createRange();
                            range.selectNodeContents(el);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                        document.execCommand('insertText', false, text);
                    } else {
                        el.textContent = text;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    if (submit) {
                        const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
                        el.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
                        el.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
                        el.dispatchEvent(new KeyboardEvent('keyup', enterOpts));
                    }

                    event.source.postMessage({
                        type: 'dom-response',
                        requestId: req.requestId,
                        result: { success: true, message: `Typed into ${req.selector}` }
                    }, '*');
                    break;
                }
                case 'scroll': {
                    const scrollAmount = 300;
                    const dir = req.direction || 'down';
                    switch (dir) {
                        case 'up': el.scrollBy({ top: -scrollAmount, behavior: 'smooth' }); break;
                        case 'down': el.scrollBy({ top: scrollAmount, behavior: 'smooth' }); break;
                        case 'left': el.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); break;
                        case 'right': el.scrollBy({ left: scrollAmount, behavior: 'smooth' }); break;
                    }
                    event.source.postMessage({
                        type: 'dom-response',
                        requestId: req.requestId,
                        result: { success: true, message: `Scrolled ${dir}` }
                    }, '*');
                    break;
                }
                case 'drag': {
                    const pixels = req.pixels || 50;
                    const dx = req.direction === 'l' ? -pixels : req.direction === 'r' ? pixels : 0;
                    const dy = req.direction === 't' ? -pixels : req.direction === 'b' ? pixels : 0;
                    const rect = el.getBoundingClientRect();
                    const startX = rect.left + rect.width / 2;
                    const startY = rect.top + rect.height / 2;
                    const dispatchMouse = (type, x, y) => {
                        el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
                    };
                    dispatchMouse('mousedown', startX, startY);
                    dispatchMouse('mousemove', startX + dx, startY + dy);
                    dispatchMouse('mouseup', startX + dx, startY + dy);
                    event.source.postMessage({
                        type: 'dom-response',
                        requestId: req.requestId,
                        result: { success: true, message: `Dragged ${req.direction} ${pixels}px` }
                    }, '*');
                    break;
                }
                default:
                    event.source.postMessage({
                        type: 'dom-response',
                        requestId: req.requestId,
                        error: `Unknown command: ${req.command}`
                    }, '*');
            }
            return;
        }
    }

    populateAgentDropdown() {
        const select = document.getElementById('assignedTo');
        select.innerHTML = '';
        
        this.agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.slug;
            option.textContent = agent.name;
            select.appendChild(option);
        });
    }

    async loadTodos() {
        try {
            // This would call the MCP server to get todos
            // For now, we'll use mock data
            this.todos = [
                { id: 1, title: 'Sample Task', description: 'This is a sample task', 
                  assignedTo: 'manager', priority: 'medium', status: 'pending' }
            ];
            this.renderTodos();
        } catch (error) {
            console.error('Failed to load todos:', error);
        }
    }

    renderTodos() {
        const container = document.getElementById('todo-list');
        container.innerHTML = '';

        this.todos.forEach(todo => {
            const todoEl = document.createElement('div');
            todoEl.className = 'todo-item';
            todoEl.innerHTML = `
                <div class="todo-title">${todo.title}</div>
                <div class="todo-meta">
                    Assigned to: ${todo.assignedTo} | 
                    Priority: ${todo.priority} | 
                    Status: ${todo.status}
                </div>
                <div>${todo.description}</div>
                <div class="todo-actions">
                    <button class="btn-edit" onclick="app.editTodo(${todo.id})">Edit</button>
                    <button class="btn-approve" onclick="app.approveTodo(${todo.id})">Approve</button>
                    <button class="btn-delete" onclick="app.deleteTodo(${todo.id})">Delete</button>
                </div>
            `;
            container.appendChild(todoEl);
        });
    }

    async createTodo() {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const assignedTo = document.getElementById('assignedTo').value;
        const priority = document.getElementById('priority').value;

        if (!title) {
            alert('Title is required');
            return;
        }

        try {
            // Send data back to MCP server
            window.parent.postMessage({
                type: 'mcp-action',
                action: 'accept',
                content: {
                    title,
                    description,
                    assignedTo,
                    priority,
                    action: 'create_todo'
                }
            }, '*');

            // Clear form
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            
        } catch (error) {
            console.error('Failed to create todo:', error);
        }
    }

    async editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        // In a real implementation, this would open an edit modal
        const newTitle = prompt('Edit title:', todo.title);
        if (newTitle !== null) {
            window.parent.postMessage({
                type: 'mcp-action',
                action: 'accept',
                content: {
                    id,
                    title: newTitle,
                    action: 'edit_todo'
                }
            }, '*');
        }
    }

    async approveTodo(id) {
        window.parent.postMessage({
            type: 'mcp-action',
            action: 'accept',
            content: {
                id,
                action: 'approve_todo'
            }
        }, '*');
    }

    async deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            window.parent.postMessage({
                type: 'mcp-action',
                action: 'accept',
                content: {
                    id,
                    action: 'delete_todo'
                }
            }, '*');
        }
    }
}

// Global functions for HTML onclick handlers
function createTodo() {
    window.app.createTodo();
}

// Initialize app
window.app = new TodoApp();