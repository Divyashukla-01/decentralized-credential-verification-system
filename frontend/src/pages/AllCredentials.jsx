import { useEffect, useState, useCallback } from 'react'
import { Activity, RefreshCw, ShieldCheck, Loader2, Search, AlertCircle, Download, Database } from 'lucide-react'
import { getAllCertificatesFromDb, downloadCertificate } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

export default function AllCredentials() {
  const { getCachedCerts } = useAuth()
  const [certs, setCerts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [downloading, setDownloading]     = useState(null)
  const [showCached, setShowCached]       = useState(false)
  const [cachedCerts, setCachedCerts]     = useState([])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await getAllCertificatesFromDb()
      setCerts(res.data?.data || [])
      setLastRefreshed(new Date())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect. Showing cached data.')
      setShowCached(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    setCachedCerts(getCachedCerts())
  }, [load])

  const handleDownload = async (certId) => {
    setDownloading(certId)
    try {
      const res = await downloadCertificate(certId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `certificate-${certId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Download failed') }
    finally { setDownloading(null) }
  }

  const displayCerts = showCached ? cachedCerts : certs
  const filtered = displayCerts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.certId?.toLowerCase().includes(q) || c.rollNo?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) || c.course?.toLowerCase().includes(q)
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>All Certificates</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {showCached ? 'Showing cached data (offline)' : 'Live from Hyperledger Fabric ledger'}
          </p>
        </div>
        <div className="flex gap-2">
          {cachedCerts.length > 0 && (
            <button onClick={() => setShowCached(!showCached)} className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}>
              <Database size={13} />
              {showCached ? 'Live Data' : `Cached (${cachedCerts.length})`}
            </button>
          )}
          <button onClick={load} disabled={loading} className="btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, roll no, name, course..."
            className="input-field pl-9 py-2.5" style={{ fontSize: '0.875rem' }} />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{filtered.length}</span>
          {search ? ` of ${displayCerts.length}` : ''} records
          {lastRefreshed && ` · ${lastRefreshed.toLocaleTimeString('en-IN')}`}
        </p>
      </div>

      {/* Offline banner */}
      {showCached && (
        <div className="alert-warning text-sm">
          <AlertCircle size={15} />
          <span>Showing {cachedCerts.length} locally cached certificates. Connect to blockchain for live data.</span>
        </div>
      )}

      {/* Error */}
      {error && !showCached && (
        <div className="alert-error">
          <AlertCircle size={15} className="flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm mb-0.5">Backend Unreachable</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center gap-3 py-14">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent-light)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Querying blockchain ledger...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && !error && (
        <div className="card flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <ShieldCheck size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {search ? 'No matching certificates' : 'No certificates yet'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? `No results for "${search}"` : 'Issue your first certificate to see it here.'}
            </p>
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
                <tr>
                  {['Certificate ID','Roll No','Student Name','Course','Issue Date','Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.certId || c.rollNo || i}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 0.15s' }}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={13} style={{ color: 'var(--accent-light)' }} className="flex-shrink-0" />
                        <span className="font-display text-xs" style={{ color: 'var(--text-primary)' }}>{c.certId}</span>
                      </div>
                    </td>
                    <td className="table-cell font-display text-xs" style={{ color: 'var(--accent-light)' }}>{c.rollNo}</td>
                    <td className="table-cell font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.studentName}</td>
                    <td className="table-cell text-sm" style={{ maxWidth: 200 }}>
                      <span className="truncate block" style={{ color: 'var(--text-secondary)' }}>{c.course}</span>
                    </td>
                    <td className="table-cell text-xs font-display" style={{ color: 'var(--text-muted)' }}>{c.issueDate}</td>
                    <td className="table-cell">
                      {!showCached && (
                        <button onClick={() => handleDownload(c.certId)}
                          disabled={downloading === c.certId} className="btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                          {downloading === c.certId
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Download size={11} />}
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((c, i) => (
              <div key={c.certId || i} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} style={{ color: 'var(--accent-light)' }} />
                    <span className="font-display text-xs" style={{ color: 'var(--text-primary)' }}>{c.certId}</span>
                  </div>
                  {!showCached && (
                    <button onClick={() => handleDownload(c.certId)} className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      <Download size={11} /> PDF
                    </button>
                  )}
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.studentName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Roll: <span style={{ color: 'var(--accent-light)' }}>{c.rollNo}</span> · {c.course}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.issueDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
