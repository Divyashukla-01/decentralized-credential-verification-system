import { useState, useEffect } from 'react'
import { Search, Loader2, ShieldCheck, ShieldX, Download, Hash, User, BookOpen, Calendar, Building, Link } from 'lucide-react'
import { verifyCertificate, downloadCertificate } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

export default function VerifyPage() {
  const { user } = useAuth()
  const [certId, setCertId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [downloading, setDownloading] = useState(false)

  // Read certId from URL query param (for QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const qrCertId = params.get('certId')
    if (qrCertId) {
      setCertId(qrCertId)
      handleVerify(qrCertId)
    } else if (user?.role === 'student' && user?.studentId) {
      setCertId(user.studentId)
    }
  }, [])

  const handleVerify = async (id) => {
    const targetId = id || certId
    if (!targetId.trim()) return
    setLoading(true); setResult(null)
    try {
      const res = await verifyCertificate(targetId.trim())
      setResult(res.data.data)
    } catch (err) {
      setResult({
        status: 'NOT_FOUND',
        valid: false,
        message: err.response?.data?.message || 'Certificate not found on blockchain',
        certId: targetId
      })
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
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

  const statusColor = result?.status === 'VALID' ? '#34d399' : result?.status === 'INVALID' ? '#f87171' : '#fbbf24'
  const statusBg = result?.status === 'VALID' ? 'rgba(6,78,59,0.3)' : result?.status === 'INVALID' ? 'rgba(127,29,29,0.3)' : 'rgba(120,53,15,0.3)'
  const statusBorder = result?.status === 'VALID' ? '#065f46' : result?.status === 'INVALID' ? '#7f1d1d' : '#92400e'

  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(4,47,46,0.4)', border: '1px solid #115e59' }}>
          <Search size={18} style={{ color: '#14b8a6' }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg" style={{ color: '#fafafa' }}>Verify Certificate</h1>
          <p className="text-xs" style={{ color: '#71717a' }}>Recomputes SHA-256 hash · Compares with blockchain</p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <label className="label">Certificate ID</label>
        <div className="flex gap-2">
          <input value={certId} onChange={e => { setCertId(e.target.value); setResult(null) }}
            placeholder="e.g. CERT-2024-001"
            className="input-field" disabled={loading || (user?.role === 'student')}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}/>
          <button onClick={() => handleVerify()} disabled={loading || !certId.trim()}
            className="btn-primary" style={{ width: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
          </button>
        </div>
        {user?.role === 'student' && (
          <p className="text-xs mt-2" style={{ color: '#71717a' }}>Your Certificate ID is pre-filled from your account</p>
        )}
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="animate-slide-up space-y-4">
          {/* Status banner */}
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: statusBg, border: `1px solid ${statusBorder}` }}>
            {result.status === 'VALID'
              ? <ShieldCheck size={24} style={{ color: statusColor }} className="flex-shrink-0 mt-0.5"/>
              : <ShieldX size={24} style={{ color: statusColor }} className="flex-shrink-0 mt-0.5"/>}
            <div>
              <p className="font-display font-bold text-sm uppercase tracking-widest" style={{ color: statusColor }}>
                {result.status === 'VALID' ? '✅ Verified Certificate'
                  : result.status === 'INVALID' ? '❌ Tampered Certificate'
                  : '⚠️ Not Found'}
              </p>
              <p className="text-sm mt-1" style={{ color: '#e2e8f0' }}>{result.message}</p>
            </div>
          </div>

          {/* Certificate details */}
          {result.studentName && (
            <div className="card space-y-4">
              <p className="label">Certificate Details</p>
              {[
                [User, 'Student Name', result.studentName],
                [BookOpen, 'Course / Degree', result.course],
                [Calendar, 'Date of Issue', result.issueDate],
                [Hash, 'Certificate ID', result.certId, true],
                [Building, 'Issued By', result.issuerName],
                [Building, 'Org (MSP)', result.issuerOrg, true],
                [Link, 'Tx ID', result.txId, true],
              ].filter(([,,v]) => v).map(([Icon, label, value, mono], i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#0d9488' }}/>
                  <div>
                    <p className="text-xs font-display uppercase tracking-widest" style={{ color: '#71717a' }}>{label}</p>
                    <p className={`text-sm break-all ${mono ? 'font-display' : ''}`} style={{ color: '#fafafa' }}>{value}</p>
                  </div>
                </div>
              ))}

              {/* Hash comparison */}
              <div className="pt-3" style={{ borderTop: '1px solid #27272a' }}>
                <p className="label mb-2">Hash Verification</p>
                <div className="space-y-2 text-xs font-display">
                  <div>
                    <p style={{ color: '#71717a' }}>Blockchain Hash (stored):</p>
                    <p className="break-all" style={{ color: '#14b8a6' }}>{result.blockchainHash}</p>
                  </div>
                  <div>
                    <p style={{ color: '#71717a' }}>Computed Hash (now):</p>
                    <p className="break-all" style={{ color: result.valid ? '#34d399' : '#f87171' }}>{result.computedHash}</p>
                  </div>
                  <div className="p-2 rounded text-center font-bold" style={{
                    background: result.valid ? 'rgba(6,78,59,0.3)' : 'rgba(127,29,29,0.3)',
                    color: result.valid ? '#34d399' : '#f87171'
                  }}>
                    {result.valid ? '✅ Hashes Match — Tamper Proof' : '❌ Hash Mismatch — Certificate Tampered'}
                  </div>
                </div>
              </div>

              {/* Download */}
              {result.valid && (
                <button onClick={handleDownload} disabled={downloading}
                  className="btn-primary" style={{ marginTop: '0.5rem' }}>
                  {downloading ? <><Loader2 size={15} className="animate-spin"/>Generating PDF...</>
                    : <><Download size={15}/>Download Certificate PDF</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      {!result && (
        <div className="card" style={{ background: '#09090b', border: '1px solid #27272a' }}>
          <p className="label mb-3">How Verification Works</p>
          <ol className="text-xs space-y-2" style={{ color: '#71717a' }}>
            {['Fetch certificate metadata from Hyperledger Fabric blockchain',
              'Recompute SHA-256 hash: SHA256(name + course + date + certId)',
              'Compare computed hash with blockchain-stored hash',
              'If match → VALID (tamper-proof). If mismatch → TAMPERED'].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-display flex-shrink-0" style={{ color: '#14b8a6' }}>{String(i+1).padStart(2,'0')}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
