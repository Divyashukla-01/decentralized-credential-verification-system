package com.dcvs.controller;

import com.dcvs.model.ApiResponse;
import com.dcvs.model.VerificationResult;
import com.dcvs.service.CertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final CertificateService certificateService;

    public PublicController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    /**
     * GET /api/public/verify/{certId}
     * Fully public — no auth needed. Used when QR is scanned.
     * Returns full verification result with blockchain hash comparison.
     */
    @GetMapping("/verify/{certId}")
    public ResponseEntity<ApiResponse<VerificationResult>> publicVerify(
            @PathVariable String certId) {
        VerificationResult result = certificateService.verify(certId);
        return ResponseEntity.ok(ApiResponse.success("Verification complete", result));
    }

    /**
     * GET /api/public/verify/roll/{rollNo}
     * Public verify by roll number.
     */
    @GetMapping("/verify/roll/{rollNo}")
    public ResponseEntity<ApiResponse<VerificationResult>> publicVerifyByRoll(
            @PathVariable String rollNo) {
        try {
            VerificationResult result = certificateService.verifyByRollNo(rollNo);
            return ResponseEntity.ok(ApiResponse.success("Verification complete", result));
        } catch (Exception e) {
            VerificationResult notFound = VerificationResult.builder()
                    .valid(false).status("NOT_FOUND").rollNo(rollNo)
                    .message("No certificate found for roll number: " + rollNo).build();
            return ResponseEntity.ok(ApiResponse.success("Verification complete", notFound));
        }
    }
}
