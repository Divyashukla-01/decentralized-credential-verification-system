package com.dcvs.service;

import com.dcvs.model.CertificateResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hyperledger.fabric.client.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FabricService {

    private static final Logger log = LoggerFactory.getLogger(FabricService.class);

    @Autowired(required = false)
    private Gateway gateway;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${fabric.channel-name:mychannel}")
    private String channelName;

    @Value("${fabric.chaincode-name:dcvs}")
    private String chaincodeName;

    private boolean isFabricAvailable() {
        if (gateway == null) {
            log.warn("Fabric Gateway is not available. Blockchain features disabled.");
            return false;
        }
        return true;
    }

    private Contract getContract() {
        return gateway.getNetwork(channelName).getContract(chaincodeName);
    }

    public void issueCertificate(String certId, String rollNo, String hash,
                                  String studentName, String course,
                                  String issueDate, String issuerName,
                                  String timestamp) throws Exception {
        if (!isFabricAvailable()) {
            log.warn("Skipping blockchain issueCertificate — Fabric not connected.");
            return;
        }
        log.info("Issuing certificate: certId={}, rollNo={}", certId, rollNo);
        try {
            getContract().submitTransaction("IssueCertificate",
                    certId, rollNo, hash, studentName, course, issueDate, issuerName, timestamp);
        } catch (EndorseException | SubmitException | CommitStatusException | CommitException e) {
            throw new RuntimeException("Blockchain error: " + extractError(e), e);
        }
    }

    public CertificateResponse getCertificate(String certId) throws Exception {
        if (!isFabricAvailable()) {
            throw new RuntimeException("Blockchain not available. Cannot verify certificate.");
        }
        try {
            byte[] result = getContract().evaluateTransaction("VerifyCertificate", certId);
            return objectMapper.readValue(new String(result), CertificateResponse.class);
        } catch (GatewayException e) {
            throw new RuntimeException("Certificate not found: " + extractError(e), e);
        }
    }

    public CertificateResponse getCertificateByRollNo(String rollNo) throws Exception {
        if (!isFabricAvailable()) {
            throw new RuntimeException("Blockchain not available. Cannot fetch certificate.");
        }
        try {
            byte[] result = getContract().evaluateTransaction("GetCertificateByRollNo", rollNo);
            return objectMapper.readValue(new String(result), CertificateResponse.class);
        } catch (GatewayException e) {
            throw new RuntimeException("No certificate found for roll number: " + extractError(e), e);
        }
    }

    public List<CertificateResponse> getAllCertificates() throws Exception {
        if (!isFabricAvailable()) {
            log.warn("Returning empty list — Fabric not connected.");
            return List.of();
        }
        try {
            byte[] result = getContract().evaluateTransaction("GetAllCertificates");
            String json = new String(result);
            if (json.isBlank() || json.equals("null")) return List.of();
            return objectMapper.readValue(json, new TypeReference<List<CertificateResponse>>() {});
        } catch (GatewayException e) {
            throw new RuntimeException("Error fetching certificates: " + extractError(e), e);
        }
    }

    private String extractError(Exception e) {
        String msg = e.getMessage();
        if (msg == null) return "Unknown error";
        int idx = msg.lastIndexOf("message: ");
        return idx >= 0 ? msg.substring(idx + 9).trim() : msg;
    }
}
