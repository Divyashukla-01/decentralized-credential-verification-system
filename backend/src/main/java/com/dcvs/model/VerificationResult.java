package com.dcvs.model;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VerificationResult {
    private boolean valid;
    private String status;        // VALID | INVALID | NOT_FOUND
    private String message;
    private String certId;
    private String rollNo;
    private String studentName;
    private String course;
    private String issueDate;
    private String issuerName;
    private String issuerOrg;
    private String txId;
    private String timestamp;
    private String blockchainHash;
    private String computedHash;
}
