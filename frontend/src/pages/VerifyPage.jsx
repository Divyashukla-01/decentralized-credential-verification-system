import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldX, Download, Loader2, AlertTriangle, Search, Hash, User, BookOpen, Calendar, Building, Link2, RefreshCw } from 'lucide-react'
import { verifyCertificate, downloadCertificate } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

// ── Student View: shows their certificates as cards ──────────
function StudentCertCard({ cert, onDownload, downloading }) {
  const [verified, setVerified] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const verify = async () => {
    setVerifying(true)
    try {
      const res = await verifyCertificate(cert.certId)
      setVerified(res.data?.data)
    } catch {
      setVerified({ status: 'NOT_FOUND', valid: false, message: 'Blockchain unavailable' })
    } finally { setVerifying(false) }
  }

  useEffect(() => { verify() }, [])

  const statusColor = verified?.valid ? 'var(--success)' : verified ? 'var(--warning)' : 'var(--text-muted)'
  const statusLabel = verified?.valid ? '✅ Verified on Blockchain'
    : verified?.status === 'NOT_FOUND' ? '⚠️ Blockchain Offline (cached)'
    : verified ? '❌ Verification Failed' : '⏳ Verifying...'

  return (
    <div className="card" style={{ border: `1px solid ${verified?.valid ? 'var(--success-border)' : 'var(--border)'}` }}>
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: verified?.valid ? 'var(--success-bg)' : 'var(--bg-secondary)',
            color: statusColor,
            border: `1px solid ${verified?.valid ? 'var(--success-border)' : 'var(--border)'}`,
          }}>
          {verifying ? <><Loader2 size={11} className="inline animate-spin mr-1" />Verifying...</> : statusLabel}
        </span>
        <span className="text-xs font-display" style={{ color: 'var(--text-muted)' }}>{cert.certId}</span>
      </div>

      {/* Certificate info */}
      <div className="mb-4">
        <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{cert.studentName}</p>
        <p className="text-sm" style={{ color: 'var(--accent-light)' }}>{cert.course}</p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Roll No: <span style={{ color: 'var(--text-secondary)' }}>{cert.rollNo}</span>
          {' · '}Issued: <span style={{ color: 'var(--text-secondary)' }}>{cert.issueDate}</span>
          {' · '}<span style={{ color: 'var(--text-secondary)' }}>{cert.issuerName}</span>
        </p>
      </div>

      {/* Hash verification details (if verified) */}
      {verified?.blockchainHash && (
        <div className="p-3 rounded-xl mb-4 text-xs font-display"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }} className="mb-1">Blockchain Hash:</p>
          <p className="break-all" style={{ color: 'var(--accent-light)' }}>{verified.blockchainHash}</p>
          {verified.txId && (
            <>
              <p style={{ color: 'var(--text-muted)' }} className="mt-2 mb-1">Transaction ID:</p>
              <p className="break-all" style={{ color: 'var(--text-secondary)' }}>{verified.txId}</p>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onDownload(cert.certId)} disabled={downloading === cert.certId}
          className="btn-primary" style={{ flex: 1 }}>
          {downloading === cert.certId
            ? <><Loader2 size={14} className="animate-spin" />Generating PDF...</>
            : <><Download size={14} />Download Certificate</>}
        </button>
        <button onClick={verify} disabled={verifying} className="btn-secondary" style={{ width: 'auto', padding: '0.75rem' }}>
          <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  )
}

