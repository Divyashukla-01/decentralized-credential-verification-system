package com.dcvs.controller;

import com.dcvs.model.ApiResponse;
import com.dcvs.model.AuthDtos;
import com.dcvs.service.OtpService;
import com.dcvs.service.StudentAuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final OtpService otpService;
    private final StudentAuthService studentAuthService;

    public AuthController(OtpService otpService, StudentAuthService studentAuthService) {
        this.otpService = otpService;
        this.studentAuthService = studentAuthService;
    }

    /** POST /api/auth/send-otp — send OTP for signup or reset */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@RequestBody AuthDtos.SendOtpRequest req) {
        try {
            String purpose = req.getPurpose() != null ? req.getPurpose() : "signup";
            if ("reset".equals(purpose)) {
                studentAuthService.sendResetOtp(req.getEmail());
            } else {
                studentAuthService.sendSignupOtp(req.getEmail());
            }
            return ResponseEntity.ok(ApiResponse.success("OTP sent to " + req.getEmail(), "SENT"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to send OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to send OTP: " + e.getMessage()));
        }
    }

    /** POST /api/auth/signup — complete signup with OTP verification */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthDtos.StudentResponse>> signup(
            @Valid @RequestBody AuthDtos.SignupRequest req) {
        try {
            AuthDtos.StudentResponse student = studentAuthService.completeSignup(req);
            return ResponseEntity.ok(ApiResponse.success("Account created successfully", student));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** POST /api/auth/login — login with email + password */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDtos.StudentResponse>> login(
            @Valid @RequestBody AuthDtos.LoginRequest req) {
        try {
            AuthDtos.StudentResponse student = studentAuthService.login(req);
            return ResponseEntity.ok(ApiResponse.success("Login successful", student));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    /** POST /api/auth/reset-password — reset password with OTP */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody AuthDtos.ResetPasswordRequest req) {
        try {
            studentAuthService.resetPassword(req);
            return ResponseEntity.ok(ApiResponse.success("Password reset successfully", "OK"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** POST /api/auth/verify-otp — standalone OTP verify (for legacy support) */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");
        if (email == null || otp == null)
            return ResponseEntity.badRequest().body(ApiResponse.error("Email and OTP required"));
        boolean valid = otpService.validateOtp(email.toLowerCase(), otp);
        return valid
                ? ResponseEntity.ok(ApiResponse.success("OTP verified", "VERIFIED"))
                : ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired OTP"));
    }
}
