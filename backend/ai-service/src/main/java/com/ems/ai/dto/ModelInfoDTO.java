package com.ems.ai.dto;

public record ModelInfoDTO(
    String id,
    String name,
    String description,
    Integer maxTokens,
    Boolean supportsVision,
    Boolean isDefault
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String description;
        private Integer maxTokens;
        private Boolean supportsVision;
        private Boolean isDefault;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder maxTokens(Integer maxTokens) { this.maxTokens = maxTokens; return this; }
        public Builder supportsVision(Boolean supportsVision) { this.supportsVision = supportsVision; return this; }
        public Builder isDefault(Boolean isDefault) { this.isDefault = isDefault; return this; }

        public ModelInfoDTO build() {
            return new ModelInfoDTO(id, name, description, maxTokens, supportsVision, isDefault);
        }
    }
}
