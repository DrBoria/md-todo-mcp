import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface TaskType {
  id: string
  title: string
  description: string
  assignedTo: string
  isAsync: boolean
}

interface Props {
  task: TaskType
  agents: string[]
  onUpdate: (task: TaskType) => void
}

export const TodoItem: React.FC<Props> = ({ task, agents, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-gray-800 p-3 rounded border border-gray-700"
    >
      <div className="flex items-center gap-3">
        {/* Expand/Collapse Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-gray-400 hover:text-white"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab text-gray-500 hover:text-white"
        >
          ≡
        </div>

        {/* Editable Title */}
        {isEditing ? (
          <input
            value={task.title}
            onChange={e => onUpdate({...task, title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false)
              }
            }}
            autoFocus
            className="flex-1 bg-gray-900 px-2 py-1 rounded border border-gray-600"
          />
        ) : (
          <div 
            className="flex-1 font-medium cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </div>
        )}
        
        {/* Agent Selector */}
        <select
          value={task.assignedTo}
          onChange={e => onUpdate({...task, assignedTo: e.target.value })}
          className="bg-gray-700 rounded px-2 py-1 text-sm border border-gray-600"
        >
          <option value="">Unassigned</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>

        {/* Async Checkbox */}
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={task.isAsync}
            onChange={e => onUpdate({...task, isAsync: e.target.checked })}
            className="rounded border-gray-600"
          />
          Batch
        </label>
      </div>

      {/* Expandable Description Textarea */}
      {isExpanded && (
        <div className="mt-3 pl-8">
          <textarea
            value={task.description}
            onChange={e => onUpdate({...task, description: e.target.value })}
            placeholder="Detailed instructions for the assigned agent..."
            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm min-h-[80px] resize-vertical"
          />
        </div>
      )}
    </div>
  )
}