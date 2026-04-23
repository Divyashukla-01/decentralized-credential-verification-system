package com.dcvs.repository;

import com.dcvs.model.CertificateMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateMetadataRepository extends JpaRepository<CertificateMetadata, String> {

    @Query(value = "SELECT * FROM certificate_metadata WHERE TRIM(roll_no) = TRIM(:rollNo) ORDER BY issued_at DESC LIMIT 1", nativeQuery = true)
    Optional<CertificateMetadata> findByRollNo(@Param("rollNo") String rollNo);

    @Query(value = "SELECT * FROM certificate_metadata WHERE TRIM(roll_no) = TRIM(:rollNo) ORDER BY issued_at DESC", nativeQuery = true)
    List<CertificateMetadata> findAllByRollNo(@Param("rollNo") String rollNo);

    List<CertificateMetadata> findAllByOrderByIssuedAtDesc();
}
