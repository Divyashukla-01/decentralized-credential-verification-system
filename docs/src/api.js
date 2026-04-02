import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// Certificate APIs
export const issueCertificate = (data) =>
  api.post('/certificate/issue', data, { responseType: 'blob' })

export const bulkIssueCertificates = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/certificate/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const verifyCertificate = (certId) =>
  api.get(`/certificate/verify/${certId}`)

export const downloadCertificate = (certId) =>
  api.get(`/certificate/download/${certId}`, { responseType: 'blob' })

export const getAllCertificates = () =>
  api.get('/certificate/all')

export const healthCheck = () =>
  api.get('/certificate/health')

export default api
