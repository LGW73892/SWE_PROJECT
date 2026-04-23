package com.silicondefense.backend.service;

import com.silicondefense.backend.model.InterviewPlanDocument;
import com.silicondefense.backend.model.UserDocument;
import com.silicondefense.backend.model.CompanyQuestionDocument;
import com.silicondefense.backend.repo.InterviewPlanRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Locale;
import java.util.Comparator;

@Service
public class PlanService {

    private final InterviewPlanRepository planRepository;
    private final UserProfileService userProfileService;
    private final GeminiPlanService geminiPlanService;
    private final CompanyQuestionBankService companyQuestionBankService;

    public PlanService(
            InterviewPlanRepository planRepository,
            UserProfileService userProfileService,
            GeminiPlanService geminiPlanService,
            CompanyQuestionBankService companyQuestionBankService
    ) {
        this.planRepository = planRepository;
        this.userProfileService = userProfileService;
        this.geminiPlanService = geminiPlanService;
        this.companyQuestionBankService = companyQuestionBankService;
    }

    public Map<String, Object> generatePlan(
            String userId,
            String interviewType,
            String timeframe,
            List<String> targetCompanies,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
        UserDocument user = userProfileService.getUserById(userId);
        List<String> normalizedStrengths = normalizeTopics(strengths);
        List<String> normalizedWeaknesses = normalizeTopics(weaknesses);
        List<String> normalizedNeutral = normalizeTopics(neutralTopics);

        boolean hasExplicitSelections = !normalizedStrengths.isEmpty()
                || !normalizedWeaknesses.isEmpty()
                || !normalizedNeutral.isEmpty();

        if (!hasExplicitSelections) {
            List<String> savedStrengths = new ArrayList<>();
            List<String> savedWeaknesses = new ArrayList<>();
            List<String> savedNeutral = new ArrayList<>();
            splitTopicPreferences(user.getTopicPreferences(), savedStrengths, savedWeaknesses, savedNeutral);

            if (savedStrengths.isEmpty() && user.getStrengths() != null) {
                savedStrengths.addAll(normalizeTopics(user.getStrengths()));
            }
            if (savedWeaknesses.isEmpty() && user.getWeaknesses() != null) {
                savedWeaknesses.addAll(normalizeTopics(user.getWeaknesses()));
            }
            if (savedNeutral.isEmpty() && user.getNeutralTopics() != null) {
                savedNeutral.addAll(normalizeTopics(user.getNeutralTopics()));
            }

            normalizedStrengths = savedStrengths;
            normalizedWeaknesses = savedWeaknesses;
            normalizedNeutral = savedNeutral;
        }

        Map<String, String> topicPreferenceUpdate = hasExplicitSelections
                ? combineTopicPreferences(normalizedStrengths, normalizedWeaknesses, normalizedNeutral)
                : null;

        if (targetCompanies != null || topicPreferenceUpdate != null) {
            userProfileService.updateProfile(userId, user.getFullName(), targetCompanies, topicPreferenceUpdate);
            user = userProfileService.getUserById(userId);
        }

        Set<String> strengthSet = new LinkedHashSet<>(normalizedStrengths);
        Set<String> weaknessSet = new LinkedHashSet<>(normalizedWeaknesses);
        normalizedNeutral.removeIf(topic -> strengthSet.contains(topic) || weaknessSet.contains(topic));

        GeminiPlanService.PlanData generated = geminiPlanService.generatePlan(
                userId,
                user.getFullName(),
                interviewType,
                timeframe,
                user.getTargetCompanies(),
                normalizedStrengths,
                normalizedWeaknesses,
                normalizedNeutral
        );
        applyPreferenceWeights(
                generated,
                normalizedStrengths,
                normalizedWeaknesses,
                normalizedNeutral
        );

            List<GeminiPlanService.Question> mergedQuestions = mergeWithCompanyQuestionBank(
                generated.questions,
                user.getTargetCompanies()
            );

        InterviewPlanDocument plan = planRepository.findByUserId(userId).orElseGet(InterviewPlanDocument::new);
        plan.setUserId(userId);
        plan.setInterviewType(interviewType);
        plan.setTimeframe(timeframe);
        plan.setTargetCompanies(new ArrayList<>(user.getTargetCompanies()));
        plan.setStrengths(new ArrayList<>(normalizedStrengths));
        plan.setWeaknesses(new ArrayList<>(normalizedWeaknesses));
        plan.setNeutralTopics(new ArrayList<>(normalizedNeutral));
        plan.setPhases(toPhases(generated.phases));
        plan.setSchedule(toSchedule(generated.schedule));
        Set<String> usedQuestionKeys = plan.getUsedQuestionKeys() == null
                ? new LinkedHashSet<>()
                : new LinkedHashSet<>(plan.getUsedQuestionKeys());
        plan.setQuestions(buildPhaseQuestions(
                generated.phases,
                mergedQuestions,
                usedQuestionKeys,
                questionsPerPhase(timeframe),
                normalizedStrengths,
                normalizedWeaknesses
        ));
        plan.setCompletedPhases(Set.of());
        plan.setCompletedTaskIds(Set.of());
        plan.setAnsweredQuestionIds(Set.of());
        plan.setUsedQuestionKeys(usedQuestionKeys);
        if (plan.getCreatedAt() == null) {
            plan.setCreatedAt(Instant.now());
        }
        plan.setUpdatedAt(Instant.now());

        InterviewPlanDocument saved = planRepository.save(plan);
        return toApi(saved);
    }

