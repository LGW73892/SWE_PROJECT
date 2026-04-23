package com.silicondefense.backend.controller;

import com.silicondefense.backend.auth.AuthContext;
import com.silicondefense.backend.service.PlanService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping("/generate")
    public Map<String, Object> generate(@RequestBody GeneratePlanRequest request) {
        return planService.generatePlan(
                AuthContext.currentUser().getUserId(),
                request.interviewType(),
                request.timeframe(),
                request.targetCompanies() == null ? List.of() : request.targetCompanies(),
                request.strengths() == null ? List.of() : request.strengths(),
                request.weaknesses() == null ? List.of() : request.weaknesses(),
                request.neutralTopics() == null ? List.of() : request.neutralTopics()
        );
    }

    @GetMapping("/current")
    public Map<String, Object> current() {
        return planService.getCurrentPlan(AuthContext.currentUser().getUserId());
    }

    @PatchMapping("/phases/{phaseId}")
    public Map<String, Object> phase(
            @PathVariable String phaseId,
            @RequestBody CompletionRequest request
    ) {
        return planService.setPhaseCompletion(AuthContext.currentUser().getUserId(), phaseId, request.completed());
    }

    @PatchMapping("/tasks/{taskId}")
    public Map<String, Object> task(
            @PathVariable String taskId,
            @RequestBody CompletionRequest request
    ) {
        return planService.setTaskCompletion(AuthContext.currentUser().getUserId(), taskId, request.completed());
    }

    @PatchMapping("/questions/{questionId}")
    public Map<String, Object> question(
            @PathVariable String questionId,
            @RequestBody CompletionRequest request
    ) {
        return planService.setQuestionAnswered(AuthContext.currentUser().getUserId(), questionId, request.completed());
    }

    public record GeneratePlanRequest(
            @NotBlank String interviewType,
            @NotBlank String timeframe,
            List<String> targetCompanies,
            List<String> strengths,
            List<String> weaknesses,
            List<String> neutralTopics
    ) {
    }

    public record CompletionRequest(boolean completed) {
    }
}
