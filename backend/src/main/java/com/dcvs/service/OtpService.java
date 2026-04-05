package com.dcvs.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.issuer-name:DCVS University}")
    private String institutionName;

    // email → {otp, expiryTime}
    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Generates a 6-digit OTP and sends it to the given email.
     */
    public void generateAndSendOtp(String email) throws Exception {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        Instant expiry = Instant.now().plusSeconds(otpExpiryMinutes * 60L);
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, expiry));

        log.info("OTP generated for {}: {} (expires at {})", email, otp, expiry);
        sendOtpEmail(email, otp);
    }

    /**
     * Validates the OTP for a given email.
     */
    public boolean validateOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null) {
            log.warn("No OTP found for email: {}", email);
            return false;
        }
        if (Instant.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            log.warn("OTP expired for email: {}", email);
            return false;
        }
        if (!entry.otp().equals(otp)) {
            log.warn("Invalid OTP for email: {}", email);
            return false;
        }
        otpStore.remove(email.toLowerCase());
        log.info("OTP validated successfully for: {}", email);
        return true;
    }

    private void sendOtpEmail(String toEmail, String otp) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("Your DCVS Verification Code — " + institutionName);

        String html = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #7c3aed, #4c1d95); padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; letter-spacing: 2px;">DCVS</h1>
                <p style="margin: 8px 0 0; color: #c4b5fd; font-size: 13px;">%s</p>
              </div>
              <div style="padding: 32px 24px;">
                <p style="color: #a78bfa; font-size: 14px; margin: 0 0 8px;">Your verification code</p>
                <div style="background: #1a1a2e; border: 2px solid #7c3aed; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
                  <span style="font-size: 42px; font-weight: bold; color: #a78bfa; letter-spacing: 12px;">%s</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">This code expires in <strong style="color: #a78bfa;">%d minutes</strong>. Do not share it with anyone.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e1e2e; padding-top: 16px;">
                  Decentralized Credential Verification System · Secured by Hyperledger Fabric
                </p>
              </div>
            </div>
            """.formatted(institutionName, otp, otpExpiryMinutes);

        helper.setText(html, true);
        mailSender.send(message);
        log.info("OTP email sent to: {}", toEmail);
    }

    private record OtpEntry(String otp, Instant expiry) {}
}