    public Map<String, Object> getCurrentPlan(String userId) {
        InterviewPlanDocument plan = planRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No generated plan found. Generate one first."));
        return toApi(plan);
    }

    public Map<String, Object> setPhaseCompletion(String userId, String phaseId, boolean completed) {
        InterviewPlanDocument plan = getByUserId(userId);
        ensurePlanSets(plan);
        if (completed) {
            plan.getCompletedPhases().add(phaseId);
        } else {
            plan.getCompletedPhases().remove(phaseId);
        }
        plan.setUpdatedAt(Instant.now());
        return toApi(planRepository.save(plan));
    }

    public Map<String, Object> setTaskCompletion(String userId, String taskId, boolean completed) {
        InterviewPlanDocument plan = getByUserId(userId);
        ensurePlanSets(plan);
        if (completed) {
            plan.getCompletedTaskIds().add(taskId);
        } else {
            plan.getCompletedTaskIds().remove(taskId);
        }
        plan.setUpdatedAt(Instant.now());
        return toApi(planRepository.save(plan));
    }

    public Map<String, Object> setQuestionAnswered(String userId, String questionId, boolean answered) {
        InterviewPlanDocument plan = getByUserId(userId);
        ensurePlanSets(plan);
        InterviewPlanDocument.PracticeQuestion target = null;
        for (InterviewPlanDocument.PracticeQuestion question : plan.getQuestions()) {
            if (questionId.equals(question.getId())) {
                target = question;
                break;
            }
        }

        if (answered) {
            plan.getAnsweredQuestionIds().add(questionId);
            if (target != null && target.getQuestion() != null && !target.getQuestion().isBlank()) {
                plan.getUsedQuestionKeys().add(normalizeQuestionKey(target.getQuestion()));
            }
        } else {
            plan.getAnsweredQuestionIds().remove(questionId);
        }
        plan.setUpdatedAt(Instant.now());
        return toApi(planRepository.save(plan));
    }

    private InterviewPlanDocument getByUserId(String userId) {
        return planRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No generated plan found. Generate one first."));
    }

    private List<InterviewPlanDocument.PlanPhase> toPhases(List<GeminiPlanService.Phase> phases) {
        List<InterviewPlanDocument.PlanPhase> result = new ArrayList<>();
        for (GeminiPlanService.Phase input : phases) {
            InterviewPlanDocument.PlanPhase phase = new InterviewPlanDocument.PlanPhase();
            phase.setId(input.id);
            phase.setTitle(input.title);
            phase.setDescription(input.description);
            phase.setDuration(input.duration);
            phase.setTopics(input.topics);
            result.add(phase);
        }
        return result;
    }

