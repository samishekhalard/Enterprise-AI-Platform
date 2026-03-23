package com.ems.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request DTO for partial updates to provider configuration.
 * Used with PATCH endpoint for enabling/disabling providers.
 */
@Schema(description = "Provider partial update request")
public record ProviderPatchRequest(

    @Schema(
        description = "Enable or disable the provider",
        example = "true"
    )
    Boolean enabled,

    @Schema(
        description = "Update the priority order",
        example = "1"
    )
    Integer priority,

    @Schema(
        description = "Update the display name",
        example = "Company SSO"
    )
    String displayName

) {
    /**
     * Check if this patch request has any updates.
     */
    public boolean hasUpdates() {
        return enabled != null || priority != null || displayName != null;
    }
}
