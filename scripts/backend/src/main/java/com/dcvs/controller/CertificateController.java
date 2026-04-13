package com.dcvs.controller;

import com.dcvs.model.ApiResponse;
import com.dcvs.model.CertificateRequest;
import com.dcvs.model.CertificateResponse;
import com.dcvs.model.VerificationResult;
import com.dcvs.service.CertificateService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/certificate")
public class CertificateController {

    private static final Logger log = LoggerFactory.getLogger(CertificateController.class);
    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    /** POST /api/certificate/issue — issue single certificate */
    @PostMapping("/issue")
    public ResponseEntity<?> issueCertificate(@Valid @RequestBody CertificateRequest request) {
        log.info("POST /api/certificate/issue - certId={}, rollNo={}", request.getCertId(), request.getRollNo());
        try {
            byte[] pdf = certificateService.issueCertificate(request);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"certificate-" + request.getCertId() + ".pdf\"")
                    .body(pdf);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    /** POST /api/certificate/bulk — bulk issue from Excel */
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> bulkIssue(
            @RequestParam("file") MultipartFile file) {
        try {
            List<Map<String, String>> results = certificateService.bulkIssue(file);
            long success = results.stream().filter(r -> "SUCCESS".equals(r.get("status"))).count();
            return ResponseEntity.ok(ApiResponse.success(
                    success + "/" + results.size() + " certificates issued", results));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Bulk issue failed: " + e.getMessage()));
        }
    }

    /** GET /api/certificate/verify/{certId} — verify by cert ID */
    @GetMapping("/verify/{certId}")
    public ResponseEntity<ApiResponse<VerificationResult>> verify(@PathVariable String certId) {
        VerificationResult result = certificateService.verify(certId);
        return ResponseEntity.ok(ApiResponse.success("Verification complete", result));
    }

    /** GET /api/certificate/verify/roll/{rollNo} — verify by roll number */
    @GetMapping("/verify/roll/{rollNo}")
    public ResponseEntity<ApiResponse<VerificationResult>> verifyByRoll(@PathVariable String rollNo) {
        VerificationResult result = certificateService.verifyByRollNo(rollNo);
        return ResponseEntity.ok(ApiResponse.success("Verification complete", result));
    }

    /** GET /api/certificate/download/{certId} — download PDF */
    @GetMapping("/download/{certId}")
    public ResponseEntity<?> downloadCertificate(@PathVariable String certId) {
        try {
            byte[] pdf = certificateService.downloadCertificate(certId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"certificate-" + certId + ".pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Certificate not found: " + e.getMessage()));
        }
    }

    /** GET /api/certificate/all — list all certificates */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> getAllCertificates() {
        try {
            return ResponseEntity.ok(ApiResponse.success("OK", certificateService.getAllCertificates()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    /** GET /api/certificate/health */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("DCVS Certificate API running", "OK"));
    }
}
