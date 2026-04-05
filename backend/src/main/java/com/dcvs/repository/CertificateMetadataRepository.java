package com.dcvs.repository;

import com.dcvs.model.CertificateMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateMetadataRepository extends JpaRepository<CertificateMetadata, String> {
    Optional<CertificateMetadata> findByRollNo(String rollNo);
    List<CertificateMetadata> findAllByOrderByIssuedAtDesc();
}
