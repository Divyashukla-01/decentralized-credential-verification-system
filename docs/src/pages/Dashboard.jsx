import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, PlusCircle, Search, Activity, Server, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { getAllCertificates as getAllCredentials, healthCheck } from '../api.js'

function StatCard({ label, value, sub, color = 'fabric' }) {
  return (
    <div className="card flex flex-col gap-2">
      <p className="label">{label}</p>
      <p className={`font-display text-3xl font-bold text-${color}-400`}>{value}</p>
      {sub && <p className="text-xs text-chain-100">{sub}</p>}
    </div>
  )
}

function QuickAction({ to, icon: Icon, title, desc, color = 'fabric' }) {
  return (
    <Link to={to} className="card group hover:border-fabric-700 transition-all duration-200 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg bg-${color}-900/40 border border-${color}-800 flex items-center justify-center flex-shrink-0 group-hover:bg-${color}-900/70 transition-colors`}>
        <Icon size={18} className={`text-${color}-400`} />
      </div>
      <div className="flex-1">
        <p className="font-display text-sm font-bold text-chain-50 mb-1">{title}</p>
        <p className="text-xs text-chain-100">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-chain-100 group-hover:text-fabric-400 transition-colors mt-1" />
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: '—', orgs: 2, channel: 'mychannel' })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [recentCredentials, setRecentCredentials] = useState([])

  useEffect(() => {
    // Check backend health
    healthCheck()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'))

    // Get credential count
    getAllCredentials()
      .then(res => {
        const creds = res.data || []
        setStats(s => ({ ...s, total: creds.length }))
        setRecentCredentials(creds.slice(-3).reverse())
      })
      .catch(() => {})
  }, [])

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden card border-fabric-900 bg-gradient-to-br from-chain-900 via-chain-900 to-fabric-950">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #14b8a6 40px, #14b8a6 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #14b8a6 40px, #14b8a6 41px)'
        }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="font-display text-xs tracking-widest text-chain-100 uppercase">
              Backend {backendStatus}
            </span>
            {backendStatus === 'online' && <CheckCircle size={12} className="text-emerald-400" />}
            {backendStatus === 'offline' && <XCircle size={12} className="text-red-400" />}
          </div>
          <h1 className="font-display text-3xl font-bold text-chain-50 mb-2">
            Credential Verification<br />
            <span className="text-fabric-400">On-Chain.</span>
          </h1>
          <p className="text-chain-100 text-sm max-w-lg">
            Issue tamper-proof academic credentials on Hyperledger Fabric.
            Two organizations, one channel, zero trust required.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Credentials" value={stats.total} sub="on mychannel" />
        <StatCard label="Organizations" value={stats.orgs} sub="Org1 + Org2" />
        <StatCard label="Channel" value="active" sub="mychannel" color="emerald" />
        <StatCard label="Chaincode" value="v1.0" sub="credential" />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="label mb-4">Quick Actions</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickAction
            to="/issue"
            icon={PlusCircle}
            title="Issue Credential"
            desc="Record a new credential on the Fabric ledger"
          />
          <QuickAction
            to="/verify"
            icon={Search}
            title="Verify Credential"
            desc="Look up and validate a credential by ID"
          />
          <QuickAction
            to="/all"
            icon={Activity}
            title="View All Records"
            desc="Browse every credential stored on-chain"
          />
        </div>
      </div>

      {/* Network Info */}
      <div>
        <p className="label mb-4">Network Configuration</p>
        <div className="card font-display text-xs space-y-3">
          {[
            ['Network',    'Hyperledger Fabric 2.5'],
            ['Channel',    'mychannel'],
            ['Chaincode',  'credential'],
            ['State DB',   'CouchDB'],
            ['TLS',        'Enabled'],
            ['Orgs',       'Org1MSP, Org2MSP'],
            ['Peer',       'peer0.org1.example.com:7051'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2 border-b border-chain-800 last:border-0">
              <span className="text-chain-100 uppercase tracking-widest">{k}</span>
              <span className="text-fabric-400">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      {recentCredentials.length > 0 && (
        <div>
          <p className="label mb-4">Recent Credentials</p>
          <div className="space-y-2">
            {recentCredentials.map(c => (
              <div key={c.id} className="card flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-fabric-400 flex-shrink-0" />
                  <div>
                    <p className="font-display text-xs text-chain-50">{c.id}</p>
                    <p className="text-xs text-chain-100">{c.studentId} · {c.course}</p>
                  </div>
                </div>
                <span className="badge-grade">{c.grade}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
