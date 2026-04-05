package com.dcvs.controller;

import com.dcvs.model.ApiResponse;
import com.dcvs.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OtpService otpService;

    public AuthController(OtpService otpService) {
        this.otpService = otpService;
    }

    /**
     * POST /api/auth/send-otp
     * Body: { "email": "student@gmail.com" }
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email is required"));
        }
        try {
            otpService.generateAndSendOtp(email.toLowerCase().trim());
            return ResponseEntity.ok(
                    ApiResponse.success("OTP sent to " + email, "SENT"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to send OTP: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/verify-otp
     * Body: { "email": "student@gmail.com", "otp": "123456" }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email and OTP are required"));
        }

        boolean valid = otpService.validateOtp(email.toLowerCase().trim(), otp.trim());
        if (valid) {
            return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", "VERIFIED"));
        } else {
            return ResponseEntity.status(400)
                    .body(ApiResponse.error("Invalid or expired OTP"));
        }
    }
}
