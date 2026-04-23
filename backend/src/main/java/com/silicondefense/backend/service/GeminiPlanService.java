package com.silicondefense.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeminiPlanService {

    private static final Logger log = LoggerFactory.getLogger(GeminiPlanService.class);
    private static final int MAX_RETRIES = 3;
    private static final long BASE_RETRY_DELAY_MS = 500L;

    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiPlanService(
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model}") String model,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    public PlanData generatePlan(
            String userId,
            String fullName,
            String interviewType,
            String timeframe,
            List<String> targetCompanies
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key is not set; using fallback plan generation");
            return fallbackPlan(interviewType, timeframe, targetCompanies);
        }

        try {
            String prompt = buildPrompt(userId, fullName, interviewType, timeframe, targetCompanies);
            String responseJson = callGeminiWithRetry(prompt);
            PlanData parsed = parseGeminiResponse(responseJson);
            if (parsed != null && !parsed.phases.isEmpty() && !parsed.schedule.isEmpty() && !parsed.questions.isEmpty()) {
                log.info("Gemini generation succeeded for user {} with model {}", userId, model);
                return parsed;
            }
            log.warn("Gemini returned incomplete payload; using fallback plan generation");
        } catch (Exception ex) {
            log.warn("Gemini generation failed; using fallback plan generation. Reason: {}", ex.getMessage());
        }

        return fallbackPlan(interviewType, timeframe, targetCompanies);
    }

    private String callGeminiWithRetry(String prompt) throws IOException, InterruptedException {
        IOException lastFailure = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return callGemini(prompt);
            } catch (IOException ex) {
                lastFailure = ex;
                boolean shouldRetry = isRetryableGeminiError(ex) && attempt < MAX_RETRIES;
                if (!shouldRetry) {
                    throw ex;
                }
                long delayMs = BASE_RETRY_DELAY_MS * (1L << (attempt - 1));
                log.warn("Gemini request failed (attempt {}/{}). Retrying in {}ms. Reason: {}",
                        attempt, MAX_RETRIES, delayMs, ex.getMessage());
                Thread.sleep(delayMs);
            }
        }
        throw lastFailure == null ? new IOException("Gemini request failed with unknown error") : lastFailure;
    }

    private boolean isRetryableGeminiError(IOException ex) {
        String message = ex.getMessage();
        if (message == null) {
            return false;
        }
        return message.contains("status 429")
                || message.contains("status 500")
                || message.contains("status 503")
                || message.contains("status 504");
    }

    private String callGemini(String prompt) throws IOException, InterruptedException {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        String requestBody = objectMapper.writeValueAsString(
                objectMapper.createObjectNode()
                        .set("contents", objectMapper.createArrayNode().add(
                                objectMapper.createObjectNode()
                                        .set("parts", objectMapper.createArrayNode().add(
                                                objectMapper.createObjectNode().put("text", prompt)
                                        ))
                        ))
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String body = response.body() == null ? "" : response.body();
            String safeBody = body.length() > 1000 ? body.substring(0, 1000) + "..." : body;
            throw new IOException("Gemini call failed with status " + response.statusCode() + ". Body: " + safeBody);
        }

        return response.body();
    }

    private PlanData parseGeminiResponse(String geminiResponseJson) throws IOException {
        JsonNode root = objectMapper.readTree(geminiResponseJson);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            return null;
        }

        String text = textNode.asText();
        String json = extractJson(text);
        if (json == null) {
            return null;
        }

        JsonNode payload = objectMapper.readTree(json);
        PlanData data = new PlanData();

        for (JsonNode phaseNode : payload.path("phases")) {
            Phase phase = new Phase();
            phase.id = phaseNode.path("id").asText();
            phase.title = phaseNode.path("title").asText();
            phase.description = phaseNode.path("description").asText();
            phase.duration = phaseNode.path("duration").asText();
            for (JsonNode topicNode : phaseNode.path("topics")) {
                phase.topics.add(topicNode.asText());
            }
            data.phases.add(phase);
        }

        for (JsonNode dayNode : payload.path("schedule")) {
            Day day = new Day();
            day.day = dayNode.path("day").asInt();
            day.date = dayNode.path("date").asText();
            for (JsonNode taskNode : dayNode.path("tasks")) {
                Task task = new Task();
                task.id = taskNode.path("id").asText();
                task.title = taskNode.path("title").asText();
                task.duration = taskNode.path("duration").asText();
                task.type = taskNode.path("type").asText();
                day.tasks.add(task);
            }
            data.schedule.add(day);
        }

        for (JsonNode questionNode : payload.path("questions")) {
            Question question = new Question();
            question.id = questionNode.path("id").asText();
            question.question = questionNode.path("question").asText();
            question.category = questionNode.path("category").asText();
            question.difficulty = questionNode.path("difficulty").asText();
            for (JsonNode tipNode : questionNode.path("tips")) {
                question.tips.add(tipNode.asText());
            }
            data.questions.add(question);
        }

        return data;
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        return text.substring(start, end + 1);
    }

    private String buildPrompt(
            String userId,
            String fullName,
            String interviewType,
            String timeframe,
            List<String> targetCompanies
    ) {
        String userName = (fullName == null || fullName.isBlank()) ? "Candidate" : fullName.trim();
        String companyContext = targetCompanies.isEmpty()
                ? "top tech companies (Google, Meta, Amazon, Microsoft)"
                : String.join(", ", targetCompanies);

        int totalDays = switch (timeframe) {
            case "1week"  -> 7;
            case "2weeks" -> 14;
            case "1month" -> 30;
            case "2months"-> 60;
            default       -> 14;
        };

        int totalQuestions = switch (timeframe) {
            case "1week"  -> 15;
            case "2weeks" -> 25;
            case "1month" -> 40;
            case "2months"-> 60;
            default       -> 25;
        };

        String interviewGuidance = switch (interviewType) {
            case "software" -> """
            Focus on: data structures, algorithms, system design, coding challenges, and object-oriented design.
            Include LeetCode-style questions, system design exercises (e.g., design a URL shortener, design Twitter),
            and behavioral questions using the STAR method. Company-specific: include known question patterns
            and focus areas (e.g., Google focuses on algorithms and scalability, Meta on product-scale systems,
            Amazon on leadership principles, Microsoft on problem-solving clarity).
            """;
            case "product" -> """
            Focus on: product sense, metrics, case studies, prioritization frameworks, and go-to-market strategy.
            Include questions like "How would you improve X product?", "How do you define success for feature Y?",
            and estimation questions. Company-specific: tailor to each company's product culture
            (e.g., Meta focuses on social impact and growth, Google on data-driven decisions,
            Amazon on customer obsession and working backwards).
            """;
            case "behavioral" -> """
            Focus on: leadership, conflict resolution, teamwork, failure/success stories, and situational judgment.
            Use STAR method (Situation, Task, Action, Result) for all questions.
            Include company-specific values (e.g., Amazon's 16 Leadership Principles, Google's Googleyness,
            Meta's Move Fast culture). Include questions about handling ambiguity, cross-functional collaboration,
            and driving impact.
            """;
            case "general" -> """
            Focus on: resume walkthroughs, common interview questions, salary negotiation, networking,
            and professional storytelling. Include questions like "Tell me about yourself",
            "Where do you see yourself in 5 years?", and "Why do you want to work here?".
            Provide practical tips for each question.
            """;
            default -> "Focus on general interview preparation best practices.";
        };

        return String.format("""
        You are an expert interview coach helping %s prepare for %s interviews at %s.
        
        Preparation timeframe: %s (%d days total).
        
        Interview focus guidance:
        %s
        
        Generate a highly personalized, realistic, and actionable interview preparation plan.
        
        Requirements:
        - Create exactly 4 phases that progressively build skill (Foundation → Focused Practice → Company-Specific → Final Polish)
        - Generate exactly %d days of schedule entries (day 1 through day %d), each with 2-3 specific tasks
        - Generate exactly %d practice questions, mixing difficulties: 40%% easy, 40%% medium, 20%% hard
        - Every question must include 3 specific, actionable tips
        - Tasks should be specific and actionable (not generic like "study algorithms" but "solve 3 LeetCode medium array problems focusing on sliding window technique")
        - Questions must be real, specific interview questions — not placeholders
        - When target companies are provided, include company-specific questions and topics (e.g., actual known interview questions from those companies)
        - Include mock interview days every 5-7 days
        - Include weekly review sessions
        - Schedule should have realistic time estimates (30-120 min per task)
        - Task types must be one of: study, practice, review, mock
        
        Return ONLY valid JSON with this exact schema — no markdown, no explanation, no extra text:
        {
          "phases": [{"id": string, "title": string, "description": string, "duration": string, "topics": [string]}],
          "schedule": [{"day": number, "date": string, "tasks": [{"id": string, "title": string, "duration": string, "type": "study"|"practice"|"review"|"mock"}]}],
          "questions": [{"id": string, "question": string, "category": string, "difficulty": "easy"|"medium"|"hard", "tips": [string]}]
        }
        """,
                userName, interviewType, companyContext,
                timeframe, totalDays,
                interviewGuidance,
                totalDays, totalDays,
                totalQuestions
        );
    }

    private PlanData fallbackPlan(String interviewType, String timeframe, List<String> targetCompanies) {
        int days = switch (timeframe) {
            case "1week" -> 7;
            case "2weeks" -> 14;
            case "1month" -> 30;
            case "2months" -> 60;
            default -> 14;
        };

        String companyFocus = targetCompanies.isEmpty() ? "General top tech companies" : String.join(", ", targetCompanies);

        PlanData data = new PlanData();
        for (int i = 1; i <= 4; i++) {
            Phase phase = new Phase();
            phase.id = "phase-" + i;
            phase.title = switch (i) {
                case 1 -> "Core Foundations";
                case 2 -> "Focused Practice";
                case 3 -> "Company-Specific Prep";
                default -> "Mock Interviews & Polish";
            };
            phase.description = switch (i) {
                case 1 -> "Build fundamentals for " + interviewType + " interviews";
                case 2 -> "Practice common patterns and improve speed";
                case 3 -> "Tailor preparation to target companies";
                default -> "Finalize and rehearse under realistic conditions";
            };
            phase.duration = "Phase " + i;
            phase.topics = new ArrayList<>(List.of(
                    "Interview type: " + interviewType,
                    "Target focus: " + companyFocus,
                    "Behavioral storytelling",
                    "Progress review"
            ));
            data.phases.add(phase);
        }

        LocalDate start = LocalDate.now();
        for (int i = 0; i < days; i++) {
            Day day = new Day();
            day.day = i + 1;
            day.date = start.plusDays(i).format(DateTimeFormatter.ISO_DATE);

            Task study = new Task();
            study.id = "day-" + (i + 1) + "-study";
            study.title = "Study key topic for " + interviewType;
            study.duration = "90 min";
            study.type = "study";

            Task practice = new Task();
            practice.id = "day-" + (i + 1) + "-practice";
            practice.title = "Solve practice set with " + companyFocus + " style";
            practice.duration = "90 min";
            practice.type = "practice";

            day.tasks.add(study);
            day.tasks.add(practice);

            if ((i + 1) % 5 == 0) {
                Task mock = new Task();
                mock.id = "day-" + (i + 1) + "-mock";
                mock.title = "Mock interview";
                mock.duration = "60 min";
                mock.type = "mock";
                day.tasks.add(mock);
            }

            if ((i + 1) % 7 == 0) {
                Task review = new Task();
                review.id = "day-" + (i + 1) + "-review";
                review.title = "Weekly progress review";
                review.duration = "45 min";
                review.type = "review";
                day.tasks.add(review);
            }

            data.schedule.add(day);
        }

        for (int i = 1; i <= 12; i++) {
            Question q = new Question();
            q.id = "q-" + i;
            q.question = "Question " + i + " for " + interviewType + " interviews at " + companyFocus;
            q.category = i % 2 == 0 ? "Behavioral" : "Technical";
            q.difficulty = i % 3 == 0 ? "hard" : (i % 2 == 0 ? "medium" : "easy");
            q.tips = new ArrayList<>(List.of(
                    "Use a structured approach",
                    "Tie answers to company context",
                    "Quantify impact and trade-offs"
            ));
            data.questions.add(q);
        }

        return data;
    }

    public static class PlanData {
        public List<Phase> phases = new ArrayList<>();
        public List<Day> schedule = new ArrayList<>();
        public List<Question> questions = new ArrayList<>();
    }

    public static class Phase {
        public String id;
        public String title;
        public String description;
        public String duration;
        public List<String> topics = new ArrayList<>();
    }

    public static class Day {
        public int day;
        public String date;
        public List<Task> tasks = new ArrayList<>();
    }

    public static class Task {
        public String id;
        public String title;
        public String duration;
        public String type;
    }

    public static class Question {
        public String id;
        public String question;
        public String category;
        public String difficulty;
        public List<String> tips = new ArrayList<>();
    }
}
