package com.silicondefense.backend.controller;

import com.silicondefense.backend.service.AuthService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody SignupRequest request) {
        return authService.signup(request.email(), request.password(), request.fullName());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }

    public record SignupRequest(
            @Email String email,
            @Size(min = 8, max = 128) String password,
            @NotBlank String fullName
    ) {
    }

    public record LoginRequest(
            @Email String email,
            @NotBlank String password
    ) {
    }
}
