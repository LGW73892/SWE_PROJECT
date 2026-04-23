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
            List<String> targetCompanies,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
        final String unavailableMessage =
                "There was an issue generating your plan. Please try again in a minute or so. " +
                "You can use the Question Bank now to practice for a specific company.";

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException(unavailableMessage);
        }

        String prompt = buildPrompt(
                userId,
                fullName,
                interviewType,
                timeframe,
                targetCompanies,
                strengths,
                weaknesses,
                neutralTopics
        );

        try {
            String responseJson = callGeminiWithRetry(prompt);
            PlanData parsed = parseGeminiResponse(responseJson);
            if (isCompletePlan(parsed)) {
                log.info("Gemini generation succeeded for user {} with model {}", userId, model);
                return parsed;
            }
            log.warn("Gemini returned incomplete payload for user {}", userId);
        } catch (Exception ex) {
            log.warn("Gemini generation failed for user {}. Reason: {}", userId, ex.getMessage());
        }

        throw new IllegalArgumentException(unavailableMessage);
    }

    private boolean isCompletePlan(PlanData parsed) {
        return parsed != null
                && !parsed.phases.isEmpty()
                && !parsed.schedule.isEmpty()
                && !parsed.questions.isEmpty();
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
        return parsePlanDataText(text);
    }

    private PlanData parsePlanDataText(String text) throws IOException {
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
            question.phaseId = questionNode.path("phaseId").asText();
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
            List<String> targetCompanies,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
        ) {
        String userName = (fullName == null || fullName.isBlank()) ? "Candidate" : fullName.trim();
        String companyContext = targetCompanies.isEmpty() ? "No explicit company targets provided" : String.join(", ", targetCompanies);
        String strengthsContext = strengths.isEmpty() ? "No explicit strengths selected" : String.join(", ", strengths);
        String weaknessesContext = weaknesses.isEmpty() ? "No explicit weaknesses selected" : String.join(", ", weaknesses);
        String neutralContext = neutralTopics.isEmpty() ? "No explicit neutral topics selected" : String.join(", ", neutralTopics);

        return "Generate a realistic interview preparation plan in strict JSON. " +
            "User id: " + userId + ". " +
            "User name: " + userName + ". " +
                "Interview type: " + interviewType + ". " +
                "Timeframe: " + timeframe + ". " +
            "Target companies: " + companyContext + ". " +
            "User strengths: " + strengthsContext + ". " +
            "User weaknesses: " + weaknessesContext + ". " +
            "User neutral topics: " + neutralContext + ". " +
                "Return ONLY JSON with schema: {\"phases\":[{\"id\":string,\"title\":string,\"description\":string,\"duration\":string,\"topics\":[string]}]," +
                "\"schedule\":[{\"day\":number,\"date\":string,\"tasks\":[{\"id\":string,\"title\":string,\"duration\":string,\"type\":\"study\"|\"practice\"|\"review\"|\"mock\"}]}]," +
                "\"questions\":[{\"id\":string,\"question\":string,\"category\":string,\"difficulty\":\"easy\"|\"medium\"|\"hard\",\"tips\":[string]}]}. " +
            "Schedule and questions must be personalized to this user profile, strengths, weaknesses, and target companies. " +
            "Weaknesses are the primary focus: at least 70% of study/practice tasks and at least 70% of questions must target weaknesses when weaknesses are provided. " +
            "Strength topics should be ignored or only briefly covered (at most one short checkpoint in the full plan). " +
            "Neutral topics should be included based on their importance to the selected interview type. " +
            "Create company-specific questions and plan topics when target companies are provided.";
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
        public String phaseId;
        public String category;
        public String difficulty;
        public List<String> tips = new ArrayList<>();
    }

}
