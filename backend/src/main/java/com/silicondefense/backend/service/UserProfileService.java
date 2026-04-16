package com.silicondefense.backend.service;

import com.silicondefense.backend.model.UserDocument;
import com.silicondefense.backend.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    public Map<String, Object> updateProfile(String userId, String fullName, List<String> targetCompanies) {
        UserDocument user = getUserById(userId);
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        if (targetCompanies != null) {
            user.setTargetCompanies(normalizeCompanies(targetCompanies));
        }
        user.setUpdatedAt(Instant.now());
        UserDocument saved = userRepository.save(user);
        return toPublicUser(saved);
    }

    public UserDocument getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
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

    public static Map<String, Object> toPublicUser(UserDocument user) {
        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "targetCompanies", user.getTargetCompanies() == null ? List.of() : user.getTargetCompanies(),
                "createdAt", user.getCreatedAt(),
                "updatedAt", user.getUpdatedAt()
        );
    }
}
