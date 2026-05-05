import { memo } from 'react'
import { motion, Reorder, useDragControls } from 'framer-motion'

const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete }) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={todo}
      id={todo.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`todo-item${todo.is_done ? ' done' : ''}`}
      dragListener={false}
      dragControls={dragControls}
    >
      {/* DRAG HANDLE - NO TOGGLE */}
      <div 
        className="drag-handle"
        onPointerDown={(e) => dragControls.start(e)}
        style={{ cursor: 'grab', padding: '0 0.5rem', color: 'var(--ink-mute)', userSelect: 'none' }}
      >
        ⠿
      </div>

      {/* TOGGLE AREA - CHECKBOX */}
      <motion.div 
        className="todo-check"
        onClick={() => onToggle(todo)}
        style={{ cursor: 'pointer' }}
        animate={{ 
          backgroundColor: todo.is_done ? 'var(--ink)' : 'transparent',
          scale: todo.is_done ? [1, 1.2, 1] : 1
        }}
      >
        <motion.span 
          className="check-icon"
          initial={false}
          animate={{ display: todo.is_done ? 'block' : 'none', opacity: todo.is_done ? 1 : 0 }}
        >
          ✓
        </motion.span>
      </motion.div>

      {/* TOGGLE AREA - TITLE */}
      <span 
        className="todo-title" 
        onClick={() => onToggle(todo)}
        style={{ cursor: 'pointer' }}
      >
        {todo.title}
      </span>

      {/* DELETE - NO TOGGLE */}
      <motion.button
        whileHover={{ scale: 1.2, color: 'var(--danger)' }}
        whileTap={{ scale: 0.8 }}
        className="delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
      >
        ×
      </motion.button>
    </Reorder.Item>
  )
})

export default TodoItem
