package com.silicondefense.backend.service;

import com.silicondefense.backend.model.UserDocument;
import com.silicondefense.backend.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;

@Service
public class UserProfileService {

    private final UserRepository userRepository;

    public UserProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Map<String, Object> getProfile(String userId) {
        UserDocument user = getUserById(userId);
        return toPublicUser(user);
    }

    public Map<String, Object> updateProfile(
            String userId,
            String fullName,
            List<String> targetCompanies,
            Map<String, String> topicPreferences
    ) {
        return updateProfile(userId, fullName, targetCompanies, topicPreferences, null, null, null);
    }

    public Map<String, Object> updateProfile(
            String userId,
            String fullName,
            List<String> targetCompanies,
            Map<String, String> topicPreferences,
            List<UserDocument.JobApplication> applications,
            List<UserDocument.LeetCodeEntry> leetCodeEntries,
            String profileNotes
    ) {
        UserDocument user = getUserById(userId);
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        if (targetCompanies != null) {
            user.setTargetCompanies(normalizeCompanies(targetCompanies));
        }
        if (topicPreferences != null) {
            Map<String, String> normalized = normalizeTopicPreferences(topicPreferences);
            user.setTopicPreferences(normalized);

            List<String> strengths = new ArrayList<>();
            List<String> weaknesses = new ArrayList<>();
            List<String> neutralTopics = new ArrayList<>();
            splitTopicPreferences(normalized, strengths, weaknesses, neutralTopics);
            user.setStrengths(strengths);
            user.setWeaknesses(weaknesses);
            user.setNeutralTopics(neutralTopics);
        }
        if (applications != null) {
            user.setApplications(normalizeApplications(applications));
        }
        if (leetCodeEntries != null) {
            user.setLeetCodeEntries(normalizeLeetCodeEntries(leetCodeEntries));
        }
        if (profileNotes != null) {
            user.setProfileNotes(profileNotes.isBlank() ? "" : profileNotes.trim());
        }
        user.setUpdatedAt(Instant.now());
        UserDocument saved = userRepository.save(user);
        return toPublicUser(saved);
    }

    public UserDocument getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public Map<String, Object> updateApplications(
            String userId,
            List<UserDocument.JobApplication> applications
    ) {
        UserDocument user = getUserById(userId);
        user.setApplications(normalizeApplications(applications == null ? List.of() : applications));
        user.setUpdatedAt(Instant.now());
        UserDocument saved = userRepository.save(user);
        return toPublicUser(saved);
    }

    public Map<String, Object> updateLeetCodeEntries(
            String userId,
            List<UserDocument.LeetCodeEntry> leetCodeEntries
    ) {
        UserDocument user = getUserById(userId);
        user.setLeetCodeEntries(normalizeLeetCodeEntries(leetCodeEntries == null ? List.of() : leetCodeEntries));
        user.setUpdatedAt(Instant.now());
        UserDocument saved = userRepository.save(user);
        return toPublicUser(saved);
    }

    private List<String> normalizeCompanies(List<String> targetCompanies) {
        List<String> result = new ArrayList<>();
        for (String company : targetCompanies) {
            if (company != null && !company.isBlank()) {
                result.add(company.trim());
            }
        }
        return result;
    }

    private Map<String, String> normalizeTopicPreferences(Map<String, String> topicPreferences) {
        Map<String, String> result = new HashMap<>();
        for (Map.Entry<String, String> entry : topicPreferences.entrySet()) {
            String topic = entry.getKey();
            String status = entry.getValue();
            if (topic == null || topic.isBlank() || status == null || status.isBlank()) {
                continue;
            }

            String normalizedStatus = status.trim().toLowerCase();
            if (!normalizedStatus.equals("strength") && !normalizedStatus.equals("weakness") && !normalizedStatus.equals("neutral")) {
                continue;
            }

            result.put(topic.trim(), normalizedStatus);
        }
        return result;
    }

    private void splitTopicPreferences(
            Map<String, String> topicPreferences,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
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

    private List<UserDocument.JobApplication> normalizeApplications(List<UserDocument.JobApplication> applications) {
        List<UserDocument.JobApplication> result = new ArrayList<>();
        for (UserDocument.JobApplication input : applications) {
            if (input == null) {
                continue;
            }

            String company = input.getCompany() == null ? "" : input.getCompany().trim();
            String role = input.getRole() == null ? "" : input.getRole().trim();
            String status = input.getStatus() == null ? "" : input.getStatus().trim();
            String notes = input.getNotes() == null ? "" : input.getNotes().trim();

            if (company.isBlank() && role.isBlank() && status.isBlank() && notes.isBlank()) {
                continue;
            }

            UserDocument.JobApplication normalized = new UserDocument.JobApplication();
            normalized.setCompany(company);
            normalized.setRole(role);
            normalized.setStatus(status);
            normalized.setNotes(notes);
            result.add(normalized);
        }
        return result;
    }

    private List<UserDocument.LeetCodeEntry> normalizeLeetCodeEntries(List<UserDocument.LeetCodeEntry> entries) {
        List<UserDocument.LeetCodeEntry> result = new ArrayList<>();
        for (UserDocument.LeetCodeEntry input : entries) {
            if (input == null) {
                continue;
            }

            String title = input.getTitle() == null ? "" : input.getTitle().trim();
            String difficulty = input.getDifficulty() == null ? "" : input.getDifficulty().trim();
            String status = input.getStatus() == null ? "" : input.getStatus().trim();
            String notes = input.getNotes() == null ? "" : input.getNotes().trim();

            if (title.isBlank() && difficulty.isBlank() && status.isBlank() && notes.isBlank()) {
                continue;
            }

            UserDocument.LeetCodeEntry normalized = new UserDocument.LeetCodeEntry();
            normalized.setTitle(title);
            normalized.setDifficulty(difficulty);
            normalized.setStatus(status);
            normalized.setNotes(notes);
            result.add(normalized);
        }
        return result;
    }

    public static Map<String, Object> toPublicUser(UserDocument user) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", user.getId());
        payload.put("email", user.getEmail() == null ? "" : user.getEmail());
        payload.put("fullName", user.getFullName() == null ? "" : user.getFullName());
        payload.put("targetCompanies", user.getTargetCompanies() == null ? List.of() : user.getTargetCompanies());
        payload.put("topicPreferences", user.getTopicPreferences() == null ? Map.of() : user.getTopicPreferences());
        payload.put("strengths", user.getStrengths() == null ? List.of() : user.getStrengths());
        payload.put("weaknesses", user.getWeaknesses() == null ? List.of() : user.getWeaknesses());
        payload.put("neutralTopics", user.getNeutralTopics() == null ? List.of() : user.getNeutralTopics());
        payload.put("applications", user.getApplications() == null ? List.of() : user.getApplications());
        payload.put("leetCodeEntries", user.getLeetCodeEntries() == null ? List.of() : user.getLeetCodeEntries());
        payload.put("profileNotes", user.getProfileNotes() == null ? "" : user.getProfileNotes());
        payload.put("createdAt", user.getCreatedAt());
        payload.put("updatedAt", user.getUpdatedAt());
        return payload;
    }
}
