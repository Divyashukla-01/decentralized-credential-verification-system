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

    /**
     * POST /api/certificate/issue
     * Issues a single certificate — returns PDF binary
     */
    @PostMapping("/issue")
    public ResponseEntity<?> issueCertificate(@Valid @RequestBody CertificateRequest request) {
        log.info("POST /api/certificate/issue - certId={}", request.getCertId());
        try {
            byte[] pdf = certificateService.issueCertificate(request);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"certificate-" + request.getCertId() + ".pdf\"")
                    .body(pdf);
        } catch (RuntimeException e) {
            log.error("Issue failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to issue certificate: " + e.getMessage()));
        }
    }

    /**
     * POST /api/certificate/bulk
     * Bulk issue from Excel file
     */
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> bulkIssue(
            @RequestParam("file") MultipartFile file) {
        log.info("POST /api/certificate/bulk - filename={}", file.getOriginalFilename());
        try {
            List<Map<String, String>> results = certificateService.bulkIssue(file);
            long success = results.stream().filter(r -> "SUCCESS".equals(r.get("status"))).count();
            return ResponseEntity.ok(ApiResponse.success(
                    "Bulk issue complete: " + success + "/" + results.size() + " certificates issued", results));
        } catch (Exception e) {
            log.error("Bulk issue failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Bulk issue failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/certificate/verify/{certId}
     * Verifies a certificate by recomputing hash and comparing with blockchain
     */
    @GetMapping("/verify/{certId}")
    public ResponseEntity<ApiResponse<VerificationResult>> verify(@PathVariable String certId) {
        log.info("GET /api/certificate/verify/{}", certId);
        VerificationResult result = certificateService.verify(certId);
        HttpStatus status = "NOT_FOUND".equals(result.getStatus())
                ? HttpStatus.NOT_FOUND : HttpStatus.OK;
        return ResponseEntity.status(status)
                .body(ApiResponse.success("Verification complete", result));
    }

    /**
     * GET /api/certificate/download/{certId}
     * Downloads the PDF for an existing certificate
     */
    @GetMapping("/download/{certId}")
    public ResponseEntity<?> downloadCertificate(@PathVariable String certId) {
        log.info("GET /api/certificate/download/{}", certId);
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

    /**
     * GET /api/certificate/all
     * Returns all certificates from blockchain
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> getAllCertificates() {
        log.info("GET /api/certificate/all");
        try {
            List<CertificateResponse> certs = certificateService.getAllCertificates();
            return ResponseEntity.ok(ApiResponse.success("Certificates retrieved", certs));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/certificate/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("DCVS Certificate API running", "OK"));
    }
}
