import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        // If sign up success, check if confirmation sent
        if (data.user && data.session) {
          // Auto login if no confirm needed (unlikely on cloud)
        } else {
          setVerifying(true)
        }
      }
    }
    setLoading(false)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    })

    if (error) setError(error.message)
    setLoading(false)
  }

  if (verifying) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">CHECK EMAIL</h2>
          <p className="auth-subtitle">Enter 6-digit code sent to {email}</p>
          
          <form onSubmit={handleVerify}>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-field">
              <input
                className="auth-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="auth-submit" disabled={loading}>
              {loading ? '...' : 'VERIFY'}
            </motion.button>
            <button type="button" className="auth-link-btn" onClick={() => setVerifying(false)}>
              Back to Sign In
            </button>
          </form>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          {['LOGIN', 'SIGNUP'].map((tab) => (
            <button 
              key={tab}
              className={`auth-tab${(tab === 'LOGIN') === isLogin ? ' active' : ''}`}
              onClick={() => { setIsLogin(tab === 'LOGIN'); setError(null); }}
            >
              {tab}
              {(tab === 'LOGIN') === isLogin && (
                <motion.div layoutId="activeTab" className="active-indicator"
                  style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 4, background: 'var(--acid)', border: '2px solid var(--ink)' }}
                />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth}>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="auth-error">
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="auth-submit" disabled={loading}>
            {loading ? '...' : (isLogin ? 'GO' : 'JOIN')}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
