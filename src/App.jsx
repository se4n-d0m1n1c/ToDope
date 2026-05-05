import { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './lib/supabase'
import TodoApp from './components/TodoApp'
import Auth from './components/Auth'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // async-parallel: Start promise early
    const sessionPromise = supabase.auth.getSession()

    sessionPromise.then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  // rendering-hoist-jsx: Auth has full-width layout, render outside app-wrapper
  if (!session) return <Auth />

  return (
    <div className="app-wrapper">
      <TodoApp user={session.user} />
    </div>
  )
}

export default App
