package com.silicondefense.backend.controller;

import com.silicondefense.backend.auth.AuthContext;
import com.silicondefense.backend.model.UserDocument;
import com.silicondefense.backend.service.UserProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileService userProfileService;

    public ProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return userProfileService.getProfile(AuthContext.currentUser().getUserId());
    }

    @PutMapping("/me")
    public Map<String, Object> update(@RequestBody UpdateProfileRequest request) {
        return userProfileService.updateProfile(
                AuthContext.currentUser().getUserId(),
                request.fullName(),
                request.targetCompanies(),
            request.topicPreferences(),
            request.applications(),
            request.leetCodeEntries(),
            request.profileNotes()
        );
    }

    @PatchMapping("/me/applications")
    public Map<String, Object> updateApplications(@RequestBody ApplicationsRequest request) {
        return userProfileService.updateApplications(
                AuthContext.currentUser().getUserId(),
                request.applications()
        );
    }

    @PatchMapping("/me/leetcode")
    public Map<String, Object> updateLeetCode(@RequestBody LeetCodeRequest request) {
        return userProfileService.updateLeetCodeEntries(
                AuthContext.currentUser().getUserId(),
                request.leetCodeEntries()
        );
    }

        public record UpdateProfileRequest(
            String fullName,
            List<String> targetCompanies,
            Map<String, String> topicPreferences,
            List<UserDocument.JobApplication> applications,
            List<UserDocument.LeetCodeEntry> leetCodeEntries,
            String profileNotes
        ) {
    }

    public record ApplicationsRequest(List<UserDocument.JobApplication> applications) {
    }

    public record LeetCodeRequest(List<UserDocument.LeetCodeEntry> leetCodeEntries) {
    }
}
