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
     * QR contains the Vercel public verification URL.
     * This always works — Vercel is always live (free hosting).
     * URL format: https://your-app.vercel.app/public/verify?certId=CERT-001
     *
     * When scanned:
     * - If network up → shows full blockchain verification
     * - If network down → shows cached certificate data from localStorage
     */
    public static byte[] generateQRCode(String certId, String vercelBaseUrl)
            throws WriterException, IOException {

        // Build the public verification URL
        String url = vercelBaseUrl + "/public/verify?certId=" + certId;

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, 280, 280, hints);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return out.toByteArray();
    }
}
