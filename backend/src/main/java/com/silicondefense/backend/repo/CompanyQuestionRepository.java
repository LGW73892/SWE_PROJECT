package com.silicondefense.backend.repo;

import com.silicondefense.backend.model.CompanyQuestionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CompanyQuestionRepository extends MongoRepository<CompanyQuestionDocument, String> {
    List<CompanyQuestionDocument> findByCompanyNormalized(String companyNormalized);
    List<CompanyQuestionDocument> findByCompanyNormalizedContaining(String companyNormalized);
}
