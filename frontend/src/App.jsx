import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { Shield, PlusCircle, Search, LayoutGrid, Activity, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { useTheme } from './ThemeContext.jsx'
import LoginPage from './LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IssuePage from './pages/IssuePage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import AllCredentials from './pages/AllCredentials.jsx'
import PublicVerifyPage from './pages/PublicVerifyPage.jsx'

const ADMIN_NAV = [
  { to: '/',      label: 'Dashboard',  icon: LayoutGrid },
  { to: '/issue', label: 'Issue',      icon: PlusCircle },
  { to: '/all',   label: 'Records',    icon: Activity   },
]
const STUDENT_NAV = [
  { to: '/verify', label: 'Verify Certificate', icon: Search },
]

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/verify" replace />
  return children
}

export default function App() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()

  // Public verify page — no login needed
  if (location.pathname === '/public/verify') {
    return (
      <Routes>
        <Route path="/public/verify" element={<PublicVerifyPage />} />
      </Routes>
    )
  }

  if (!user) return <LoginPage />

  const isAdmin = user.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>DCVS</span>
              <span className="hidden sm:inline text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                Credential Verification System
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Right: theme + user + logout */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button onClick={toggle} className="btn-ghost"
              style={{ padding: '0.5rem', borderRadius: '8px' }}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
              {theme === 'dark'
                ? <Sun size={16} style={{ color: 'var(--text-muted)' }} />
                : <Moon size={16} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(5,150,105,0.15)',
                  color: isAdmin ? 'var(--accent-light)' : 'var(--success)',
                }}>
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.2 }}>
                  {isAdmin ? 'Admin' : `Roll: ${user.rollNo}`}
                </p>
              </div>
            </div>

            <button onClick={logout} className="btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
              <LogOut size={15} />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Role badge */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-4">
        <span className={`accent-badge ${!isAdmin ? 'success-badge' : ''}`}>
          {isAdmin ? '🔐 Admin Portal' : `🎓 ${user.name} · Roll No: ${user.rollNo}`}
        </span>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<ProtectedRoute allowedRole="admin"><Dashboard /></ProtectedRoute>} />
          <Route path="/issue" element={<ProtectedRoute allowedRole="admin"><IssuePage /></ProtectedRoute>} />
          <Route path="/all" element={<ProtectedRoute allowedRole="admin"><AllCredentials /></ProtectedRoute>} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/public/verify" element={<PublicVerifyPage />} />
          <Route path="*" element={<Navigate to={isAdmin ? '/' : '/verify'} replace />} />
        </Routes>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1rem 0' }}>
        <p className="text-center text-xs font-display" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          DCVS · Hyperledger Fabric · SHA-256 · Goel Institute of Technology and Management
        </p>
      </footer>
    </div>
  )
}
