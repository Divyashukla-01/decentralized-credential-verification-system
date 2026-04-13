package com.dcvs.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class HashUtil {

    /**
     * Generates SHA-256 hash from: studentName + rollNo + course + issueDate + certId
     */
    public static String generateHash(String studentName, String rollNo,
                                       String course, String issueDate, String certId) {
        String raw = studentName.trim() + rollNo.trim() + course.trim()
                   + issueDate.trim() + certId.trim();
        return sha256(raw);
    }

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
