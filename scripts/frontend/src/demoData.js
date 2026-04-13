// ============================================================
// DEMO MODE — used when backend is not available (Vercel deployment)
// Simulates blockchain responses with realistic mock data
// ============================================================

export const DEMO_MODE = true

export const DEMO_CERTIFICATES = [
  {
    certId: 'CERT-2024-001',
    studentName: 'Divya Shukla',
    course: 'B.Tech Information Technology with Cybersecurity',
    issueDate: '2024-06-15',
    issuerName: 'DCVS University',
    issuerOrg: 'Org1MSP',
    hash: 'a3f8c2e1d94b7f6a2c8e3d1f9b4a7c2e1d8f3b6a9c4e7f2d1b8a5c3e9f6d4b',
    txId: '92615509c03795573037e66d4af89104c36554bf4e752e5436e44e5ba0131659',
    timestamp: '2024-06-15T10:30:00Z',
  },
  {
    certId: 'CERT-2024-002',
    studentName: 'Rahul Verma',
    course: 'M.Tech Computer Science',
    issueDate: '2024-06-15',
    issuerName: 'DCVS University',
    issuerOrg: 'Org1MSP',
    hash: 'b4e9d3f2a1c7e8b5d2f4a9c1e6b3d8f5a2c7e4b9d1f6a3c8e5b2d7f4a1c9e',
    txId: '73a4f8b2c5e9d1f7a3b6c2e8d5f1a4b7c3e6f9d2b5a8c1e4f7d3b6a9c2e5f',
    timestamp: '2024-06-15T11:00:00Z',
  },
  {
    certId: 'CERT-2024-003',
    studentName: 'Priya Patel',
    course: 'B.Tech Computer Science',
    issueDate: '2024-06-16',
    issuerName: 'DCVS University',
    issuerOrg: 'Org2MSP',
    hash: 'c5f1e4d8b2a6c9f3e7d1b5a8c2f6e9d3b7a1c4f8e2d6b9a3c7f1e5d9b4a2c',
    txId: '5f2a9c6e3b8d1f4a7c2e5b8d3f6a9c1e4b7d2f5a8c3e6b9d4f1a7c2e5b8d3',
    timestamp: '2024-06-16T09:15:00Z',
  },
  {
    certId: 'CERT-2024-004',
    studentName: 'Amit Kumar',
    course: 'MBA Business Analytics',
    issueDate: '2024-06-17',
    issuerName: 'DCVS University',
    issuerOrg: 'Org1MSP',
    hash: 'd6a2f5c9e3b7d1f4a8c2e6b9d3f7a1c5e8b2d6f9a3c7e1b4d8f2a6c9e3b7d',
    txId: '8d3f7a1c5e9b4d2f6a8c3e7b1d5f9a2c6e4b8d3f7a1c5e9b4d2f6a8c3e7b',
    timestamp: '2024-06-17T14:30:00Z',
  },
  {
    certId: 'CERT-2024-005',
    studentName: 'Sneha Gupta',
    course: 'B.Tech Electronics and Communication',
    issueDate: '2024-06-18',
    issuerName: 'DCVS University',
    issuerOrg: 'Org2MSP',
    hash: 'e7b3a6d1f9c4e8b2d5f1a7c3e9b6d2f4a8c1e5b9d3f7a2c6e4b8d1f5a9c3e',
    txId: '9e4b8d2f6a1c5e9b3d7f1a4c8e2b6d3f7a9c1e5b4d8f2a6c3e7b1d5f9a2c',
    timestamp: '2024-06-18T10:00:00Z',
  },
]

// Simulates SHA-256 hash generation (for display only)
export function demoHash(studentName, course, issueDate, certId) {
  const raw = studentName + course + issueDate + certId
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  // Expand to 64 char hex-like string for display
  const base = Math.abs(hash).toString(16).padStart(8, '0')
  return (base.repeat(8)).substring(0, 64)
}

// Mock API responses
export const mockApi = {
  health: () => Promise.resolve({ data: { success: true, message: 'DCVS Backend running (Demo Mode)', data: 'OK' } }),

  getAllCertificates: () => Promise.resolve({
    data: { success: true, message: 'Demo certificates', data: DEMO_CERTIFICATES }
  }),

  verifyCertificate: (certId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cert = DEMO_CERTIFICATES.find(c => c.certId === certId)
        if (cert) {
          const computedHash = demoHash(cert.studentName, cert.course, cert.issueDate, cert.certId)
          resolve({
            data: {
              success: true,
              data: {
                valid: true,
                status: 'VALID',
                message: '✅ Certificate is authentic and tamper-proof',
                ...cert,
                blockchainHash: cert.hash,
                computedHash: cert.hash, // match = valid
              }
            }
          })
        } else {
          resolve({
            data: {
              success: false,
              data: {
                valid: false,
                status: 'NOT_FOUND',
                message: 'Certificate not found on blockchain',
                certId,
              }
            }
          })
        }
      }, 800) // simulate network delay
    })
  },

  issueCertificate: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: new Blob(['demo-pdf'], { type: 'application/pdf' }) })
      }, 1500)
    })
  },
}
