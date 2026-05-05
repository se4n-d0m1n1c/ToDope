import { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './lib/supabase'
import TodoApp from './components/TodoApp'
import Auth from './components/Auth'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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

  return (
    <div className="app-wrapper">
      {!session ? <Auth /> : <TodoApp user={session.user} />}
    </div>
  )
}

export default App
