import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldX, Loader2, Hash, User, BookOpen, Calendar, Building, Link2, AlertTriangle } from 'lucide-react'
import axios from 'axios'

function Field({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <Icon size={15} style={{ color: 'var(--accent-light)', flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <p className="label" style={{ marginBottom: 2 }}>{label}</p>
        <p className={`text-sm break-all ${mono ? 'font-display' : ''}`} style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
      </div>
    </div>
  )
}

export default function PublicVerifyPage() {
  const [certId, setCertId]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [autoLoaded, setAutoLoaded] = useState(false)

  // Auto-verify if certId in URL params (QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('certId')
    if (id) {
      setCertId(id)
      setAutoLoaded(true)
      verify(id)
    }
  }, [])

  const verify = async (id) => {
    const targetId = id || certId
    if (!targetId.trim()) return
    setLoading(true); setResult(null)
    try {
      const res = await axios.get(`/api/public/verify/${targetId.trim()}`)
      setResult(res.data?.data)
    } catch (err) {
      setResult({
        status: 'NOT_FOUND',
        valid: false,
        message: 'Certificate not found on blockchain',
        certId: targetId,
      })
    } finally { setLoading(false) }
  }

  const statusConfig = {
    VALID:     { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)', icon: ShieldCheck, label: '✅ Verified — Tamper-Proof' },
    INVALID:   { color: 'var(--error)', bg: 'var(--error-bg)', border: 'var(--error-border)', icon: ShieldX, label: '❌ Tampered Certificate' },
    NOT_FOUND: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(217,119,6,0.2)', icon: AlertTriangle, label: '⚠️ Certificate Not Found' },
  }
  const sc = result ? (statusConfig[result.status] || statusConfig.NOT_FOUND) : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Certificate Verification</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Goel Institute of Technology and Management</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">

        {/* Info banner */}
        <div className="glass-card text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            🔐 Blockchain Certificate Verification
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            This system verifies certificates stored on Hyperledger Fabric blockchain.
            Results are cryptographically tamper-proof.
          </p>
        </div>

        {/* Search box */}
        <div className="card">
          <label className="label">Certificate ID</label>
          <div className="flex gap-2">
            <input value={certId}
              onChange={e => { setCertId(e.target.value); setResult(null) }}
              placeholder="Enter Certificate ID (e.g. CERT-2024-001)"
              className="input-field" disabled={loading}
              onKeyDown={e => e.key === 'Enter' && verify()} />
            <button onClick={() => verify()} disabled={loading || !certId.trim()} className="btn-primary"
              style={{ width: 'auto', padding: '0.75rem 1.25rem' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card text-center py-10">
            <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent-light)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Querying Blockchain...</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Connecting to Hyperledger Fabric ledger</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="animate-slide-up space-y-4">
            {/* Status */}
            <div className="p-5 rounded-2xl flex items-start gap-4"
              style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
              <sc.icon size={28} style={{ color: sc.color, flexShrink: 0 }} />
              <div>
                <p className="font-bold text-base" style={{ color: sc.color }}>{sc.label}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
              </div>
            </div>

            {/* Certificate details */}
            {result.studentName && (
              <div className="card">
                <p className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Certificate Details</p>
                <Field icon={Hash}     label="Certificate ID"  value={result.certId}      mono />
                <Field icon={Hash}     label="Roll Number"     value={result.rollNo}      mono />
                <Field icon={User}     label="Student Name"    value={result.studentName} />
                <Field icon={BookOpen} label="Course / Degree" value={result.course} />
                <Field icon={Calendar} label="Date of Issue"   value={result.issueDate} />
                <Field icon={Building} label="Issued By"       value={result.issuerName} />
                <Field icon={Building} label="Organization"    value={result.issuerOrg}   mono />
                <Field icon={Link2}    label="Transaction ID"  value={result.txId}        mono />

                {/* Hash comparison */}
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="label mb-3">Hash Verification</p>
                  <div className="space-y-3 text-xs font-display">
                    <div>
                      <p style={{ color: 'var(--text-muted)' }} className="mb-1">Blockchain Hash (stored):</p>
                      <p className="break-all" style={{ color: 'var(--accent-light)' }}>{result.blockchainHash}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }} className="mb-1">Computed Hash (now):</p>
                      <p className="break-all" style={{ color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                        {result.computedHash}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg text-center font-bold"
                      style={{
                        background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
                        border: `1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
                        color: result.valid ? 'var(--success)' : 'var(--error)',
                      }}>
                      {result.valid
                        ? '✅ Hashes Match — Certificate is Authentic'
                        : '❌ Hash Mismatch — Certificate May Be Tampered'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs font-display" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          Secured by Hyperledger Fabric Blockchain · SHA-256 Hash Verification
        </p>
      </div>
    </div>
  )
}
