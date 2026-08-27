package io.settler.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Objects;

/**
 * Represents a reconciliation run result.
 */
public class ReconciliationRun {
    private String id;
    private String jobId;
    private String status;
    private int matched;
    private int unmatched;
    private int conflicts;
    private int errors;
    private double accuracy;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant startedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant completedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant createdAt;

    public ReconciliationRun() {
    }

    @JsonProperty("id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @JsonProperty("jobId")
    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    @JsonProperty("status")
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @JsonProperty("matched")
    public int getMatched() {
        return matched;
    }

    public void setMatched(int matched) {
        this.matched = matched;
    }

    @JsonProperty("unmatched")
    public int getUnmatched() {
        return unmatched;
    }

    public void setUnmatched(int unmatched) {
        this.unmatched = unmatched;
    }

    @JsonProperty("conflicts")
    public int getConflicts() {
        return conflicts;
    }

    public void setConflicts(int conflicts) {
        this.conflicts = conflicts;
    }

    @JsonProperty("errors")
    public int getErrors() {
        return errors;
    }

    public void setErrors(int errors) {
        this.errors = errors;
    }

    @JsonProperty("accuracy")
    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    @JsonProperty("startedAt")
    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    @JsonProperty("completedAt")
    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    @JsonProperty("createdAt")
    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReconciliationRun that = (ReconciliationRun) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ReconciliationRun{" +
                "id='" + id + '\'' +
                ", jobId='" + jobId + '\'' +
                ", status='" + status + '\'' +
                ", matched=" + matched +
                ", unmatched=" + unmatched +
                ", accuracy=" + accuracy +
                '}';
    }
}
