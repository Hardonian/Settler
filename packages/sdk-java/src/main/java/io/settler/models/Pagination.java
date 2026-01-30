package io.settler.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

/**
 * Pagination metadata for list responses.
 */
public class Pagination {
    private int page;
    private int limit;
    private int total;
    private int totalPages;

    public Pagination() {
    }

    @JsonProperty("page")
    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    @JsonProperty("limit")
    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    @JsonProperty("total")
    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    @JsonProperty("totalPages")
    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    /**
     * Checks if there is a next page available.
     *
     * @return true if more pages exist
     */
    public boolean hasNext() {
        return page < totalPages;
    }

    /**
     * Checks if there is a previous page available.
     *
     * @return true if a previous page exists
     */
    public boolean hasPrevious() {
        return page > 1;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Pagination that = (Pagination) o;
        return page == that.page &&
                limit == that.limit &&
                total == that.total &&
                totalPages == that.totalPages;
    }

    @Override
    public int hashCode() {
        return Objects.hash(page, limit, total, totalPages);
    }

    @Override
    public String toString() {
        return "Pagination{" +
                "page=" + page +
                ", limit=" + limit +
                ", total=" + total +
                ", totalPages=" + totalPages +
                '}';
    }
}
