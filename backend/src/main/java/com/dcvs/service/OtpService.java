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
    private int expiryMinutes;

    @Value("${app.issuer-name:DCVS}")
    private String institutionName;

    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void generateAndSendOtp(String email, String purpose) throws Exception {
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        Instant expiry = Instant.now().plusSeconds(expiryMinutes * 60L);
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, expiry));
        log.info("OTP for {} ({}): {}", email, purpose, otp);
        sendEmail(email, otp, purpose);
    }

    public boolean validateOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null || Instant.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            return false;
        }
        if (!entry.otp().equals(otp)) return false;
        otpStore.remove(email.toLowerCase());
        return true;
    }

    private void sendEmail(String to, String otp, String purpose) throws Exception {
        String subject = purpose.equals("reset")
                ? "Reset Your DCVS Password"
                : "Verify Your Email — " + institutionName;

        String purposeText = purpose.equals("reset")
                ? "You requested a password reset."
                : "You are signing up for the Credential Verification System.";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);

        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:0 auto;background:#0f0a1e;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1565c0,#0d47a1);padding:32px 24px;text-align:center;">
                <h2 style="margin:0;color:white;font-size:20px;letter-spacing:2px;">%s</h2>
                <p style="margin:8px 0 0;color:#90caf9;font-size:13px;">Credential Verification System</p>
              </div>
              <div style="padding:32px 24px;background:#0f0a1e;">
                <p style="color:#90caf9;font-size:14px;margin:0 0 8px;">%s</p>
                <p style="color:#e3f2fd;font-size:14px;">Your verification code:</p>
                <div style="background:#1a237e;border:2px solid #1565c0;border-radius:12px;padding:24px;text-align:center;margin:16px 0;">
                  <span style="font-size:44px;font-weight:bold;color:#90caf9;letter-spacing:14px;">%s</span>
                </div>
                <p style="color:#546e7a;font-size:13px;">Expires in <strong style="color:#90caf9;">%d minutes</strong>. Do not share this code.</p>
                <p style="color:#37474f;font-size:11px;margin-top:24px;border-top:1px solid #1a237e;padding-top:16px;">
                  %s · Secured by Hyperledger Fabric
                </p>
              </div>
            </div>
            """.formatted(institutionName, purposeText, otp, expiryMinutes, institutionName);

        helper.setText(html, true);
        mailSender.send(message);
        log.info("OTP email sent to: {}", to);
    }

    private record OtpEntry(String otp, Instant expiry) {}
}
