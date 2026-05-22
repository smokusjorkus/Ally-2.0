package com.wachichaw.AllyRAG;

import lombok.Data;
import java.util.List;

@Data
public class RagSearchResponse {
    private List<LegalCase> cases;
    private Integer count;
    private String query;

    private Boolean rejected = false;
    private String rejectionStage;
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
