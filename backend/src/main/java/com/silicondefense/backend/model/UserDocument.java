package com.silicondefense.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document("users")
public class UserDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;
    private String fullName;
    private List<String> targetCompanies = new ArrayList<>();
    private Map<String, String> topicPreferences = new HashMap<>();
    private List<String> strengths = new ArrayList<>();
    private List<String> weaknesses = new ArrayList<>();
    private List<String> neutralTopics = new ArrayList<>();
    private List<JobApplication> applications = new ArrayList<>();
    private List<LeetCodeEntry> leetCodeEntries = new ArrayList<>();
    private String profileNotes;
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<String> getTargetCompanies() {
        return targetCompanies;
    }

    public void setTargetCompanies(List<String> targetCompanies) {
        this.targetCompanies = targetCompanies;
    }

    public Map<String, String> getTopicPreferences() {
        return topicPreferences;
    }

    public void setTopicPreferences(Map<String, String> topicPreferences) {
        this.topicPreferences = topicPreferences;
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

    public List<JobApplication> getApplications() {
        return applications;
    }

    public void setApplications(List<JobApplication> applications) {
        this.applications = applications;
    }

    public List<LeetCodeEntry> getLeetCodeEntries() {
        return leetCodeEntries;
    }

    public void setLeetCodeEntries(List<LeetCodeEntry> leetCodeEntries) {
        this.leetCodeEntries = leetCodeEntries;
    }

    public String getProfileNotes() {
        return profileNotes;
    }

    public void setProfileNotes(String profileNotes) {
        this.profileNotes = profileNotes;
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

    public static class JobApplication {
        private String company;
        private String role;
        private String status;
        private String notes;

        public String getCompany() {
            return company;
        }

        public void setCompany(String company) {
            this.company = company;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class LeetCodeEntry {
        private String title;
        private String difficulty;
        private String status;
        private String notes;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }
}
