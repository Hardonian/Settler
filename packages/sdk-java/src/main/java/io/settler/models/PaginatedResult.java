package io.settler.models;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Generic paginated result wrapper for list API responses.
 *
 * @param <T> the type of items in the result
 */
public final class PaginatedResult<T> {
    private final List<T> data;
    private final Pagination pagination;

    public PaginatedResult(List<T> data, Pagination pagination) {
        this.data = data != null ? Collections.unmodifiableList(data) : Collections.emptyList();
        this.pagination = pagination;
    }

    /**
     * Gets the list of items in this page.
     *
     * @return an unmodifiable list of items (never null)
     */
    public List<T> getData() {
        return data;
    }

    /**
     * Gets the pagination metadata.
     *
     * @return the pagination info
     */
    public Pagination getPagination() {
        return pagination;
    }

    /**
     * Gets the number of items in this page.
     *
     * @return the item count
     */
    public int size() {
        return data.size();
    }

    /**
     * Checks if there are no items in this page.
     *
     * @return true if the data list is empty
     */
    public boolean isEmpty() {
        return data.isEmpty();
    }

    /**
     * Checks if there is a next page.
     *
     * @return true if more pages exist
     */
    public boolean hasNext() {
        return pagination != null && pagination.hasNext();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaginatedResult<?> that = (PaginatedResult<?>) o;
        return Objects.equals(data, that.data) &&
                Objects.equals(pagination, that.pagination);
    }

    @Override
    public int hashCode() {
        return Objects.hash(data, pagination);
    }

    @Override
    public String toString() {
        return "PaginatedResult{" +
                "size=" + data.size() +
                ", pagination=" + pagination +
                '}';
    }
}