// ── Admin / Public Search View ────────────────────────────────
function AdminSearchView() {
  const [searchId, setSearchId]     = useState('')
  const [searchType, setSearchType] = useState('certId')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [downloading, setDownloading] = useState(false)

  const handleVerify = async () => {
    if (!searchId.trim()) return
    setLoading(true); setResult(null)
    try {
      const { default: axios } = await import('axios')
      const endpoint = searchType === 'rollNo'
        ? `/api/certificate/verify/roll/${searchId.trim()}`
        : `/api/certificate/verify/${searchId.trim()}`
      const res = await axios.get(endpoint)
      setResult(res.data?.data)
    } catch (err) {
      setResult({ status: 'NOT_FOUND', valid: false,
        message: err.response?.data?.message || 'Not found on blockchain' })
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
    if (!result?.certId) return
    setDownloading(true)
    try {
      const res = await downloadCertificate(result.certId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `certificate-${result.certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Download failed') }
    finally { setDownloading(false) }
  }

  const sc = result ? {
    VALID:     { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)', icon: ShieldCheck, label: '✅ Verified — Tamper-Proof' },
    INVALID:   { color: 'var(--error)', bg: 'var(--error-bg)', border: 'var(--error-border)', icon: ShieldX, label: '❌ Certificate Tampered' },
    NOT_FOUND: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(217,119,6,0.2)', icon: AlertTriangle, label: '⚠️ Not Found' },
  }[result.status] : null

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div className="tab-bar">
          {[['certId','Certificate ID'],['rollNo','Roll Number']].map(([k,l]) => (
            <button key={k} onClick={() => { setSearchType(k); setSearchId(''); setResult(null) }}
              className={`tab-item ${searchType === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
        <div>
          <label className="label">{searchType === 'rollNo' ? 'Roll Number' : 'Certificate ID'}</label>
          <div className="flex gap-2">
            <input value={searchId} onChange={e => { setSearchId(e.target.value); setResult(null) }}
              placeholder={searchType === 'rollNo' ? 'e.g. 2203600130027' : 'e.g. CERT-2024-001'}
              className="input-field" onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            <button onClick={handleVerify} disabled={loading || !searchId.trim()} className="btn-primary"
              style={{ width: 'auto', padding: '0.75rem 1.25rem', flexShrink: 0 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </div>
      </div>

      {result && sc && (
        <div className="animate-slide-up space-y-4">
          <div className="p-5 rounded-2xl flex items-start gap-4"
            style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
            <sc.icon size={26} style={{ color: sc.color, flexShrink: 0 }} />
            <div>
              <p className="font-bold" style={{ color: sc.color }}>{sc.label}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
            </div>
          </div>

          {result.studentName && (
            <div className="card space-y-3">
              {[
                [Hash, 'Certificate ID', result.certId, true],
                [Hash, 'Roll Number', result.rollNo, true],
                [User, 'Student Name', result.studentName],
                [BookOpen, 'Course', result.course],
                [Calendar, 'Issue Date', result.issueDate],
                [Building, 'Issued By', result.issuerName],
                [Link2, 'Transaction ID', result.txId, true],
              ].filter(([,,v]) => v).map(([Icon, label, value, mono], i) => (
                <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <Icon size={14} style={{ color: 'var(--accent-light)', flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <p className="label" style={{ marginBottom: 2 }}>{label}</p>
                    <p className={`text-sm break-all ${mono ? 'font-display' : ''}`} style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                </div>
              ))}

              {result.blockchainHash && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="label mb-3">Hash Verification</p>
                  <div className="space-y-2 text-xs font-display">
                    <div>
                      <p style={{ color: 'var(--text-muted)' }} className="mb-1">Blockchain Hash:</p>
                      <p className="break-all" style={{ color: 'var(--accent-light)' }}>{result.blockchainHash}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)' }} className="mb-1">Recomputed Hash:</p>
                      <p className="break-all" style={{ color: result.valid ? 'var(--success)' : 'var(--error)' }}>{result.computedHash}</p>
                    </div>
                    <div className="p-3 rounded-lg text-center font-bold"
                      style={{ background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
                               border: `1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
                               color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                      {result.valid ? '✅ Hashes Match — Certificate Authentic' : '❌ Hash Mismatch — Tampered'}
                    </div>
                  </div>
                </div>
              )}

              {result.valid && (
                <button onClick={handleDownload} disabled={downloading} className="btn-primary mt-2">
                  {downloading ? <><Loader2 size={15} className="animate-spin" />Generating...</>
                    : <><Download size={15} />Download Certificate PDF</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────
export default function VerifyPage() {
  const { user, getCachedCerts } = useAuth()
  const [downloading, setDownloading] = useState(null)
  const isStudent = user?.role === 'student'

  // Get this student's certificates from cache
  const allCached = getCachedCerts()
  const myCerts = isStudent
    ? allCached.filter(c => c.rollNo === user?.rollNo || c.certId === user?.studentId)
    : []

  const handleDownload = async (certId) => {
    setDownloading(certId)
    try {
      const res = await downloadCertificate(certId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `certificate-${certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Download failed: ' + e.message) }
    finally { setDownloading(null) }
  }

  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {isStudent ? 'My Certificate' : 'Verify Certificate'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isStudent
            ? 'Your blockchain-secured certificate from ' + (user?.rollNo ? `Roll No: ${user.rollNo}` : 'your account')
            : 'Search by Certificate ID or Roll Number · Compare SHA-256 hash with blockchain'}
        </p>
      </div>

      {/* Student view: show their certificates directly */}
      {isStudent && myCerts.length > 0 && (
        <div className="space-y-4">
          {myCerts.map(cert => (
            <StudentCertCard key={cert.certId} cert={cert}
              onDownload={handleDownload} downloading={downloading} />
          ))}
        </div>
      )}

      {/* Student with no cached certs */}
      {isStudent && myCerts.length === 0 && (
        <div className="card text-center py-12">
          <ShieldCheck size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Certificate Found</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Your certificate hasn't been issued yet, or it was issued on a different device.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Enter your Certificate ID below to search:
          </p>
          <div className="mt-4">
            <AdminSearchView />
          </div>
        </div>
      )}

      {/* Admin view: search */}
      {!isStudent && <AdminSearchView />}
    </div>
  )
}