    private List<InterviewPlanDocument.DaySchedule> toSchedule(List<GeminiPlanService.Day> days) {
        List<InterviewPlanDocument.DaySchedule> result = new ArrayList<>();
        for (GeminiPlanService.Day dayInput : days) {
            InterviewPlanDocument.DaySchedule day = new InterviewPlanDocument.DaySchedule();
            day.setDay(dayInput.day);
            day.setDate(dayInput.date);

            List<InterviewPlanDocument.ScheduleTask> tasks = new ArrayList<>();
            for (GeminiPlanService.Task taskInput : dayInput.tasks) {
                InterviewPlanDocument.ScheduleTask task = new InterviewPlanDocument.ScheduleTask();
                task.setId(taskInput.id);
                task.setTitle(taskInput.title);
                task.setDuration(taskInput.duration);
                task.setType(taskInput.type);
                tasks.add(task);
            }
            day.setTasks(tasks);
            result.add(day);
        }
        return result;
    }

    private Map<String, Object> toApi(InterviewPlanDocument plan) {
        return Map.ofEntries(
            Map.entry("id", plan.getId()),
            Map.entry("interviewType", plan.getInterviewType()),
            Map.entry("timeframe", plan.getTimeframe()),
            Map.entry("targetCompanies", plan.getTargetCompanies()),
            Map.entry("strengths", plan.getStrengths()),
            Map.entry("weaknesses", plan.getWeaknesses()),
            Map.entry("neutralTopics", plan.getNeutralTopics()),
            Map.entry("phases", plan.getPhases()),
            Map.entry("schedule", plan.getSchedule()),
            Map.entry("questions", plan.getQuestions()),
            Map.entry("completedPhases", plan.getCompletedPhases()),
            Map.entry("completedTaskIds", plan.getCompletedTaskIds()),
            Map.entry("answeredQuestionIds", plan.getAnsweredQuestionIds()),
            Map.entry("usedQuestionKeys", plan.getUsedQuestionKeys()),
            Map.entry("updatedAt", plan.getUpdatedAt())
        );
    }

    private List<InterviewPlanDocument.PracticeQuestion> buildPhaseQuestions(
            List<GeminiPlanService.Phase> phases,
            List<GeminiPlanService.Question> mergedQuestions,
            Set<String> usedQuestionKeys,
            int perPhase,
            List<String> strengths,
            List<String> weaknesses
    ) {
        List<InterviewPlanDocument.PracticeQuestion> result = new ArrayList<>();
        Set<String> sessionSeen = new LinkedHashSet<>();
        List<GeminiPlanService.Question> sortedPool = mergedQuestions.stream()
                .sorted(Comparator.comparing((GeminiPlanService.Question q) -> q.category == null ? "" : q.category))
                .toList();

        for (GeminiPlanService.Phase phase : phases) {
            int count = 0;
            for (GeminiPlanService.Question source : rankGeneratedForPhase(sortedPool, phase, strengths, weaknesses)) {
                String text = source.question == null ? "" : source.question.trim();
                if (text.isBlank()) {
                    continue;
                }
                String key = normalizeQuestionKey(text);
                if (usedQuestionKeys.contains(key) || !sessionSeen.add(key)) {
                    continue;
                }

                InterviewPlanDocument.PracticeQuestion question = new InterviewPlanDocument.PracticeQuestion();
                question.setId(phase.id + "-q-" + (count + 1));
                question.setPhaseId(phase.id);
                question.setQuestion(text);
                question.setCategory(source.category == null || source.category.isBlank() ? "practice" : source.category);
                question.setDifficulty(normalizeDifficulty(source.difficulty));
                question.setTips(source.tips == null ? List.of() : new ArrayList<>(source.tips));
                result.add(question);
                count++;
                if (count >= perPhase) {
                    break;
                }
            }
        }

        return result;
    }

