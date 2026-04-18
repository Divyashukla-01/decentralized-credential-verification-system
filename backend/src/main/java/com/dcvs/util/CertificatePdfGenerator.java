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

    private static final DeviceRgb NAVY        = new DeviceRgb(8, 20, 55);
    private static final DeviceRgb NAVY_MID    = new DeviceRgb(15, 35, 80);
    private static final DeviceRgb GOLD        = new DeviceRgb(197, 155, 50);
    private static final DeviceRgb GOLD_LIGHT  = new DeviceRgb(235, 200, 100);
    private static final DeviceRgb WHITE       = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb OFF_WHITE   = new DeviceRgb(253, 252, 248);
    private static final DeviceRgb GRAY        = new DeviceRgb(110, 120, 140);
    private static final DeviceRgb TEAL        = new DeviceRgb(0, 150, 136);   // modern accent
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(180, 140, 40); // visible gold border

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
                case "INTERNSHIP"    -> INTERNSHIP;
                case "WORKSHOP"      -> WORKSHOP;
                case "HACKATHON"     -> HACKATHON;
                case "CULTURAL_EVENT", "CULTURAL" -> CULTURAL_EVENT;
                case "SPORTS"        -> SPORTS;
                default              -> DEGREE_COMPLETION;
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
        PdfFont serifItal = PdfFontFactory.createFont(StandardFonts.TIMES_ITALIC);
        PdfFont serifBI   = PdfFontFactory.createFont(StandardFonts.TIMES_BOLDITALIC);
        PdfFont sans      = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont sansBold  = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        // ── Background OFF-WHITE ──────────────────────────────
        Table bg = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, 0, W).setHeight(H);
        bg.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(OFF_WHITE));
        doc.add(bg);

        // ── Outer border — VISIBLE GOLD (not mixing with bg) ─
        Table outer = new Table(UnitValue.createPointArray(new float[]{W - 20}))
                .setFixedPosition(10, 10, W - 20).setHeight(H - 20);
        outer.addCell(new Cell()
                .setBorder(new SolidBorder(BORDER_COLOR, 5f))
                .setBackgroundColor(OFF_WHITE));
        doc.add(outer);

        // ── Inner thin border ─────────────────────────────────
        Table inner = new Table(UnitValue.createPointArray(new float[]{W - 36}))
                .setFixedPosition(18, 18, W - 36).setHeight(H - 36);
        inner.addCell(new Cell()
                .setBorder(new SolidBorder(GOLD_LIGHT, 1.2f))
                .setBackgroundColor(OFF_WHITE));
        doc.add(inner);

        // ── Corner ornaments (gold diamonds) ─────────────────
        float cs = 14;
        float[][] corners = {{20, H-34},{W-34, H-34},{20, 20},{W-34, 20}};
        for (float[] c : corners) {
            Table corner = new Table(UnitValue.createPointArray(new float[]{cs}))
                    .setFixedPosition(c[0], c[1], cs).setHeight(cs);
            corner.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
            doc.add(corner);
        }

        // ── NAVY TOP BAND — institution name only ─────────────
        float topH = 68;
        Table topBand = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH, W).setHeight(topH);
        topBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(topBand);

        // ── Double gold divider at bottom of navy band ────────
        Table topDiv1 = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH, W).setHeight(4f);
        topDiv1.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(topDiv1);
        Table topDiv2 = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH - 7f, W).setHeight(1.5f);
        topDiv2.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD_LIGHT));
        doc.add(topDiv2);

        // ── NAVY BOTTOM BAND ──────────────────────────────────
        float botH = 44;
        Table botBand = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, 0, W).setHeight(botH);
        botBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(botBand);

        // ── Double gold divider at top of bottom band ─────────
        Table botDiv1 = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, botH, W).setHeight(4f);
        botDiv1.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(botDiv1);
        Table botDiv2 = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, botH + 7f, W).setHeight(1.5f);
        botDiv2.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD_LIGHT));
        doc.add(botDiv2);

        // ── Cert ID top right ─────────────────────────────────
        doc.add(new Paragraph("No: " + certId)
                .setFont(sans).setFontSize(7.5f).setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFixedPosition(W - 160, H - 22, 140));

        // ── Institution name in navy band ─────────────────────
        doc.add(new Paragraph(issuerName.toUpperCase())
                .setFont(serifBold).setFontSize(16f)
                .setFontColor(WHITE).setCharacterSpacing(2.5f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 46, W - 120));

        // ════════════════════════════════════════════════════════
        // WHITE AREA: from (H - topH - 8) down to (botH + 8)
        // Total white height ≈ 595 - 68 - 8 - 44 - 8 = 467px
        // ════════════════════════════════════════════════════════
        float whiteTop = H - topH - 8f;      // ~519
        float whiteBot = botH + 8f;           // ~52
        float whiteH   = whiteTop - whiteBot; // ~467

        // ── [1] CERTIFICATE TITLE — top of white area ─────────
        // Position: 18px below whiteTop
        float titleY = whiteTop - 20f;
        doc.add(new Paragraph(type.title)
                .setFont(sansBold).setFontSize(11f)
                .setFontColor(NAVY).setCharacterSpacing(4f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, titleY, W - 120));

        // Gold line under title
        Table titleLine = new Table(UnitValue.createPointArray(new float[]{340}))
                .setFixedPosition((W - 340) / 2f, titleY - 5f, 340).setHeight(2f);
        titleLine.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(titleLine);

        // ── [2] CENTER CONTENT — vertically centered in white ─
        // Content block height estimate: ~220px
        // Center of white area: whiteBot + whiteH/2 = 52 + 233 = 285
        // Start content block 110px above center = 285 + 110 = 395
        float centerY = whiteBot + (whiteH / 2f); // ~285
        float blockStart = centerY + 100f;         // ~385

        // GAP of 38px below title line, then "This is to certify"
        doc.add(new Paragraph(type.line1)
                .setFont(serifItal).setFontSize(13f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, blockStart, W - 120));

        // Student name — large and bold
        doc.add(new Paragraph(studentName)
                .setFont(serifBold).setFontSize(38f).setFontColor(NAVY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, blockStart - 50f, W - 120));

        // Gold underline for name
        Table nameUnder = new Table(UnitValue.createPointArray(new float[]{380}))
                .setFixedPosition((W - 380) / 2f, blockStart - 55f, 380).setHeight(2.5f);
        nameUnder.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(nameUnder);

        // Line 2
        doc.add(new Paragraph(type.line2)
                .setFont(serifItal).setFontSize(11.5f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, blockStart - 80f, W - 120));

        // Course name — teal modern color
        doc.add(new Paragraph(course)
                .setFont(serifBI).setFontSize(20f).setFontColor(NAVY_MID)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, blockStart - 110f, W - 120));

        // Line 3 + issuer
        doc.add(new Paragraph(type.line3 + " " + issuerName)
                .setFont(serifItal).setFontSize(10.5f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, blockStart - 132f, W - 120));

        // ── [3] DETAILS + QR at bottom of white area ──────────
        float detailY = whiteBot + 14f; // just above bottom band

        // Left: details table
        Table details = new Table(UnitValue.createPointArray(new float[]{95, 160}))
                .setFixedPosition(60, detailY, 275).setHeight(75);
        String[][] rows = {
            {"Roll No:",       rollNo != null && !rollNo.isEmpty() ? rollNo : "N/A"},
            {"Date of Issue:", issueDate},
            {"Category:",      category != null ? category : "Degree Completion"},
        };
        for (String[] r : rows) {
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(3.5f)
                    .add(new Paragraph(r[0]).setFont(sansBold).setFontSize(7.5f).setFontColor(GRAY)));
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(3.5f)
                    .add(new Paragraph(r[1]).setFont(serifBold).setFontSize(9f).setFontColor(NAVY)));
        }
        doc.add(details);

        // Center: gold star ornament
        doc.add(new Paragraph("✦")
                .setFont(serifBold).setFontSize(32f).setFontColor(GOLD)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(W / 2f - 22f, detailY + 18f, 44f));

        // Right: QR code
        if (qrCodeBytes != null && qrCodeBytes.length > 0) {
            Image qr = new Image(ImageDataFactory.create(qrCodeBytes))
                    .setWidth(80f).setHeight(80f)
                    .setFixedPosition(W - 148f, detailY - 2f);
            doc.add(qr);
        }
        doc.add(new Paragraph("Scan to verify")
                .setFont(sans).setFontSize(6.5f).setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(W - 152f, detailY - 11f, 88f));

        // ── Digital signature in bottom band ──────────────────
        String shortHash = hash != null && hash.length() > 28
                ? hash.substring(0, 28) + "..." : (hash != null ? hash : "N/A");
        String shortTx = txId != null && txId.length() > 24
                ? txId.substring(0, 24) + "..." : (txId != null ? txId : "N/A");

        doc.add(new Paragraph(
                "DIGITALLY SIGNED — BLOCKCHAIN VERIFIED   |   SHA-256: " + shortHash +
                "   |   TxID: " + shortTx + "   |   Hyperledger Fabric · mychannel")
                .setFont(sans).setFontSize(6f).setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(35, 14, W - 70));

        while (pdf.getNumberOfPages() > 1) pdf.removePage(pdf.getNumberOfPages());
        doc.close();
        return out.toByteArray();
    }
}
