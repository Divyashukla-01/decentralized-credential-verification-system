import { useEffect, useState, useCallback } from 'react'
import { Activity, RefreshCw, ShieldCheck, Loader2, Search, AlertCircle, Download } from 'lucide-react'
import { getAllCertificates, downloadCertificate } from '../api.js'

const GRADE_COLORS = {
  'A+': 'text-emerald-400', 'A': 'text-emerald-400', 'A-': 'text-teal-400',
  'B+': '#14b8a6', 'B': '#14b8a6', 'B-': '#14b8a6',
}

export default function AllCredentials() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [downloading, setDownloading] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await getAllCertificates()
      setCerts(res.data?.data || [])
      setLastRefreshed(new Date())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to backend')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

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

  const filtered = certs.filter(c => {
    const q = search.toLowerCase()
    return !q || c.certId?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.course?.toLowerCase().includes(q) ||
      c.issuerName?.toLowerCase().includes(q)
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(4,47,46,0.4)', border: '1px solid #115e59' }}>
            <Activity size={18} style={{ color: '#14b8a6' }} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg" style={{ color: '#fafafa' }}>All Certificates</h1>
            <p className="text-xs" style={{ color: '#71717a' }}>GET /api/certificate/all · Admin only</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-sm px-3 py-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Search + stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#71717a' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter by ID, student, course..."
            className="input-field pl-9 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-4 text-xs font-display" style={{ color: '#71717a' }}>
          <span><span style={{ color: '#14b8a6' }} className="font-bold">{filtered.length}</span>
            {search ? ` of ${certs.length}` : ''} certificates</span>
          {lastRefreshed && <span>Updated {lastRefreshed.toLocaleTimeString('en-IN')}</span>}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div>
            <p className="font-display text-sm font-bold mb-1">Backend Unreachable</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center gap-3 py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: '#14b8a6' }} />
          <span className="font-display text-sm" style={{ color: '#71717a' }}>Querying blockchain ledger...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && certs.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 gap-4">
          <ShieldCheck size={40} style={{ color: '#27272a' }} />
          <div className="text-center">
            <p className="font-display font-bold mb-1" style={{ color: '#fafafa' }}>No Certificates Yet</p>
            <p className="text-sm" style={{ color: '#71717a' }}>Issue your first certificate to see it here.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#09090b' }}>
                  {['Certificate ID','Student Name','Course','Issue Date','Issuer','Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.certId} className="transition-colors"
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(9,9,11,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,184,166,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(9,9,11,0.3)'}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={13} style={{ color: '#14b8a6' }} className="flex-shrink-0" />
                        <span className="font-display text-xs" style={{ color: '#fafafa' }}>{c.certId}</span>
                      </div>
                    </td>
                    <td className="table-cell text-sm" style={{ color: '#fafafa' }}>{c.studentName}</td>
                    <td className="table-cell text-sm" style={{ color: '#a1a1aa', maxWidth: '200px' }}>
                      <span className="truncate block">{c.course}</span>
                    </td>
                    <td className="table-cell text-xs font-display" style={{ color: '#a1a1aa' }}>{c.issueDate}</td>
                    <td className="table-cell text-xs" style={{ color: '#a1a1aa' }}>{c.issuerName}</td>
                    <td className="table-cell">
                      <button onClick={() => handleDownload(c.certId)}
                        disabled={downloading === c.certId}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display transition-all"
                        style={{ background: 'rgba(4,47,46,0.4)', color: '#14b8a6', border: '1px solid #115e59' }}>
                        {downloading === c.certId
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Download size={11} />}
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y" style={{ borderColor: '#27272a' }}>
            {filtered.map(c => (
              <div key={c.certId} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} style={{ color: '#14b8a6' }} />
                    <span className="font-display text-xs" style={{ color: '#fafafa' }}>{c.certId}</span>
                  </div>
                  <button onClick={() => handleDownload(c.certId)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display"
                    style={{ background: 'rgba(4,47,46,0.4)', color: '#14b8a6', border: '1px solid #115e59' }}>
                    <Download size={11} /> PDF
                  </button>
                </div>
                <p className="text-sm" style={{ color: '#fafafa' }}>{c.studentName}</p>
                <p className="text-xs" style={{ color: '#a1a1aa' }}>{c.course}</p>
                <div className="flex justify-between text-xs font-display" style={{ color: '#71717a' }}>
                  <span>{c.issueDate}</span>
                  <span>{c.issuerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