    private List<GeminiPlanService.Question> rankGeneratedForPhase(
            List<GeminiPlanService.Question> questions,
            GeminiPlanService.Phase phase,
            List<String> strengths,
            List<String> weaknesses
    ) {
        return questions.stream()
                .sorted(Comparator.comparingInt(q -> -phaseRelevanceScore(
                        phase,
                        q.question,
                        q.category,
                        q.tips,
                        strengths,
                        weaknesses
                )))
                .toList();
    }

    private int phaseRelevanceScore(
            GeminiPlanService.Phase phase,
            String questionText,
            String category,
            List<String> tips,
            List<String> strengths,
            List<String> weaknesses
    ) {
        InterviewPlanDocument.PlanPhase mapped = new InterviewPlanDocument.PlanPhase();
        mapped.setTitle(phase.title);
        mapped.setDescription(phase.description);
        mapped.setTopics(phase.topics == null ? List.of() : phase.topics);
        return phaseRelevanceScore(mapped, questionText, category, tips)
                + preferenceWeightScore(questionText, category, tips, strengths, weaknesses);
    }

    private int phaseRelevanceScore(
            InterviewPlanDocument.PlanPhase phase,
            String questionText,
            String category,
            List<String> tips
    ) {
        String combined = ((questionText == null ? "" : questionText) + " " +
                (category == null ? "" : category) + " " +
                String.join(" ", tips == null ? List.of() : tips))
                .toLowerCase(Locale.ROOT);
        int score = 0;
        for (String topic : phase.getTopics() == null ? List.<String>of() : phase.getTopics()) {
            if (topic == null || topic.isBlank()) {
                continue;
            }
            String normalizedTopic = topic.toLowerCase(Locale.ROOT);
            if (combined.contains(normalizedTopic)) {
                score += 10;
            }
            for (String token : normalizedTopic.split("[^a-z0-9]+")) {
                if (token.length() < 4) {
                    continue;
                }
                if (combined.contains(token)) {
                    score += 2;
                }
            }
        }
        if (phase.getTitle() != null && combined.contains(phase.getTitle().toLowerCase(Locale.ROOT))) {
            score += 6;
        }
        return score;
    }

    private String normalizeQuestionKey(String question) {
        return question.trim().toLowerCase(Locale.ROOT);
    }

    private int preferenceWeightScore(
            String questionText,
            String category,
            List<String> tips,
            List<String> strengths,
            List<String> weaknesses
    ) {
        String combined = ((questionText == null ? "" : questionText) + " " +
                (category == null ? "" : category) + " " +
                String.join(" ", tips == null ? List.of() : tips))
                .toLowerCase(Locale.ROOT);
        int score = 0;
        for (String weakness : weaknesses == null ? List.<String>of() : weaknesses) {
            if (weakness == null || weakness.isBlank()) {
                continue;
            }
            if (containsTopic(combined, weakness)) {
                score += 12;
            }
        }
        for (String strength : strengths == null ? List.<String>of() : strengths) {
            if (strength == null || strength.isBlank()) {
                continue;
            }
            if (containsTopic(combined, strength)) {
                score -= 8;
            }
        }
        return score;
    }

    private boolean containsTopic(String combinedLower, String topic) {
        String normalizedTopic = topic.toLowerCase(Locale.ROOT);
        if (combinedLower.contains(normalizedTopic)) {
            return true;
        }
        for (String token : normalizedTopic.split("[^a-z0-9]+")) {
            if (token.length() >= 4 && combinedLower.contains(token)) {
                return true;
            }
        }
        return false;
    }

