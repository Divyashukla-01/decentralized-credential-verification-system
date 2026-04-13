import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, PlusCircle, Activity, ArrowRight, TrendingUp, Clock, Database } from 'lucide-react'
import { getAllCertificates, healthCheck } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

export default function Dashboard() {
  const { getCachedCerts } = useAuth()
  const [stats, setStats]             = useState({ total: '—', recent: 0 })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [recentCerts, setRecentCerts] = useState([])
  const [cachedCount, setCachedCount] = useState(0)

  useEffect(() => {
    setCachedCount(getCachedCerts().length)

    healthCheck()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'))

    getAllCertificates()
      .then(res => {
        const certs = res.data?.data || []
        const last7 = certs.filter(c => {
          const d = new Date(c.timestamp || c.issueDate)
          return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
        }).length
        setStats({ total: certs.length, recent: last7 })
        setRecentCerts(certs.slice(-4).reverse())
      })
      .catch(() => {})
  }, [])

  const statusColor = backendStatus === 'online' ? 'var(--success)' : backendStatus === 'offline' ? 'var(--error)' : 'var(--warning)'

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-8"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d0b1a 60%, #0a1628 100%)', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: statusColor }}>
              Backend {backendStatus}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">
            Welcome, Administrator
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Manage and verify blockchain-secured academic credentials for<br />
            <strong style={{ color: '#a78bfa' }}>Goel Institute of Technology and Management</strong>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Certificates', value: stats.total, icon: ShieldCheck, color: 'var(--accent-light)' },
          { label: 'This Week', value: stats.recent, icon: TrendingUp, color: 'var(--success)' },
          { label: 'Organizations', value: '2', icon: Database, color: '#f59e0b' },
          { label: 'Cached Locally', value: cachedCount, icon: Clock, color: 'var(--text-muted)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <Icon size={16} style={{ color, opacity: 0.7 }} />
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Quick Actions
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { to: '/issue', icon: PlusCircle, title: 'Issue Certificate', desc: 'Generate PDF · Store SHA-256 hash on blockchain · Include roll number' },
            { to: '/all',   icon: Activity,   title: 'View All Records', desc: 'Browse every certificate stored on Hyperledger Fabric ledger' },
            { to: '/verify',icon: ShieldCheck,title: 'Verify Certificate', desc: 'Check authenticity by certId or roll number · Download PDF' },
          ].map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="card card-hover group" style={{ textDecoration: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all"
                style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Icon size={18} style={{ color: 'var(--accent-light)' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>
                Open <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent certificates */}
      {recentCerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Recent Certificates
            </p>
            <Link to="/all" className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>
              View all →
            </Link>
          </div>
          <div className="card p-0 overflow-hidden">
            {recentCerts.map((c, i) => (
              <div key={c.certId} className="flex items-center justify-between p-4 transition-colors"
                style={{ borderBottom: i < recentCerts.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.studentName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {c.certId} · Roll: {c.rollNo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>{c.course?.substring(0,20)}...</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.issueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
