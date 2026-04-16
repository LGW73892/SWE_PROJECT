package com.silicondefense.backend.service;

import com.silicondefense.backend.auth.JwtService;
import com.silicondefense.backend.model.UserDocument;
import com.silicondefense.backend.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public Map<String, Object> signup(String email, String password, String fullName) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email is already in use");
        }

        UserDocument user = new UserDocument();
        user.setEmail(email.trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName.trim());
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        UserDocument saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getId(), saved.getEmail());
        return Map.of(
                "token", token,
                "user", UserProfileService.toPublicUser(saved)
        );
    }

    public Map<String, Object> login(String email, String password) {
        UserDocument user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return Map.of(
                "token", token,
                "user", UserProfileService.toPublicUser(user)
        );
    }
}
