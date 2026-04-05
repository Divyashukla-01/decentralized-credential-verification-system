package com.dcvs.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_metadata")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CertificateMetadata {

    @Id
    @Column(name = "cert_id", nullable = false)
    private String certId;

    @Column(name = "roll_no")
    private String rollNo;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(nullable = false)
    private String course;

    @Column(name = "issue_date")
    private String issueDate;

    @Column(name = "issuer_name")
    private String issuerName;

    @Column
    private String category;

    @Column(length = 64)
    private String hash;

    @Column(name = "tx_id", length = 128)
    private String txId;

    @Column(name = "issuer_org")
    private String issuerOrg;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }
}
