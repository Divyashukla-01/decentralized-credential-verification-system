import axios from 'axios'
import { mockApi } from './demoData.js'

// Demo mode: true when running on Vercel (no backend available)
// Automatically detects if running on localhost or deployed
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true' ||
  (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'))

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Intercept requests — if demo mode, return mock data
api.interceptors.request.use(config => {
  if (IS_DEMO) {
    // Cancel real request, will be handled by mock below
    config.headers['X-Demo-Mode'] = 'true'
  }
  return config
})

export const isDemoMode = () => IS_DEMO

export const healthCheck = () => {
  if (IS_DEMO) return mockApi.health()
  return api.get('/certificate/health')
}

export const issueCertificate = (data) => {
  if (IS_DEMO) return mockApi.issueCertificate(data)
  return api.post('/certificate/issue', data, { responseType: 'blob' })
}

export const bulkIssueCertificates = (file) => {
  if (IS_DEMO) return Promise.resolve({ data: { success: true, data: [], message: 'Demo mode' } })
  const form = new FormData()
  form.append('file', file)
  return api.post('/certificate/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const verifyCertificate = (certId) => {
  if (IS_DEMO) return mockApi.verifyCertificate(certId)
  return api.get(`/certificate/verify/${certId}`)
}

export const downloadCertificate = (certId) => {
  if (IS_DEMO) return Promise.resolve({ data: new Blob(['demo'], { type: 'application/pdf' }) })
  return api.get(`/certificate/download/${certId}`, { responseType: 'blob' })
}

export const getAllCertificates = () => {
  if (IS_DEMO) return mockApi.getAllCertificates()
  return api.get('/certificate/all')
}

export default api
