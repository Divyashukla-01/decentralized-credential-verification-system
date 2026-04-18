import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { Shield, Search, LayoutGrid, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { useTheme } from './ThemeContext.jsx'
import LoginPage from './LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IssuePage from './pages/IssuePage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import AllCredentials from './pages/AllCredentials.jsx'
import PublicVerifyPage from './pages/PublicVerifyPage.jsx'

const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
]
const STUDENT_NAV = [
  { to: '/verify', label: 'My Certificate', icon: Search },
]

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/verify" replace />
  return children
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px',
        padding:'7px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--text-muted)', transition:'all 0.2s' }}>
      {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
    </button>
  )
}

export default function App() {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Public verify page — no login needed
  if (location.pathname === '/public/verify') {
    return <Routes><Route path="/public/verify" element={<PublicVerifyPage />} /></Routes>
  }

  if (!user) return <LoginPage />

  const isAdmin = user.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'var(--bg-primary)' }}>
      <header style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-card)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ maxWidth:'1152px', margin:'0 auto', padding:'0 16px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#5b21b6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>DCVS</span>
              <span className="hidden sm:inline" style={{ fontSize:'0.75rem', marginLeft:'8px', color:'var(--text-muted)' }}>
                Credential Verification System
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to} className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
                  <Icon size={15}/><span className="hidden sm:inline">{label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Right: theme + user + logout — NO check icon */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <ThemeToggle />
            <div className="hidden sm:flex" style={{ alignItems:'center', gap:'8px', padding:'6px 10px', borderRadius:'10px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem',
                background: isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(5,150,105,0.15)',
                color: isAdmin ? 'var(--accent-light)' : 'var(--success)' }}>
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-primary)', lineHeight:1.2 }}>{user.name}</p>
                <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', lineHeight:1.2 }}>
                  {isAdmin ? 'Admin' : `Roll: ${user.rollNo || 'N/A'}`}
                </p>
              </div>
            </div>
            <button onClick={logout} className="btn-ghost" style={{ padding:'8px 12px', fontSize:'0.85rem' }}>
              <LogOut size={15}/><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Role badge */}
      <div style={{ maxWidth:'1152px', margin:'0 auto', width:'100%', padding:'12px 16px 0' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 12px',
          borderRadius:'999px', fontSize:'0.75rem', fontWeight:600,
          background: isAdmin ? 'rgba(124,58,237,0.1)' : 'rgba(5,150,105,0.1)',
          border:`1px solid ${isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(5,150,105,0.2)'}`,
          color: isAdmin ? 'var(--accent-light)' : 'var(--success)' }}>
          {isAdmin ? '🔐 Admin Portal' : `🎓 ${user.name} · Roll: ${user.rollNo || 'N/A'}`}
        </span>
      </div>

      <main style={{ flex:1, maxWidth:'1152px', margin:'0 auto', width:'100%', padding:'24px 16px' }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRole="admin"><Dashboard /></ProtectedRoute>} />
          <Route path="/issue" element={<ProtectedRoute allowedRole="admin"><IssuePage /></ProtectedRoute>} />
          <Route path="/all" element={<ProtectedRoute allowedRole="admin"><AllCredentials /></ProtectedRoute>} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/public/verify" element={<PublicVerifyPage />} />
          <Route path="*" element={<Navigate to={isAdmin ? '/' : '/verify'} replace />} />
        </Routes>
      </main>

      <footer style={{ borderTop:'1px solid var(--border)', padding:'16px', textAlign:'center' }}>
        <p style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--text-muted)', opacity:0.5 }}>
          DCVS · Hyperledger Fabric · SHA-256 · Goel Institute of Technology and Management
        </p>
      </footer>
    </div>
  )
}
