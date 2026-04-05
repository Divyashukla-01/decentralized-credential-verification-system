package com.dcvs.service;

import com.dcvs.model.AuthDtos;
import com.dcvs.model.Student;
import com.dcvs.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class StudentAuthService {

    private static final Logger log = LoggerFactory.getLogger(StudentAuthService.class);

    private final StudentRepository studentRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    public StudentAuthService(StudentRepository studentRepository,
                               OtpService otpService,
                               PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Step 1 of signup: send OTP to email
     */
    public void sendSignupOtp(String email) throws Exception {
        if (studentRepository.existsByEmail(email.toLowerCase())) {
            throw new RuntimeException("Email already registered. Please login.");
        }
        otpService.generateAndSendOtp(email, "signup");
    }

    /**
     * Step 2 of signup: verify OTP + create account
     */
    public AuthDtos.StudentResponse completeSignup(AuthDtos.SignupRequest req) {
        // Verify OTP
        boolean valid = otpService.validateOtp(req.getEmail().toLowerCase(), req.getOtp());
        if (!valid) throw new RuntimeException("Invalid or expired OTP");

        // Check duplicates
        if (studentRepository.existsByEmail(req.getEmail().toLowerCase()))
            throw new RuntimeException("Email already registered");
        if (studentRepository.existsByRollNo(req.getRollNo()))
            throw new RuntimeException("Roll number already registered");

        // Save student
        Student student = Student.builder()
                .name(req.getName())
                .email(req.getEmail().toLowerCase())
                .rollNo(req.getRollNo())
                .studentId(req.getStudentId())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .emailVerified(true)
                .build();

        Student saved = studentRepository.save(student);
        log.info("New student registered: {} ({})", saved.getName(), saved.getEmail());
        return toResponse(saved);
    }

    /**
     * Login with email + password
     */
    public AuthDtos.StudentResponse login(AuthDtos.LoginRequest req) {
        Student student = studentRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        if (!passwordEncoder.matches(req.getPassword(), student.getPasswordHash()))
            throw new RuntimeException("Incorrect password");

        return toResponse(student);
    }

    /**
     * Send OTP for password reset
     */
    public void sendResetOtp(String email) throws Exception {
        if (!studentRepository.existsByEmail(email.toLowerCase()))
            throw new RuntimeException("No account found with this email");
        otpService.generateAndSendOtp(email, "reset");
    }

    /**
     * Reset password with OTP
     */
    public void resetPassword(AuthDtos.ResetPasswordRequest req) {
        boolean valid = otpService.validateOtp(req.getEmail().toLowerCase(), req.getOtp());
        if (!valid) throw new RuntimeException("Invalid or expired OTP");

        Student student = studentRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        student.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        studentRepository.save(student);
        log.info("Password reset for: {}", student.getEmail());
    }

    /**
     * Get student by email (for session restore)
     */
    public AuthDtos.StudentResponse getByEmail(String email) {
        Student student = studentRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Account not found"));
        return toResponse(student);
    }

    private AuthDtos.StudentResponse toResponse(Student s) {
        AuthDtos.StudentResponse res = new AuthDtos.StudentResponse();
        res.setId(s.getId());
        res.setName(s.getName());
        res.setEmail(s.getEmail());
        res.setRollNo(s.getRollNo());
        res.setStudentId(s.getStudentId());
        return res;
    }
}
