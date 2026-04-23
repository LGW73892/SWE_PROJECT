package com.silicondefense.backend.service;

import com.silicondefense.backend.model.CompanyQuestionDocument;
import com.silicondefense.backend.repo.CompanyQuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class QuestionBankSeedService implements CommandLineRunner {

    private final CompanyQuestionRepository companyQuestionRepository;

    public QuestionBankSeedService(CompanyQuestionRepository companyQuestionRepository) {
        this.companyQuestionRepository = companyQuestionRepository;
    }

    @Override
    public void run(String... args) {
        if (companyQuestionRepository.count() > 0) {
            return;
        }

        List<CompanyQuestionDocument> seed = new ArrayList<>();

        seed.add(create("Google", "leetcode", "Given an array of strings, group anagrams together.", "medium", List.of("Discuss hash key strategy", "Analyze time complexity")));
        seed.add(create("Google", "leetcode", "Find the longest substring without repeating characters.", "medium", List.of("Sliding window", "Mention edge cases")));
        seed.add(create("Google", "behavioral", "Tell me about a disagreement with a teammate and how you handled it.", "medium", List.of("Use STAR", "Show collaboration outcome")));

        seed.add(create("Meta", "leetcode", "Implement LRU Cache.", "medium", List.of("HashMap + doubly linked list", "Big-O requirements")));
        seed.add(create("Meta", "leetcode", "Binary tree right side view.", "medium", List.of("BFS/DFS approaches", "Space tradeoffs")));
        seed.add(create("Meta", "behavioral", "Describe a time you moved fast under ambiguity.", "medium", List.of("Decision framework", "Impact metrics")));

        seed.add(create("Amazon", "leetcode", "Top K frequent elements.", "medium", List.of("Heap vs bucket sort", "Complexity comparison")));
        seed.add(create("Amazon", "leetcode", "Merge K sorted lists.", "hard", List.of("Priority queue", "Alternative divide and conquer")));
        seed.add(create("Amazon", "behavioral", "Tell me about a time you took ownership.", "medium", List.of("Tie to customer impact", "Show measurable result")));

        seed.add(create("Microsoft", "leetcode", "Number of islands.", "medium", List.of("DFS/BFS", "Mutating input vs visited set")));
        seed.add(create("Microsoft", "leetcode", "Serialize and deserialize binary tree.", "hard", List.of("Preorder encoding", "Null markers")));
        seed.add(create("Microsoft", "behavioral", "Describe a time you improved developer productivity.", "medium", List.of("Baseline metric", "Before/after impact")));

        seed.add(create("Stripe", "leetcode", "Valid parentheses.", "easy", List.of("Stack usage", "Input constraints")));
        seed.add(create("Stripe", "leetcode", "Design hit counter.", "medium", List.of("Time-window buckets", "Memory constraints")));
        seed.add(create("Stripe", "behavioral", "Tell me about a time you prevented a risky launch.", "medium", List.of("Risk analysis", "Communication and mitigation")));

        companyQuestionRepository.saveAll(seed);
    }

    private CompanyQuestionDocument create(String company, String category, String question, String difficulty, List<String> tips) {
        CompanyQuestionDocument doc = new CompanyQuestionDocument();
        doc.setCompany(company);
        doc.setCompanyNormalized(company.toLowerCase());
        doc.setCategory(category);
        doc.setQuestion(question);
        doc.setDifficulty(difficulty);
        doc.setTips(tips);
        doc.setSource("seed");
        doc.setImportanceScore(60.0);
        return doc;
    }
}
