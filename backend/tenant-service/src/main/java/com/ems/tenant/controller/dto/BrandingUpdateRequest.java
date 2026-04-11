package com.ems.tenant.controller.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = false)
public record BrandingUpdateRequest(
        String primaryColor,
        String primaryColorDark,
        String secondaryColor,
        String surfaceColor,
        String textColor,
        String shadowDarkColor,
        String shadowLightColor,
        String logoUrl,
        String logoUrlDark,
        String faviconUrl,
        String loginBackgroundUrl,
        String fontFamily,
        String customCss,
        Integer cornerRadius,
        Integer buttonDepth,
        Integer shadowIntensity,
        Boolean softShadows,
        Boolean compactNav,
        String hoverButton,
        String hoverCard,
        String hoverInput,
        String hoverNav,
        String hoverTableRow,
        Map<String, Object> componentTokens
) {
    public Map<String, Object> toUpdateMap() {
        Map<String, Object> map = new LinkedHashMap<>();

        putIfNotNull(map, "primaryColor", primaryColor);
        putIfNotNull(map, "primaryColorDark", primaryColorDark);
        putIfNotNull(map, "secondaryColor", secondaryColor);
        putIfNotNull(map, "surfaceColor", surfaceColor);
        putIfNotNull(map, "textColor", textColor);
        putIfNotNull(map, "shadowDarkColor", shadowDarkColor);
        putIfNotNull(map, "shadowLightColor", shadowLightColor);
        putIfNotNull(map, "logoUrl", logoUrl);
        putIfNotNull(map, "logoUrlDark", logoUrlDark);
        putIfNotNull(map, "faviconUrl", faviconUrl);
        putIfNotNull(map, "loginBackgroundUrl", loginBackgroundUrl);
        putIfNotNull(map, "fontFamily", fontFamily);
        putIfNotNull(map, "customCss", customCss);
        putIfNotNull(map, "cornerRadius", cornerRadius);
        putIfNotNull(map, "buttonDepth", buttonDepth);
        putIfNotNull(map, "shadowIntensity", shadowIntensity);
        putIfNotNull(map, "softShadows", softShadows);
        putIfNotNull(map, "compactNav", compactNav);
        putIfNotNull(map, "hoverButton", hoverButton);
        putIfNotNull(map, "hoverCard", hoverCard);
        putIfNotNull(map, "hoverInput", hoverInput);
        putIfNotNull(map, "hoverNav", hoverNav);
        putIfNotNull(map, "hoverTableRow", hoverTableRow);
        putIfNotNull(map, "componentTokens", componentTokens);

        return map;
    }

    private static void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
