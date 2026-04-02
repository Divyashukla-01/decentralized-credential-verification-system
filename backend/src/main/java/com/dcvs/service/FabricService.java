package com.dcvs.service;

import com.dcvs.model.CertificateResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hyperledger.fabric.client.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FabricService {
    private static final Logger log = LoggerFactory.getLogger(FabricService.class);
    private final Gateway gateway;
    private final ObjectMapper objectMapper;
    private final String channelName;
    private final String chaincodeName;

    public FabricService(Gateway gateway,
                         @Value("${fabric.channel-name}") String channelName,
                         @Value("${fabric.chaincode-name}") String chaincodeName) {
        this.gateway = gateway;
        this.objectMapper = new ObjectMapper();
        this.channelName = channelName;
        this.chaincodeName = chaincodeName;
    }

    private Contract getContract() {
        return gateway.getNetwork(channelName).getContract(chaincodeName);
    }

    public void issueCertificate(String certId, String hash, String studentName,
                                  String course, String issueDate, String issuerName, String timestamp) throws Exception {
        log.info("Issuing certificate: certId={}", certId);
        try {
            getContract().submitTransaction("IssueCertificate", certId, hash, studentName, course, issueDate, issuerName, timestamp);
        } catch (EndorseException | SubmitException | CommitStatusException | CommitException e) {
            throw new RuntimeException("Blockchain error: " + extractError(e), e);
        }
    }

    public CertificateResponse getCertificate(String certId) throws Exception {
        try {
            byte[] result = getContract().evaluateTransaction("VerifyCertificate", certId);
            return objectMapper.readValue(new String(result), CertificateResponse.class);
        } catch (GatewayException e) {
            throw new RuntimeException("Certificate not found: " + extractError(e), e);
        }
    }

    public List<CertificateResponse> getAllCertificates() throws Exception {
        try {
            byte[] result = getContract().evaluateTransaction("GetAllCertificates");
            String json = new String(result);
            if (json == null || json.isBlank() || json.equals("null")) return List.of();
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
