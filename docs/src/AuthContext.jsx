import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@dcvs.edu'
const ADMIN_PASSWORD = 'admin123'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { role: 'admin'|'student', name, email, studentId }

  useEffect(() => {
    const saved = localStorage.getItem('dcvs_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const loginAdmin = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const u = { role: 'admin', name: 'Administrator', email }
      setUser(u)
      localStorage.setItem('dcvs_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, message: 'Invalid admin credentials' }
  }

  const registerStudent = (name, email, studentId, password) => {
    // Check if student already registered
    const existing = JSON.parse(localStorage.getItem('dcvs_students') || '[]')
    if (existing.find(s => s.email === email)) {
      return { success: false, message: 'Email already registered' }
    }
    if (existing.find(s => s.studentId === studentId)) {
      return { success: false, message: 'Student ID already registered' }
    }
    const newStudent = { name, email, studentId, password }
    localStorage.setItem('dcvs_students', JSON.stringify([...existing, newStudent]))
    return { success: true }
  }

  const loginStudent = (email, password) => {
    const existing = JSON.parse(localStorage.getItem('dcvs_students') || '[]')
    const student = existing.find(s => s.email === email && s.password === password)
    if (student) {
      const u = { role: 'student', name: student.name, email: student.email, studentId: student.studentId }
      setUser(u)
      localStorage.setItem('dcvs_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, message: 'Invalid email or password' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dcvs_user')
  }

  return (
    <AuthContext.Provider value={{ user, loginAdmin, loginStudent, registerStudent, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
