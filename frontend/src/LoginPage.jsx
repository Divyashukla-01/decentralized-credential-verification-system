import { useState } from 'react'
import { Shield, Mail, Lock, User, Hash, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'

const TABS = ['student', 'register', 'admin']

export default function LoginPage() {
  const { loginAdmin, loginStudent, sendOtp, verifyOtp, registerStudent } = useAuth()
  const [tab, setTab]       = useState('student')
  const [step, setStep]     = useState(1) // 1=form, 2=otp, 3=done
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')

  // Admin form
  const [adminForm, setAdminForm] = useState({ email: '', password: '' })

  // Student login
  const [stuEmail, setStuEmail]   = useState('')
  const [stuOtp, setStuOtp]       = useState('')

  // Student register
  const [regForm, setRegForm] = useState({ name: '', email: '', rollNo: '', studentId: '' })
  const [regOtp, setRegOtp]   = useState('')

  const clear = () => { setError(''); setInfo('') }

  // ── Admin Login ──────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    const res = loginAdmin(adminForm.email, adminForm.password)
    if (!res.success) setError(res.message)
    setLoading(false)
  }

  // ── Student: send OTP to login ───────────────────────────
  const handleStudentSendOtp = async (e) => {
    e.preventDefault(); clear()
    const existing = JSON.parse(localStorage.getItem('dcvs_students') || '[]')
    if (!existing.find(s => s.email === stuEmail)) {
      setError('Email not registered. Please sign up first.')
      return
    }
    setLoading(true)
    const res = await sendOtp(stuEmail)
    setLoading(false)
    if (res.success) { setStep(2); setInfo('OTP sent to your Gmail inbox') }
    else setError(res.message)
  }

  // ── Student: verify OTP to login ─────────────────────────
  const handleStudentVerifyOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    const res = await verifyOtp(stuEmail, stuOtp)
    setLoading(false)
    if (res.success) { loginStudent(stuEmail) }
    else setError(res.message)
  }

  // ── Register: send OTP ───────────────────────────────────
  const handleRegSendOtp = async (e) => {
    e.preventDefault(); clear()
    if (!regForm.email.includes('@')) { setError('Enter a valid Gmail address'); return }
    if (!regForm.name || !regForm.rollNo) { setError('All fields are required'); return }
    setLoading(true)
    const res = await sendOtp(regForm.email)
    setLoading(false)
    if (res.success) { setStep(2); setInfo('OTP sent to ' + regForm.email) }
    else setError(res.message)
  }

  // ── Register: verify OTP & create account ────────────────
  const handleRegVerifyOtp = async (e) => {
    e.preventDefault(); clear(); setLoading(true)
    const otpRes = await verifyOtp(regForm.email, regOtp)
    if (!otpRes.success) { setError(otpRes.message); setLoading(false); return }
    const regRes = registerStudent(regForm.name, regForm.email, regForm.studentId, regForm.rollNo)
    setLoading(false)
    if (regRes.success) { setStep(3); setInfo('Account created! You can now login.') }
    else setError(regRes.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-purple"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
            <Shield size={30} color="white" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Credential Verification
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Goel Institute of Technology and Management
          </p>
          <p className="text-xs mt-1 font-display" style={{ color: 'var(--accent-light)', opacity: 0.7 }}>
            Powered by Hyperledger Fabric
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          {/* Tabs */}
          <div className="tab-bar mb-6">
            {[['student','Student Login'],['register','Sign Up'],['admin','Admin']].map(([k,l]) => (
              <button key={k} onClick={() => { setTab(k); setStep(1); clear() }}
                className={`tab-item ${tab === k ? 'active' : ''}`}>{l}</button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-4 text-sm animate-slide-up">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="alert-success mb-4 text-sm animate-slide-up">
              <CheckCircle size={15} className="flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {/* ── ADMIN ─────────────────────────────────────── */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="label">Admin Email</label>
                <input value={adminForm.email}
                  onChange={e => { setAdminForm(f => ({...f, email: e.target.value})); clear() }}
                  placeholder="Enter admin email" className="input-field"
                  type="email" required disabled={loading} autoComplete="off" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input value={adminForm.password}
                    onChange={e => { setAdminForm(f => ({...f, password: e.target.value})); clear() }}
                    placeholder="Enter password" className="input-field pr-10"
                    type={showPwd ? 'text' : 'password'} required disabled={loading} autoComplete="off" />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost" style={{ padding: '4px' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin" />Authenticating...</>
                  : <>Login as Admin <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ── STUDENT LOGIN ─────────────────────────────── */}
          {tab === 'student' && step === 1 && (
            <form onSubmit={handleStudentSendOtp} className="space-y-4">
              <div>
                <label className="label"><Mail size={11} className="inline mr-1" />Gmail Address</label>
                <input value={stuEmail} onChange={e => { setStuEmail(e.target.value); clear() }}
                  placeholder="your.name@gmail.com" className="input-field"
                  type="email" required disabled={loading} />
              </div>
              <button type="submit" disabled={loading || !stuEmail} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin" />Sending OTP...</>
                  : <>Send OTP to Gmail <ArrowRight size={16} /></>}
              </button>
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No account?{' '}
                <button type="button" onClick={() => { setTab('register'); clear() }}
                  style={{ color: 'var(--accent-light)' }} className="font-semibold hover:underline">
                  Sign up here
                </button>
              </p>
            </form>
          )}

          {tab === 'student' && step === 2 && (
            <form onSubmit={handleStudentVerifyOtp} className="space-y-4">
              <div className="text-center p-4 rounded-xl mb-2"
                style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <KeyRound size={24} style={{ color: 'var(--accent-light)', margin: '0 auto 8px' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-light)' }}>OTP Sent!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Check your Gmail: <strong>{stuEmail}</strong>
                </p>
              </div>
              <div>
                <label className="label">Enter 6-digit OTP</label>
                <input value={stuOtp} onChange={e => { setStuOtp(e.target.value); clear() }}
                  placeholder="• • • • • •" className="input-field text-center text-2xl font-display tracking-widest"
                  maxLength={6} required disabled={loading} />
              </div>
              <button type="submit" disabled={loading || stuOtp.length < 6} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin" />Verifying...</>
                  : <>Verify & Login <ArrowRight size={16} /></>}
              </button>
              <button type="button" onClick={() => { setStep(1); clear() }} className="btn-secondary w-full">
                ← Back
              </button>
            </form>
          )}

          {/* ── REGISTER ──────────────────────────────────── */}
          {tab === 'register' && step === 1 && (
            <form onSubmit={handleRegSendOtp} className="space-y-4">
              <div>
                <label className="label"><User size={11} className="inline mr-1" />Full Name</label>
                <input value={regForm.name} onChange={e => { setRegForm(f => ({...f, name: e.target.value})); clear() }}
                  placeholder="Your full name" className="input-field" required />
              </div>
              <div>
                <label className="label"><Mail size={11} className="inline mr-1" />Gmail Address</label>
                <input value={regForm.email} onChange={e => { setRegForm(f => ({...f, email: e.target.value})); clear() }}
                  placeholder="your.name@gmail.com" className="input-field" type="email" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><Hash size={11} className="inline mr-1" />Roll Number</label>
                  <input value={regForm.rollNo} onChange={e => { setRegForm(f => ({...f, rollNo: e.target.value})); clear() }}
                    placeholder="e.g. 20BT0421" className="input-field" required />
                </div>
                <div>
                  <label className="label">Student ID</label>
                  <input value={regForm.studentId} onChange={e => { setRegForm(f => ({...f, studentId: e.target.value})); clear() }}
                    placeholder="Optional" className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin" />Sending OTP...</>
                  : <>Send Verification OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {tab === 'register' && step === 2 && (
            <form onSubmit={handleRegVerifyOtp} className="space-y-4">
              <div className="text-center p-4 rounded-xl mb-2"
                style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <KeyRound size={24} style={{ color: 'var(--accent-light)', margin: '0 auto 8px' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-light)' }}>Verify your Gmail</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>OTP sent to <strong>{regForm.email}</strong></p>
              </div>
              <div>
                <label className="label">Enter 6-digit OTP</label>
                <input value={regOtp} onChange={e => { setRegOtp(e.target.value); clear() }}
                  placeholder="• • • • • •" className="input-field text-center text-2xl font-display tracking-widest"
                  maxLength={6} required />
              </div>
              <button type="submit" disabled={loading || regOtp.length < 6} className="btn-primary">
                {loading ? <><Loader2 size={16} className="animate-spin" />Creating Account...</>
                  : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {tab === 'register' && step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                <CheckCircle size={28} style={{ color: 'var(--success)' }} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Account Created!</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You can now login with your Gmail.</p>
              <button onClick={() => { setTab('student'); setStep(1); clear() }} className="btn-primary">
                Go to Login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6 font-display"
          style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          DCVS · HYPERLEDGER FABRIC · SHA-256 · TLS ENABLED
        </p>
      </div>
    </div>
  )
}
