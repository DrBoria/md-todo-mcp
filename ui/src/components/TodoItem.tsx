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

export interface AgentType {
  slug: string
  name: string
}

interface Props {
  task: TaskType
  index: number
  agents: AgentType[]
  onUpdate: (task: TaskType) => void
  onRemove: () => void
}

export const TodoItem: React.FC<Props> = ({ task, index, agents, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        borderBottom: '1px solid #2d2d2d',
        backgroundColor: isHovered ? '#2a2d2e' : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* MAIN ROW */}
      <div style={itemStyles.row}>
        {/* Drag handle + expand/collapse */}
        <div
          {...attributes}
          {...listeners}
          style={itemStyles.dragHandle}
          title="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.4 }}>
            <path d="M5 3h2v2H5V3zm4 0h2v2H9V3zM5 7h2v2H5V7zm4 0h2v2H9V7zm-4 4h2v2H5v-2zm4 0h2v2H9v-2z"/>
          </svg>
        </div>

        <button onClick={() => setIsExpanded(!isExpanded)} style={itemStyles.expandButton}>
          <svg 
            width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
            style={{ 
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s',
              opacity: 0.6,
            }}
          >
            <path d="M6 4l4 4-4 4V4z"/>
          </svg>
        </button>

        {/* Index badge */}
        <span style={itemStyles.indexBadge}>{index + 1}</span>

        {/* Title */}
        {isEditing ? (
          <input
            value={task.title}
            onChange={e => onUpdate({...task, title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(false) }}
            autoFocus
            style={itemStyles.titleInput}
          />
        ) : (
          <div 
            style={itemStyles.title}
            onClick={() => setIsEditing(true)}
          >
            {task.title}
          </div>
        )}

        {/* Agent badge */}
        {task.assignedTo && (
          <span style={itemStyles.agentBadge}>
            {agents.find(a => a.slug === task.assignedTo)?.name || task.assignedTo}
          </span>
        )}

        {/* Actions (visible on hover) */}
        <div style={{ ...itemStyles.actions, opacity: isHovered ? 1 : 0 }}>
          <select
            value={task.assignedTo}
            onChange={e => onUpdate({...task, assignedTo: e.target.value })}
            style={itemStyles.select}
            title="Assign agent"
          >
            <option value="">Assign...</option>
            {agents.map(agent => (
              <option key={agent.slug} value={agent.slug}>{agent.name}</option>
            ))}
          </select>
          
          <button onClick={onRemove} style={itemStyles.removeButton} title="Remove task">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div style={itemStyles.details}>
          <textarea
            value={task.description}
            onChange={e => onUpdate({...task, description: e.target.value })}
            placeholder="Add description or instructions for this task..."
            style={itemStyles.descriptionInput}
          />
          <div style={itemStyles.detailRow}>
            <label style={itemStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={task.isAsync}
                onChange={e => onUpdate({...task, isAsync: e.target.checked })}
                style={itemStyles.checkbox}
              />
              Run in parallel
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

const itemStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px 4px 4px',
    minHeight: '28px',
    cursor: 'default',
  },
  dragHandle: {
    cursor: 'grab',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  expandButton: {
    background: 'none',
    border: 'none',
    padding: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    color: '#cccccc',
  },
  indexBadge: {
    fontSize: '10px',
    color: '#858585',
    backgroundColor: '#333333',
    borderRadius: '3px',
    padding: '1px 5px',
    fontWeight: 600,
    flexShrink: 0,
    minWidth: '18px',
    textAlign: 'center' as const,
  },
  title: {
    flex: 1,
    cursor: 'text',
    padding: '2px 4px',
    borderRadius: '2px',
    color: '#cccccc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  titleInput: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    border: '1px solid #007acc',
    borderRadius: '2px',
    color: '#cccccc',
    padding: '2px 4px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  agentBadge: {
    fontSize: '11px',
    color: '#4ec9b0',
    backgroundColor: '#1e3a34',
    borderRadius: '3px',
    padding: '1px 6px',
    fontWeight: 500,
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  select: {
    backgroundColor: '#3c3c3c',
    border: '1px solid #454545',
    borderRadius: '2px',
    color: '#cccccc',
    fontSize: '11px',
    padding: '1px 4px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#cccccc',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.6,
  },
  details: {
    padding: '4px 12px 8px 44px',
  },
  descriptionInput: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    border: '1px solid #3c3c3c',
    borderRadius: '2px',
    color: '#cccccc',
    padding: '6px 8px',
    fontSize: '12px',
    fontFamily: 'inherit',
    minHeight: '60px',
    resize: 'vertical' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  detailRow: {
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#858585',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#007acc',
  },
}