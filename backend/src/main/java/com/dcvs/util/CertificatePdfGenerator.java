package com.dcvs.util;

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

    private static final DeviceRgb NAVY       = new DeviceRgb(8, 20, 55);
    private static final DeviceRgb NAVY_MID   = new DeviceRgb(15, 35, 80);
    private static final DeviceRgb GOLD       = new DeviceRgb(197, 155, 50);
    private static final DeviceRgb GOLD_LIGHT = new DeviceRgb(235, 200, 100);
    private static final DeviceRgb WHITE      = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb OFF_WHITE  = new DeviceRgb(253, 252, 248);
    private static final DeviceRgb GRAY       = new DeviceRgb(100, 110, 130);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(220, 225, 235);

    public enum CertificateType {
        DEGREE_COMPLETION("CERTIFICATE OF COMPLETION",
                "This is to certify that",
                "has successfully completed all requirements for the degree of",
                "with distinction from"),
        INTERNSHIP("CERTIFICATE OF INTERNSHIP",
                "This is to certify that",
                "has successfully completed an internship program in",
                "under the auspices of"),
        WORKSHOP("CERTIFICATE OF PARTICIPATION",
                "This is to certify that",
                "has successfully participated in the workshop on",
                "organized by"),
        HACKATHON("CERTIFICATE OF ACHIEVEMENT",
                "This is to proudly certify that",
                "has demonstrated outstanding skills in the Hackathon:",
                "hosted by"),
        CULTURAL_EVENT("CERTIFICATE OF EXCELLENCE",
                "This is to proudly certify that",
                "has showcased remarkable talent in the cultural event:",
                "organized by"),
        SPORTS("CERTIFICATE OF MERIT",
                "This is to certify that",
                "has demonstrated outstanding sportsmanship in",
                "under the aegis of");

        public final String title, line1, line2, line3;

        CertificateType(String title, String line1, String line2, String line3) {
            this.title = title; this.line1 = line1;
            this.line2 = line2; this.line3 = line3;
        }

        public static CertificateType fromString(String s) {
            if (s == null) return DEGREE_COMPLETION;
            return switch (s.toUpperCase().replace(" ", "_").replace("-", "_")) {
                case "INTERNSHIP"   -> INTERNSHIP;
                case "WORKSHOP"     -> WORKSHOP;
                case "HACKATHON"    -> HACKATHON;
                case "CULTURAL_EVENT", "CULTURAL" -> CULTURAL_EVENT;
                case "SPORTS"       -> SPORTS;
                default             -> DEGREE_COMPLETION;
            };
        }
    }

    public static byte[] generate(
            String certId, String rollNo, String studentName,
            String course, String issueDate, String issuerName,
            String hash, String txId, String vercelUrl,
            String category, byte[] qrCodeBytes) throws IOException {

        CertificateType type = CertificateType.fromString(category);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(out));
        PageSize pageSize = PageSize.A4.rotate();
        pdf.setDefaultPageSize(pageSize);

        Document doc = new Document(pdf, pageSize);
        doc.setMargins(0, 0, 0, 0);

        float W = pageSize.getWidth();   // ~841
        float H = pageSize.getHeight();  // ~595

        PdfFont serifBold = PdfFontFactory.createFont(StandardFonts.TIMES_BOLD);
        PdfFont serif     = PdfFontFactory.createFont(StandardFonts.TIMES_ROMAN);
        PdfFont serifItal = PdfFontFactory.createFont(StandardFonts.TIMES_ITALIC);
        PdfFont serifBI   = PdfFontFactory.createFont(StandardFonts.TIMES_BOLDITALIC);
        PdfFont sans      = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont sansBold  = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        // ── Background ───────────────────────────────────────
        Table bg = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, 0, W).setHeight(H);
        bg.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(OFF_WHITE));
        doc.add(bg);

        // ── Outer gold border ────────────────────────────────
        Table outer = new Table(UnitValue.createPointArray(new float[]{W - 30}))
                .setFixedPosition(15, 15, W - 30).setHeight(H - 30);
        outer.addCell(new Cell().setBorder(new SolidBorder(GOLD, 3.5f)).setBackgroundColor(OFF_WHITE));
        doc.add(outer);

        // ── Inner border ─────────────────────────────────────
        Table inner = new Table(UnitValue.createPointArray(new float[]{W - 50}))
                .setFixedPosition(25, 25, W - 50).setHeight(H - 50);
        inner.addCell(new Cell().setBorder(new SolidBorder(GOLD_LIGHT, 1f)).setBackgroundColor(OFF_WHITE));
        doc.add(inner);

        // ── Gold corner squares ──────────────────────────────
        float cs = 16;
        float[][] corners = {{28, H-44},{W-44, H-44},{28, 28},{W-44, 28}};
        for (float[] c : corners) {
            Table corner = new Table(UnitValue.createPointArray(new float[]{cs}))
                    .setFixedPosition(c[0], c[1], cs).setHeight(cs);
            corner.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
            doc.add(corner);
        }

        // ── Navy top band (height reduced to give more content space) ─
        float topH = 115;
        Table topBand = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH, W).setHeight(topH);
        topBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(topBand);

        // ── Gold divider at bottom of top band ───────────────
        Table topDiv = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH, W).setHeight(3.5f);
        topDiv.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(topDiv);

        // ── Navy bottom band (reduced height) ────────────────
        float botH = 46;
        Table botBand = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, 0, W).setHeight(botH);
        botBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(botBand);

        // ── Gold divider at top of bottom band ───────────────
        Table botDiv = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, botH, W).setHeight(3f);
        botDiv.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(botDiv);

        // ── Institution name ─────────────────────────────────
        doc.add(new Paragraph(issuerName.toUpperCase())
                .setFont(serifBold).setFontSize(17)
                .setFontColor(WHITE).setCharacterSpacing(2f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 58, W - 120));

        // ── Certificate type title ───────────────────────────
        doc.add(new Paragraph(type.title)
                .setFont(sans).setFontSize(9.5f)
                .setFontColor(GOLD_LIGHT).setCharacterSpacing(3.5f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 78, W - 120));

        // ── Thin gold line ───────────────────────────────────
        Table subDiv = new Table(UnitValue.createPointArray(new float[]{280}))
                .setFixedPosition((W-280)/2f, H - 86, 280).setHeight(1f);
        subDiv.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD_LIGHT));
        doc.add(subDiv);

        // ── Cert ID top right ────────────────────────────────
        doc.add(new Paragraph("No: " + certId)
                .setFont(sans).setFontSize(7.5f).setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFixedPosition(W - 165, H - 35, 145));

        // ── Content area: vertically centered between bands ──
        // Available space: from botH+botDiv(49) to H-topH(480) = 431px
        // Center of that = 49 + 431/2 = 264.5
        // We'll place content starting from y=420 downward

        float contentStart = H - topH - 18; // just below top band

        // ── "This is to certify that" ────────────────────────
        doc.add(new Paragraph(type.line1)
                .setFont(serifItal).setFontSize(13).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, contentStart - 28, W - 120));

        // ── Student name ─────────────────────────────────────
        doc.add(new Paragraph(studentName)
                .setFont(serifBold).setFontSize(36).setFontColor(NAVY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, contentStart - 76, W - 120));

        // ── Gold underline ───────────────────────────────────
        Table nameUnder = new Table(UnitValue.createPointArray(new float[]{360}))
                .setFixedPosition((W-360)/2f, contentStart - 82, 360).setHeight(2f);
        nameUnder.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(nameUnder);

        // ── Line 2 ───────────────────────────────────────────
        doc.add(new Paragraph(type.line2)
                .setFont(serifItal).setFontSize(12).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, contentStart - 108, W - 120));

        // ── Course name ──────────────────────────────────────
        doc.add(new Paragraph(course)
                .setFont(serifBI).setFontSize(19).setFontColor(NAVY_MID)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, contentStart - 140, W - 120));

        // ── Line 3 + issuer ──────────────────────────────────
        doc.add(new Paragraph(type.line3 + " " + issuerName)
                .setFont(serifItal).setFontSize(11).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, contentStart - 162, W - 120));

        // ── Details + QR row ─────────────────────────────────
        // Place this row vertically centered in remaining space
        // Remaining from line3 bottom (~contentStart-175) to botDiv top (49)
        // Center = (contentStart-175 + 49) / 2 = ~160 for a 70px block
        float detailY = botH + 55; // 55px above bottom band

        // Left: details table
        Table details = new Table(UnitValue.createPointArray(new float[]{90, 150}))
                .setFixedPosition(65, detailY, 260).setHeight(80);
        String[][] rows = {
            {"Roll No:", rollNo != null && !rollNo.isEmpty() ? rollNo : "N/A"},
            {"Date of Issue:", issueDate},
            {"Category:", category != null ? category : "Degree Completion"},
        };
        for (String[] r : rows) {
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                    .add(new Paragraph(r[0]).setFont(sansBold).setFontSize(8).setFontColor(GRAY)));
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                    .add(new Paragraph(r[1]).setFont(serifBold).setFontSize(9.5f).setFontColor(NAVY)));
        }
        doc.add(details);

        // Center: decorative element
        doc.add(new Paragraph("✦")
                .setFont(serifBold).setFontSize(36).setFontColor(GOLD)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(W/2 - 25, detailY + 20, 50));

        // Right: QR code
        if (qrCodeBytes != null && qrCodeBytes.length > 0) {
            Image qr = new Image(ImageDataFactory.create(qrCodeBytes))
                    .setWidth(90).setHeight(90)
                    .setFixedPosition(W - 158, detailY - 5);
            doc.add(qr);
        }
        doc.add(new Paragraph("Scan to verify")
                .setFont(sans).setFontSize(7).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(W - 162, detailY - 14, 98));

        // ── Digital signature in bottom band ─────────────────
        String shortHash = hash != null && hash.length() > 28 ? hash.substring(0, 28) + "..." : (hash != null ? hash : "N/A");
        String shortTx   = txId != null && txId.length() > 24 ? txId.substring(0, 24) + "..." : (txId != null ? txId : "N/A");

        doc.add(new Paragraph(
                "DIGITALLY SIGNED — BLOCKCHAIN VERIFIED   |   SHA-256: " + shortHash +
                "   |   TxID: " + shortTx + "   |   Hyperledger Fabric · mychannel")
                .setFont(sans).setFontSize(6.5f).setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(35, 16, W - 70));

        // Force single page
        while (pdf.getNumberOfPages() > 1) pdf.removePage(pdf.getNumberOfPages());

        doc.close();
        return out.toByteArray();
    }
}
