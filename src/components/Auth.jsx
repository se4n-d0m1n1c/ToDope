import { useState, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const AuthTab = memo(({ tab, active, onClick }) => (
  <button
    className={`auth-tab ${active ? 'active' : ''} flex-grow-1`}
    onClick={() => onClick(tab)}
  >
    {tab}
    {active && (
      <motion.div layoutId="activeTab" className="active-indicator"
        style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 4, background: 'var(--acid)', border: '2px solid var(--ink)' }}
      />
    )}
  </button>
))

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  const handleAuth = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const params = { email, password }
    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword(params)
      : await supabase.auth.signUp(params)
    if (error) {
      setError(error.message)
    } else if (!isLogin) {
      // Supabase returns empty identities for already-registered emails
      if (data.user?.identities?.length === 0) {
        setError('This email is already registered. Try logging in instead.')
      } else if (!data.session) {
        setVerifying(true)
      }
    }
    setLoading(false)
  }, [isLogin, email, password])

  const handleVerify = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
    if (error) setError(error.message)
    setLoading(false)
  }, [email, otp])

  const toggleMode = useCallback((tab) => {
    setIsLogin(tab === 'LOGIN')
    setError(null)
  }, [])

  const cardContent = verifying ? (
    <div className="text-center">
      <h2 className="auth-title mb-3">CHECK EMAIL</h2>
      <p className="auth-subtitle mb-4">Enter 8-digit code sent to {email}</p>
      <form onSubmit={handleVerify}>
        {error && <div className="auth-error mb-3">{error}</div>}
        <div className="mb-4">
          <input
            className="form-control text-center fs-2"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
            maxLength={8}
            required
          />
        </div>
        <button className="btn btn-primary w-100 mb-3" disabled={loading}>
          {loading ? '...' : 'VERIFY'}
        </button>
        <button type="button" className="btn btn-link text-dark text-decoration-none" onClick={() => setVerifying(false)}>
          Back to Sign In
        </button>
      </form>
    </div>
  ) : (
    <>
      <div className="auth-tabs d-flex mb-4">
        <AuthTab tab="LOGIN" active={isLogin} onClick={toggleMode} />
        <AuthTab tab="SIGNUP" active={!isLogin} onClick={toggleMode} />
      </div>
      <form onSubmit={handleAuth}>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="auth-error mb-3"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary w-100 py-3"
          disabled={loading}
        >
          {loading ? '...' : (isLogin ? 'GO' : 'JOIN')}
        </motion.button>
      </form>
    </>
  )

  return (
    <div className="auth-page-wrapper position-relative">
      <div className="bg-decor shape-circle d-none d-lg-block"></div>
      <div className="bg-decor shape-square d-none d-lg-block"></div>

      <div className="auth-split">
        {/* Left: Brand */}
        <div className="auth-brand-side text-center">
          <div className="mascot-container mb-4">
            <img src="/mascot.png" alt="ToDope Mascot" className="mascot-img" />
          </div>
          <h1 className="app-title mb-0">To<span className="acid-dot">Do</span>pe</h1>
          <div className="brand-badge">GET SH*T DONE</div>
        </div>

        {/* Right: Card */}
        <div className="auth-form-side">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="auth-card p-4 p-md-5"
          >
            {cardContent}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
