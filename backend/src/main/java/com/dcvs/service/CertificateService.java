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

    @Value("${app.issuer-name:DCVS University}")
    private String defaultIssuerName;

    public CertificateService(FabricService fabricService) {
        this.fabricService = fabricService;
    }

    /**
     * Issues a single certificate:
     * 1. Generate SHA-256 hash
     * 2. Store hash + metadata on blockchain
     * 3. Generate QR code with full cert info
     * 4. Generate single-page PDF with digital signature
     */
    public byte[] issueCertificate(CertificateRequest req) throws Exception {
        log.info("Issuing certificate for: {}", req.getStudentName());

        // Step 1: Generate hash
        String hash = HashUtil.generateHash(req.getStudentName(), req.getCourse(),
                req.getIssueDate(), req.getCertId());
        log.info("Generated hash: {}", hash);

        // Step 2: Store on blockchain
        String timestamp = Instant.now().toString();
        fabricService.issueCertificate(req.getCertId(), hash, req.getStudentName(),
                req.getCourse(), req.getIssueDate(), req.getIssuerName(), timestamp);

        // Step 3: Fetch TxID from blockchain (re-read to get txId)
        String txId = "N/A";
        try {
            CertificateResponse stored = fabricService.getCertificate(req.getCertId());
            txId = stored.getTxId() != null ? stored.getTxId() : "N/A";
        } catch (Exception e) {
            log.warn("Could not fetch txId after issue: {}", e.getMessage());
        }

        // Step 4: Generate QR with full public info
        byte[] qrBytes = QRCodeUtil.generateQRCode(
                req.getCertId(), req.getStudentName(), req.getCourse(),
                req.getIssueDate(), req.getIssuerName(), hash);

        // Step 5: Generate single-page PDF
        return CertificatePdfGenerator.generate(
                req.getCertId(), req.getStudentName(), req.getCourse(),
                req.getIssueDate(), req.getIssuerName(), hash, txId, qrBytes);
    }

    /**
     * Bulk issue from Excel.
     * Excel columns: A=CertID | B=StudentName | C=Course | D=IssueDate | E=IssuerName
     */
    public List<Map<String, String>> bulkIssue(MultipartFile file) throws Exception {
        List<Map<String, String>> results = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Map<String, String> rowResult = new LinkedHashMap<>();
                try {
                    String certId      = getCellValue(row, 0);
                    String studentName = getCellValue(row, 1);
                    String course      = getCellValue(row, 2);
                    String issueDate   = getCellValue(row, 3);
                    String issuerName  = getCellValue(row, 4).isEmpty() ? defaultIssuerName : getCellValue(row, 4);

                    if (certId.isEmpty() || studentName.isEmpty()) {
                        rowResult.put("row", String.valueOf(i + 1));
                        rowResult.put("status", "SKIPPED");
                        rowResult.put("reason", "Missing certId or studentName");
                        results.add(rowResult);
                        continue;
                    }

                    String hash = HashUtil.generateHash(studentName, course, issueDate, certId);
                    String timestamp = Instant.now().toString();
                    fabricService.issueCertificate(certId, hash, studentName, course, issueDate, issuerName, timestamp);

                    rowResult.put("row", String.valueOf(i + 1));
                    rowResult.put("certId", certId);
                    rowResult.put("studentName", studentName);
                    rowResult.put("status", "SUCCESS");
                    rowResult.put("hash", hash);

                } catch (Exception e) {
                    rowResult.put("row", String.valueOf(i + 1));
                    rowResult.put("status", "FAILED");
                    rowResult.put("reason", e.getMessage());
                }
                results.add(rowResult);
            }
        }
        return results;
    }

    /**
     * Verifies a certificate by recomputing hash and comparing with blockchain.
     */
    public VerificationResult verify(String certId) {
        try {
            CertificateResponse cert = fabricService.getCertificate(certId);

            String computedHash = HashUtil.generateHash(
                    cert.getStudentName(), cert.getCourse(),
                    cert.getIssueDate(), cert.getCertId());

            boolean isValid = computedHash.equals(cert.getHash());

            return VerificationResult.builder()
                    .valid(isValid)
                    .status(isValid ? "VALID" : "INVALID")
                    .message(isValid
                            ? "✅ Certificate is authentic and tamper-proof"
                            : "❌ Certificate has been tampered — hashes do not match")
                    .certId(cert.getCertId())
                    .studentName(cert.getStudentName())
                    .course(cert.getCourse())
                    .issueDate(cert.getIssueDate())
                    .issuerName(cert.getIssuerName())
                    .issuerOrg(cert.getIssuerOrg())
                    .txId(cert.getTxId())
                    .timestamp(cert.getTimestamp())
                    .blockchainHash(cert.getHash())
                    .computedHash(computedHash)
                    .build();

        } catch (Exception e) {
            return VerificationResult.builder()
                    .valid(false)
                    .status("NOT_FOUND")
                    .message("Certificate not found on blockchain: " + e.getMessage())
                    .certId(certId)
                    .build();
        }
    }

    /**
     * Re-generates PDF for download from blockchain data.
     */
    public byte[] downloadCertificate(String certId) throws Exception {
        CertificateResponse cert = fabricService.getCertificate(certId);
        byte[] qrBytes = QRCodeUtil.generateQRCode(
                cert.getCertId(), cert.getStudentName(), cert.getCourse(),
                cert.getIssueDate(), cert.getIssuerName(), cert.getHash());
        return CertificatePdfGenerator.generate(
                cert.getCertId(), cert.getStudentName(), cert.getCourse(),
                cert.getIssueDate(), cert.getIssuerName(), cert.getHash(),
                cert.getTxId(), qrBytes);
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
