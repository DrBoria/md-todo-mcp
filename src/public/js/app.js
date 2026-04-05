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