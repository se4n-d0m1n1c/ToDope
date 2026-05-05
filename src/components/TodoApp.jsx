import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { supabase } from '../lib/supabase'
import TodoItem from './TodoItem'
import AddTodo from './AddTodo'

const FILTERS = ['All', 'Active', 'Done']

export default function TodoApp({ user }) {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  /* ── FETCH ── */
  useEffect(() => {
    let isMounted = true
    
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
      
      if (isMounted && !error) {
        setTodos(data)
        setLoading(false)
      }
    }
    fetchTodos()

    const channel = supabase
      .channel(`todos-realtime-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'todos',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTodos((prev) => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setTodos((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)))
        } else if (payload.eventType === 'DELETE') {
          setTodos((prev) => prev.filter((t) => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { 
      isMounted = false
      supabase.removeChannel(channel) 
    }
  }, [user.id])

  /* ── SYNC PRIORITIES ── */
  const syncPriorities = useCallback(async (newOrder) => {
    const updates = newOrder.map((todo, index) => ({
      id: todo.id,
      priority: index,
      user_id: user.id,
      title: todo.title,
      is_done: todo.is_done
    }))
    await supabase.from('todos').upsert(updates)
  }, [user.id])

  const handleReorder = (newOrder) => {
    setTodos(newOrder)
    syncPriorities(newOrder)
  }

  const handleAdd = useCallback(async (title) => {
    if (!title.trim()) return
    const maxPriority = todos.length > 0 ? Math.max(...todos.map(t => t.priority || 0)) : -1
    const { data, error } = await supabase
      .from('todos')
      .insert({ title: title.trim(), user_id: user.id, priority: maxPriority + 1 })
      .select()
      .single()
    if (!error) setTodos((prev) => [...prev, data])
  }, [user.id, todos])

  const handleSignOut = useCallback(() => supabase.auth.signOut(), [])

  const handleToggle = useCallback(async (todo) => {
    const { data, error } = await supabase
      .from('todos')
      .update({ is_done: !todo.is_done })
      .eq('id', todo.id)
      .select()
      .single()
    if (!error) setTodos((prev) => prev.map((t) => (t.id === data.id ? data : t)))
  }, [])

  const handleDelete = useCallback(async (id) => {
    await supabase.from('todos').delete().eq('id', id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleClearDone = useCallback(async () => {
    const doneIds = todos.filter((t) => t.is_done).map((t) => t.id)
    if (!doneIds.length) return
    await supabase.from('todos').delete().in('id', doneIds)
    setTodos((prev) => prev.filter((t) => !t.is_done))
  }, [todos])

  /* ── DERIVED STATE ── */
  const { filtered, doneCount, activeCount } = useMemo(() => {
    const filtered = todos.filter((t) => {
      if (filter === 'Active') return !t.is_done
      if (filter === 'Done') return t.is_done
      return true
    })
    const done = todos.filter(t => t.is_done).length
    return { 
      filtered, 
      doneCount: done, 
      activeCount: todos.length - done 
    }
  }, [todos, filter])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <nav className="top-nav">
        <button className="logout-btn" onClick={handleSignOut}>
          LOGOUT ({user.email.split('@')[0]})
        </button>
      </nav>

      <header className="app-header">
        <motion.h1 
          className="app-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          To<span className="acid-dot">Do</span>pe
        </motion.h1>
        <p className="app-subtitle" style={{ textAlign: 'center' }}>Priority mode: Drag handle to reorder</p>
        <hr className="header-rule" />
      </header>

      <AddTodo onAdd={handleAdd} />

      <div className="stats-bar">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <span className="stats-badge">{todos.length}</span> tasks · 
          <span className="stats-badge">{activeCount}</span> active · 
          <span className="stats-badge">{doneCount}</span> done
        </motion.div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-bar" /> : null}

      <Reorder.Group 
        axis="y" 
        values={todos} 
        onReorder={handleReorder}
        className="todo-list"
        style={{ listStyle: 'none', padding: 0, contentVisibility: 'auto' }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>
        {!loading && filtered.length === 0 ? (
          <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            <span className="empty-icon">◻</span>
            <p>List empty</p>
          </motion.li>
        ) : null}
      </Reorder.Group>

      <footer className="app-footer">
        <span>© 2026 ToDope</span>
        <button className="clear-done-btn" onClick={handleClearDone} disabled={doneCount === 0}>
          Clear done
        </button>
      </footer>
    </motion.div>
  )
}
