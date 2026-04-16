package com.silicondefense.backend.repo;

import com.silicondefense.backend.model.InterviewPlanDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface InterviewPlanRepository extends MongoRepository<InterviewPlanDocument, String> {
    Optional<InterviewPlanDocument> findByUserId(String userId);
}
