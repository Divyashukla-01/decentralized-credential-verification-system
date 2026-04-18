import { createContext, useContext, useState, useEffect } from 'react'

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

  const loginAdmin = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const u = { role: 'admin', name: 'Administrator', email }
      setUser(u)
      // Admin session is intentionally NOT persisted - requires login each visit
      return { success: true }
    }
    return { success: false, message: 'Invalid admin credentials' }
  }

  // Called after successful API login
  const loginStudentFromApi = (studentData) => {
    const u = {
      role: 'student',
      name: studentData.name,
      email: studentData.email,
      rollNo: studentData.rollNo || '',
      studentId: studentData.studentId || '',
      id: studentData.id,
    }
    setUser(u)
    localStorage.setItem('dcvs_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dcvs_user')
  }

  // Certificate cache
  const saveCertToCache = (cert) => {
    const certs = JSON.parse(localStorage.getItem(CERTS_KEY) || '[]')
    if (!certs.find(c => c.certId === cert.certId)) {
      localStorage.setItem(CERTS_KEY, JSON.stringify([...certs, { ...cert, cachedAt: new Date().toISOString() }]))
    }
  }

  const getCachedCerts = () => {
    try { return JSON.parse(localStorage.getItem(CERTS_KEY) || '[]') }
    catch { return [] }
  }

  const clearCertCache = () => localStorage.removeItem(CERTS_KEY)

  return (
    <AuthContext.Provider value={{
      user, loginAdmin, loginStudentFromApi, logout,
      saveCertToCache, getCachedCerts, clearCertCache,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
