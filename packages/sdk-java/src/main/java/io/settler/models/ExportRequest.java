package io.settler.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Request object for creating data exports.
 */
public class ExportRequest {
    private UUID jobId;
    private Format format;
    private DateRange dateRange;
    private ExportOptions options;

    public enum Format {
        QUICKBOOKS,
        CSV,
        JSON
    }

    public ExportRequest() {
    }

    @JsonProperty("jobId")
    public UUID getJobId() {
        return jobId;
    }

    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }

    @JsonProperty("format")
    public Format getFormat() {
        return format;
    }

    public void setFormat(Format format) {
        this.format = format;
    }

    @JsonProperty("dateRange")
    public DateRange getDateRange() {
        return dateRange;
    }

    public void setDateRange(DateRange dateRange) {
        this.dateRange = dateRange;
    }

    @JsonProperty("options")
    public ExportOptions getOptions() {
        return options;
    }

    public void setOptions(ExportOptions options) {
        this.options = options;
    }

    /**
     * Date range for exports.
     */
    public static class DateRange {
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private Instant start;
        
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private Instant end;

        public DateRange() {
        }

        public DateRange(Instant start, Instant end) {
            this.start = start;
            this.end = end;
        }

        @JsonProperty("start")
        public Instant getStart() {
            return start;
        }

        public void setStart(Instant start) {
            this.start = start;
        }

        @JsonProperty("end")
        public Instant getEnd() {
            return end;
        }

        public void setEnd(Instant end) {
            this.end = end;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            DateRange dateRange = (DateRange) o;
            return Objects.equals(start, dateRange.start) &&
                    Objects.equals(end, dateRange.end);
        }

        @Override
        public int hashCode() {
            return Objects.hash(start, end);
        }
    }

    /**
     * Export options for customizing output.
     */
    public static class ExportOptions {
        private Boolean includeFees;
        private Boolean includeUnmatched;
        private Boolean includeRawPayloads;
        private List<String> columns;
        private Map<String, Object> glAccountMapping;

        public ExportOptions() {
        }

        @JsonProperty("includeFees")
        public Boolean getIncludeFees() {
            return includeFees;
        }

        public void setIncludeFees(Boolean includeFees) {
            this.includeFees = includeFees;
        }

        @JsonProperty("includeUnmatched")
        public Boolean getIncludeUnmatched() {
            return includeUnmatched;
        }

        public void setIncludeUnmatched(Boolean includeUnmatched) {
            this.includeUnmatched = includeUnmatched;
        }

        @JsonProperty("includeRawPayloads")
        public Boolean getIncludeRawPayloads() {
            return includeRawPayloads;
        }

        public void setIncludeRawPayloads(Boolean includeRawPayloads) {
            this.includeRawPayloads = includeRawPayloads;
        }

        @JsonProperty("columns")
        public List<String> getColumns() {
            return columns;
        }

        public void setColumns(List<String> columns) {
            this.columns = columns;
        }

        @JsonProperty("glAccountMapping")
        public Map<String, Object> getGlAccountMapping() {
            return glAccountMapping;
        }

        public void setGlAccountMapping(Map<String, Object> glAccountMapping) {
            this.glAccountMapping = glAccountMapping;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ExportOptions that = (ExportOptions) o;
            return Objects.equals(includeFees, that.includeFees) &&
                    Objects.equals(includeUnmatched, that.includeUnmatched) &&
                    Objects.equals(includeRawPayloads, that.includeRawPayloads) &&
                    Objects.equals(columns, that.columns) &&
                    Objects.equals(glAccountMapping, that.glAccountMapping);
        }

        @Override
        public int hashCode() {
            return Objects.hash(includeFees, includeUnmatched, includeRawPayloads, columns, glAccountMapping);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExportRequest that = (ExportRequest) o;
        return Objects.equals(jobId, that.jobId) &&
                format == that.format &&
                Objects.equals(dateRange, that.dateRange) &&
                Objects.equals(options, that.options);
    }

    @Override
    public int hashCode() {
        return Objects.hash(jobId, format, dateRange, options);
    }

    @Override
    public String toString() {
        return "ExportRequest{" +
                "jobId=" + jobId +
                ", format=" + format +
                ", dateRange=" + dateRange +
                ", options=" + options +
                '}';
    }
}
