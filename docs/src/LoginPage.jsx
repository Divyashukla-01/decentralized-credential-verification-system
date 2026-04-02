import { useState } from 'react'
import { ShieldCheck, Mail, Lock, User, Hash, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'

export default function LoginPage() {
  const { loginAdmin, loginStudent, registerStudent } = useAuth()
  const [tab, setTab] = useState('student') // 'admin' | 'student' | 'register'
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Admin form
  const [adminForm, setAdminForm] = useState({ email: '', password: '' })
  // Student login form
  const [stuLogin, setStuLogin] = useState({ email: '', password: '' })
  // Student register form
  const [stuReg, setStuReg] = useState({ name: '', email: '', studentId: '', password: '', confirm: '' })

  const clear = () => { setError(''); setSuccess('') }

  const handleAdminLogin = (e) => {
    e.preventDefault(); clear(); setLoading(true)
    setTimeout(() => {
      const res = loginAdmin(adminForm.email, adminForm.password)
      if (!res.success) setError(res.message)
      setLoading(false)
    }, 600)
  }

  const handleStudentLogin = (e) => {
    e.preventDefault(); clear(); setLoading(true)
    setTimeout(() => {
      const res = loginStudent(stuLogin.email, stuLogin.password)
      if (!res.success) setError(res.message)
      setLoading(false)
    }, 600)
  }

  const handleRegister = (e) => {
    e.preventDefault(); clear()
    if (!stuReg.email.includes('@gmail.com') && !stuReg.email.includes('@')) {
      return setError('Please enter a valid Gmail address')
    }
    if (stuReg.password !== stuReg.confirm) {
      return setError('Passwords do not match')
    }
    if (stuReg.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    setLoading(true)
    setTimeout(() => {
      const res = registerStudent(stuReg.name, stuReg.email, stuReg.studentId, stuReg.password)
      if (res.success) {
        setSuccess('Account created! Please login.')
        setTab('student')
        setStuLogin({ email: stuReg.email, password: '' })
        setStuReg({ name: '', email: '', studentId: '', password: '', confirm: '' })
      } else {
        setError(res.message)
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #09090b 0%, #0c1a18 50%, #09090b 100%)' }}>

      {/* Grid background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,#14b8a6 40px,#14b8a6 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#14b8a6 40px,#14b8a6 41px)'
      }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
            <ShieldCheck size={32} className="text-black" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">DCVS</h1>
          <p className="text-sm" style={{ color: '#71717a' }}>Decentralized Credential Verification System</p>
          <p className="text-xs mt-1 font-display" style={{ color: '#14b8a6' }}>HYPERLEDGER FABRIC · MYCHANNEL</p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="flex mb-6 p-1 rounded-lg" style={{ background: '#09090b' }}>
            {[
              { key: 'student', label: 'Student Login' },
              { key: 'register', label: 'Sign Up' },
              { key: 'admin', label: 'Admin' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); clear() }}
                className="flex-1 py-2 px-2 rounded-md text-xs font-display transition-all duration-200"
                style={{
                  background: tab === t.key ? '#14b8a6' : 'transparent',
                  color: tab === t.key ? '#09090b' : '#71717a',
                  fontWeight: tab === t.key ? '700' : '400',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-4 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert-success mb-4 text-sm">
              <CheckCircle size={15} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* ── ADMIN LOGIN ── */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 rounded-lg mb-2 text-xs font-display"
                style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid #115e59', color: '#2dd4bf' }}>
                🔐 Admin credentials: admin@dcvs.edu / admin123
              </div>
              <div>
                <label className="label"><Mail size={10} className="inline mr-1" />Admin Email</label>
                <input value={adminForm.email} onChange={e => { setAdminForm(f => ({ ...f, email: e.target.value })); clear() }}
                  placeholder="admin@dcvs.edu" className="input-field" type="email" required />
              </div>
              <div>
                <label className="label"><Lock size={10} className="inline mr-1" />Password</label>
                <div className="relative">
                  <input value={adminForm.password} onChange={e => { setAdminForm(f => ({ ...f, password: e.target.value })); clear() }}
                    placeholder="••••••••" className="input-field pr-10" type={showPwd ? 'text' : 'password'} required />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#71717a' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Authenticating...' : 'Login as Admin'}
              </button>
            </form>
          )}

          {/* ── STUDENT LOGIN ── */}
          {tab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="label"><Mail size={10} className="inline mr-1" />Gmail Address</label>
                <input value={stuLogin.email} onChange={e => { setStuLogin(f => ({ ...f, email: e.target.value })); clear() }}
                  placeholder="your.name@gmail.com" className="input-field" type="email" required />
              </div>
              <div>
                <label className="label"><Lock size={10} className="inline mr-1" />Password</label>
                <div className="relative">
                  <input value={stuLogin.password} onChange={e => { setStuLogin(f => ({ ...f, password: e.target.value })); clear() }}
                    placeholder="••••••••" className="input-field pr-10" type={showPwd ? 'text' : 'password'} required />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#71717a' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Logging in...' : 'Login as Student'}
              </button>
              <p className="text-center text-xs" style={{ color: '#71717a' }}>
                No account?{' '}
                <button type="button" onClick={() => { setTab('register'); clear() }}
                  style={{ color: '#14b8a6' }} className="font-display">
                  Sign up here
                </button>
              </p>
            </form>
          )}

          {/* ── STUDENT REGISTER ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label"><User size={10} className="inline mr-1" />Full Name</label>
                <input value={stuReg.name} onChange={e => { setStuReg(f => ({ ...f, name: e.target.value })); clear() }}
                  placeholder="Divya Shukla" className="input-field" required />
              </div>
              <div>
                <label className="label"><Mail size={10} className="inline mr-1" />Gmail Address</label>
                <input value={stuReg.email} onChange={e => { setStuReg(f => ({ ...f, email: e.target.value })); clear() }}
                  placeholder="divya.shukla@gmail.com" className="input-field" type="email" required />
                <p className="text-xs mt-1" style={{ color: '#71717a' }}>Must be a valid Gmail address</p>
              </div>
              <div>
                <label className="label"><Hash size={10} className="inline mr-1" />Student ID</label>
                <input value={stuReg.studentId} onChange={e => { setStuReg(f => ({ ...f, studentId: e.target.value })); clear() }}
                  placeholder="e.g. STU-20BT-0421" className="input-field" required />
                <p className="text-xs mt-1" style={{ color: '#71717a' }}>This is used to verify your credentials</p>
              </div>
              <div>
                <label className="label"><Lock size={10} className="inline mr-1" />Password</label>
                <input value={stuReg.password} onChange={e => { setStuReg(f => ({ ...f, password: e.target.value })); clear() }}
                  placeholder="Min 6 characters" className="input-field" type="password" required />
              </div>
              <div>
                <label className="label"><Lock size={10} className="inline mr-1" />Confirm Password</label>
                <input value={stuReg.confirm} onChange={e => { setStuReg(f => ({ ...f, confirm: e.target.value })); clear() }}
                  placeholder="Repeat password" className="input-field" type="password" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating Account...' : 'Create Student Account'}
              </button>
              <p className="text-center text-xs" style={{ color: '#71717a' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('student'); clear() }}
                  style={{ color: '#14b8a6' }} className="font-display">
                  Login here
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-4 font-display" style={{ color: '#3f3f46' }}>
          BLOCKCHAIN · TLS ENABLED · COUCHDB · FABRIC v2.5
        </p>
      </div>
    </div>
  )
}
