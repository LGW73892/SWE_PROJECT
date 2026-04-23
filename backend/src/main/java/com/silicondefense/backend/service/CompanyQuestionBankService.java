package com.silicondefense.backend.service;

import com.silicondefense.backend.model.CompanyQuestionDocument;
import com.silicondefense.backend.repo.CompanyQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CompanyQuestionBankService {

    private final CompanyQuestionRepository companyQuestionRepository;

    public CompanyQuestionBankService(CompanyQuestionRepository companyQuestionRepository) {
        this.companyQuestionRepository = companyQuestionRepository;
    }

    public List<String> searchCompanies(String query) {
        String normalized = normalizeCompany(query);
        List<CompanyQuestionDocument> docs;
        if (normalized.isBlank()) {
            docs = companyQuestionRepository.findAll();
        } else {
            docs = companyQuestionRepository.findByCompanyNormalizedContaining(normalized);
        }

        Set<String> companies = new LinkedHashSet<>();
        for (CompanyQuestionDocument doc : docs) {
            if (doc.getCompany() != null && !doc.getCompany().isBlank()) {
                companies.add(doc.getCompany().trim());
            }
        }

        return companies.stream().sorted(String::compareToIgnoreCase).toList();
    }

    public List<CompanyQuestionDocument> getQuestionsForCompany(String company) {
        String normalized = normalizeCompany(company);
        if (normalized.isBlank()) {
            return List.of();
        }

        Comparator<CompanyQuestionDocument> byImportance = Comparator
                .comparingDouble(this::importanceScore)
                .reversed();

        List<CompanyQuestionDocument> companySpecific = companyQuestionRepository.findByCompanyNormalized(normalized);
        List<CompanyQuestionDocument> general = companyQuestionRepository.findByCompanyNormalized("general");

        Set<String> seen = new LinkedHashSet<>();
        List<CompanyQuestionDocument> merged = new ArrayList<>();
        for (CompanyQuestionDocument doc : companySpecific) {
            if (!isSupportedCategory(doc.getCategory())) {
                continue;
            }
            String key = ((doc.getCategory() == null ? "" : doc.getCategory()) + "|" +
                    (doc.getQuestion() == null ? "" : doc.getQuestion())).toLowerCase(Locale.ROOT);
            if (seen.add(key)) {
                merged.add(doc);
            }
        }
        for (CompanyQuestionDocument doc : general) {
            if (!isSupportedCategory(doc.getCategory())) {
                continue;
            }
            String key = ((doc.getCategory() == null ? "" : doc.getCategory()) + "|" +
                    (doc.getQuestion() == null ? "" : doc.getQuestion())).toLowerCase(Locale.ROOT);
            if (seen.add(key)) {
                merged.add(doc);
            }
        }

        return merged.stream()
                .sorted(
                        Comparator
                                .comparing(CompanyQuestionDocument::getCategory, Comparator.nullsLast(String::compareToIgnoreCase))
                                .thenComparing(byImportance)
                                .thenComparing(CompanyQuestionDocument::getQuestion, Comparator.nullsLast(String::compareToIgnoreCase))
                )
                .toList();
    }

    public List<CompanyQuestionDocument> getQuestionsForCompanies(List<String> companies) {
        if (companies == null || companies.isEmpty()) {
            return List.of();
        }

        List<CompanyQuestionDocument> all = new ArrayList<>();
        Set<String> dedupe = new LinkedHashSet<>();

        for (String company : companies) {
            for (CompanyQuestionDocument doc : getQuestionsForCompany(company)) {
                String key = (doc.getCompany() + "|" + doc.getQuestion()).toLowerCase(Locale.ROOT);
                if (dedupe.add(key)) {
                    all.add(doc);
                }
            }
        }

        return all;
    }

    public Map<String, List<Map<String, Object>>> getGroupedQuestions(String company) {
        List<CompanyQuestionDocument> docs = getQuestionsForCompany(company);

        return docs.stream()
                .collect(Collectors.groupingBy(
                        doc -> doc.getCategory() == null || doc.getCategory().isBlank() ? "other" : doc.getCategory(),
                        LinkedHashMap::new,
                        Collectors.mapping(doc -> Map.of(
                                "question", doc.getQuestion() == null ? "" : doc.getQuestion(),
                                "difficulty", doc.getDifficulty() == null ? "" : doc.getDifficulty(),
                                "tips", doc.getTips() == null ? List.of() : doc.getTips()
                        ), Collectors.toList())
                ));
    }

    private double importanceScore(CompanyQuestionDocument doc) {
        if (doc.getImportanceScore() != null) {
            return doc.getImportanceScore();
        }

        double score = 0;

        Double frequency = extractFrequencyScore(doc.getTips());
        if (frequency != null) {
            score += frequency * 10;
        }

        String difficulty = doc.getDifficulty() == null ? "" : doc.getDifficulty().toLowerCase(Locale.ROOT);
        switch (difficulty) {
            case "medium" -> score += 30;
            case "easy" -> score += 20;
            case "hard" -> score += 10;
            default -> score += 15;
        }

        String combinedText = ((doc.getQuestion() == null ? "" : doc.getQuestion()) + " " +
                String.join(" ", doc.getTips() == null ? List.of() : doc.getTips()))
                .toLowerCase(Locale.ROOT);

        if (combinedText.contains("most common") || combinedText.contains("frequently")) {
            score += 25;
        } else if (combinedText.contains("common") || combinedText.contains("frequency")) {
            score += 12;
        }
        if (combinedText.contains("top interview")) {
            score += 8;
        }

        return score;
    }

    private Double extractFrequencyScore(List<String> tips) {
        if (tips == null || tips.isEmpty()) {
            return null;
        }

        for (String tip : tips) {
            if (tip == null) {
                continue;
            }
            String lower = tip.toLowerCase(Locale.ROOT);
            if (!lower.contains("frequency")) {
                continue;
            }

            StringBuilder numeric = new StringBuilder();
            for (char ch : tip.toCharArray()) {
                if (Character.isDigit(ch) || ch == '.') {
                    numeric.append(ch);
                } else if (numeric.length() > 0) {
                    break;
                }
            }

            if (numeric.length() == 0) {
                continue;
            }

            try {
                return Double.parseDouble(numeric.toString());
            } catch (NumberFormatException ignored) {
                // Continue trying other tips.
            }
        }

        return null;
    }

    public String normalizeCompany(String company) {
        if (company == null) {
            return "";
        }
        return company.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isSupportedCategory(String category) {
        if (category == null) {
            return true;
        }
        return !"system-design".equalsIgnoreCase(category.trim());
    }
}
