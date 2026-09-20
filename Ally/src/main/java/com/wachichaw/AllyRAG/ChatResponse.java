package com.wachichaw.AllyRAG;

import lombok.Data;
import java.util.List;

@Data
public class ChatResponse {
    @com.fasterxml.jackson.annotation.JsonProperty("legal_validation_status")
    private String legalValidationStatus = "unverified";
    @com.fasterxml.jackson.annotation.JsonProperty("can_state_final_outcome")
    private boolean canStateFinalOutcome;
    @com.fasterxml.jackson.annotation.JsonProperty("validation_warning")
    private String validationWarning;

    private String conversationId;
    private String requestId;
    private String response;
    private List<LegalCase> relevantCases;
    private Integer caseCount;
    private String confidence;
    private boolean ragEnabled;
    private String timestamp;

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public List<LegalCase> getRelevantCases() {
        return relevantCases;
    }

    public void setRelevantCases(List<LegalCase> relevantCases) {
        this.relevantCases = relevantCases;
    }

    public Integer getCaseCount() {
        return caseCount;
    }

    public void setCaseCount(Integer caseCount) {
        this.caseCount = caseCount;
    }

    public String getConfidence() {
        return confidence;
    }

    public void setConfidence(String confidence) {
        this.confidence = confidence;
    }

    public boolean isRagEnabled() {
        return ragEnabled;
    }

    public void setRagEnabled(boolean ragEnabled) {
        this.ragEnabled = ragEnabled;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
