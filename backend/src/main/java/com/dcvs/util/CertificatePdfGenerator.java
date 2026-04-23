package com.dcvs.util;

import com.dcvs.service.AICertificateService;
import com.itextpdf.io.image.ImageDataFactory;
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
import com.itextpdf.layout.properties.*;
import com.itextpdf.io.font.constants.StandardFonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class CertificatePdfGenerator {

    public enum CertificateType {
        DEGREE_COMPLETION("CERTIFICATE OF COMPLETION",
                "This is to certify that", "has successfully completed all requirements for the degree of", "with distinction from"),
        INTERNSHIP("CERTIFICATE OF INTERNSHIP",
                "This is to certify that", "has successfully completed an internship program in", "under the auspices of"),
        WORKSHOP("CERTIFICATE OF PARTICIPATION",
                "This is to certify that", "has successfully participated in the workshop on", "organized by"),
        HACKATHON("CERTIFICATE OF ACHIEVEMENT",
                "This is to proudly certify that", "has demonstrated outstanding skills in the Hackathon:", "hosted by"),
        CULTURAL_EVENT("CERTIFICATE OF EXCELLENCE",
                "This is to proudly certify that", "has showcased remarkable talent in the cultural event:", "organized by"),
        SPORTS("CERTIFICATE OF MERIT",
                "This is to certify that", "has demonstrated outstanding sportsmanship in", "under the aegis of");

        public final String title, line1, line2, line3;
        CertificateType(String title, String line1, String line2, String line3) {
            this.title = title; this.line1 = line1; this.line2 = line2; this.line3 = line3;
        }
        public static CertificateType fromString(String s) {
            if (s == null) return DEGREE_COMPLETION;
            return switch (s.toUpperCase().replace(" ", "_").replace("-", "_")) {
                case "INTERNSHIP" -> INTERNSHIP;
                case "WORKSHOP" -> WORKSHOP;
                case "HACKATHON" -> HACKATHON;
                case "CULTURAL_EVENT", "CULTURAL" -> CULTURAL_EVENT;
                case "SPORTS" -> SPORTS;
                default -> DEGREE_COMPLETION;
            };
        }
    }

    private static DeviceRgb hexToRgb(String hex) {
        hex = hex.replace("#", "");
        int r = Integer.parseInt(hex.substring(0, 2), 16);
        int g = Integer.parseInt(hex.substring(2, 4), 16);
        int b = Integer.parseInt(hex.substring(4, 6), 16);
        return new DeviceRgb(r, g, b);
    }

    public static byte[] generate(
            String certId, String rollNo, String studentName,
            String course, String issueDate, String issuerName,
            String hash, String txId, String vercelUrl,
            String category, byte[] qrCodeBytes) throws IOException {
        return generate(certId, rollNo, studentName, course, issueDate,
                issuerName, hash, txId, vercelUrl, category, qrCodeBytes, null);
    }

    public static byte[] generate(
            String certId, String rollNo, String studentName,
            String course, String issueDate, String issuerName,
            String hash, String txId, String vercelUrl,
            String category, byte[] qrCodeBytes,
            AICertificateService.CertificateDesign aiDesign) throws IOException {

        CertificateType type = CertificateType.fromString(category);

        // Apply AI design or smart defaults
        DeviceRgb NAVY, GOLD, GOLD_LIGHT, WHITE, OFF_WHITE, GRAY, ACCENT;
        if (aiDesign != null) {
            NAVY      = hexToRgb(aiDesign.primaryColor());
            GOLD      = hexToRgb(aiDesign.secondaryColor());
            GOLD_LIGHT= hexToRgb(aiDesign.accentColor());
            ACCENT    = hexToRgb(aiDesign.accentColor());
            OFF_WHITE = hexToRgb(aiDesign.backgroundColor());
        } else {
            NAVY       = new DeviceRgb(8, 20, 55);
            GOLD       = new DeviceRgb(197, 155, 50);
            GOLD_LIGHT = new DeviceRgb(235, 200, 100);
            ACCENT     = new DeviceRgb(15, 35, 80);
            OFF_WHITE  = new DeviceRgb(253, 252, 248);
        }
        WHITE = new DeviceRgb(255, 255, 255);
        GRAY  = new DeviceRgb(100, 110, 130);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(out));
        PageSize pageSize = PageSize.A4.rotate();
        pdf.setDefaultPageSize(pageSize);
        Document doc = new Document(pdf, pageSize);
        doc.setMargins(0, 0, 0, 0);

        float W = pageSize.getWidth();
        float H = pageSize.getHeight();

        PdfFont serifBold = PdfFontFactory.createFont(StandardFonts.TIMES_BOLD);
        PdfFont serifItal = PdfFontFactory.createFont(StandardFonts.TIMES_ITALIC);
        PdfFont serifBI   = PdfFontFactory.createFont(StandardFonts.TIMES_BOLDITALIC);
        PdfFont sans      = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont sansBold  = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        // Background
        Table bg = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, 0, W).setHeight(H);
        bg.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(OFF_WHITE));
        doc.add(bg);

        // Outer border
        Table outer = new Table(UnitValue.createPointArray(new float[]{W - 20})).setFixedPosition(10, 10, W - 20).setHeight(H - 20);
        outer.addCell(new Cell().setBorder(new SolidBorder(GOLD, 5f)).setBackgroundColor(OFF_WHITE));
        doc.add(outer);

        // Inner border
        Table inner = new Table(UnitValue.createPointArray(new float[]{W - 36})).setFixedPosition(18, 18, W - 36).setHeight(H - 36);
        inner.addCell(new Cell().setBorder(new SolidBorder(GOLD_LIGHT, 1.2f)).setBackgroundColor(OFF_WHITE));
        doc.add(inner);

        // Corners
        float cs = 14;
        float[][] corners = {{20, H-34}, {W-34, H-34}, {20, 20}, {W-34, 20}};
        for (float[] c : corners) {
            Table corner = new Table(UnitValue.createPointArray(new float[]{cs})).setFixedPosition(c[0], c[1], cs).setHeight(cs);
            corner.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
            doc.add(corner);
        }

        // Navy top band
        float topH = 68;
        Table topBand = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, H - topH, W).setHeight(topH);
        topBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(topBand);

        // Gold dividers
        Table topDiv = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, H - topH, W).setHeight(4f);
        topDiv.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(topDiv);
        Table topDiv2 = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, H - topH - 7f, W).setHeight(1.5f);
        topDiv2.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD_LIGHT));
        doc.add(topDiv2);

        // Bottom band
        float botH = 44;
        Table botBand = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, 0, W).setHeight(botH);
        botBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(botBand);

        Table botDiv = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, botH, W).setHeight(4f);
        botDiv.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(botDiv);
        Table botDiv2 = new Table(UnitValue.createPointArray(new float[]{W})).setFixedPosition(0, botH + 7f, W).setHeight(1.5f);
        botDiv2.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD_LIGHT));
        doc.add(botDiv2);

        // Cert ID
        doc.add(new Paragraph("No: " + certId).setFont(sans).setFontSize(7.5f).setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.RIGHT).setFixedPosition(W - 160, H - 22, 140));

        // Institution name
        doc.add(new Paragraph(issuerName.toUpperCase()).setFont(serifBold).setFontSize(16f)
                .setFontColor(WHITE).setCharacterSpacing(2.5f)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(60, H - 48, W - 120));

        // White area
        float whiteTop = H - topH - 8f;
        float whiteBot = botH + 8f;
        float whiteH   = whiteTop - whiteBot;

        // Certificate title in white area
        doc.add(new Paragraph(type.title).setFont(sansBold).setFontSize(11f).setFontColor(NAVY)
                .setCharacterSpacing(4f).setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, whiteTop - 20f, W - 120));

        // Gold underline
        Table titleLine = new Table(UnitValue.createPointArray(new float[]{340}))
                .setFixedPosition((W - 340) / 2f, whiteTop - 25f, 340).setHeight(2f);
        titleLine.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(titleLine);

        // Content — vertically centered
        float centerY = whiteBot + (whiteH / 2f);
        float blockStart = centerY + 95f;

        // Gap of 30px then certify line
        doc.add(new Paragraph(type.line1).setFont(serifItal).setFontSize(13f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(60, blockStart, W - 120));

        // Student name
        doc.add(new Paragraph(studentName).setFont(serifBold).setFontSize(38f).setFontColor(NAVY)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(60, blockStart - 50f, W - 120));

        // Gold underline for name
        Table nameUnder = new Table(UnitValue.createPointArray(new float[]{380}))
                .setFixedPosition((W - 380) / 2f, blockStart - 55f, 380).setHeight(2.5f);
        nameUnder.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(nameUnder);

        doc.add(new Paragraph(type.line2).setFont(serifItal).setFontSize(11.5f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(60, blockStart - 80f, W - 120));

        doc.add(new Paragraph(course).setFont(serifBI).setFontSize(20f).setFontColor(ACCENT)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(60, blockStart - 110f, W - 120));

        doc.add(new Paragraph(type.line3 + " " + issuerName).setFont(serifItal).setFontSize(10.5f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(60, blockStart - 132f, W - 120));

        // Details + QR
        float detailY = whiteBot + 14f;

        Table details = new Table(UnitValue.createPointArray(new float[]{95, 160}))
                .setFixedPosition(60, detailY, 275).setHeight(75);
        String[][] rows = {
            {"Roll No:", rollNo != null && !rollNo.isEmpty() ? rollNo : "N/A"},
            {"Date of Issue:", issueDate},
            {"Category:", category != null ? category : "Degree Completion"},
        };
        for (String[] r : rows) {
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(3.5f)
                    .add(new Paragraph(r[0]).setFont(sansBold).setFontSize(7.5f).setFontColor(GRAY)));
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(3.5f)
                    .add(new Paragraph(r[1]).setFont(serifBold).setFontSize(9f).setFontColor(NAVY)));
        }
        doc.add(details);

        doc.add(new Paragraph("✦").setFont(serifBold).setFontSize(32f).setFontColor(GOLD)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(W / 2f - 22f, detailY + 18f, 44f));

        if (qrCodeBytes != null && qrCodeBytes.length > 0) {
            Image qr = new Image(ImageDataFactory.create(qrCodeBytes)).setWidth(80f).setHeight(80f)
                    .setFixedPosition(W - 148f, detailY - 2f);
            doc.add(qr);
        }
        doc.add(new Paragraph("Scan to verify").setFont(sans).setFontSize(6.5f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(W - 152f, detailY - 11f, 88f));

        // TxID in bottom band
        String shortHash = hash != null && hash.length() > 28 ? hash.substring(0, 28) + "..." : (hash != null ? hash : "N/A");
        String shortTx   = txId != null && txId.length() > 24 ? txId.substring(0, 24) + "..." : (txId != null ? txId : "N/A");
        doc.add(new Paragraph("DIGITALLY SIGNED — BLOCKCHAIN VERIFIED   |   SHA-256: " + shortHash +
                "   |   TxID: " + shortTx + "   |   Hyperledger Fabric · mychannel")
                .setFont(sans).setFontSize(6f).setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.CENTER).setFixedPosition(35, 14, W - 70));

        while (pdf.getNumberOfPages() > 1) pdf.removePage(pdf.getNumberOfPages());
        doc.close();
        return out.toByteArray();
    }
}
