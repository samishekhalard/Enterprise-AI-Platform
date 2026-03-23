package com.ems.common.dto.auth;

import java.time.Instant;
import java.util.List;

/**
 * Query parameters for fetching auth events.
 */
public record AuthEventQuery(
    List<String> types,
    String userId,
    String username,
    String ipAddress,
    Instant dateFrom,
    Instant dateTo,
    Integer first,
    Integer max
) {
    public static AuthEventQuery defaults() {
        return new AuthEventQuery(null, null, null, null, null, null, 0, 100);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<String> types;
        private String userId;
        private String username;
        private String ipAddress;
        private Instant dateFrom;
        private Instant dateTo;
        private Integer first = 0;
        private Integer max = 100;

        public Builder types(List<String> types) {
            this.types = types;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder dateFrom(Instant dateFrom) {
            this.dateFrom = dateFrom;
            return this;
        }

        public Builder dateTo(Instant dateTo) {
            this.dateTo = dateTo;
            return this;
        }

        public Builder first(Integer first) {
            this.first = first;
            return this;
        }

        public Builder max(Integer max) {
            this.max = max;
            return this;
        }

        public AuthEventQuery build() {
            return new AuthEventQuery(types, userId, username, ipAddress, dateFrom, dateTo, first, max);
        }
    }
}
