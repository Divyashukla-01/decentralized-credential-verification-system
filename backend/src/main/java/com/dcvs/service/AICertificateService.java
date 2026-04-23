package com.dcvs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
public class AICertificateService {

    private static final Logger log = LoggerFactory.getLogger(AICertificateService.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public record CertificateDesign(
        String primaryColor,
        String secondaryColor,
        String accentColor,
        String backgroundColor,
        String fontStyle,
        String borderStyle,
        String headerText,
        String styleDescription,
        String mood
    ) {}

    public CertificateDesign generateDesign(String category) {
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            try {
                return callGeminiAPI(category);
            } catch (Exception e) {
                log.warn("Gemini API failed, using smart defaults: {}", e.getMessage());
            }
        }
        return getSmartDefault(category);
    }

    private CertificateDesign callGeminiAPI(String category) throws Exception {
        String prompt = """
            Generate a professional certificate design for: %s
            Respond ONLY with valid JSON (no markdown), with these exact fields:
            {
              "primaryColor": "hex color like #1a237e",
              "secondaryColor": "hex color",
              "accentColor": "hex color",
              "backgroundColor": "hex color",
              "fontStyle": "one of: elegant, bold, modern, classic, creative",
              "borderStyle": "one of: double-gold, single-navy, ornate, minimal, gradient",
              "headerText": "certificate type title like CERTIFICATE OF ACHIEVEMENT",
              "styleDescription": "2-3 words describing the style",
              "mood": "one of: professional, festive, academic, corporate, celebratory"
            }
            """.formatted(category);

        var requestBody = mapper.writeValueAsString(Map.of(
            "contents", new Object[]{
                Map.of("parts", new Object[]{Map.of("text", prompt)})
            }
        ));

        var request = HttpRequest.newBuilder()
            .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + geminiApiKey))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        var responseJson = mapper.readTree(response.body());
        var text = responseJson.at("/candidates/0/content/parts/0/text").asText();

        // Clean markdown if present
        text = text.replaceAll("```json|```", "").trim();
        var design = mapper.readValue(text, Map.class);

        return new CertificateDesign(
            (String) design.getOrDefault("primaryColor", "#08143A"),
            (String) design.getOrDefault("secondaryColor", "#C59B32"),
            (String) design.getOrDefault("accentColor", "#FFFFFF"),
            (String) design.getOrDefault("backgroundColor", "#FDFCF8"),
            (String) design.getOrDefault("fontStyle", "elegant"),
            (String) design.getOrDefault("borderStyle", "double-gold"),
            (String) design.getOrDefault("headerText", "CERTIFICATE"),
            (String) design.getOrDefault("styleDescription", "Professional Classic"),
            (String) design.getOrDefault("mood", "professional")
        );
    }

    private CertificateDesign getSmartDefault(String category) {
        if (category == null) return defaultProfessional();
        return switch (category.toUpperCase().replace(" ", "_").replace("-", "_")) {
            case "CULTURAL_EVENT", "CULTURAL" -> new CertificateDesign(
                "#6A1B9A", "#F06292", "#FFD700", "#FFF8E7",
                "creative", "ornate", "CERTIFICATE OF EXCELLENCE",
                "Vibrant Creative", "festive"
            );
            case "INTERNSHIP" -> new CertificateDesign(
                "#0D47A1", "#1565C0", "#FFC107", "#F8FAFF",
                "modern", "single-navy", "CERTIFICATE OF INTERNSHIP",
                "Corporate Elegant", "corporate"
            );
            case "WORKSHOP" -> new CertificateDesign(
                "#004D40", "#00695C", "#80CBC4", "#F0FDF4",
                "modern", "minimal", "CERTIFICATE OF PARTICIPATION",
                "Modern Academic", "academic"
            );
            case "HACKATHON" -> new CertificateDesign(
                "#212121", "#424242", "#00E5FF", "#F0F0F0",
                "bold", "gradient", "CERTIFICATE OF ACHIEVEMENT",
                "Tech Bold", "celebratory"
            );
            case "SPORTS" -> new CertificateDesign(
                "#B71C1C", "#C62828", "#FFD700", "#FFF9F9",
                "bold", "double-gold", "CERTIFICATE OF MERIT",
                "Champion Bold", "celebratory"
            );
            default -> defaultProfessional();
        };
    }

    private CertificateDesign defaultProfessional() {
        return new CertificateDesign(
            "#08143A", "#C59B32", "#FFFFFF", "#FDFCF8",
            "elegant", "double-gold", "CERTIFICATE OF COMPLETION",
            "Professional Classic", "professional"
        );
    }
}
