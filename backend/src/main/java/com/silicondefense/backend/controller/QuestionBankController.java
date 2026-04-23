package com.silicondefense.backend.controller;

import com.silicondefense.backend.service.CompanyQuestionBankService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/question-bank")
public class QuestionBankController {

    private final CompanyQuestionBankService companyQuestionBankService;

    public QuestionBankController(CompanyQuestionBankService companyQuestionBankService) {
        this.companyQuestionBankService = companyQuestionBankService;
    }

    @GetMapping("/companies")
    public Map<String, Object> companies(@RequestParam(defaultValue = "") String query) {
        List<String> companies = companyQuestionBankService.searchCompanies(query);
        return Map.of(
                "companies", companies,
                "count", companies.size()
        );
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String company) {
        Map<String, List<Map<String, Object>>> grouped = companyQuestionBankService.getGroupedQuestions(company);
        int total = grouped.values().stream().mapToInt(List::size).sum();

        return Map.of(
                "company", company,
                "total", total,
                "categories", grouped
        );
    }
}
