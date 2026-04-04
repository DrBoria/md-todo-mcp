import React, { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TodoItem, TaskType } from './components/TodoItem'

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([
    { id: '1', title: 'Design database schema', description: '', assignedTo: '', isAsync: false },
    { id: '2', title: 'Implement API endpoints', description: '', assignedTo: '', isAsync: false },
    { id: '3', title: 'Create frontend components', description: '', assignedTo: '', isAsync: false }
  ])
  
  const [availableAgents, setAvailableAgents] = useState<string[]>([])

  // Listen for messages from Jabberwock (host)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'mcp-context') {
        const agents = event.data.data?.agents || []
        setAvailableAgents(agents)
      }
    }
    
    window.addEventListener('message', handler)
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
    // Send final modified plan back to Jabberwock
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

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen font-sans">
      <h2 className="text-xl font-bold mb-4">Task Execution Plan</h2>
      
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-4">
            {tasks.map(task => (
              <TodoItem
                key={task.id}
                task={task}
                agents={availableAgents}
                onUpdate={(updated) => setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="flex gap-2">
        <button 
          onClick={handleApprove} 
          className="bg-blue-600 px-4 py-2 rounded font-semibold flex-1 hover:bg-blue-700"
        >
          Approve & Execute (Batch)
        </button>
        
        <button 
          onClick={handleCancel}
          className="bg-gray-600 px-4 py-2 rounded font-semibold hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default App