import { useState } from 'react'
import { PlusCircle, Loader2, CheckCircle, XCircle, Download, FileSpreadsheet, Hash, User, BookOpen, Calendar, Building, Tag } from 'lucide-react'
import { issueCertificate, bulkIssueCertificates } from '../api.js'
import { useAuth } from '../AuthContext.jsx'

const CATEGORIES = [
  { value: 'DEGREE_COMPLETION', label: '🎓 Degree Completion',  desc: 'For graduating students' },
  { value: 'INTERNSHIP',        label: '💼 Internship',         desc: 'For internship completion' },
  { value: 'WORKSHOP',          label: '🛠️ Workshop',           desc: 'For workshop participation' },
  { value: 'HACKATHON',         label: '💻 Hackathon',          desc: 'For hackathon achievement' },
  { value: 'CULTURAL_EVENT',    label: '🎭 Cultural Event',     desc: 'For cultural participation' },
  { value: 'SPORTS',            label: '🏆 Sports',             desc: 'For sports achievement' },
]

export default function IssuePage() {
  const { saveCertToCache } = useAuth()
  const [tab, setTab] = useState('single')
  const [form, setForm] = useState({
    certId: '', rollNo: '', studentName: '', course: '',
    issueDate: new Date().toISOString().split('T')[0],
    issuerName: 'Goel Institute of Technology and Management',
    category: 'DEGREE_COMPLETION',
  })
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [pdfUrl, setPdfUrl]       = useState(null)
  const [excelFile, setExcelFile] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)

  const update = (k, v) => { setForm(f => ({...f, [k]: v})); setResult(null) }

  const handleSingle = async (e) => {
    e.preventDefault()
    setLoading(true); setResult(null); setPdfUrl(null)
    try {
      const res = await issueCertificate(form)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfUrl({ url, name: `certificate-${form.certId}.pdf` })
      setResult({ success: true, message: 'Certificate issued! Hash stored on Hyperledger Fabric blockchain.' })
      saveCertToCache({
        certId: form.certId, rollNo: form.rollNo,
        studentName: form.studentName, course: form.course,
        issueDate: form.issueDate, issuerName: form.issuerName,
        category: form.category, issuedAt: new Date().toISOString()
      })
      setForm(f => ({ ...f, certId: '', rollNo: '', studentName: '', course: '' }))
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || err.message || 'Failed to issue certificate' })
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

  const selectedCat = CATEGORIES.find(c => c.value === form.category)

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Issue Certificate</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Admin only · SHA-256 hash stored on blockchain · QR links to Vercel verification</p>
      </div>

      <div className="tab-bar">
        {[['single','Single Certificate'],['bulk','Bulk Upload (.xlsx)']].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); setResult(null); setBulkResults(null) }}
            className={`tab-item ${tab === k ? 'active' : ''}`}>
            {k === 'single' ? <PlusCircle size={13} className="inline mr-1" /> : <FileSpreadsheet size={13} className="inline mr-1" />}
            {l}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <div className="card">
          <form onSubmit={handleSingle} className="space-y-5">

            {/* Category selector */}
            <div>
              <label className="label"><Tag size={11} className="inline mr-1" />Certificate Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} type="button"
                    onClick={() => update('category', cat.value)}
                    className="p-3 rounded-xl text-left transition-all border text-xs"
                    style={{
                      background: form.category === cat.value ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${form.category === cat.value ? 'var(--accent)' : 'var(--border)'}`,
                      color: form.category === cat.value ? 'var(--accent-light)' : 'var(--text-muted)',
                    }}>
                    <div className="font-semibold mb-0.5">{cat.label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{cat.desc}</div>
                  </button>
                ))}
              </div>
              {selectedCat && (
                <p className="text-xs mt-2" style={{ color: 'var(--accent-light)' }}>
                  Selected: <strong>{selectedCat.label}</strong>
                </p>
              )}
            </div>

            <div className="divider" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label"><Hash size={11} className="inline mr-1" />Certificate ID</label>
                <input value={form.certId} onChange={e => update('certId', e.target.value)}
                  placeholder="CERT-2024-001" className="input-field" required disabled={loading} />
              </div>
              <div>
                <label className="label"><Hash size={11} className="inline mr-1" />Roll Number</label>
                <input value={form.rollNo} onChange={e => update('rollNo', e.target.value)}
                  placeholder="2203600130027" className="input-field" required disabled={loading} />
              </div>
              <div>
                <label className="label"><User size={11} className="inline mr-1" />Student Name</label>
                <input value={form.studentName} onChange={e => update('studentName', e.target.value)}
                  placeholder="Full Name" className="input-field" required disabled={loading} />
              </div>
              <div>
                <label className="label"><Calendar size={11} className="inline mr-1" />Date of Issue</label>
                <input type="date" value={form.issueDate} onChange={e => update('issueDate', e.target.value)}
                  className="input-field" required disabled={loading} />
              </div>
              <div className="col-span-2">
                <label className="label"><BookOpen size={11} className="inline mr-1" />
                  {form.category === 'DEGREE_COMPLETION' ? 'Degree / Course' :
                   form.category === 'INTERNSHIP' ? 'Internship Domain' :
                   form.category === 'WORKSHOP' ? 'Workshop Name' :
                   form.category === 'HACKATHON' ? 'Hackathon Name' :
                   form.category === 'CULTURAL_EVENT' ? 'Event Name' : 'Sport / Event'}
                </label>
                <input value={form.course} onChange={e => update('course', e.target.value)}
                  placeholder={
                    form.category === 'DEGREE_COMPLETION' ? 'B.Tech Information Technology' :
                    form.category === 'INTERNSHIP' ? 'Cybersecurity & Ethical Hacking' :
                    form.category === 'WORKSHOP' ? 'Machine Learning Fundamentals' :
                    form.category === 'HACKATHON' ? 'Smart India Hackathon 2024' :
                    form.category === 'CULTURAL_EVENT' ? 'Rhythm — Annual Cultural Fest' :
                    'Inter-College Cricket Tournament'
                  }
                  className="input-field" required disabled={loading} />
              </div>
              <div className="col-span-2">
                <label className="label"><Building size={11} className="inline mr-1" />Issuing Institution</label>
                <input value={form.issuerName} onChange={e => update('issuerName', e.target.value)}
                  className="input-field" required disabled={loading} />
              </div>
            </div>

            {result && (
              <div className={result.success ? 'alert-success' : 'alert-error'}>
                {result.success ? <CheckCircle size={15}/> : <XCircle size={15}/>}
                <span className="text-sm">{result.message}</span>
              </div>
            )}

            {pdfUrl && (
              <a href={pdfUrl.url} download={pdfUrl.name} className="btn-secondary w-full" style={{ textDecoration: 'none' }}>
                <Download size={15} /> Download Certificate PDF
              </a>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Issuing on Blockchain...</>
                : <><PlusCircle size={16} />Issue {selectedCat?.label || 'Certificate'}</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="card space-y-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--accent-light)' }}>
              📋 Excel Format — 7 columns
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr style={{ color: 'var(--accent-light)' }}>
                    {['A: CertID','B: RollNo','C: Name','D: Course','E: Date','F: Issuer','G: Category'].map(h => (
                      <th key={h} className="text-left pr-3 pb-2 font-display">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--text-muted)' }}>
                  <tr>
                    <td className="pr-3">CERT-001</td>
                    <td className="pr-3">20BT0421</td>
                    <td className="pr-3">Divya Shukla</td>
                    <td className="pr-3">B.Tech IT</td>
                    <td className="pr-3">2024-06-15</td>
                    <td className="pr-3">Goel Institute</td>
                    <td>DEGREE_COMPLETION</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Category values: DEGREE_COMPLETION | INTERNSHIP | WORKSHOP | HACKATHON | CULTURAL_EVENT | SPORTS
            </p>
          </div>

          <form onSubmit={handleBulk} className="space-y-4">
            <div>
              <label className="label">Upload Excel File</label>
              <input type="file" accept=".xlsx,.xls" onChange={e => setExcelFile(e.target.files[0])}
                className="input-field cursor-pointer" />
              {excelFile && <p className="text-xs mt-1" style={{ color: 'var(--accent-light)' }}>Selected: {excelFile.name}</p>}
            </div>
            <button type="submit" disabled={loading || !excelFile} className="btn-primary">
              {loading ? <><Loader2 size={16} className="animate-spin" />Processing...</>
                : <><FileSpreadsheet size={16} />Issue All Certificates</>}
            </button>
          </form>

          {bulkResults?.data && (
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Results: {bulkResults.data.length} rows processed
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {bulkResults.data.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg text-xs"
                    style={{ background: 'var(--bg-secondary)', border: `1px solid ${r.status === 'SUCCESS' ? 'var(--success-border)' : 'var(--error-border)'}` }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Row {r.row}: {r.studentName || r.reason}</span>
                    <span style={{ color: r.status === 'SUCCESS' ? 'var(--success)' : 'var(--error)' }} className="font-semibold">
                      {r.status === 'SUCCESS' ? '✅' : '❌'} {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bulkResults?.error && <div className="alert-error text-sm">{bulkResults.error}</div>}
        </div>
      )}
    </div>
  )
}
