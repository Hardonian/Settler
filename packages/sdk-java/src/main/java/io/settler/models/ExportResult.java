package io.settler.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Result of a data export operation.
 */
public class ExportResult {
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant exportDate;
    
    private DateRange dateRange;
    private Summary summary;
    private List<Map<String, Object>> matches;

    public ExportResult() {
    }

    @JsonProperty("exportDate")
    public Instant getExportDate() {
        return exportDate;
    }

    public void setExportDate(Instant exportDate) {
        this.exportDate = exportDate;
    }

    @JsonProperty("dateRange")
    public DateRange getDateRange() {
        return dateRange;
    }

    public void setDateRange(DateRange dateRange) {
        this.dateRange = dateRange;
    }

    @JsonProperty("summary")
    public Summary getSummary() {
        return summary;
    }

    public void setSummary(Summary summary) {
        this.summary = summary;
    }

    @JsonProperty("matches")
    public List<Map<String, Object>> getMatches() {
        return matches;
    }

    public void setMatches(List<Map<String, Object>> matches) {
        this.matches = matches;
    }

    /**
     * Date range for the export.
     */
    public static class DateRange {
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private Instant start;
        
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private Instant end;

        public DateRange() {
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
     * Export summary statistics.
     */
    public static class Summary {
        private int totalMatches;
        private int totalUnmatched;
        private int totalFees;

        public Summary() {
        }

        @JsonProperty("totalMatches")
        public int getTotalMatches() {
            return totalMatches;
        }

        public void setTotalMatches(int totalMatches) {
            this.totalMatches = totalMatches;
        }

        @JsonProperty("totalUnmatched")
        public int getTotalUnmatched() {
            return totalUnmatched;
        }

        public void setTotalUnmatched(int totalUnmatched) {
            this.totalUnmatched = totalUnmatched;
        }

        @JsonProperty("totalFees")
        public int getTotalFees() {
            return totalFees;
        }

        public void setTotalFees(int totalFees) {
            this.totalFees = totalFees;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Summary summary = (Summary) o;
            return totalMatches == summary.totalMatches &&
                    totalUnmatched == summary.totalUnmatched &&
                    totalFees == summary.totalFees;
        }

        @Override
        public int hashCode() {
            return Objects.hash(totalMatches, totalUnmatched, totalFees);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExportResult that = (ExportResult) o;
        return Objects.equals(exportDate, that.exportDate) &&
                Objects.equals(dateRange, that.dateRange) &&
                Objects.equals(summary, that.summary) &&
                Objects.equals(matches, that.matches);
    }

    @Override
    public int hashCode() {
        return Objects.hash(exportDate, dateRange, summary, matches);
    }

    @Override
    public String toString() {
        return "ExportResult{" +
                "exportDate=" + exportDate +
                ", dateRange=" + dateRange +
                ", summary=" + summary +
                ", matches=" + matches +
                '}';
    }
}
