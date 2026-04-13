package com.dcvs.config;

import io.grpc.ChannelCredentials;
import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.TlsChannelCredentials;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.cert.CertificateException;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Configuration
public class FabricConfig {

    @Value("${fabric.msp-id}")
    private String mspId;

    @Value("${fabric.peer-endpoint}")
    private String peerEndpoint;

    @Value("${fabric.peer-host-alias}")
    private String peerHostAlias;

    @Value("${fabric.tls-cert-path}")
    private String tlsCertPath;

    @Value("${fabric.cert-path}")
    private String certPath;

    @Value("${fabric.key-path}")
    private String keyPath;

    @Bean
    public Gateway fabricGateway() throws Exception {
        // Load TLS certificate for gRPC channel
        Path tlsCertFile = Paths.get(tlsCertPath);

        ChannelCredentials credentials = TlsChannelCredentials.newBuilder()
                .trustManager(tlsCertFile.toFile())
                .build();

        ManagedChannel channel = Grpc.newChannelBuilder(peerEndpoint, credentials)
                .overrideAuthority(peerHostAlias)
                .build();

        // Load identity
        Identity identity = newIdentity();
        Signer signer = newSigner();

        return Gateway.newInstance()
                .identity(identity)
                .signer(signer)
                .connection(channel)
                .evaluateOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .endorseOptions(options -> options.withDeadlineAfter(15, TimeUnit.SECONDS))
                .submitOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .commitStatusOptions(options -> options.withDeadlineAfter(60, TimeUnit.SECONDS))
                .connect();
    }

    private Identity newIdentity() throws IOException, CertificateException {
        Path certFile = Paths.get(certPath);
        try (var certReader = Files.newBufferedReader(certFile)) {
            var certificate = Identities.readX509Certificate(certReader);
            return new X509Identity(mspId, certificate);
        }
    }

    private Signer newSigner() throws IOException, InvalidKeyException {
        Path keyDir = Paths.get(keyPath);
        // Keystore directory - find the private key file
        Path keyFile;
        try (Stream<Path> keyFiles = Files.list(keyDir)) {
            keyFile = keyFiles
                    .filter(p -> !Files.isDirectory(p))
                    .findFirst()
                    .orElseThrow(() -> new IOException("No private key found in: " + keyDir));
        }

        try (var keyReader = Files.newBufferedReader(keyFile)) {
            var privateKey = Identities.readPrivateKey(keyReader);
            return Signers.newPrivateKeySigner(privateKey);
        }
    }
}
