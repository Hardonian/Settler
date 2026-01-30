package io.settler.exceptions;

/**
 * Exception thrown when a requested resource is not found.
 */
public class NotFoundException extends SettlerException {
    private final String resourceType;
    private final String resourceId;

    public NotFoundException(String message) {
        super(message, 404, "not_found", null);
        this.resourceType = null;
        this.resourceId = null;
    }

    public NotFoundException(String resourceType, String resourceId) {
        super(String.format("%s not found: %s", resourceType, resourceId), 404, "not_found", null);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    public NotFoundException(String resourceType, String resourceId, String requestId) {
        super(String.format("%s not found: %s", resourceType, resourceId), 404, "not_found", requestId);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    /**
     * Gets the type of resource that was not found.
     *
     * @return the resource type, or null if unspecified
     */
    public String getResourceType() {
        return resourceType;
    }

    /**
     * Gets the ID of the resource that was not found.
     *
     * @return the resource ID, or null if unspecified
     */
    public String getResourceId() {
        return resourceId;
    }
}
