import { useState } from 'react'

export default function AddTodo({ onAdd }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value)
    setValue('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} aria-label="Add new todo">
      <input
        id="todo-input"
        className="add-input"
        type="text"
        placeholder="What needs to be done?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={200}
        autoComplete="off"
        aria-label="New task title"
      />
      <button
        className="add-btn"
        type="submit"
        aria-label="Add task"
        disabled={!value.trim()}
      >
        ADD
      </button>
    </form>
  )
}
