package com.dcvs.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponse {
    @JsonProperty("certId")      private String certId;
    @JsonProperty("studentName") private String studentName;
    @JsonProperty("course")      private String course;
    @JsonProperty("issueDate")   private String issueDate;
    @JsonProperty("issuerName")  private String issuerName;
    @JsonProperty("issuerOrg")   private String issuerOrg;
    @JsonProperty("hash")        private String hash;
    @JsonProperty("txId")        private String txId;
    @JsonProperty("timestamp")   private String timestamp;
}
