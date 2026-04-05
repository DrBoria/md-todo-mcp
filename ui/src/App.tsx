import React, { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TodoItem, TaskType, AgentType } from './components/TodoItem'

const DEFAULT_TASKS: TaskType[] = [
  { id: '1', title: 'New task', description: '', assignedTo: '', isAsync: false }
]

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>(DEFAULT_TASKS)
  const [availableAgents, setAvailableAgents] = useState<AgentType[]>([])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'mcp-context') {
        const rawAgents = event.data.data?.agents || []
        const parsedAgents = typeof rawAgents === 'string' ? JSON.parse(rawAgents) : rawAgents
        setAvailableAgents(Array.isArray(parsedAgents) ? parsedAgents : [])

        const rawInput = event.data.data?.input
        if (rawInput) {
          const parsedInput = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput
          if (parsedInput?.initialTasks && Array.isArray(parsedInput.initialTasks)) {
            const mapped = parsedInput.initialTasks.map((t: Record<string, string>, i: number) => ({
              id: t.id || String(Date.now() + i),
              title: t.title || 'Untitled',
              description: t.description || '',
              assignedTo: t.assignedTo || '',
              isAsync: t.isAsync === 'true' || (t as any).isAsync === true || false,
            }))
            if (mapped.length > 0) {
              setTasks(mapped)
            }
          }
        }
      }
    }
    
    window.addEventListener('message', handler)
    // Request context from parent once the listener is attached
    window.parent.postMessage({ type: 'mcp-context-request' }, '*')
    
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleApprove = () => {
    window.parent.postMessage({
      type: 'mcp-action',
      action: 'accept',
      content: { tasks }
    }, '*')
  }

  const handleCancel = () => {
    window.parent.postMessage({
      type: 'mcp-action',
      action: 'cancel'
    }, '*')
  }

  const addTask = () => {
    const newId = String(Date.now())
    setTasks(prev => [...prev, {
      id: newId,
      title: 'New task',
      description: '',
      assignedTo: '',
      isAsync: false,
    }])
  }

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.8 }}>
            <path d="M14 1H3L2 2v12l1 1h11l1-1V2l-1-1zM8 13H3V2h5v11zm6 0H9V2h5v11z"/>
          </svg>
          <span style={styles.headerTitle}>Task Execution Plan</span>
        </div>
        <button onClick={addTask} style={styles.addButton} title="Add task">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z"/>
          </svg>
        </button>
      </div>

      {/* TASK COUNT */}
      <div style={styles.taskCount}>
        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </div>

      {/* TASK LIST */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div style={styles.taskList}>
            {tasks.map((task, index) => (
              <TodoItem
                key={task.id}
                task={task}
                index={index}
                agents={availableAgents}
                onUpdate={(updated) => setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))}
                onRemove={() => removeTask(task.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* ACTION BUTTONS */}
      <div style={styles.actions}>
        <button onClick={handleApprove} style={styles.approveButton}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.27 10.87h.71l4.56-4.56-.71-.71-4.2 4.21-1.92-1.92L4 8.6l2.27 2.27z"/>
          </svg>
          Approve & Execute
        </button>
        <button onClick={handleCancel} style={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    color: '#cccccc',
    backgroundColor: '#1e1e1e',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #2d2d2d',
    backgroundColor: '#252526',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#cccccc',
  },
  addButton: {
    background: 'none',
    border: 'none',
    color: '#cccccc',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
  },
  taskCount: {
    padding: '6px 12px',
    fontSize: '11px',
    color: '#858585',
    borderBottom: '1px solid #2d2d2d',
  },
  taskList: {
    flex: 1,
    overflow: 'auto',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    padding: '10px 12px',
    borderTop: '1px solid #2d2d2d',
    backgroundColor: '#252526',
  },
  approveButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#0e639c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '2px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#cccccc',
    border: '1px solid #454545',
    borderRadius: '2px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}

export default App