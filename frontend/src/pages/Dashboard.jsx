import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, PlusCircle, Search, Activity, CheckCircle, XCircle, ArrowRight, Zap } from 'lucide-react'
import { getAllCertificates, healthCheck, isDemoMode } from '../api.js'

function StatCard({ label, value, sub, color = '#14b8a6' }) {
  return (
    <div className="card flex flex-col gap-2">
      <p className="label">{label}</p>
      <p className="font-display text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: '#71717a' }}>{sub}</p>}
    </div>
  )
}

function QuickAction({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="card group transition-all duration-200 flex items-start gap-4"
      style={{ border: '1px solid #27272a' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#115e59'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#27272a'}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: 'rgba(4,47,46,0.4)', border: '1px solid #115e59' }}>
        <Icon size={18} style={{ color: '#14b8a6' }} />
      </div>
      <div className="flex-1">
        <p className="font-display text-sm font-bold mb-1" style={{ color: '#fafafa' }}>{title}</p>
        <p className="text-xs" style={{ color: '#71717a' }}>{desc}</p>
      </div>
      <ArrowRight size={14} style={{ color: '#71717a' }} className="mt-1 group-hover:text-teal-400 transition-colors" />
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: '—' })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [recentCerts, setRecentCerts] = useState([])
  const demo = isDemoMode()

  useEffect(() => {
    healthCheck()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus(demo ? 'demo' : 'offline'))

    getAllCertificates()
      .then(res => {
        const certs = res.data?.data || []
        setStats({ total: certs.length })
        setRecentCerts(certs.slice(-3).reverse())
      })
      .catch(() => {})
  }, [])

  const statusColor = backendStatus === 'online' ? '#34d399' : backendStatus === 'demo' ? '#fbbf24' : '#f87171'
  const statusLabel = backendStatus === 'online' ? 'Backend Online' : backendStatus === 'demo' ? 'Demo Mode' : 'Backend Offline'

  return (
    <div className="animate-fade-in space-y-8">

      {/* Demo mode banner */}
      {demo && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(120,53,15,0.3)', border: '1px solid #92400e', color: '#fcd34d' }}>
          <Zap size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-bold mb-1">🎭 Demo Mode Active</p>
            <p className="text-xs" style={{ color: '#fde68a' }}>
              This is a live frontend demo. The blockchain backend (Hyperledger Fabric) runs locally.
              All data shown is sample data. Verify works with IDs: CERT-2024-001 to CERT-2024-005.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="card relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #18181b, #0c1a18)',
        border: '1px solid #134e4a'
      }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 30px,#14b8a6 30px,#14b8a6 31px),repeating-linear-gradient(90deg,transparent,transparent 30px,#14b8a6 30px,#14b8a6 31px)'
        }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
            <span className="font-display text-xs tracking-widest uppercase" style={{ color: '#71717a' }}>
              {statusLabel}
            </span>
            {backendStatus === 'online' && <CheckCircle size={12} style={{ color: '#34d399' }} />}
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: '#fafafa' }}>
            Blockchain Certificate<br />
            <span style={{ color: '#14b8a6' }}>Verification System</span>
          </h1>
          <p className="text-sm" style={{ color: '#71717a' }}>
            Issue tamper-proof academic certificates secured by SHA-256 hashing
            on Hyperledger Fabric. Two organizations, one immutable ledger.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Certificates Issued" value={stats.total} sub="on mychannel" />
        <StatCard label="Organizations" value="2" sub="Org1 + Org2" />
        <StatCard label="Hash Algorithm" value="SHA-256" sub="tamper-proof" color="#818cf8" />
        <StatCard label="Chaincode" value="v2.0" sub="credential" />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="label mb-4">Admin Actions</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickAction to="/issue" icon={PlusCircle} title="Issue Certificate"
            desc="Generate PDF with QR code, store hash on blockchain" />
          <QuickAction to="/all" icon={Activity} title="All Certificates"
            desc="Browse every certificate stored on-chain" />
          <QuickAction to="/verify" icon={Search} title="Verify Certificate"
            desc="Verify authenticity by recomputing SHA-256 hash" />
        </div>
      </div>

      {/* Network Info */}
      <div>
        <p className="label mb-4">Network Configuration</p>
        <div className="card font-display text-xs space-y-0">
          {[
            ['Network',       'Hyperledger Fabric 2.5'],
            ['Channel',       'mychannel'],
            ['Chaincode',     'credential (Go)'],
            ['State DB',      'CouchDB'],
            ['TLS',           'Enabled'],
            ['Orgs',          'Org1MSP + Org2MSP'],
            ['Hash',          'SHA-256 (tamper detection)'],
            ['PDF',           'iText7 + QR (ZXing)'],
            ['Bulk Upload',   'Apache POI (Excel .xlsx)'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2.5"
              style={{ borderBottom: '1px solid #27272a' }}>
              <span className="uppercase tracking-widest" style={{ color: '#71717a' }}>{k}</span>
              <span style={{ color: '#14b8a6' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      {recentCerts.length > 0 && (
        <div>
          <p className="label mb-4">Recent Certificates</p>
          <div className="space-y-2">
            {recentCerts.map(c => (
              <div key={c.certId} className="card flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={15} style={{ color: '#14b8a6' }} className="flex-shrink-0" />
                  <div>
                    <p className="font-display text-xs" style={{ color: '#fafafa' }}>{c.certId}</p>
                    <p className="text-xs" style={{ color: '#71717a' }}>{c.studentName} · {c.course?.substring(0, 35)}{c.course?.length > 35 ? '...' : ''}</p>
                  </div>
                </div>
                <span className="text-xs font-display" style={{ color: '#14b8a6' }}>{c.issueDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
