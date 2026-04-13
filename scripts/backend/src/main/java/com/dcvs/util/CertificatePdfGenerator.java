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

    // ── Color palette ─────────────────────────────────────────
    private static final DeviceRgb NAVY       = new DeviceRgb(8, 20, 55);
    private static final DeviceRgb NAVY_MID   = new DeviceRgb(15, 35, 80);
    private static final DeviceRgb GOLD       = new DeviceRgb(197, 155, 50);
    private static final DeviceRgb GOLD_LIGHT = new DeviceRgb(235, 200, 100);
    private static final DeviceRgb GOLD_PALE  = new DeviceRgb(250, 240, 200);
    private static final DeviceRgb WHITE      = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb OFF_WHITE  = new DeviceRgb(253, 252, 248);
    private static final DeviceRgb GRAY       = new DeviceRgb(100, 110, 130);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(220, 225, 235);

    // ── Certificate categories with custom wording ────────────
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
                "has demonstrated outstanding skills and secured recognition in the Hackathon:",
                "hosted by"),

        CULTURAL_EVENT("CERTIFICATE OF EXCELLENCE",
                "This is to proudly certify that",
                "has showcased remarkable talent and participated in the cultural event:",
                "organized by"),

        SPORTS("CERTIFICATE OF MERIT",
                "This is to certify that",
                "has demonstrated outstanding sportsmanship and excellence in",
                "under the aegis of");

        public final String title;
        public final String line1;
        public final String line2;
        public final String line3;

        CertificateType(String title, String line1, String line2, String line3) {
            this.title = title;
            this.line1 = line1;
            this.line2 = line2;
            this.line3 = line3;
        }

        public static CertificateType fromString(String s) {
            if (s == null) return DEGREE_COMPLETION;
            return switch (s.toUpperCase().replace(" ", "_").replace("-", "_")) {
                case "INTERNSHIP"      -> INTERNSHIP;
                case "WORKSHOP"        -> WORKSHOP;
                case "HACKATHON"       -> HACKATHON;
                case "CULTURAL_EVENT",
                     "CULTURAL"        -> CULTURAL_EVENT;
                case "SPORTS"          -> SPORTS;
                default                -> DEGREE_COMPLETION;
            };
        }
    }

    /**
     * Generates a professional single-page A4 landscape certificate.
     * Dark Navy + Gold theme. No signature line. Blockchain digital signature at bottom.
     */
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

        PdfFont serifBold  = PdfFontFactory.createFont(StandardFonts.TIMES_BOLD);
        PdfFont serif      = PdfFontFactory.createFont(StandardFonts.TIMES_ROMAN);
        PdfFont serifItal  = PdfFontFactory.createFont(StandardFonts.TIMES_ITALIC);
        PdfFont serifBI    = PdfFontFactory.createFont(StandardFonts.TIMES_BOLDITALIC);
        PdfFont sans       = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont sansBold   = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        // ── 1. White background ──────────────────────────────────
        Table bg = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, 0, W).setHeight(H);
        bg.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(OFF_WHITE));
        doc.add(bg);

        // ── 2. Navy top band ─────────────────────────────────────
        float topH = 130;
        Table topBand = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH, W).setHeight(topH);
        topBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(topBand);

        // ── 3. Navy bottom band ──────────────────────────────────
        float botH = 55;
        Table botBand = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, 0, W).setHeight(botH);
        botBand.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(NAVY));
        doc.add(botBand);

        // ── 4. Gold border lines (top and bottom of bands) ───────
        // Top band bottom border
        Table topLine = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, H - topH, W).setHeight(4);
        topLine.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(topLine);

        // Bottom band top border
        Table botLine = new Table(UnitValue.createPointArray(new float[]{W}))
                .setFixedPosition(0, botH, W).setHeight(4);
        botLine.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(botLine);

        // ── 5. Corner gold squares ───────────────────────────────
        float cs = 18;
        float[][] corners = {{0,H-cs},{W-cs,H-cs},{0,0},{W-cs,0}};
        for (float[] c : corners) {
            Table corner = new Table(UnitValue.createPointArray(new float[]{cs}))
                    .setFixedPosition(c[0], c[1], cs).setHeight(cs);
            corner.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
            doc.add(corner);
        }

        // ── 6. Institution name (in top band) ────────────────────
        doc.add(new Paragraph(issuerName.toUpperCase())
                .setFont(serifBold).setFontSize(17)
                .setFontColor(WHITE)
                .setCharacterSpacing(2.5f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 65, W - 120));

        // ── 7. Certificate type title (in top band) ──────────────
        doc.add(new Paragraph(type.title)
                .setFont(sans).setFontSize(10)
                .setFontColor(GOLD_LIGHT)
                .setCharacterSpacing(4f)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 90, W - 120));

        // ── 8. Thin gold line below subtitle ─────────────────────
        Table subLine = new Table(UnitValue.createPointArray(new float[]{300}))
                .setFixedPosition((W-300)/2f, H - 98, 300).setHeight(1);
        subLine.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD_LIGHT));
        doc.add(subLine);

        // ── 9. Cert ID top-right (in top band) ──────────────────
        doc.add(new Paragraph("Cert No: " + certId)
                .setFont(sans).setFontSize(8)
                .setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFixedPosition(W - 170, H - 38, 150));

        // ── 10. Line 1: "This is to certify that" ────────────────
        doc.add(new Paragraph(type.line1)
                .setFont(serifItal).setFontSize(13)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 175, W - 120));

        // ── 11. Student name (LARGE, prominent) ──────────────────
        doc.add(new Paragraph(studentName)
                .setFont(serifBold).setFontSize(38)
                .setFontColor(NAVY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 230, W - 120));

        // ── 12. Gold underline below name ────────────────────────
        Table nameUnder = new Table(UnitValue.createPointArray(new float[]{360}))
                .setFixedPosition((W-360)/2f, H - 237, 360).setHeight(2);
        nameUnder.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(GOLD));
        doc.add(nameUnder);

        // ── 13. Line 2 (action text) ─────────────────────────────
        doc.add(new Paragraph(type.line2)
                .setFont(serifItal).setFontSize(12)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 265, W - 120));

        // ── 14. Course/event name ─────────────────────────────────
        doc.add(new Paragraph(course)
                .setFont(serifBI).setFontSize(19)
                .setFontColor(NAVY_MID)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 298, W - 120));

        // ── 15. Line 3 + issuer ───────────────────────────────────
        doc.add(new Paragraph(type.line3 + " " + issuerName)
                .setFont(serifItal).setFontSize(11)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(60, H - 322, W - 120));

        // ── 16. Details: Roll No + Date (left side) ──────────────
        float detailY = H - 390;
        Table details = new Table(UnitValue.createPointArray(new float[]{90, 130}))
                .setFixedPosition(70, detailY, 240).setHeight(70);
        String[][] rows = {
            {"Roll No:", rollNo != null && !rollNo.isEmpty() ? rollNo : "N/A"},
            {"Issue Date:", issueDate},
            {"Category:", category != null ? category : "Degree Completion"},
        };
        for (String[] r : rows) {
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                    .add(new Paragraph(r[0]).setFont(sansBold).setFontSize(8).setFontColor(GRAY)));
            details.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                    .add(new Paragraph(r[1]).setFont(serifBold).setFontSize(10).setFontColor(NAVY)));
        }
        doc.add(details);

        // ── 17. QR code (right side) ─────────────────────────────
        if (qrCodeBytes != null && qrCodeBytes.length > 0) {
            Image qr = new Image(ImageDataFactory.create(qrCodeBytes))
                    .setWidth(100).setHeight(100)
                    .setFixedPosition(W - 165, detailY - 5);
            doc.add(qr);
        }
        doc.add(new Paragraph("Scan to verify")
                .setFont(sans).setFontSize(7)
                .setFontColor(GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(W - 168, detailY - 18, 106));

        // ── 18. Digital signature block (bottom navy band) ────────
        String shortHash = hash != null && hash.length() > 28 ? hash.substring(0, 28) + "..." : (hash != null ? hash : "N/A");
        String shortTx   = txId != null && txId.length() > 24 ? txId.substring(0, 24) + "..." : (txId != null ? txId : "N/A");

        doc.add(new Paragraph(
                "🔐  DIGITALLY SIGNED — BLOCKCHAIN VERIFIED   |   " +
                "SHA-256: " + shortHash + "   |   TxID: " + shortTx +
                "   |   Hyperledger Fabric · mychannel")
                .setFont(sans).setFontSize(6.5f)
                .setFontColor(GOLD_LIGHT)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(30, 18, W - 60));

        // Force single page
        while (pdf.getNumberOfPages() > 1) pdf.removePage(pdf.getNumberOfPages());
        doc.close();
        return out.toByteArray();
    }
}
