import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldX, Download, Loader2, AlertTriangle, Search, Hash, User, BookOpen, Calendar, Building, Link2, RefreshCw, Eye } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../AuthContext.jsx'

function Field({ icon: Icon, label, value, mono }) {
  if (!value) return null
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <Icon size={14} style={{ color:'var(--accent-light)', flexShrink:0, marginTop:2 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:'0.88rem', color:'var(--text-primary)', wordBreak:'break-all', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
      </div>
    </div>
  )
}

// Student cert card shown after login
function StudentCertCard({ cert, onDownload, onView, downloading, verifying }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`/api/certificate/verify/${cert.certId}`)
        setResult(res.data?.data)
      } catch {
        // fallback to DB
        try {
          const res2 = await axios.get(`/api/public/verify/${cert.certId}`)
          setResult(res2.data?.data)
        } catch {
          setResult({ status: 'NOT_FOUND', valid: false, message: 'Blockchain and database both unavailable' })
        }
      } finally { setLoading(false) }
    }
    verify()
  }, [cert.certId])

  const statusColor = result?.valid ? 'var(--success)' : result ? 'var(--warning)' : 'var(--text-muted)'
  const statusBg    = result?.valid ? 'var(--success-bg)' : 'var(--bg-secondary)'
  const statusBorder = result?.valid ? 'var(--success-border)' : 'var(--border)'

  return (
    <div className="card animate-slide-up" style={{ border:`1px solid ${result?.valid ? 'var(--success-border)' : 'var(--border)'}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'4px 10px', borderRadius:'999px',
          background: statusBg, color: statusColor, border:`1px solid ${statusBorder}` }}>
          {loading ? <><Loader2 size={11} style={{ display:'inline', marginRight:'4px', animation:'spin 1s linear infinite' }}/>Verifying...</>
            : result?.valid ? '✅ Blockchain Verified' : '⚠️ Offline (cached)'}
        </span>
        <span style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--text-muted)' }}>{cert.certId}</span>
      </div>

      <p style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>{cert.studentName}</p>
      <p style={{ fontSize:'0.9rem', color:'var(--accent-light)', marginBottom:'8px' }}>{cert.course}</p>
      <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
        Roll No: <strong style={{ color:'var(--text-secondary)' }}>{cert.rollNo}</strong>
        {' · '}Issued: <strong style={{ color:'var(--text-secondary)' }}>{cert.issueDate}</strong>
        {' · '}{cert.issuerName}
      </p>

      {/* Hash info if verified */}
      {result?.blockchainHash && (
        <div style={{ marginTop:'12px', padding:'10px', borderRadius:'10px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'4px' }}>Blockchain Hash:</p>
          <p style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--accent-light)', wordBreak:'break-all' }}>{result.blockchainHash}</p>
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
        <button onClick={() => onView(result || cert)} disabled={!result?.studentName}
          className="btn-secondary" style={{ padding:'0.75rem 1rem' }}
          title="View full verification details">
          <Eye size={15} />
        </button>
        <button onClick={() => { setLoading(true); setResult(null) }}
          className="btn-secondary" style={{ padding:'0.75rem 0.75rem' }} title="Re-verify">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  )
}

// Full verification detail modal
function VerifyDetailModal({ result, onClose }) {
  if (!result) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={onClose}>
      <div style={{ background:'var(--bg-card)', borderRadius:'16px', padding:'24px', maxWidth:'560px', width:'100%', maxHeight:'90vh', overflowY:'auto', border:'1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <p style={{ fontWeight:700, color:'var(--text-primary)' }}>Verification Details</p>
          <button onClick={onClose} className="btn-ghost" style={{ padding:'4px 8px' }}>✕</button>
        </div>

        <div style={{ padding:'12px', borderRadius:'10px', marginBottom:'16px',
          background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
          border:`1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
          color: result.valid ? 'var(--success)' : 'var(--error)' }}>
          <p style={{ fontWeight:700 }}>{result.valid ? '✅ Certificate Verified — Tamper-Proof' : '❌ Verification Failed'}</p>
          <p style={{ fontSize:'0.85rem', marginTop:'4px' }}>{result.message}</p>
        </div>

        <Field icon={Hash}     label="Certificate ID"  value={result.certId}      mono />
        <Field icon={Hash}     label="Roll Number"     value={result.rollNo}      mono />
        <Field icon={User}     label="Student Name"    value={result.studentName} />
        <Field icon={BookOpen} label="Course"          value={result.course} />
        <Field icon={Calendar} label="Issue Date"      value={result.issueDate} />
        <Field icon={Building} label="Issued By"       value={result.issuerName} />
        <Field icon={Link2}    label="Transaction ID"  value={result.txId}        mono />

        {result.blockchainHash && (
          <div style={{ marginTop:'16px', padding:'12px', borderRadius:'10px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-muted)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Hash Verification</p>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'2px' }}>Blockchain Hash:</p>
            <p style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--accent-light)', wordBreak:'break-all', marginBottom:'8px' }}>{result.blockchainHash}</p>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'2px' }}>Computed Hash:</p>
            <p style={{ fontSize:'0.72rem', fontFamily:'monospace', color: result.valid ? 'var(--success)' : 'var(--error)', wordBreak:'break-all', marginBottom:'8px' }}>{result.computedHash}</p>
            <div style={{ padding:'10px', borderRadius:'8px', textAlign:'center', fontWeight:700, fontSize:'0.85rem',
              background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
              border:`1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
              color: result.valid ? 'var(--success)' : 'var(--error)' }}>
              {result.valid ? '✅ Hashes Match — Certificate Authentic' : '❌ Hash Mismatch — Tampered'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Admin search view
function AdminSearchView() {
  const [searchId, setSearchId]     = useState('')
  const [searchType, setSearchType] = useState('certId')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [viewResult, setViewResult] = useState(null)

  const handleVerify = async () => {
    if (!searchId.trim()) return
    setLoading(true); setResult(null)
    try {
      const endpoint = searchType === 'rollNo'
        ? `/api/certificate/verify/roll/${searchId.trim()}`
        : `/api/certificate/verify/${searchId.trim()}`
      const res = await axios.get(endpoint)
      setResult(res.data?.data)
    } catch {
      try {
        const res2 = await axios.get(`/api/public/verify/${searchId.trim()}`)
        setResult(res2.data?.data)
      } catch (err) {
        setResult({ status:'NOT_FOUND', valid:false, message: err.response?.data?.message || 'Not found' })
      }
    } finally { setLoading(false) }
  }

  const handleDownload = async (certId) => {
    setDownloading(true)
    try {
      const res = await axios.get(`/api/certificate/download/${certId}`, { responseType:'blob' })
      const blob = new Blob([res.data], { type:'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download=`certificate-${certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Download failed — make sure blockchain is running') }
    finally { setDownloading(false) }
  }

  const sc = result ? {
    VALID:     { color:'var(--success)', bg:'var(--success-bg)', border:'var(--success-border)', Icon:ShieldCheck },
    INVALID:   { color:'var(--error)',   bg:'var(--error-bg)',   border:'var(--error-border)',   Icon:ShieldX },
    NOT_FOUND: { color:'var(--warning)', bg:'var(--warning-bg)', border:'rgba(217,119,6,0.2)',  Icon:AlertTriangle },
  }[result.status] : null

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div className="tab-bar">
          {[['certId','Certificate ID'],['rollNo','Roll Number']].map(([k,l]) => (
            <button key={k} onClick={() => { setSearchType(k); setSearchId(''); setResult(null) }}
              className={`tab-item ${searchType===k?'active':''}`}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <input value={searchId} onChange={e => { setSearchId(e.target.value); setResult(null) }}
            placeholder={searchType==='rollNo' ? 'e.g. 2203600130027' : 'e.g. CERT-2024-001'}
            className="input-field" onKeyDown={e => e.key==='Enter' && handleVerify()} />
          <button onClick={handleVerify} disabled={loading || !searchId.trim()} className="btn-primary"
            style={{ width:'auto', padding:'0.75rem 1.25rem', flexShrink:0 }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
          </button>
        </div>
      </div>

      {result && sc && (
        <div className="animate-slide-up space-y-4">
          <div style={{ padding:'16px', borderRadius:'14px', display:'flex', alignItems:'flex-start', gap:'12px',
            background:sc.bg, border:`1px solid ${sc.border}` }}>
            <sc.Icon size={24} style={{ color:sc.color, flexShrink:0 }} />
            <div>
              <p style={{ fontWeight:700, color:sc.color }}>{result.message}</p>
            </div>
          </div>
          {result.studentName && (
            <div className="card space-y-1">
              <Field icon={Hash}     label="Certificate ID"  value={result.certId}      mono />
              <Field icon={Hash}     label="Roll Number"     value={result.rollNo}      mono />
              <Field icon={User}     label="Student Name"    value={result.studentName} />
              <Field icon={BookOpen} label="Course"          value={result.course} />
              <Field icon={Calendar} label="Issue Date"      value={result.issueDate} />
              <Field icon={Building} label="Issued By"       value={result.issuerName} />
              <Field icon={Link2}    label="Transaction ID"  value={result.txId}        mono />
              {result.blockchainHash && (
                <div style={{ marginTop:'12px', padding:'12px', borderRadius:'10px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'4px' }}>Blockchain Hash:</p>
                  <p style={{ fontSize:'0.72rem', fontFamily:'monospace', color:'var(--accent-light)', wordBreak:'break-all' }}>{result.blockchainHash}</p>
                  <div style={{ marginTop:'8px', padding:'8px', borderRadius:'8px', textAlign:'center', fontWeight:700, fontSize:'0.82rem',
                    background: result.valid ? 'var(--success-bg)' : 'var(--error-bg)',
                    border:`1px solid ${result.valid ? 'var(--success-border)' : 'var(--error-border)'}`,
                    color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                    {result.valid ? '✅ Hashes Match — Authentic' : '❌ Hash Mismatch — Tampered'}
                  </div>
                </div>
              )}
              <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                {result.valid && (
                  <button onClick={() => handleDownload(result.certId)} disabled={downloading}
                    className="btn-primary" style={{ flex:1 }}>
                    {downloading ? <><Loader2 size={15} className="animate-spin"/>Generating...</>
                      : <><Download size={15}/>Download PDF</>}
                  </button>
                )}
                <button onClick={() => setViewResult(result)} className="btn-secondary" style={{ padding:'0.75rem 1rem' }}>
                  <Eye size={15}/> View Details
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {viewResult && <VerifyDetailModal result={viewResult} onClose={() => setViewResult(null)} />}
    </div>
  )
}

export default function VerifyPage() {
  const { user, getCachedCerts } = useAuth()
  const [downloading, setDownloading] = useState(null)
  const [viewResult, setViewResult]   = useState(null)
  const isStudent = user?.role === 'student'

  const allCached = getCachedCerts()
  const myCerts = isStudent
    ? allCached.filter(c => c.rollNo === user?.rollNo || c.certId === user?.studentId || c.studentName === user?.name)
    : []

  const handleDownload = async (certId) => {
    setDownloading(certId)
    try {
      const res = await axios.get(`/api/certificate/download/${certId}`, { responseType:'blob' })
      const blob = new Blob([res.data], { type:'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download=`certificate-${certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed: ' + (e.response?.status === 404 ? 'Blockchain must be running to generate PDF' : e.message))
    } finally { setDownloading(null) }
  }

  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-6">
      <div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>
          {isStudent ? 'My Certificate' : 'Verify Certificate'}
        </h1>
        <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>
          {isStudent ? `Certificates issued to Roll No: ${user?.rollNo || 'your account'}` : 'Search by Certificate ID or Roll Number'}
        </p>
      </div>

      {/* Student: show their certs as cards */}
      {isStudent && myCerts.length > 0 && (
        <div className="space-y-4">
          {myCerts.map(cert => (
            <StudentCertCard key={cert.certId} cert={cert}
              onDownload={handleDownload}
              onView={setViewResult}
              downloading={downloading} />
          ))}
        </div>
      )}

      {/* Student with no cached certs — show search */}
      {isStudent && myCerts.length === 0 && (
        <div className="card text-center" style={{ padding:'40px 24px' }}>
          <ShieldCheck size={40} className="mx-auto mb-4" style={{ color:'var(--text-muted)' }} />
          <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'8px' }}>No Certificates Found</p>
          <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'20px' }}>
            Your certificate hasn't been issued yet, or use the search below:
          </p>
          <AdminSearchView />
        </div>
      )}

      {/* Admin: show search */}
      {!isStudent && <AdminSearchView />}

      {/* View detail modal */}
      {viewResult && <VerifyDetailModal result={viewResult} onClose={() => setViewResult(null)} />}
    </div>
  )
}
