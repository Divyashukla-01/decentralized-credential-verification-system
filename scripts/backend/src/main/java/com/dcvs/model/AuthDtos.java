package com.dcvs.model;

import jakarta.validation.constraints.*;
import lombok.Data;

public class AuthDtos {

    @Data
    public static class SignupRequest {
        @NotBlank private String name;
        @Email @NotBlank private String email;
        @NotBlank private String rollNo;
        private String studentId;
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
        @NotBlank private String otp;
    }

    @Data
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }

    @Data
    public static class SendOtpRequest {
        @Email @NotBlank private String email;
        private String purpose; // "signup" | "reset"
    }

    @Data
    public static class ResetPasswordRequest {
        @Email @NotBlank private String email;
        @NotBlank private String otp;
        @NotBlank @Size(min = 6) private String newPassword;
    }

    @Data
    public static class StudentResponse {
        private Long id;
        private String name;
        private String email;
        private String rollNo;
        private String studentId;
        private String role = "student";
    }
}
