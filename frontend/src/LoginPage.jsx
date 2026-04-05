import { useState } from 'react'
import { Shield, Mail, Lock, User, Hash, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Loader2, KeyRound, RotateCcw } from 'lucide-react'
import axios from 'axios'
import { useAuth } from './AuthContext.jsx'

export default function LoginPage() {
  const { loginAdmin, loginStudentFromApi } = useAuth()
  const [tab, setTab]     = useState('student')
  const [step, setStep]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo]   = useState('')

  // Forms
  const [adminForm, setAdminForm] = useState({ email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm]     = useState({ name: '', email: '', rollNo: '', studentId: '', password: '', confirm: '', otp: '' })
  const [resetForm, setResetForm] = useState({ email: '', otp: '', newPassword: '', confirm: '' })

  const clear = () => { setError(''); setInfo('') }

  // ── Admin Login ──────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const res = loginAdmin(adminForm.email, adminForm.password)
    if (!res.success) setError(res.message)
    setLoading(false)
  }

  // ── Student Login ────────────────────────────────────────
  const handleStudentLogin = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', loginForm)
      loginStudentFromApi(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  // ── Signup Step 1: Send OTP ──────────────────────────────
  const handleSendSignupOtp = async (e) => {
    e.preventDefault(); clear()
    if (!regForm.email.includes('@')) { setError('Enter a valid email address'); return }
    if (!regForm.name || !regForm.rollNo) { setError('Name and Roll Number are required'); return }
    if (regForm.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (regForm.password !== regForm.confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await axios.post('/api/auth/send-otp', { email: regForm.email, purpose: 'signup' })
      setStep(2); setInfo('OTP sent to ' + regForm.email)
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  // ── Signup Step 2: Verify OTP + Create Account ───────────
  const handleCompleteSignup = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    try {
      await axios.post('/api/auth/signup', {
        name: regForm.name, email: regForm.email,
        rollNo: regForm.rollNo, studentId: regForm.studentId,
        password: regForm.password, otp: regForm.otp
      })
      setStep(3); setInfo('Account created! You can now login.')
    } catch (err) { setError(err.response?.data?.message || 'Signup failed') }
    finally { setLoading(false) }
  }

  // ── Forgot Password Step 1: Send OTP ────────────────────
  const handleSendResetOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    try {
      await axios.post('/api/auth/send-otp', { email: resetForm.email, purpose: 'reset' })
      setStep(2); setInfo('Password reset OTP sent to ' + resetForm.email)
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  // ── Forgot Password Step 2: Reset ───────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault(); clear()
    if (resetForm.newPassword !== resetForm.confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', {
        email: resetForm.email, otp: resetForm.otp, newPassword: resetForm.newPassword
      })
      setStep(3); setInfo('Password reset! You can now login.')
    } catch (err) { setError(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid var(--border)', background: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-primary)' }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
            <Shield size={30} color="white" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Credential Verification</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Goel Institute of Technology and Management</p>
          <p className="text-xs mt-1 font-display" style={{ color: 'var(--accent-light)', opacity: 0.7 }}>Powered by Hyperledger Fabric</p>
        </div>

        <div className="card" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
          {/* Tabs */}
          <div className="tab-bar mb-6">
            {[['student','Student Login'],['register','Sign Up'],['forgot','Forgot Password'],['admin','Admin']].map(([k,l]) => (
              <button key={k} onClick={() => { setTab(k); setStep(1); clear() }}
                className={`tab-item ${tab === k ? 'active' : ''}`} style={{ fontSize: '0.78rem' }}>{l}</button>
            ))}
          </div>

          {/* Alerts */}
          {error && <div className="alert-error mb-4 text-sm animate-slide-up"><AlertCircle size={15}/><span>{error}</span></div>}
          {info  && <div className="alert-success mb-4 text-sm animate-slide-up"><CheckCircle size={15}/><span>{info}</span></div>}

          {/* ── STUDENT LOGIN ── */}
          {tab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="label"><Mail size={11} className="inline mr-1"/>Email</label>
                <input value={loginForm.email} onChange={e => { setLoginForm(f => ({...f, email: e.target.value})); clear() }}
                  placeholder="your@gmail.com" style={inputStyle} type="email" required disabled={loading} />
              </div>
              <div>
                <label className="label"><Lock size={11} className="inline mr-1"/>Password</label>
                <div className="relative">
                  <input value={loginForm.password} onChange={e => { setLoginForm(f => ({...f, password: e.target.value})); clear() }}
                    placeholder="••••••••" style={{...inputStyle, paddingRight: '2.5rem'}}
                    type={showPwd ? 'text' : 'password'} required disabled={loading} />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="btn-ghost"
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px' }}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin"/>Logging in...</> : <>Login <ArrowRight size={16}/></>}
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => { setTab('register'); clear() }}
                  style={{ color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  No account? Sign up
                </button>
                <button type="button" onClick={() => { setTab('forgot'); clear() }}
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {/* ── SIGNUP Step 1 ── */}
          {tab === 'register' && step === 1 && (
            <form onSubmit={handleSendSignupOtp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><User size={11} className="inline mr-1"/>Full Name</label>
                  <input value={regForm.name} onChange={e => { setRegForm(f => ({...f, name: e.target.value})); clear() }}
                    placeholder="Your full name" style={inputStyle} required />
                </div>
                <div>
                  <label className="label"><Hash size={11} className="inline mr-1"/>Roll Number</label>
                  <input value={regForm.rollNo} onChange={e => { setRegForm(f => ({...f, rollNo: e.target.value})); clear() }}
                    placeholder="e.g. 20BT0421" style={inputStyle} required />
                </div>
              </div>
              <div>
                <label className="label"><Mail size={11} className="inline mr-1"/>Email Address</label>
                <input value={regForm.email} onChange={e => { setRegForm(f => ({...f, email: e.target.value})); clear() }}
                  placeholder="your@gmail.com" style={inputStyle} type="email" required />
              </div>
              <div>
                <label className="label"><Lock size={11} className="inline mr-1"/>Password</label>
                <input value={regForm.password} onChange={e => { setRegForm(f => ({...f, password: e.target.value})); clear() }}
                  placeholder="Min 6 characters" style={inputStyle} type="password" required />
              </div>
              <div>
                <label className="label"><Lock size={11} className="inline mr-1"/>Confirm Password</label>
                <input value={regForm.confirm} onChange={e => { setRegForm(f => ({...f, confirm: e.target.value})); clear() }}
                  placeholder="Repeat password" style={inputStyle} type="password" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin"/>Sending OTP...</> : <>Send Verification OTP <ArrowRight size={16}/></>}
              </button>
            </form>
          )}

          {/* ── SIGNUP Step 2: Enter OTP ── */}
          {tab === 'register' && step === 2 && (
            <form onSubmit={handleCompleteSignup} className="space-y-4">
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <KeyRound size={24} style={{ color: 'var(--accent-light)', margin: '0 auto 8px' }} />
                <p className="font-semibold text-sm" style={{ color: 'var(--accent-light)' }}>Check your email!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>OTP sent to <strong>{regForm.email}</strong></p>
              </div>
              <div>
                <label className="label">Enter 6-digit OTP</label>
                <input value={regForm.otp} onChange={e => { setRegForm(f => ({...f, otp: e.target.value})); clear() }}
                  placeholder="• • • • • •" style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  maxLength={6} required />
              </div>
              <button type="submit" disabled={loading || regForm.otp.length < 6} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin"/>Creating Account...</> : <>Create Account <ArrowRight size={16}/></>}
              </button>
              <button type="button" onClick={() => { setStep(1); clear() }} className="btn-secondary w-full">← Back</button>
            </form>
          )}

          {/* ── SIGNUP Step 3: Success ── */}
          {tab === 'register' && step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                <CheckCircle size={28} style={{ color: 'var(--success)' }} />
              </div>
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Account Created!</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You can now login with your email and password.</p>
              <button onClick={() => { setTab('student'); setStep(1); clear() }} className="btn-primary">Go to Login</button>
            </div>
          )}

          {/* ── FORGOT PASSWORD Step 1 ── */}
          {tab === 'forgot' && step === 1 && (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your registered email. We'll send an OTP to reset your password.</p>
              <div>
                <label className="label"><Mail size={11} className="inline mr-1"/>Email Address</label>
                <input value={resetForm.email} onChange={e => { setResetForm(f => ({...f, email: e.target.value})); clear() }}
                  placeholder="your@gmail.com" style={inputStyle} type="email" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin"/>Sending...</> : <>Send Reset OTP <ArrowRight size={16}/></>}
              </button>
            </form>
          )}

          {/* ── FORGOT PASSWORD Step 2 ── */}
          {tab === 'forgot' && step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">OTP from Email</label>
                <input value={resetForm.otp} onChange={e => { setResetForm(f => ({...f, otp: e.target.value})); clear() }}
                  placeholder="• • • • • •" style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  maxLength={6} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input value={resetForm.newPassword} onChange={e => { setResetForm(f => ({...f, newPassword: e.target.value})); clear() }}
                  placeholder="Min 6 characters" style={inputStyle} type="password" required />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input value={resetForm.confirm} onChange={e => { setResetForm(f => ({...f, confirm: e.target.value})); clear() }}
                  placeholder="Repeat password" style={inputStyle} type="password" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin"/>Resetting...</> : <>Reset Password <ArrowRight size={16}/></>}
              </button>
            </form>
          )}

          {/* ── FORGOT Step 3: Success ── */}
          {tab === 'forgot' && step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                <RotateCcw size={28} style={{ color: 'var(--success)' }} />
              </div>
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Password Reset!</p>
              <button onClick={() => { setTab('student'); setStep(1); clear() }} className="btn-primary">Login Now</button>
            </div>
          )}

          {/* ── ADMIN ── */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="label">Admin Email</label>
                <input value={adminForm.email} onChange={e => { setAdminForm(f => ({...f, email: e.target.value})); clear() }}
                  placeholder="Admin email address" style={inputStyle} type="email" required disabled={loading} autoComplete="off" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input value={adminForm.password} onChange={e => { setAdminForm(f => ({...f, password: e.target.value})); clear() }}
                    placeholder="Admin password" style={{...inputStyle, paddingRight: '2.5rem'}}
                    type={showPwd ? 'text' : 'password'} required disabled={loading} autoComplete="off" />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="btn-ghost"
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px' }}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin"/>Authenticating...</> : <>Login as Admin <ArrowRight size={16}/></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6 font-display" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          DCVS · HYPERLEDGER FABRIC · SHA-256 · TLS ENABLED
        </p>
      </div>
    </div>
  )
}
