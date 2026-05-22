package com.wachichaw.AllyRAG;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class ValidationResponse {
    @JsonProperty("is_valid")
    private Boolean valid;
    
    @JsonProperty("rejection_reason")
    private String rejectionReason;
    
    @JsonProperty("confidence")
    private Double confidence;
    
    @JsonProperty("method")
    private String method;

    public Boolean getValid() {
        return valid;
    }
    
    public Boolean getIsValid() {
        return valid;
    }

    public void setValid(Boolean valid) {
        this.valid = valid;
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

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }
}
