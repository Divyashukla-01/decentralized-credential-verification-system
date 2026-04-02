import { useState } from 'react'
import { PlusCircle, Loader2, CheckCircle, XCircle, Download, Upload, FileSpreadsheet } from 'lucide-react'
import { issueCertificate, bulkIssueCertificates } from '../api.js'

export default function IssuePage() {
  const [tab, setTab] = useState('single')
  const [form, setForm] = useState({ certId: '', studentName: '', course: '', issueDate: '', issuerName: 'DCVS University' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [excelFile, setExcelFile] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)

  const handleSingle = async (e) => {
    e.preventDefault()
    setLoading(true); setResult(null); setPdfUrl(null)
    try {
      const res = await issueCertificate(form)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfUrl({ url, name: `certificate-${form.certId}.pdf` })
      setResult({ success: true, message: 'Certificate issued and stored on blockchain!' })
      setForm({ certId: '', studentName: '', course: '', issueDate: '', issuerName: 'DCVS University' })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to issue certificate'
      setResult({ success: false, message: msg })
    } finally { setLoading(false) }
  }

  const handleBulk = async (e) => {
    e.preventDefault()
    if (!excelFile) return
    setLoading(true); setBulkResults(null)
    try {
      const res = await bulkIssueCertificates(excelFile)
      setBulkResults(res.data)
    } catch (err) {
      setBulkResults({ error: err.response?.data?.message || 'Bulk upload failed' })
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(4,47,46,0.4)', border: '1px solid #115e59' }}>
          <PlusCircle size={18} style={{ color: '#14b8a6' }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg" style={{ color: '#fafafa' }}>Issue Certificate</h1>
          <p className="text-xs" style={{ color: '#71717a' }}>Admin only · Stores SHA-256 hash on Hyperledger Fabric</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-lg gap-1" style={{ background: '#09090b' }}>
        {[['single','Single Certificate'],['bulk','Bulk Upload (Excel)']].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); setResult(null); setBulkResults(null) }}
            className="flex-1 py-2 rounded-md text-xs font-display transition-all flex items-center justify-center gap-2"
            style={{ background: tab === k ? '#14b8a6' : 'transparent', color: tab === k ? '#09090b' : '#71717a', fontWeight: tab === k ? 700 : 400 }}>
            {k === 'single' ? <PlusCircle size={13}/> : <FileSpreadsheet size={13}/>}{l}
          </button>
        ))}
      </div>

      {/* Single Certificate */}
      {tab === 'single' && (
        <div className="card">
          <form onSubmit={handleSingle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Certificate ID</label>
                <input value={form.certId} onChange={e => setForm(f => ({...f, certId: e.target.value}))}
                  placeholder="e.g. CERT-2024-001" className="input-field" required disabled={loading}/>
              </div>
              <div>
                <label className="label">Student Name</label>
                <input value={form.studentName} onChange={e => setForm(f => ({...f, studentName: e.target.value}))}
                  placeholder="e.g. Divya Shukla" className="input-field" required disabled={loading}/>
              </div>
              <div>
                <label className="label">Course / Degree</label>
                <input value={form.course} onChange={e => setForm(f => ({...f, course: e.target.value}))}
                  placeholder="e.g. B.Tech IT with Cybersecurity" className="input-field" required disabled={loading}/>
              </div>
              <div>
                <label className="label">Date of Issue</label>
                <input type="date" value={form.issueDate} onChange={e => setForm(f => ({...f, issueDate: e.target.value}))}
                  className="input-field" required disabled={loading}/>
              </div>
              <div className="col-span-2">
                <label className="label">Issuer Name</label>
                <input value={form.issuerName} onChange={e => setForm(f => ({...f, issuerName: e.target.value}))}
                  placeholder="University/Organization name" className="input-field" required disabled={loading}/>
              </div>
            </div>

            {/* Hash preview */}
            <div className="rounded-lg p-3 text-xs font-display" style={{ background: '#09090b', border: '1px solid #27272a' }}>
              <p style={{ color: '#71717a' }} className="mb-1">SHA-256 Hash Input Preview:</p>
              <p style={{ color: '#14b8a6' }} className="break-all">
                {form.studentName}{form.course}{form.issueDate}{form.certId || '...'}
              </p>
              <p className="mt-1" style={{ color: '#52525b' }}>→ hash = SHA256(studentName + course + issueDate + certId)</p>
            </div>

            {result && (
              <div className={result.success ? 'alert-success' : 'alert-error'}>
                {result.success ? <CheckCircle size={15}/> : <XCircle size={15}/>}
                <span className="text-sm">{result.message}</span>
              </div>
            )}

            {pdfUrl && (
              <a href={pdfUrl.url} download={pdfUrl.name}
                className="flex items-center gap-2 justify-center py-3 px-4 rounded-lg font-display text-sm font-bold transition-all"
                style={{ background: 'rgba(4,47,46,0.4)', border: '1px solid #115e59', color: '#2dd4bf' }}>
                <Download size={16}/> Download Certificate PDF
              </a>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><Loader2 size={16} className="animate-spin"/>Generating & Storing on Blockchain...</>
                : <><PlusCircle size={16}/>Issue Certificate</>}
            </button>
          </form>
        </div>
      )}

      {/* Bulk Upload */}
      {tab === 'bulk' && (
        <div className="card space-y-4">
          {/* Excel template info */}
          <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(4,47,46,0.2)', border: '1px solid #115e59' }}>
            <p className="font-display mb-2" style={{ color: '#2dd4bf' }}>📋 Excel Format (columns A–E):</p>
            <table className="w-full text-xs">
              <thead>
                <tr>{['A: CertID','B: StudentName','C: Course','D: IssueDate','E: IssuerName'].map(h => (
                  <th key={h} className="text-left py-1 pr-4 font-display" style={{ color: '#14b8a6' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                <tr style={{ color: '#a1a1aa' }}>
                  <td className="pr-4">CERT-001</td><td className="pr-4">Divya Shukla</td>
                  <td className="pr-4">B.Tech IT</td><td className="pr-4">2024-06-15</td>
                  <td>DCVS University</td>
                </tr>
              </tbody>
            </table>
          </div>

          <form onSubmit={handleBulk} className="space-y-4">
            <div>
              <label className="label"><Upload size={10} className="inline mr-1"/>Upload Excel File</label>
              <input type="file" accept=".xlsx,.xls"
                onChange={e => setExcelFile(e.target.files[0])}
                className="w-full text-sm p-3 rounded-lg cursor-pointer"
                style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa' }}/>
              {excelFile && <p className="text-xs mt-1" style={{ color: '#14b8a6' }}>Selected: {excelFile.name}</p>}
            </div>
            <button type="submit" disabled={loading || !excelFile} className="btn-primary">
              {loading ? <><Loader2 size={16} className="animate-spin"/>Processing Excel...</>
                : <><FileSpreadsheet size={16}/>Issue All Certificates</>}
            </button>
          </form>

          {/* Bulk results */}
          {bulkResults && !bulkResults.error && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-display" style={{ color: '#14b8a6' }}>Results: {bulkResults.data?.length || 0} rows processed</p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {(bulkResults.data || []).map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded text-xs"
                    style={{ background: '#27272a', border: `1px solid ${r.status === 'SUCCESS' ? '#065f46' : '#7f1d1d'}` }}>
                    <span style={{ color: '#a1a1aa' }}>Row {r.row}: {r.studentName || r.reason}</span>
                    <span style={{ color: r.status === 'SUCCESS' ? '#34d399' : '#f87171' }} className="font-display">
                      {r.status === 'SUCCESS' ? '✅' : '❌'} {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bulkResults?.error && (
            <div className="alert-error text-sm">{bulkResults.error}</div>
          )}
        </div>
      )}
    </div>
  )
}
