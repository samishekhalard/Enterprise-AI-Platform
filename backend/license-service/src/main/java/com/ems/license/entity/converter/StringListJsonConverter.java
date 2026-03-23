package com.ems.license.entity.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * JPA AttributeConverter that converts a {@code List<String>} to/from a JSON string
 * for storage in JSONB columns.
 *
 * <p>Not auto-applied; must be explicitly referenced via {@code @Convert(converter = ...)}
 * on entity fields.</p>
 */
@Converter(autoApply = false)
@Slf4j
public class StringListJsonConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> LIST_TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "[]";
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize List<String> to JSON: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to convert list to JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(dbData, LIST_TYPE);
        } catch (IOException e) {
            log.error("Failed to deserialize JSON to List<String>: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to convert JSON to list", e);
        }
    }
}
