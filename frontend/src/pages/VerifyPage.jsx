import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldX, Download, Loader2, AlertTriangle, Search, Hash, User, BookOpen, Calendar, Building, Link2, ChevronDown, ChevronUp, Eye, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../AuthContext.jsx'

// ── Field row used inside detail panel ───────────────────────
function Field({ icon: Icon, label, value, mono }) {
  if (!value) return null
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <Icon size={14} style={{ color:'var(--accent-light)', flexShrink:0, marginTop:3 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:'0.7rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:'0.88rem', color:'var(--text-primary)', wordBreak:'break-all', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
      </div>
    </div>
  )
}

// ── Single student cert card ──────────────────────────────────
function StudentCertCard({ cert, onDownload, downloading }) {
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`/api/certificate/verify/${cert.certId}`)
        setResult(res.data?.data)
      } catch {
        try {
          const res2 = await axios.get(`/api/public/verify/${cert.certId}`)
          setResult(res2.data?.data)
        } catch {
          setResult({ status:'NOT_FOUND', valid:false, message:'Blockchain and database unavailable' })
        }
      } finally { setLoading(false) }
    }
    verify()
  }, [cert.certId])

  const isValid = result?.valid
  const statusColor  = isValid ? 'var(--success)' : loading ? 'var(--text-muted)' : 'var(--warning)'
  const statusBg     = isValid ? 'var(--success-bg)' : 'var(--bg-secondary)'
  const statusBorder = isValid ? 'var(--success-border)' : 'var(--border)'

  return (
    <div className="card animate-slide-up" style={{ border:`1.5px solid ${isValid ? 'var(--success-border)' : 'var(--border)'}` }}>
      {/* Status + cert ID row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'4px 12px', borderRadius:'999px',
          background:statusBg, color:statusColor, border:`1px solid ${statusBorder}` }}>
          {loading
            ? <><Loader2 size={11} style={{ display:'inline', marginRight:'4px', animation:'spin 1s linear infinite' }}/>Verifying...</>
            : isValid ? '✅ Blockchain Verified' : '⚠️ Offline (cached)'}
        </span>
        <span style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--text-muted)' }}>{cert.certId}</span>
      </div>

      {/* Core info */}
      <p style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>{cert.studentName}</p>
      <p style={{ fontSize:'0.9rem', color:'var(--accent-light)', marginBottom:'8px' }}>{cert.course}</p>
      <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
        Roll No: <strong style={{ color:'var(--text-secondary)' }}>{cert.rollNo}</strong>
        {' · '}Issued: <strong style={{ color:'var(--text-secondary)' }}>{cert.issueDate}</strong>
        {' · '}{cert.issuerName}
      </p>

      {/* Expandable details */}
      {result?.blockchainHash && (
        <div style={{ marginTop:'12px' }}>
          <button onClick={() => setShowDetails(d => !d)}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none',
              cursor:'pointer', color:'var(--accent-light)', fontSize:'0.82rem', fontWeight:600, padding:0 }}>
            {showDetails ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>

          {showDetails && (
            <div style={{ marginTop:'12px', padding:'12px', borderRadius:'10px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}
              className="animate-slide-up">
              <Field icon={Hash}     label="Certificate ID"  value={result.certId || cert.certId} mono />
              <Field icon={Hash}     label="Roll Number"     value={result.rollNo}    mono />
              <Field icon={User}     label="Student Name"    value={result.studentName} />
              <Field icon={BookOpen} label="Course"          value={result.course} />
              <Field icon={Calendar} label="Issue Date"      value={result.issueDate} />
              <Field icon={Building} label="Issued By"       value={result.issuerName} />
              <Field icon={Link2}    label="Transaction ID"  value={result.txId}      mono />

              <div style={{ marginTop:'12px', padding:'10px', borderRadius:'8px', background:'var(--bg-primary)', border:'1px solid var(--border)' }}>
                <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'4px' }}>Blockchain Hash:</p>
                <p style={{ fontSize:'0.7rem', fontFamily:'monospace', color:'var(--accent-light)', wordBreak:'break-all' }}>{result.blockchainHash}</p>
                <div style={{ marginTop:'8px', padding:'8px', borderRadius:'6px', textAlign:'center', fontWeight:700, fontSize:'0.8rem',
                  background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
                  border:`1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
                  color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                  {result.valid ? '✅ Hashes Match — Certificate Authentic' : '❌ Hash Mismatch — Tampered'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
        <button onClick={() => onDownload(cert.certId)} disabled={downloading === cert.certId}
          className="btn-primary" style={{ flex:1 }}>
          {downloading === cert.certId
            ? <><Loader2 size={14} className="animate-spin"/>Generating...</>
            : <><Download size={14}/>Download PDF</>}
        </button>
      </div>
    </div>
  )
}

// ── Admin search view ─────────────────────────────────────────
function AdminSearchView() {
  const [searchId, setSearchId]     = useState('')
  const [searchType, setSearchType] = useState('certId')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleVerify = async () => {
    if (!searchId.trim()) return
    setLoading(true); setResult(null); setShowDetails(false)
    try {
      const endpoint = searchType === 'rollNo'
        ? `/api/public/verify/roll/${searchId.trim()}`
        : `/api/public/verify/${searchId.trim()}`
      const res = await axios.get(endpoint)
      setResult(res.data?.data)
    } catch (err) {
      try {
        setResult({ status:'NOT_FOUND', valid:false,
          message: err.response?.data?.message || 'Not found on blockchain or database' })
      } catch {
        setResult({ status:'NOT_FOUND', valid:false,
          message: 'Not found on blockchain or database' })
      }
    } finally { setLoading(false) }
  }

  const handleDownload = async (certId) => {
    setDownloading(true)
    try {
      const res = await axios.get(`/api/certificate/download/${certId}`, { responseType:'blob' })
      const blob = new Blob([res.data], { type:'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `certificate-${certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed: ' + (e.message || 'Unknown error'))
    } finally { setDownloading(false) }
  }

  const isValid   = result?.status === 'VALID'
  const isInvalid = result?.status === 'INVALID'
  const notFound  = result?.status === 'NOT_FOUND'

  return (
    <div className="space-y-5">
      {/* Search box */}
      <div className="card space-y-4">
        <div className="tab-bar">
          {[['certId','Certificate ID'],['rollNo','Roll Number']].map(([k,l]) => (
            <button key={k} onClick={() => { setSearchType(k); setSearchId(''); setResult(null); setShowDetails(false) }}
              className={`tab-item ${searchType===k?'active':''}`}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <input value={searchId} onChange={e => { setSearchId(e.target.value); setResult(null) }}
            placeholder={searchType==='rollNo' ? 'e.g. 2203600130027' : 'e.g. CERT-2024-001'}
            className="input-field" onKeyDown={e => e.key==='Enter' && handleVerify()} />
          <button onClick={handleVerify} disabled={loading || !searchId.trim()}
            className="btn-primary" style={{ width:'auto', padding:'0.75rem 1.25rem', flexShrink:0 }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="animate-slide-up space-y-3">

          {/* ── Status summary line (clean, prominent) ── */}
          <div style={{ padding:'16px 20px', borderRadius:'14px', display:'flex', alignItems:'center', gap:'14px',
            background: isValid ? 'var(--success-bg)' : isInvalid ? 'var(--error-bg)' : 'var(--warning-bg)',
            border: `1.5px solid ${isValid ? 'var(--success-border)' : isInvalid ? 'var(--error-border)' : 'rgba(217,119,6,0.2)'}` }}>
            {isValid
              ? <ShieldCheck size={26} style={{ color:'var(--success)', flexShrink:0 }}/>
              : isInvalid
              ? <ShieldX size={26} style={{ color:'var(--error)', flexShrink:0 }}/>
              : <AlertTriangle size={26} style={{ color:'var(--warning)', flexShrink:0 }}/>}
            <div>
              <p style={{ fontWeight:700, fontSize:'1rem',
                color: isValid ? 'var(--success)' : isInvalid ? 'var(--error)' : 'var(--warning)' }}>
                {isValid ? 'Certificate Verified Successfully ✅'
                  : isInvalid ? '❌ Certificate Invalid — Tampered'
                  : '⚠️ Certificate Not Found'}
              </p>
              <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'2px' }}>{result.message}</p>
            </div>
          </div>

          {/* ── View Details toggle (only if cert found) ── */}
          {result.studentName && (
            <div className="card">
              <button onClick={() => setShowDetails(d => !d)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
                  background:'none', border:'none', cursor:'pointer', padding:0 }}>
                <span style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.95rem', display:'flex', alignItems:'center', gap:'8px' }}>
                  <Eye size={16} style={{ color:'var(--accent-light)' }}/> View Details
                </span>
                {showDetails ? <ChevronUp size={16} style={{ color:'var(--text-muted)' }}/> : <ChevronDown size={16} style={{ color:'var(--text-muted)' }}/>}
              </button>

              {showDetails && (
                <div className="animate-slide-up" style={{ marginTop:'16px' }}>
                  <Field icon={Hash}     label="Certificate ID"  value={result.certId}      mono />
                  <Field icon={Hash}     label="Roll Number"     value={result.rollNo}      mono />
                  <Field icon={User}     label="Student Name"    value={result.studentName} />
                  <Field icon={BookOpen} label="Course"          value={result.course} />
                  <Field icon={Calendar} label="Issue Date"      value={result.issueDate} />
                  <Field icon={Building} label="Issued By"       value={result.issuerName} />
                  <Field icon={Building} label="Organization"    value={result.issuerOrg}   mono />
                  <Field icon={Link2}    label="Transaction ID"  value={result.txId}        mono />

                  {result.blockchainHash && (
                    <div style={{ marginTop:'14px', padding:'12px', borderRadius:'10px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
                      <p style={{ fontSize:'0.7rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>Hash Verification</p>
                      <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'2px' }}>Blockchain Hash (stored):</p>
                      <p style={{ fontSize:'0.7rem', fontFamily:'monospace', color:'var(--accent-light)', wordBreak:'break-all', marginBottom:'8px' }}>{result.blockchainHash}</p>
                      <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'2px' }}>Recomputed Hash (now):</p>
                      <p style={{ fontSize:'0.7rem', fontFamily:'monospace', color: result.valid ? 'var(--success)' : 'var(--error)', wordBreak:'break-all', marginBottom:'8px' }}>{result.computedHash}</p>
                      <div style={{ padding:'10px', borderRadius:'8px', textAlign:'center', fontWeight:700, fontSize:'0.82rem',
                        background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
                        border:`1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
                        color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                        {result.valid ? '✅ Hashes Match — Certificate is Authentic' : '❌ Hash Mismatch — Certificate Tampered'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:'8px', marginTop:'14px' }}>
                <button onClick={() => handleDownload(result.certId)} disabled={downloading}
                  className="btn-primary" style={{ flex:1 }}>
                  {downloading
                    ? <><Loader2 size={15} className="animate-spin"/>Generating PDF...</>
                    : <><Download size={15}/>Download Certificate PDF</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function VerifyPage() {
  const { user, getCachedCerts } = useAuth()
  const [downloading, setDownloading] = useState(null)
  const isStudent = user?.role === 'student'

  const allCached = getCachedCerts()
  const myCerts = isStudent
    ? allCached.filter(c =>
        c.rollNo === user?.rollNo ||
        c.certId === user?.studentId ||
        c.studentName?.toLowerCase() === user?.name?.toLowerCase())
    : []

  const handleDownload = async (certId) => {
    setDownloading(certId)
    try {
      const res = await axios.get(`/api/certificate/download/${certId}`, { responseType:'blob' })
      const blob = new Blob([res.data], { type:'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `certificate-${certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed: ' + (e.response?.data?.message || e.message))
    } finally { setDownloading(null) }
  }

  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-6">
      <div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>
          {isStudent ? 'My Certificate' : 'Verify Certificate'}
        </h1>
        <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>
          {isStudent
            ? `Certificates issued to Roll No: ${user?.rollNo || 'your account'}`
            : 'Search by Certificate ID or Roll Number · Blockchain hash verification'}
        </p>
      </div>

      {/* Student: show their cert cards directly */}
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
        <div className="card text-center" style={{ padding:'40px 24px' }}>
          <ShieldCheck size={40} className="mx-auto mb-4" style={{ color:'var(--text-muted)' }} />
          <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'8px' }}>No Certificates Found</p>
          <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'20px' }}>
            Your certificate hasn't been issued yet. Search below:
          </p>
          <AdminSearchView />
        </div>
      )}

      {/* Admin: search */}
      {!isStudent && <AdminSearchView />}
    </div>
  )
}
