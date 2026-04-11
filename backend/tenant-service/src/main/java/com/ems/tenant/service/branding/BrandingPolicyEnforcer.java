package com.ems.tenant.service.branding;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class BrandingPolicyEnforcer {

    private static final Set<String> ALLOWED_FIELDS = Set.of(
            "primaryColor",
            "primaryColorDark",
            "secondaryColor",
            "surfaceColor",
            "textColor",
            "shadowDarkColor",
            "shadowLightColor",
            "logoUrl",
            "logoUrlDark",
            "faviconUrl",
            "loginBackgroundUrl",
            "fontFamily",
            "customCss",
            "cornerRadius",
            "buttonDepth",
            "shadowIntensity",
            "softShadows",
            "compactNav",
            "hoverButton",
            "hoverCard",
            "hoverInput",
            "hoverNav",
            "hoverTableRow",
            "componentTokens"
    );

    private static final Set<String> FOREST = Set.of("#428177", "#054239", "#002623");
    private static final Set<String> GOLDEN_WHEAT = Set.of("#edebe0", "#b9a779", "#988561");
    private static final Set<String> CHARCOAL = Set.of("#ffffff", "#3d3a3b", "#161616");

    private static final Set<String> HOVER_BUTTON = Set.of("lift", "press", "glow", "none");
    private static final Set<String> HOVER_CARD = Set.of("lift", "glow", "none");
    private static final Set<String> HOVER_INPUT = Set.of("press", "highlight", "none");
    private static final Set<String> HOVER_NAV = Set.of("slide", "lift", "highlight", "none");
    private static final Set<String> HOVER_TABLE_ROW = Set.of("highlight", "lift", "none");

    private static final Set<String> ALLOWED_COMPONENT_IDS = Set.of(
            "accordion",
            "avatar",
            "avatargroup",
            "badge",
            "breadcrumb",
            "button",
            "card",
            "checkbox",
            "chip",
            "datatable",
            "table",
            "dialog",
            "floatlabel",
            "inputnumber",
            "inputtext",
            "menu",
            "message",
            "multiselect",
            "paginator",
            "progressbar",
            "progressspinner",
            "select",
            "selectbutton",
            "tabs",
            "tag",
            "toggleswitch",
            "tooltip"
    );

    private static final Pattern HEX_PATTERN = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^(https?://\\S+|/\\S*)$");
    private static final Pattern TOKEN_KEY_PATTERN = Pattern.compile("^[A-Za-z0-9_.-]{1,80}$");

    private static final int MAX_TOKEN_DEPTH = 8;
    private static final int MAX_LIST_ITEMS = 100;

    public BrandingValidationResult validateAndNormalize(Map<String, Object> payload) {
        Map<String, Object> input = payload == null ? Map.of() : payload;
        List<String> violations = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Map<String, Object> normalized = new LinkedHashMap<>();

        for (String key : input.keySet()) {
            if (!ALLOWED_FIELDS.contains(key)) {
                violations.add("Unknown branding field: " + key);
            }
        }

        validateColorField(input, normalized, violations, "primaryColor", FOREST);
        validateColorField(input, normalized, violations, "primaryColorDark", FOREST);
        validateColorField(input, normalized, violations, "secondaryColor", Set.of("#b9a779", "#988561"));
        validateColorField(input, normalized, violations, "surfaceColor", Set.of("#edebe0"));
        validateColorField(input, normalized, violations, "textColor", CHARCOAL);
        validateColorField(input, normalized, violations, "shadowDarkColor", Set.of("#988561", "#b9a779", "#3d3a3b", "#054239"));
        validateColorField(input, normalized, violations, "shadowLightColor", Set.of("#ffffff", "#edebe0"));

        validateUrlField(input, normalized, violations, "logoUrl");
        validateUrlField(input, normalized, violations, "logoUrlDark");
        validateUrlField(input, normalized, violations, "faviconUrl");
        validateUrlField(input, normalized, violations, "loginBackgroundUrl");

        validateFontFamily(input, normalized, violations);
        validateNumericField(input, normalized, violations, "cornerRadius", 0, 40);
        validateNumericField(input, normalized, violations, "buttonDepth", 0, 30);
        validateNumericField(input, normalized, violations, "shadowIntensity", 0, 100);
        validateBooleanField(input, normalized, violations, "softShadows");
        validateBooleanField(input, normalized, violations, "compactNav");

        validateEnumField(input, normalized, violations, "hoverButton", HOVER_BUTTON);
        validateEnumField(input, normalized, violations, "hoverCard", HOVER_CARD);
        validateEnumField(input, normalized, violations, "hoverInput", HOVER_INPUT);
        validateEnumField(input, normalized, violations, "hoverNav", HOVER_NAV);
        validateEnumField(input, normalized, violations, "hoverTableRow", HOVER_TABLE_ROW);

        validateCustomCss(input, normalized, violations);
        validateComponentTokens(input, normalized, violations, warnings);

        return new BrandingValidationResult(
                violations.isEmpty(),
                List.copyOf(violations),
                List.copyOf(warnings),
                Collections.unmodifiableMap(new LinkedHashMap<>(normalized))
        );
    }

    private void validateColorField(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations,
            String field,
            Set<String> allowed
    ) {
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (!(raw instanceof String value)) {
            violations.add(field + " must be a string hex color");
            return;
        }

        String normalizedHex = value.trim().toLowerCase();
        if (!HEX_PATTERN.matcher(normalizedHex).matches()) {
            violations.add(field + " must match #RRGGBB format");
            return;
        }
        if (!allowed.contains(normalizedHex)) {
            violations.add(field + " value " + normalizedHex + " is outside approved palette");
            return;
        }
        normalized.put(field, normalizedHex);
    }

    private void validateUrlField(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations,
            String field
    ) {
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (!(raw instanceof String value)) {
            violations.add(field + " must be a string URL");
            return;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            normalized.put(field, "");
            return;
        }
        if (trimmed.length() > 500) {
            violations.add(field + " exceeds 500 character limit");
            return;
        }
        if (!URL_PATTERN.matcher(trimmed).matches()) {
            violations.add(field + " must be http(s) URL or root-relative path");
            return;
        }
        normalized.put(field, trimmed);
    }

    private void validateFontFamily(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations
    ) {
        final String field = "fontFamily";
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (!(raw instanceof String value)) {
            violations.add(field + " must be a string");
            return;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            violations.add(field + " cannot be blank");
            return;
        }
        if (trimmed.length() > 160) {
            violations.add(field + " exceeds 160 character limit");
            return;
        }
        if (trimmed.contains("<") || trimmed.contains(">") || trimmed.contains("{")) {
            violations.add(field + " contains unsupported characters");
            return;
        }
        normalized.put(field, trimmed);
    }

    private void validateNumericField(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations,
            String field,
            int min,
            int max
    ) {
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (!(raw instanceof Number number)) {
            violations.add(field + " must be numeric");
            return;
        }
        int value = number.intValue();
        if (value < min || value > max) {
            violations.add(field + " must be between " + min + " and " + max);
            return;
        }
        normalized.put(field, value);
    }

    private void validateBooleanField(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations,
            String field
    ) {
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (!(raw instanceof Boolean value)) {
            violations.add(field + " must be boolean");
            return;
        }
        normalized.put(field, value);
    }

    private void validateEnumField(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations,
            String field,
            Set<String> allowed
    ) {
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (!(raw instanceof String value)) {
            violations.add(field + " must be a string");
            return;
        }
        String normalizedValue = value.trim().toLowerCase();
        if (!allowed.contains(normalizedValue)) {
            violations.add(field + " must be one of " + allowed);
            return;
        }
        normalized.put(field, normalizedValue);
    }

    private void validateCustomCss(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations
    ) {
        final String field = "customCss";
        if (!input.containsKey(field)) {
            return;
        }
        Object raw = input.get(field);
        if (raw == null) {
            normalized.put(field, "");
            return;
        }
        if (!(raw instanceof String css)) {
            violations.add(field + " must be a string");
            return;
        }
        if (!css.isBlank()) {
            violations.add("customCss is disabled by branding enforcement policy v1");
            return;
        }
        normalized.put(field, "");
    }

    private void validateComponentTokens(
            Map<String, Object> input,
            Map<String, Object> normalized,
            List<String> violations,
            List<String> warnings
    ) {
        final String field = "componentTokens";
        if (!input.containsKey(field)) {
            return;
        }

        Object raw = input.get(field);
        if (raw == null) {
            normalized.put(field, null);
            return;
        }

        if (!(raw instanceof Map<?, ?> tokenMap)) {
            violations.add(field + " must be an object");
            return;
        }

        Map<String, Object> normalizedTokens = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : tokenMap.entrySet()) {
            if (!(entry.getKey() instanceof String componentId)) {
                violations.add("componentTokens key must be a string");
                continue;
            }
            if (!ALLOWED_COMPONENT_IDS.contains(componentId)) {
                violations.add("componentTokens contains unsupported component id: " + componentId);
                continue;
            }

            Object componentValue = entry.getValue();
            if (!(componentValue instanceof Map<?, ?> componentTokenObject)) {
                violations.add("componentTokens." + componentId + " must be an object");
                continue;
            }

            Object normalizedComponentTokens = normalizeTokenValue(
                    componentTokenObject,
                    "componentTokens." + componentId,
                    1,
                    violations
            );

            if (normalizedComponentTokens instanceof Map<?, ?>) {
                normalizedTokens.put(componentId, normalizedComponentTokens);
            }
        }

        if (normalizedTokens.isEmpty()) {
            warnings.add("componentTokens present but no valid entries were found");
        }
        normalized.put(field, normalizedTokens);
    }

    private Object normalizeTokenValue(
            Object value,
            String path,
            int depth,
            List<String> violations
    ) {
        if (depth > MAX_TOKEN_DEPTH) {
            violations.add(path + " exceeds max nesting depth " + MAX_TOKEN_DEPTH);
            return null;
        }

        if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        if (value instanceof Map<?, ?> map) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!(entry.getKey() instanceof String key)) {
                    violations.add(path + " contains non-string token key");
                    continue;
                }
                if (!TOKEN_KEY_PATTERN.matcher(key).matches()) {
                    violations.add(path + "." + key + " has invalid token key format");
                    continue;
                }

                Object normalizedChild = normalizeTokenValue(entry.getValue(), path + "." + key, depth + 1, violations);
                if (normalizedChild != null || entry.getValue() == null) {
                    normalized.put(key, normalizedChild);
                }
            }
            return normalized;
        }

        if (value instanceof List<?> list) {
            if (list.size() > MAX_LIST_ITEMS) {
                violations.add(path + " exceeds max list size " + MAX_LIST_ITEMS);
                return null;
            }
            List<Object> normalizedList = new ArrayList<>(list.size());
            for (int i = 0; i < list.size(); i++) {
                Object normalizedChild = normalizeTokenValue(list.get(i), path + "[" + i + "]", depth + 1, violations);
                if (normalizedChild != null || list.get(i) == null) {
                    normalizedList.add(normalizedChild);
                }
            }
            return normalizedList;
        }

        violations.add(path + " has unsupported token value type: " + value.getClass().getSimpleName());
        return null;
    }

    public Set<String> allowedComponentIds() {
        return new LinkedHashSet<>(ALLOWED_COMPONENT_IDS);
    }

    public Map<String, Set<String>> palette() {
        return Map.of(
                "forest", FOREST,
                "goldenWheat", GOLDEN_WHEAT,
                "charcoal", CHARCOAL
        );
    }
}
