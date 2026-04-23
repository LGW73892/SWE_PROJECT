package com.silicondefense.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Document("interview_plans")
public class InterviewPlanDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String interviewType;
    private String timeframe;
    private List<String> targetCompanies = new ArrayList<>();
    private List<String> strengths = new ArrayList<>();
    private List<String> weaknesses = new ArrayList<>();
    private List<String> neutralTopics = new ArrayList<>();

    private List<PlanPhase> phases = new ArrayList<>();
    private List<DaySchedule> schedule = new ArrayList<>();
    private List<PracticeQuestion> questions = new ArrayList<>();

    private Set<String> completedPhases = new HashSet<>();
    private Set<String> completedTaskIds = new HashSet<>();
    private Set<String> answeredQuestionIds = new HashSet<>();
    private Set<String> usedQuestionKeys = new HashSet<>();

    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getInterviewType() {
        return interviewType;
    }

    public void setInterviewType(String interviewType) {
        this.interviewType = interviewType;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public void setTimeframe(String timeframe) {
        this.timeframe = timeframe;
    }

    public List<String> getTargetCompanies() {
        return targetCompanies;
    }

    public void setTargetCompanies(List<String> targetCompanies) {
        this.targetCompanies = targetCompanies;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses;
    }

    public List<String> getNeutralTopics() {
        return neutralTopics;
    }

    public void setNeutralTopics(List<String> neutralTopics) {
        this.neutralTopics = neutralTopics;
    }

    public List<PlanPhase> getPhases() {
        return phases;
    }

    public void setPhases(List<PlanPhase> phases) {
        this.phases = phases;
    }

    public List<DaySchedule> getSchedule() {
        return schedule;
    }

    public void setSchedule(List<DaySchedule> schedule) {
        this.schedule = schedule;
    }

    public List<PracticeQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<PracticeQuestion> questions) {
        this.questions = questions;
    }

    public Set<String> getCompletedPhases() {
        return completedPhases;
    }

    public void setCompletedPhases(Set<String> completedPhases) {
        this.completedPhases = completedPhases;
    }

    public Set<String> getCompletedTaskIds() {
        return completedTaskIds;
    }

    public void setCompletedTaskIds(Set<String> completedTaskIds) {
        this.completedTaskIds = completedTaskIds;
    }

    public Set<String> getAnsweredQuestionIds() {
        return answeredQuestionIds;
    }

    public void setAnsweredQuestionIds(Set<String> answeredQuestionIds) {
        this.answeredQuestionIds = answeredQuestionIds;
    }

    public Set<String> getUsedQuestionKeys() {
        return usedQuestionKeys;
    }

    public void setUsedQuestionKeys(Set<String> usedQuestionKeys) {
        this.usedQuestionKeys = usedQuestionKeys;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class PlanPhase {
        private String id;
        private String title;
        private String description;
        private String duration;
        private List<String> topics = new ArrayList<>();

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getDuration() {
            return duration;
        }

        public void setDuration(String duration) {
            this.duration = duration;
        }

        public List<String> getTopics() {
            return topics;
        }

        public void setTopics(List<String> topics) {
            this.topics = topics;
        }
    }

    public static class DaySchedule {
        private int day;
        private String date;
        private List<ScheduleTask> tasks = new ArrayList<>();

        public int getDay() {
            return day;
        }

        public void setDay(int day) {
            this.day = day;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public List<ScheduleTask> getTasks() {
            return tasks;
        }

        public void setTasks(List<ScheduleTask> tasks) {
            this.tasks = tasks;
        }
    }

    public static class ScheduleTask {
        private String id;
        private String title;
        private String duration;
        private String type;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDuration() {
            return duration;
        }

        public void setDuration(String duration) {
            this.duration = duration;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }

    public static class PracticeQuestion {
        private String id;
        private String question;
        private String phaseId;
        private String category;
        private String difficulty;
        private List<String> tips = new ArrayList<>();

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question;
        }

        public String getPhaseId() {
            return phaseId;
        }

        public void setPhaseId(String phaseId) {
            this.phaseId = phaseId;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public List<String> getTips() {
            return tips;
        }

        public void setTips(List<String> tips) {
            this.tips = tips;
        }
    }
}
