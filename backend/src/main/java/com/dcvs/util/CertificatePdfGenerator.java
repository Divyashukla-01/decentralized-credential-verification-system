package com.dcvs.util;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.itextpdf.io.font.constants.StandardFonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class CertificatePdfGenerator {

    // Color palette
    private static final DeviceRgb NAVY    = new DeviceRgb(10, 25, 55);
    private static final DeviceRgb TEAL    = new DeviceRgb(20, 184, 166);
    private static final DeviceRgb GOLD    = new DeviceRgb(212, 160, 23);
    private static final DeviceRgb GOLD_L  = new DeviceRgb(240, 200, 80);
    private static final DeviceRgb WHITE   = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb GRAY    = new DeviceRgb(100, 110, 125);
    private static final DeviceRgb LGRAY   = new DeviceRgb(220, 225, 230);
    private static final DeviceRgb DKBLUE  = new DeviceRgb(5, 15, 40);

    public static byte[] generate(
            String certId, String studentName, String course,
            String issueDate, String issuerName, String hash,
            String txId, byte[] qrCodeBytes) throws IOException {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);

        // Force single A4 landscape page
        PageSize pageSize = PageSize.A4.rotate();
        pdf.setDefaultPageSize(pageSize);

        Document doc = new Document(pdf, pageSize);
        doc.setMargins(0, 0, 0, 0); // We handle all padding manually

        PdfFont serif      = PdfFontFactory.createFont(StandardFonts.TIMES_ROMAN);
        PdfFont serifBold  = PdfFontFactory.createFont(StandardFonts.TIMES_BOLD);
        PdfFont serifItal  = PdfFontFactory.createFont(StandardFonts.TIMES_ITALIC);
        PdfFont sans       = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont sansBold   = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont sansItal   = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

        float W = pageSize.getWidth();
        float H = pageSize.getHeight();

        // ── Outer gold border frame ───────────────────────────────
        Table outerFrame = new Table(UnitValue.createPointArray(new float[]{W - 40}))
                .setFixedPosition(20, 20, W - 40)
                .setHeight(H - 40);

        Cell outerCell = new Cell()
                .setBorder(new SolidBorder(GOLD, 4))
                .setPadding(0)
                .setBackgroundColor(WHITE);
        outerFrame.addCell(outerCell);
        doc.add(outerFrame);

        // ── Inner border ─────────────────────────────────────────
        Table innerFrame = new Table(UnitValue.createPointArray(new float[]{W - 60}))
                .setFixedPosition(30, 30, W - 60)
                .setHeight(H - 60);

        Cell innerCell = new Cell()
                .setBorder(new SolidBorder(GOLD, 1))
                .setPadding(0)
                .setBackgroundColor(WHITE);
        innerFrame.addCell(innerCell);
        doc.add(innerFrame);

        // ── Header band ──────────────────────────────────────────
        Table header = new Table(UnitValue.createPointArray(new float[]{W - 80}))
                .setFixedPosition(40, H - 120, W - 80)
                .setHeight(80);

        Cell hCell = new Cell()
                .setBackgroundColor(NAVY)
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(12).setPaddingBottom(8)
                .add(new Paragraph("DECENTRALIZED CREDENTIAL VERIFICATION SYSTEM")
                        .setFont(sansBold).setFontSize(8)
                        .setFontColor(TEAL)
                        .setCharacterSpacing(2.5f)
                        .setTextAlignment(TextAlignment.CENTER))
                .add(new Paragraph("CERTIFICATE OF COMPLETION")
                        .setFont(serifBold).setFontSize(26)
                        .setFontColor(WHITE)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginTop(2));
        header.addCell(hCell);
        doc.add(header);

        // ── Gold divider line ────────────────────────────────────
        Table divider = new Table(UnitValue.createPointArray(new float[]{W - 120}))
                .setFixedPosition(60, H - 130, W - 120)
                .setHeight(3);
        divider.addCell(new Cell().setBackgroundColor(GOLD).setBorder(Border.NO_BORDER));
        doc.add(divider);

        // ── "This is to certify that" ────────────────────────────
        doc.add(new Paragraph("This is to certify that")
                .setFont(serifItal).setFontSize(13)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(40, H - 165, W - 80));

        // ── Student name ─────────────────────────────────────────
        doc.add(new Paragraph(studentName.toUpperCase())
                .setFont(serifBold).setFontSize(32)
                .setFontColor(NAVY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(40, H - 210, W - 80));

        // ── Name underline ───────────────────────────────────────
        Table nameUnderline = new Table(UnitValue.createPointArray(new float[]{300}))
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                .setFixedPosition((W - 300) / 2, H - 218, 300)
                .setHeight(2);
        nameUnderline.addCell(new Cell().setBackgroundColor(GOLD).setBorder(Border.NO_BORDER));
        doc.add(nameUnderline);

        // ── "has successfully completed" ────────────────────────
        doc.add(new Paragraph("has successfully completed the program")
                .setFont(serifItal).setFontSize(12)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(40, H - 245, W - 80));

        // ── Course name ──────────────────────────────────────────
        doc.add(new Paragraph(course)
                .setFont(serifBold).setFontSize(20)
                .setFontColor(TEAL)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(40, H - 278, W - 80));

        // ── Details section (3 cols: left info | center seal area | right QR) ──
        float detailY = H - 390;
        float detailH = 130;

        // Left details block
        Table leftDetails = new Table(UnitValue.createPointArray(new float[]{120, 160}))
                .setFixedPosition(60, detailY, 300)
                .setHeight(detailH);

        String[][] details = {
            {"Certificate ID:", certId},
            {"Date of Issue:", issueDate},
            {"Issued By:", issuerName},
            {"Blockchain:", "Hyperledger Fabric"},
        };
        for (String[] row : details) {
            leftDetails.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                    .add(new Paragraph(row[0]).setFont(sansBold).setFontSize(8).setFontColor(GRAY)));
            leftDetails.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                    .add(new Paragraph(row[1]).setFont(sans).setFontSize(9).setFontColor(NAVY)));
        }
        doc.add(leftDetails);

        // QR code on right
        if (qrCodeBytes != null && qrCodeBytes.length > 0) {
            Image qr = new Image(ImageDataFactory.create(qrCodeBytes))
                    .setWidth(100).setHeight(100)
                    .setFixedPosition(W - 175, detailY + 10);
            doc.add(qr);

            doc.add(new Paragraph("Scan to verify")
                    .setFont(sansItal).setFontSize(7)
                    .setFontColor(GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFixedPosition(W - 175, detailY - 5, 100));
        }

        // ── Signature section ────────────────────────────────────
        float sigY = detailY - 10;

        // Signature line
        Table sigLine = new Table(UnitValue.createPointArray(new float[]{160}))
                .setFixedPosition(60, sigY - 15, 160)
                .setHeight(1);
        sigLine.addCell(new Cell().setBackgroundColor(NAVY).setBorder(Border.NO_BORDER));
        doc.add(sigLine);

        doc.add(new Paragraph(issuerName + "\nAuthorized Signatory")
                .setFont(serifItal).setFontSize(9)
                .setFontColor(GRAY)
                .setFixedPosition(60, sigY - 40, 200));

        // ── Digital Signature block ──────────────────────────────
        float dsY = sigY - 55;
        Table dsBox = new Table(UnitValue.createPointArray(new float[]{W - 120}))
                .setFixedPosition(60, dsY, W - 120)
                .setHeight(50);

        String shortHash = hash.substring(0, 32) + "...";
        String shortTx = (txId != null && txId.length() > 20) ? txId.substring(0, 32) + "..." : (txId != null ? txId : "N/A");

        Cell dsCell = new Cell()
                .setBackgroundColor(new DeviceRgb(245, 248, 252))
                .setBorder(new SolidBorder(LGRAY, 1))
                .setPadding(6)
                .add(new Paragraph("🔐  DIGITAL SIGNATURE  (SHA-256 Blockchain Verified)")
                        .setFont(sansBold).setFontSize(7)
                        .setFontColor(NAVY)
                        .setCharacterSpacing(1))
                .add(new Paragraph("Hash: " + shortHash + "    |    TxID: " + shortTx)
                        .setFont(sans).setFontSize(6.5f)
                        .setFontColor(GRAY)
                        .setMarginTop(3));
        dsBox.addCell(dsCell);
        doc.add(dsBox);

        // ── Footer ───────────────────────────────────────────────
        doc.add(new Paragraph(
                "This certificate is cryptographically secured on Hyperledger Fabric blockchain. " +
                "Any modification to this document will invalidate the digital signature and blockchain hash.")
                .setFont(sans).setFontSize(6.5f)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, 38, W - 120));

        // Force single page
        if (pdf.getNumberOfPages() > 1) {
            pdf.removePage(2);
        }

        doc.close();
        return out.toByteArray();
    }
}
