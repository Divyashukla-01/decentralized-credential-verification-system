import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { ShieldCheck, PlusCircle, Search, LayoutGrid, Activity, LogOut, User } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import LoginPage from './LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import IssuePage from './pages/IssuePage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import AllCredentials from './pages/AllCredentials.jsx'

// Admin sees everything
const ADMIN_NAV = [
  { to: '/',      label: 'Dashboard',   icon: LayoutGrid },
  { to: '/issue', label: 'Issue Cert',  icon: PlusCircle },
  { to: '/all',   label: 'All Records', icon: Activity   },
]

// Student/verifier sees ONLY verify
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
  const location = useLocation()

  if (!user) return <LoginPage />

  const isAdmin = user.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header style={{ borderBottom: '1px solid #27272a', background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(8px)' }}
        className="sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#14b8a6' }}>
              <ShieldCheck size={18} className="text-black" />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-widest" style={{ color: '#14b8a6' }}>DCVS</span>
              <span className="hidden sm:inline text-xs font-body ml-2" style={{ color: '#71717a' }}>
                Decentralized Credential Verification
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to}
                  className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}>
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
                style={{
                  background: isAdmin ? '#134e4a' : '#1e1b4b',
                  color: isAdmin ? '#14b8a6' : '#818cf8'
                }}>
                {isAdmin ? 'A' : user.name[0].toUpperCase()}
              </div>
              <div className="text-xs">
                <p className="font-display" style={{ color: '#fafafa' }}>{user.name}</p>
                <p style={{ color: '#71717a' }}>
                  {isAdmin ? 'Administrator' : `ID: ${user.studentId}`}
                </p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition-all"
              style={{ background: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46' }}>
              <LogOut size={12} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Role badge */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display"
          style={{
            background: isAdmin ? 'rgba(4,47,46,0.5)' : 'rgba(30,27,75,0.5)',
            border: `1px solid ${isAdmin ? '#115e59' : '#312e81'}`,
            color: isAdmin ? '#2dd4bf' : '#818cf8'
          }}>
          <User size={11} />
          {isAdmin
            ? '🔐 Admin Portal — Full Access'
            : `🎓 Student Portal — ${user.name} (${user.studentId})`}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Routes>
          {/* Admin routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRole="admin"><Dashboard /></ProtectedRoute>
          } />
          <Route path="/issue" element={
            <ProtectedRoute allowedRole="admin"><IssuePage /></ProtectedRoute>
          } />
          <Route path="/all" element={
            <ProtectedRoute allowedRole="admin"><AllCredentials /></ProtectedRoute>
          } />

          {/* Verify — available to everyone logged in */}
          <Route path="/verify" element={<VerifyPage />} />

          {/* Students go to verify by default */}
          <Route path="*" element={
            <Navigate to={isAdmin ? '/' : '/verify'} replace />
          } />
        </Routes>
      </main>

      <footer style={{ borderTop: '1px solid #27272a' }} className="py-4 text-center">
        <p className="text-xs font-display tracking-widest" style={{ color: '#3f3f46' }}>
          DCVS · HYPERLEDGER FABRIC · <span style={{ color: '#14b8a6' }}>MYCHANNEL</span> · SHA-256 · PDF · QR
        </p>
      </footer>
    </div>
  )
}
