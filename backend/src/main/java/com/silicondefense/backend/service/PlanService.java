package com.silicondefense.backend.service;

import com.silicondefense.backend.model.InterviewPlanDocument;
import com.silicondefense.backend.model.UserDocument;
import com.silicondefense.backend.repo.InterviewPlanRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PlanService {

    private final InterviewPlanRepository planRepository;
    private final UserProfileService userProfileService;
    private final GeminiPlanService geminiPlanService;

    public PlanService(
            InterviewPlanRepository planRepository,
            UserProfileService userProfileService,
            GeminiPlanService geminiPlanService
    ) {
        this.planRepository = planRepository;
        this.userProfileService = userProfileService;
        this.geminiPlanService = geminiPlanService;
    }

    public Map<String, Object> generatePlan(String userId, String interviewType, String timeframe, List<String> targetCompanies) {
        UserDocument user = userProfileService.getUserById(userId);
        if (targetCompanies != null) {
            userProfileService.updateProfile(userId, user.getFullName(), targetCompanies);
            user = userProfileService.getUserById(userId);
        }

        GeminiPlanService.PlanData generated = geminiPlanService.generatePlan(
                userId,
                user.getFullName(),
                interviewType,
                timeframe,
                user.getTargetCompanies()
        );

        InterviewPlanDocument plan = planRepository.findByUserId(userId).orElseGet(InterviewPlanDocument::new);
        plan.setUserId(userId);
        plan.setInterviewType(interviewType);
        plan.setTimeframe(timeframe);
        plan.setTargetCompanies(new ArrayList<>(user.getTargetCompanies()));
        plan.setPhases(toPhases(generated.phases));
        plan.setSchedule(toSchedule(generated.schedule));
        plan.setQuestions(toQuestions(generated.questions));
        plan.setCompletedPhases(Set.of());
        plan.setCompletedTaskIds(Set.of());
        plan.setAnsweredQuestionIds(Set.of());
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
        if (answered) {
            plan.getAnsweredQuestionIds().add(questionId);
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

    private List<InterviewPlanDocument.PracticeQuestion> toQuestions(List<GeminiPlanService.Question> input) {
        List<InterviewPlanDocument.PracticeQuestion> result = new ArrayList<>();
        for (GeminiPlanService.Question item : input) {
            InterviewPlanDocument.PracticeQuestion question = new InterviewPlanDocument.PracticeQuestion();
            question.setId(item.id);
            question.setQuestion(item.question);
            question.setCategory(item.category);
            question.setDifficulty(item.difficulty);
            question.setTips(item.tips);
            result.add(question);
        }
        return result;
    }

    private Map<String, Object> toApi(InterviewPlanDocument plan) {
        return Map.ofEntries(
            Map.entry("id", plan.getId()),
            Map.entry("interviewType", plan.getInterviewType()),
            Map.entry("timeframe", plan.getTimeframe()),
            Map.entry("targetCompanies", plan.getTargetCompanies()),
            Map.entry("phases", plan.getPhases()),
            Map.entry("schedule", plan.getSchedule()),
            Map.entry("questions", plan.getQuestions()),
            Map.entry("completedPhases", plan.getCompletedPhases()),
            Map.entry("completedTaskIds", plan.getCompletedTaskIds()),
            Map.entry("answeredQuestionIds", plan.getAnsweredQuestionIds()),
            Map.entry("updatedAt", plan.getUpdatedAt())
        );
    }
}
