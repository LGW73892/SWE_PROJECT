package com.silicondefense.backend.controller;

import com.silicondefense.backend.auth.AuthContext;
import com.silicondefense.backend.service.UserProfileService;
import org.springframework.web.bind.annotation.GetMapping;
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
                request.targetCompanies()
        );
    }

    public record UpdateProfileRequest(String fullName, List<String> targetCompanies) {
    }
}
