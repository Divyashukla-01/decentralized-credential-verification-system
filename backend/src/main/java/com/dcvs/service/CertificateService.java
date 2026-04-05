package com.dcvs.service;

import com.dcvs.model.CertificateRequest;
import com.dcvs.model.CertificateResponse;
import com.dcvs.model.VerificationResult;
import com.dcvs.util.CertificatePdfGenerator;
import com.dcvs.util.HashUtil;
import com.dcvs.util.QRCodeUtil;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;

@Service
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);

    private final FabricService fabricService;

    @Value("${app.issuer-name:Goel Institute of Technology and Management}")
    private String defaultIssuerName;

    // Vercel URL for QR codes — update this after Vercel deployment
    @Value("${app.vercel-url:https://decentralized-credential-verificati.vercel.app}")
    private String vercelUrl;

    public CertificateService(FabricService fabricService) {
        this.fabricService = fabricService;
    }

    /**
     * Issues a certificate and returns PDF bytes.
     * QR contains Vercel URL so it always works when scanned.
     */
    public byte[] issueCertificate(CertificateRequest req) throws Exception {
        log.info("Issuing certificate: certId={}, category={}", req.getCertId(), req.getCategory());

        // Generate SHA-256 hash
        String hash = HashUtil.generateHash(req.getStudentName(), req.getRollNo(),
                req.getCourse(), req.getIssueDate(), req.getCertId());

        // Store on blockchain
        String timestamp = Instant.now().toString();
        String category = req.getCategory() != null ? req.getCategory() : "DEGREE_COMPLETION";

        fabricService.issueCertificate(req.getCertId(), req.getRollNo(), hash,
                req.getStudentName(), req.getCourse(), req.getIssueDate(),
                req.getIssuerName(), timestamp);

        // Fetch TxID
        String txId = "N/A";
        try {
            CertificateResponse stored = fabricService.getCertificate(req.getCertId());
            txId = stored.getTxId() != null ? stored.getTxId() : "N/A";
        } catch (Exception e) {
            log.warn("Could not fetch txId: {}", e.getMessage());
        }

        // Generate QR with Vercel URL
        byte[] qrBytes = QRCodeUtil.generateQRCode(req.getCertId(), vercelUrl);

        // Generate PDF with selected template
        return CertificatePdfGenerator.generate(
                req.getCertId(), req.getRollNo(), req.getStudentName(),
                req.getCourse(), req.getIssueDate(), req.getIssuerName(),
                hash, txId, vercelUrl, category, qrBytes);
    }

    /**
     * Bulk issue from Excel.
     * Columns: A=CertID | B=RollNo | C=StudentName | D=Course | E=IssueDate | F=IssuerName | G=Category
     */
    public List<Map<String, String>> bulkIssue(MultipartFile file) throws Exception {
        List<Map<String, String>> results = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                Map<String, String> result = new LinkedHashMap<>();
                try {
                    String certId      = getCellValue(row, 0);
                    String rollNo      = getCellValue(row, 1);
                    String studentName = getCellValue(row, 2);
                    String course      = getCellValue(row, 3);
                    String issueDate   = getCellValue(row, 4);
                    String issuerName  = getCellValue(row, 5).isEmpty() ? defaultIssuerName : getCellValue(row, 5);
                    String category    = getCellValue(row, 6).isEmpty() ? "DEGREE_COMPLETION" : getCellValue(row, 6);

                    if (certId.isEmpty() || studentName.isEmpty()) {
                        result.put("row", String.valueOf(i + 1));
                        result.put("status", "SKIPPED");
                        result.put("reason", "Missing certId or studentName");
                        results.add(result); continue;
                    }

                    String hash = HashUtil.generateHash(studentName, rollNo, course, issueDate, certId);
                    fabricService.issueCertificate(certId, rollNo, hash, studentName,
                            course, issueDate, issuerName, Instant.now().toString());

                    result.put("row", String.valueOf(i + 1));
                    result.put("certId", certId);
                    result.put("rollNo", rollNo);
                    result.put("studentName", studentName);
                    result.put("category", category);
                    result.put("status", "SUCCESS");
                } catch (Exception e) {
                    result.put("row", String.valueOf(i + 1));
                    result.put("status", "FAILED");
                    result.put("reason", e.getMessage());
                }
                results.add(result);
            }
        }
        return results;
    }

    /** Verify by certId */
    public VerificationResult verify(String certId) {
        try {
            CertificateResponse cert = fabricService.getCertificate(certId);
            return buildResult(cert);
        } catch (Exception e) {
            return VerificationResult.builder()
                    .valid(false).status("NOT_FOUND").certId(certId)
                    .message("Certificate not found: " + e.getMessage()).build();
        }
    }

    /** Verify by roll number */
    public VerificationResult verifyByRollNo(String rollNo) {
        try {
            CertificateResponse cert = fabricService.getCertificateByRollNo(rollNo);
            return buildResult(cert);
        } catch (Exception e) {
            return VerificationResult.builder()
                    .valid(false).status("NOT_FOUND").rollNo(rollNo)
                    .message("No certificate found for roll: " + e.getMessage()).build();
        }
    }

    private VerificationResult buildResult(CertificateResponse cert) {
        String computed = HashUtil.generateHash(cert.getStudentName(), cert.getRollNo(),
                cert.getCourse(), cert.getIssueDate(), cert.getCertId());
        boolean valid = computed.equals(cert.getHash());
        return VerificationResult.builder()
                .valid(valid)
                .status(valid ? "VALID" : "INVALID")
                .message(valid
                        ? "✅ Certificate is authentic and tamper-proof"
                        : "❌ Certificate tampered — hash mismatch")
                .certId(cert.getCertId()).rollNo(cert.getRollNo())
                .studentName(cert.getStudentName()).course(cert.getCourse())
                .issueDate(cert.getIssueDate()).issuerName(cert.getIssuerName())
                .issuerOrg(cert.getIssuerOrg()).txId(cert.getTxId())
                .timestamp(cert.getTimestamp())
                .blockchainHash(cert.getHash()).computedHash(computed)
                .build();
    }

    /** Re-generate PDF for download */
    public byte[] downloadCertificate(String certId) throws Exception {
        CertificateResponse cert = fabricService.getCertificate(certId);
        byte[] qrBytes = QRCodeUtil.generateQRCode(cert.getCertId(), vercelUrl);
        return CertificatePdfGenerator.generate(
                cert.getCertId(), cert.getRollNo(), cert.getStudentName(),
                cert.getCourse(), cert.getIssueDate(), cert.getIssuerName(),
                cert.getHash(), cert.getTxId(), vercelUrl,
                "DEGREE_COMPLETION", qrBytes);
    }

    public List<CertificateResponse> getAllCertificates() throws Exception {
        return fabricService.getAllCertificates();
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
}
