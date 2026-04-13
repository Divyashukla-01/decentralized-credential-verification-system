package com.dcvs.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CertificateRequest {

    @NotBlank(message = "Certificate ID is required")
    private String certId;

    @NotBlank(message = "Roll number is required")
    private String rollNo;

    @NotBlank(message = "Student name is required")
    private String studentName;

    @NotBlank(message = "Course / Event name is required")
    private String course;

    @NotBlank(message = "Issue date is required")
    private String issueDate;

    @NotBlank(message = "Issuer name is required")
    private String issuerName;

    // Certificate category: DEGREE_COMPLETION, INTERNSHIP, WORKSHOP,
    // HACKATHON, CULTURAL_EVENT, SPORTS
    private String category = "DEGREE_COMPLETION";
}