    private void applyPreferenceWeights(
            GeminiPlanService.PlanData generated,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
        if (generated == null) {
            return;
        }

        List<String> weaknessPool = (weaknesses == null || weaknesses.isEmpty())
                ? List.of()
                : weaknesses;
        List<String> neutralPool = (neutralTopics == null || neutralTopics.isEmpty())
                ? List.of()
                : neutralTopics;
        List<String> strengthPool = (strengths == null || strengths.isEmpty())
                ? List.of()
                : strengths;

        if (!weaknessPool.isEmpty()) {
            for (int i = 0; i < generated.phases.size(); i++) {
                GeminiPlanService.Phase phase = generated.phases.get(i);
                List<String> topics = phase.topics == null ? new ArrayList<>() : new ArrayList<>(phase.topics);
                String weaknessTopic = weaknessPool.get(i % weaknessPool.size());
                if (!topics.contains(weaknessTopic)) {
                    topics.add(0, weaknessTopic);
                }
                if (!neutralPool.isEmpty()) {
                    String neutralTopic = neutralPool.get(i % neutralPool.size());
                    if (!topics.contains(neutralTopic)) {
                        topics.add(neutralTopic);
                    }
                }
                phase.topics = topics;
            }
        }

        List<GeminiPlanService.Task> weightedTasks = new ArrayList<>();
        for (GeminiPlanService.Day day : generated.schedule) {
            if (day.tasks != null) {
                weightedTasks.addAll(day.tasks.stream()
                        .filter(task -> "study".equalsIgnoreCase(task.type) || "practice".equalsIgnoreCase(task.type))
                        .toList());
            }
        }
        int weaknessTarget = (int) Math.ceil(weightedTasks.size() * 0.7);
        int weaknessAssigned = 0;
        int neutralAssigned = 0;
        for (GeminiPlanService.Task task : weightedTasks) {
            if (!weaknessPool.isEmpty() && weaknessAssigned < weaknessTarget) {
                String topic = weaknessPool.get(weaknessAssigned % weaknessPool.size());
                task.title = enforceTaskFocus(task.title, topic);
                weaknessAssigned++;
            } else if (!neutralPool.isEmpty()) {
                String topic = neutralPool.get(neutralAssigned % neutralPool.size());
                task.title = enforceTaskFocus(task.title, topic);
                neutralAssigned++;
            }
        }

        if (!strengthPool.isEmpty()) {
            int allowedStrengthQuestions = Math.max(1, generated.questions.size() / 10);
            int currentStrength = 0;
            for (GeminiPlanService.Question question : generated.questions) {
                String combined = ((question.question == null ? "" : question.question) + " " +
                        String.join(" ", question.tips == null ? List.of() : question.tips))
                        .toLowerCase(Locale.ROOT);
                boolean matchesStrength = false;
                for (String strength : strengthPool) {
                    if (containsTopic(combined, strength)) {
                        matchesStrength = true;
                        break;
                    }
                }
                if (!matchesStrength) {
                    continue;
                }
                currentStrength++;
                if (currentStrength > allowedStrengthQuestions && !weaknessPool.isEmpty()) {
                    String replacement = weaknessPool.get((currentStrength - allowedStrengthQuestions - 1) % weaknessPool.size());
                    question.question = enforceQuestionFocus(question.question, replacement);
                }
            }
        }
    }

    private String enforceTaskFocus(String title, String topic) {
        String safeTitle = title == null ? "Focused practice" : title;
        if (topic == null || topic.isBlank()) {
            return safeTitle;
        }
        if (safeTitle.toLowerCase(Locale.ROOT).contains(topic.toLowerCase(Locale.ROOT))) {
            return safeTitle;
        }
        return safeTitle + " - Focus: " + topic;
    }

    private String enforceQuestionFocus(String question, String topic) {
        String safeQuestion = question == null ? "Practice question" : question;
        if (topic == null || topic.isBlank()) {
            return safeQuestion;
        }
        if (safeQuestion.toLowerCase(Locale.ROOT).contains(topic.toLowerCase(Locale.ROOT))) {
            return safeQuestion;
        }
        return safeQuestion + " (" + topic + " focus)";
    }

