package com.silicondefense.backend.auth;

import org.springframework.security.authentication.AbstractAuthenticationToken;

import java.util.Collections;

public class AuthenticatedUser extends AbstractAuthenticationToken {
    private final String userId;
    private final String email;

    public AuthenticatedUser(String userId, String email) {
        super(Collections.emptyList());
        this.userId = userId;
        this.email = email;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public Object getPrincipal() {
        return userId;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }
}
