import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const ADMIN_EMAIL    = 'admin@dcvs.edu'
const ADMIN_PASSWORD = 'admin@2024#secure'
const CERTS_KEY      = 'dcvs_issued_certs'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('dcvs_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) }
      catch { localStorage.removeItem('dcvs_user') }
    }
  }, [])

  // ── Admin ────────────────────────────────────────────────
  const loginAdmin = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const u = { role: 'admin', name: 'Administrator', email }
      setUser(u)
      localStorage.setItem('dcvs_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, message: 'Invalid admin credentials' }
  }

  // ── Student OTP ──────────────────────────────────────────
  const sendOtp = async (email) => {
    try {
      await axios.post('/api/auth/send-otp', { email })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to send OTP' }
    }
  }

  const verifyOtp = async (email, otp) => {
    try {
      await axios.post('/api/auth/verify-otp', { email, otp })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid OTP' }
    }
  }

  // ── Student Register ─────────────────────────────────────
  const registerStudent = (name, email, rollNo, studentId) => {
    const existing = JSON.parse(localStorage.getItem('dcvs_students') || '[]')
    if (existing.find(s => s.email === email))
      return { success: false, message: 'Email already registered' }
    if (rollNo && existing.find(s => s.rollNo === rollNo))
      return { success: false, message: 'Roll number already registered' }

    const newStudent = {
      name,
      email,
      rollNo: rollNo || '',
      studentId: studentId || '',
    }
    localStorage.setItem('dcvs_students', JSON.stringify([...existing, newStudent]))
    return { success: true }
  }

  // ── Student Login (after OTP verified) ───────────────────
  const loginStudent = (email) => {
    const existing = JSON.parse(localStorage.getItem('dcvs_students') || '[]')
    const student = existing.find(s => s.email === email)
    if (student) {
      const u = {
        role: 'student',
        name: student.name,
        email: student.email,
        rollNo: student.rollNo || '',
        studentId: student.studentId || '',
      }
      setUser(u)
      localStorage.setItem('dcvs_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, message: 'Account not found. Please register first.' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dcvs_user')
  }

  // ── Certificate cache ────────────────────────────────────
  const saveCertToCache = (cert) => {
    const certs = JSON.parse(localStorage.getItem(CERTS_KEY) || '[]')
    const exists = certs.find(c => c.certId === cert.certId)
    if (!exists) {
      localStorage.setItem(CERTS_KEY, JSON.stringify([
        ...certs,
        { ...cert, cachedAt: new Date().toISOString() }
      ]))
    }
  }

  const getCachedCerts = () => {
    try { return JSON.parse(localStorage.getItem(CERTS_KEY) || '[]') }
    catch { return [] }
  }

  const clearCertCache = () => localStorage.removeItem(CERTS_KEY)

  return (
    <AuthContext.Provider value={{
      user,
      loginAdmin, loginStudent,
      sendOtp, verifyOtp, registerStudent,
      logout,
      saveCertToCache, getCachedCerts, clearCertCache,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