    private void ensurePlanSets(InterviewPlanDocument plan) {
        if (plan.getCompletedPhases() == null) {
            plan.setCompletedPhases(new LinkedHashSet<>());
        }
        if (plan.getCompletedTaskIds() == null) {
            plan.setCompletedTaskIds(new LinkedHashSet<>());
        }
        if (plan.getAnsweredQuestionIds() == null) {
            plan.setAnsweredQuestionIds(new LinkedHashSet<>());
        }
        if (plan.getUsedQuestionKeys() == null) {
            plan.setUsedQuestionKeys(new LinkedHashSet<>());
        }
    }

    private List<String> normalizeTopics(List<String> topics) {
        if (topics == null) {
            return new ArrayList<>();
        }

        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String topic : topics) {
            if (topic != null && !topic.isBlank()) {
                unique.add(topic.trim());
            }
        }
        return new ArrayList<>(unique);
    }

    private void splitTopicPreferences(
            Map<String, String> topicPreferences,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
        if (topicPreferences == null || topicPreferences.isEmpty()) {
            return;
        }

        for (Map.Entry<String, String> entry : topicPreferences.entrySet()) {
            String topic = entry.getKey();
            String status = entry.getValue();
            if (topic == null || topic.isBlank() || status == null || status.isBlank()) {
                continue;
            }

            switch (status.trim().toLowerCase()) {
                case "strength" -> strengths.add(topic.trim());
                case "weakness" -> weaknesses.add(topic.trim());
                case "neutral" -> neutralTopics.add(topic.trim());
                default -> {
                }
            }
        }
    }

    private Map<String, String> combineTopicPreferences(
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
        Map<String, String> result = new HashMap<>();
        for (String topic : strengths) {
            result.put(topic, "strength");
        }
        for (String topic : weaknesses) {
            result.put(topic, "weakness");
        }
        for (String topic : neutralTopics) {
            result.put(topic, "neutral");
        }
        return result;
    }

    private List<GeminiPlanService.Question> mergeWithCompanyQuestionBank(
            List<GeminiPlanService.Question> generatedQuestions,
            List<String> targetCompanies
    ) {
        List<GeminiPlanService.Question> result = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        List<CompanyQuestionDocument> companyQuestions = companyQuestionBankService.getQuestionsForCompanies(targetCompanies);
        int index = 1;
        for (CompanyQuestionDocument doc : companyQuestions) {
            String questionText = doc.getQuestion() == null ? "" : doc.getQuestion().trim();
            if (questionText.isBlank()) {
                continue;
            }

            String key = questionText.toLowerCase(Locale.ROOT);
            if (!seen.add(key)) {
                continue;
            }

            GeminiPlanService.Question question = new GeminiPlanService.Question();
            question.id = "bank-q-" + index++;
            question.question = questionText;
            question.category = doc.getCategory() == null || doc.getCategory().isBlank() ? "company" : doc.getCategory();
            question.difficulty = normalizeDifficulty(doc.getDifficulty());
            question.tips = doc.getTips() == null ? List.of() : new ArrayList<>(doc.getTips());
            result.add(question);
        }

        for (GeminiPlanService.Question generated : generatedQuestions) {
            String questionText = generated.question == null ? "" : generated.question.trim();
            if (questionText.isBlank()) {
                continue;
            }

            String key = questionText.toLowerCase(Locale.ROOT);
            if (!seen.add(key)) {
                continue;
            }
            result.add(generated);
        }

        return result;
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null) {
            return "medium";
        }

        String normalized = difficulty.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "easy", "medium", "hard" -> normalized;
            default -> "medium";
        };
    }

    private int questionsPerPhase(String timeframe) {
        if (timeframe == null) {
            return 10;
        }
        return switch (timeframe) {
            case "1week" -> 8;
            case "2weeks" -> 12;
            case "1month" -> 16;
            case "2months" -> 20;
            default -> 10;
        };
    }
}
