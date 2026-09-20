package com.wachichaw.AllyRAG;

import lombok.Data;
import java.util.List;

@Data
public class RagSearchResponse {
    @com.fasterxml.jackson.annotation.JsonProperty("legal_validation_status")
    private String legalValidationStatus = "unverified";
    @com.fasterxml.jackson.annotation.JsonProperty("can_state_final_outcome")
    private boolean canStateFinalOutcome;
    @com.fasterxml.jackson.annotation.JsonProperty("validation_warning")
    private String validationWarning;

    private List<LegalCase> cases;
    private Integer count;
    private String query;

    private Boolean rejected = false;
    @com.fasterxml.jackson.annotation.JsonProperty("rejection_stage")
    private String rejectionStage;
    @com.fasterxml.jackson.annotation.JsonProperty("rejection_reason")
    private String rejectionReason;
    private Double confidence;

    public List<LegalCase> getCases() {
        return cases;
    }

    public void setCases(List<LegalCase> cases) {
        this.cases = cases;
    }

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public Boolean getRejected() {
        return rejected;
    }

    public void setRejected(Boolean rejected) {
        this.rejected = rejected;
    }

    public String getRejectionStage() {
        return rejectionStage;
    }

    public void setRejectionStage(String rejectionStage) {
        this.rejectionStage = rejectionStage;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}
