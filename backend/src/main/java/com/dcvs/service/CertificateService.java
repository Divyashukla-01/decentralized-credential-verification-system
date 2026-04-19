package com.dcvs.service;

import com.dcvs.model.CertificateMetadata;
import com.dcvs.model.CertificateRequest;
import com.dcvs.model.CertificateResponse;
import com.dcvs.model.VerificationResult;
import com.dcvs.repository.CertificateMetadataRepository;
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
    private final CertificateMetadataRepository metadataRepo;

    @Value("${app.issuer-name:Goel Institute of Technology and Management}")
    private String defaultIssuerName;

    @Value("${app.vercel-url:https://decentralized-credential-verificati.vercel.app}")
    private String vercelUrl;

    public CertificateService(FabricService fabricService,
                               CertificateMetadataRepository metadataRepo) {
        this.fabricService = fabricService;
        this.metadataRepo = metadataRepo;
    }

    public byte[] issueCertificate(CertificateRequest req) throws Exception {
        log.info("Issuing: certId={}, category={}", req.getCertId(), req.getCategory());

        String hash = HashUtil.generateHash(req.getStudentName(), req.getRollNo(),
                req.getCourse(), req.getIssueDate(), req.getCertId());
        String timestamp = Instant.now().toString();
        String category = req.getCategory() != null ? req.getCategory() : "DEGREE_COMPLETION";

        fabricService.issueCertificate(req.getCertId(), req.getRollNo(), hash,
                req.getStudentName(), req.getCourse(), req.getIssueDate(),
                req.getIssuerName(), timestamp);

        String txId = "N/A", issuerOrg = "Org1MSP";
        try {
            CertificateResponse stored = fabricService.getCertificate(req.getCertId());
            if (stored.getTxId() != null) txId = stored.getTxId();
            if (stored.getIssuerOrg() != null) issuerOrg = stored.getIssuerOrg();
        } catch (Exception e) {
            log.warn("Could not fetch txId: {}", e.getMessage());
        }

        // Save to PostgreSQL for offline access
        try {
            metadataRepo.save(CertificateMetadata.builder()
                    .certId(req.getCertId()).rollNo(req.getRollNo())
                    .studentName(req.getStudentName()).course(req.getCourse())
                    .issueDate(req.getIssueDate()).issuerName(req.getIssuerName())
                    .category(category).hash(hash).txId(txId).issuerOrg(issuerOrg)
                    .build());
        } catch (Exception e) {
            log.error("DB save failed: {}", e.getMessage());
        }

        byte[] qrBytes = QRCodeUtil.generateQRCode(req.getCertId(), vercelUrl);
        return CertificatePdfGenerator.generate(req.getCertId(), req.getRollNo(),
                req.getStudentName(), req.getCourse(), req.getIssueDate(),
                req.getIssuerName(), hash, txId, vercelUrl, category, qrBytes);
    }

    public List<Map<String, String>> bulkIssue(MultipartFile file) throws Exception {
        List<Map<String, String>> results = new ArrayList<>();
        try (InputStream is = file.getInputStream(); Workbook wb = new XSSFWorkbook(is)) {
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
                        result.put("row", String.valueOf(i+1));
                        result.put("status","SKIPPED");
                        result.put("reason","Missing certId or studentName");
                        results.add(result); continue;
                    }

                    String hash = HashUtil.generateHash(studentName, rollNo, course, issueDate, certId);
                    fabricService.issueCertificate(certId, rollNo, hash, studentName,
                            course, issueDate, issuerName, Instant.now().toString());
                    metadataRepo.save(CertificateMetadata.builder()
                            .certId(certId).rollNo(rollNo).studentName(studentName)
                            .course(course).issueDate(issueDate).issuerName(issuerName)
                            .category(category).hash(hash).build());

                    result.put("row", String.valueOf(i+1));
                    result.put("certId", certId);
                    result.put("studentName", studentName);
                    result.put("status","SUCCESS");
                } catch (Exception e) {
                    result.put("row", String.valueOf(i+1));
                    result.put("status","FAILED");
                    result.put("reason", e.getMessage());
                }
                results.add(result);
            }
        }
        return results;
    }

    public VerificationResult verify(String certId) {
        // Try DB first (Fabric offline in cloud deployment)
        var dbResult = metadataRepo.findById(certId);
        if (dbResult.isPresent()) {
            log.info("Found certificate certId={} in DB", certId);
            return buildResultFromDb(dbResult.get());
        }
        // Try blockchain as fallback
        try {
            return buildResult(fabricService.getCertificate(certId));
        } catch (Exception e) {
            log.warn("Certificate not found for certId={} in DB or blockchain", certId);
            return VerificationResult.builder()
                    .valid(false).status("NOT_FOUND").certId(certId)
                    .message("Certificate not found").build();
        }
    }

    public VerificationResult verifyByRollNo(String rollNo) {
        // Try DB first (Fabric offline in cloud deployment)
        var dbResult = metadataRepo.findByRollNo(rollNo);
        if (dbResult.isPresent()) {
            log.info("Found certificate for rollNo={} in DB", rollNo);
            return buildResultFromDb(dbResult.get());
        }
        // Try blockchain as fallback
        try {
            return buildResult(fabricService.getCertificateByRollNo(rollNo));
        } catch (Exception e) {
            log.warn("Certificate not found for rollNo={} in DB or blockchain", rollNo);
            return VerificationResult.builder()
                    .valid(false).status("NOT_FOUND").rollNo(rollNo)
                    .message("No certificate found for roll number: " + rollNo).build();
        }
    }

    /**
     * Download certificate PDF.
     * Tries blockchain first — if offline, generates from PostgreSQL data.
     * This fixes the "Blockchain must be running" error.
     */
    public byte[] downloadCertificate(String certId) throws Exception {
        String studentName, rollNo, course, issueDate, issuerName, hash, txId, category;

        try {
            // Try blockchain first
            CertificateResponse cert = fabricService.getCertificate(certId);
            studentName = cert.getStudentName(); rollNo = cert.getRollNo();
            course = cert.getCourse(); issueDate = cert.getIssueDate();
            issuerName = cert.getIssuerName(); hash = cert.getHash();
            txId = cert.getTxId() != null ? cert.getTxId() : "N/A";
            category = "DEGREE_COMPLETION";
        } catch (Exception e) {
            log.warn("Blockchain offline for download certId={}, using DB", certId);
            // Fall back to PostgreSQL
            CertificateMetadata meta = metadataRepo.findById(certId)
                    .orElseThrow(() -> new RuntimeException(
                            "Certificate not found in blockchain or database"));
            studentName = meta.getStudentName(); rollNo = meta.getRollNo();
            course = meta.getCourse(); issueDate = meta.getIssueDate();
            issuerName = meta.getIssuerName(); hash = meta.getHash();
            txId = meta.getTxId() != null ? meta.getTxId() : "N/A";
            category = meta.getCategory() != null ? meta.getCategory() : "DEGREE_COMPLETION";
        }

        byte[] qrBytes = QRCodeUtil.generateQRCode(certId, vercelUrl);
        return CertificatePdfGenerator.generate(certId, rollNo, studentName,
                course, issueDate, issuerName, hash, txId, vercelUrl, category, qrBytes);
    }

    private VerificationResult buildResult(CertificateResponse cert) {
        String computed = HashUtil.generateHash(cert.getStudentName(), cert.getRollNo(),
                cert.getCourse(), cert.getIssueDate(), cert.getCertId());
        boolean valid = computed.equals(cert.getHash());
        return VerificationResult.builder()
                .valid(valid).status(valid ? "VALID" : "INVALID")
                .message(valid ? "✅ Certificate is authentic and tamper-proof"
                               : "❌ Certificate tampered — hash mismatch")
                .certId(cert.getCertId()).rollNo(cert.getRollNo())
                .studentName(cert.getStudentName()).course(cert.getCourse())
                .issueDate(cert.getIssueDate()).issuerName(cert.getIssuerName())
                .issuerOrg(cert.getIssuerOrg()).txId(cert.getTxId())
                .timestamp(cert.getTimestamp())
                .blockchainHash(cert.getHash()).computedHash(computed)
                .build();
    }

    private VerificationResult buildResultFromDb(CertificateMetadata m) {
        String computed = HashUtil.generateHash(m.getStudentName(), m.getRollNo(),
                m.getCourse(), m.getIssueDate(), m.getCertId());
        boolean valid = computed.equals(m.getHash());
        return VerificationResult.builder()
                .valid(valid).status(valid ? "VALID" : "INVALID")
                .message(valid ? "✅ Certificate verified (database — blockchain offline)"
                               : "❌ Certificate tampered")
                .certId(m.getCertId()).rollNo(m.getRollNo())
                .studentName(m.getStudentName()).course(m.getCourse())
                .issueDate(m.getIssueDate()).issuerName(m.getIssuerName())
                .issuerOrg(m.getIssuerOrg()).txId(m.getTxId())
                .blockchainHash(m.getHash()).computedHash(computed)
                .build();
    }

    public List<CertificateMetadata> getAllFromDb() {
        return metadataRepo.findAllByOrderByIssuedAtDesc();
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
