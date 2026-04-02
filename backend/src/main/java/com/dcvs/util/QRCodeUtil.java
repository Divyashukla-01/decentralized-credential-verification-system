package com.dcvs.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class QRCodeUtil {

    /**
     * Generates a QR code containing full certificate info as plain text.
     * Works with ANY QR scanner (phone camera, apps) — no URL needed.
     * Displays: ID, Student, Course, Date, Issuer, Hash, Status
     */
    public static byte[] generateQRCode(String certId, String studentName,
            String course, String issueDate, String issuerName, String hash)
            throws WriterException, IOException {

        String content =
            "=== DCVS CERTIFICATE ===\n" +
            "ID: " + certId + "\n" +
            "Student: " + studentName + "\n" +
            "Course: " + course + "\n" +
            "Issued: " + issueDate + "\n" +
            "Issuer: " + issuerName + "\n" +
            "Hash: " + hash + "\n" +
            "Blockchain: Hyperledger Fabric\n" +
            "Status: BLOCKCHAIN VERIFIED";

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 250, 250, hints);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return out.toByteArray();
    }
}
