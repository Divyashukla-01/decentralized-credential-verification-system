import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, ShieldX, Loader2, AlertTriangle, Hash, User, BookOpen, Calendar, Building, Link2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

function Field({ icon: Icon, label, value, mono }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid #e3f2fd' }}>
      <Icon size={16} style={{ color: '#1565c0', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#78909c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px', fontFamily: 'sans-serif' }}>{label}</p>
        <p style={{ fontSize: '0.9rem', color: '#0d47a1', wordBreak: 'break-all', fontFamily: mono ? 'monospace' : 'sans-serif', fontWeight: mono ? 400 : 500 }}>{value}</p>
      </div>
    </div>
  )
}

export default function PublicVerifyPage() {
  const [certId, setCertId]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [waking, setWaking]     = useState(false)
  const [elapsed, setElapsed]   = useState(0)

  const doVerify = useCallback(async (id) => {
    const target = (id || certId || '').trim()
    if (!target) return
    setLoading(true)
    setResult(null)
    setWaking(false)
    setElapsed(0)

    // Show "waking up" message after 3 seconds
    const wakeTimer = setTimeout(() => setWaking(true), 3000)
    
    // Elapsed seconds counter
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)

    try {
      const res = await axios.get(`/api/public/verify/${target}`, {
        timeout: 120000 // 2 minutes for cold start
      })
      setResult(res.data?.data)
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setResult({
          status: 'NOT_FOUND', valid: false,
          message: 'Server took too long to respond. Please try again — the server may have been sleeping.',
          certId: target
        })
      } else {
        setResult({
          status: 'NOT_FOUND', valid: false,
          message: 'Certificate not found on blockchain or database.',
          certId: target
        })
      }
    } finally {
      clearTimeout(wakeTimer)
      clearInterval(interval)
      setLoading(false)
      setWaking(false)
    }
  }, [certId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('certId')
    if (id) {
      setCertId(id)
      doVerify(id)
    }
  }, []) // eslint-disable-line

  const isValid   = result?.status === 'VALID'
  const isInvalid = result?.status === 'INVALID'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', padding: '20px 24px', boxShadow: '0 2px 12px rgba(13,71,161,0.3)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Certificate Verification</p>
            <p style={{ color: '#90caf9', fontSize: '0.78rem', margin: 0 }}>Goel Institute of Technology and Management</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Info card */}
        <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <ShieldCheck size={20} style={{ color: '#1565c0', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#0d47a1', fontSize: '0.9rem', margin: '0 0 4px' }}>🔐 Blockchain Certificate Verification</p>
            <p style={{ color: '#1565c0', fontSize: '0.8rem', margin: 0 }}>Certificates verified on Hyperledger Fabric using SHA-256 cryptographic hashing. Results are tamper-proof.</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(13,71,161,0.08)', border: '1px solid #e3f2fd' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#546e7a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Certificate ID</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={certId}
              onChange={e => { setCertId(e.target.value); setResult(null) }}
              placeholder="Enter Certificate ID (e.g. CERT-2026-01)"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && doVerify()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #bbdefb', fontSize: '0.9rem', outline: 'none', color: '#0d47a1' }}
            />
            <button
              onClick={() => doVerify()}
              disabled={loading || !certId.trim()}
              style={{ background: '#1565c0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !certId.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
              Verify
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(13,71,161,0.08)' }}>
            <Loader2 size={36} style={{ color: '#1565c0', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            {waking ? (
              <>
                <p style={{ fontWeight: 600, color: '#0d47a1' }}>⏳ Waking up server...</p>
                <p style={{ color: '#78909c', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  Free hosting sleeps after inactivity. Please wait ({elapsed}s)...
                </p>
                <div style={{ marginTop: '12px', background: '#e3f2fd', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#1565c0' }}>
                  This can take up to 60 seconds on first request ☕
                </div>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: '#0d47a1' }}>Querying Blockchain...</p>
                <p style={{ color: '#78909c', fontSize: '0.85rem' }}>Connecting to Hyperledger Fabric ledger</p>
              </>
            )}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div>
            <div style={{
              background: isValid ? '#e8f5e9' : isInvalid ? '#ffebee' : '#fff8e1',
              border: `2px solid ${isValid ? '#43a047' : isInvalid ? '#e53935' : '#ffa000'}`,
              borderRadius: '14px', padding: '20px', marginBottom: '16px',
              display: 'flex', alignItems: 'flex-start', gap: '14px'
            }}>
              {isValid ? <ShieldCheck size={32} style={{ color: '#2e7d32', flexShrink: 0 }} />
                : isInvalid ? <ShieldX size={32} style={{ color: '#c62828', flexShrink: 0 }} />
                : <AlertTriangle size={32} style={{ color: '#e65100', flexShrink: 0 }} />}
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 4px', color: isValid ? '#1b5e20' : isInvalid ? '#b71c1c' : '#e65100' }}>
                  {isValid ? '✅ Certificate Verified — Authentic & Tamper-Proof'
                    : isInvalid ? '❌ Certificate Tampered — Invalid'
                    : '⚠️ Certificate Not Found'}
                </p>
                <p style={{ color: isValid ? '#388e3c' : isInvalid ? '#c62828' : '#f57c00', fontSize: '0.88rem', margin: 0 }}>
                  {result.message}
                </p>
              </div>
            </div>

            {result.studentName && (
              <div style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(13,71,161,0.08)', border: '1px solid #e3f2fd' }}>
                <p style={{ fontWeight: 700, color: '#0d47a1', fontSize: '1rem', marginBottom: '4px', borderBottom: '2px solid #1565c0', paddingBottom: '10px' }}>
                  📋 Certificate Details
                </p>
                <Field icon={Hash}     label="Certificate ID"   value={result.certId}      mono />
                <Field icon={Hash}     label="Roll Number"      value={result.rollNo}      mono />
                <Field icon={User}     label="Student Name"     value={result.studentName} />
                <Field icon={BookOpen} label="Course / Program" value={result.course} />
                <Field icon={Calendar} label="Date of Issue"    value={result.issueDate} />
                <Field icon={Building} label="Issued By"        value={result.issuerName} />
                <Field icon={Building} label="Organization"     value={result.issuerOrg}   mono />
                <Field icon={Link2}    label="Transaction ID"   value={result.txId}        mono />

                {result.blockchainHash && (
                  <div style={{ marginTop: '20px', background: '#f8f9ff', borderRadius: '10px', padding: '16px', border: '1px solid #e3f2fd' }}>
                    <p style={{ fontWeight: 700, color: '#0d47a1', fontSize: '0.88rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🔐 Hash Verification
                    </p>
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '0.75rem', color: '#78909c', margin: '0 0 4px' }}>Blockchain Hash (immutably stored):</p>
                      <p style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#1565c0', wordBreak: 'break-all', background: '#e3f2fd', padding: '8px 10px', borderRadius: '6px', margin: 0 }}>
                        {result.blockchainHash}
                      </p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '0.75rem', color: '#78909c', margin: '0 0 4px' }}>Recomputed Hash (SHA-256 now):</p>
                      <p style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: result.valid ? '#2e7d32' : '#c62828', wordBreak: 'break-all', background: result.valid ? '#e8f5e9' : '#ffebee', padding: '8px 10px', borderRadius: '6px', margin: 0 }}>
                        {result.computedHash}
                      </p>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 700, fontSize: '0.88rem', background: result.valid ? '#e8f5e9' : '#ffebee', border: `1px solid ${result.valid ? '#43a047' : '#e53935'}`, color: result.valid ? '#1b5e20' : '#b71c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {result.valid
                        ? <><CheckCircle size={18} /> Hashes Match — Certificate is Authentic</>
                        : <><XCircle size={18} /> Hash Mismatch — Certificate Has Been Tampered</>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#90a4ae', marginTop: '24px' }}>
          Secured by Hyperledger Fabric · SHA-256 · Goel Institute of Technology and Management
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
