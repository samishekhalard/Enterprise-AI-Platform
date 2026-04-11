package com.ems.definition.service;

import com.ems.definition.dto.AddAttributeRequest;
import com.ems.definition.dto.AddConnectionRequest;
import com.ems.definition.dto.AttributeTypeCreateRequest;
import com.ems.definition.dto.AttributeTypeDTO;
import com.ems.definition.dto.AttributeTypeUpdateRequest;
import com.ems.definition.dto.ObjectTypeCreateRequest;
import com.ems.definition.dto.ObjectTypeDTO;
import com.ems.definition.dto.ObjectTypeUpdateRequest;
import com.ems.definition.dto.PagedResponse;
import com.ems.definition.node.AttributeTypeNode;
import com.ems.definition.node.ObjectTypeNode;
import com.ems.definition.node.relationship.CanConnectToRelationship;
import com.ems.definition.node.relationship.HasAttributeRelationship;
import com.ems.definition.repository.AttributeTypeRepository;
import com.ems.definition.repository.ObjectTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ObjectTypeServiceImpl}.
 */
@ExtendWith(MockitoExtension.class)
class ObjectTypeServiceImplTest {

    private static final String TENANT_ID = "tenant-001";

    @Mock
    private ObjectTypeRepository objectTypeRepository;

    @Mock
    private AttributeTypeRepository attributeTypeRepository;

    @InjectMocks
    private ObjectTypeServiceImpl service;

    private ObjectTypeNode sampleNode;
    private AttributeTypeNode sampleAttribute;

    @BeforeEach
    void setUp() {
        sampleNode = ObjectTypeNode.builder()
                .id("ot-001")
                .tenantId(TENANT_ID)
                .name("Server")
                .typeKey("server")
                .code("OBJ_001")
                .description("A physical or virtual server")
                .iconName("server")
                .iconColor("#428177")
                .status("active")
                .state("user_defined")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .attributes(new ArrayList<>())
                .connections(new ArrayList<>())
                .build();

        sampleAttribute = AttributeTypeNode.builder()
                .id("at-001")
                .tenantId(TENANT_ID)
                .name("Hostname")
                .attributeKey("hostname")
                .dataType("string")
                .attributeGroup("general")
                .description("The server hostname")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("listObjectTypes")
    class ListObjectTypes {

        @Test
        @DisplayName("should return paged object types for tenant")
        void shouldReturnPagedObjectTypes() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode));

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, null, null);

            assertThat(result.content()).hasSize(1);
            assertThat(result.content().get(0).name()).isEqualTo("Server");
            assertThat(result.totalElements()).isEqualTo(1L);
            assertThat(result.page()).isEqualTo(0);
            assertThat(result.size()).isEqualTo(20);
        }

        @Test
        @DisplayName("should filter by search term on name")
        void shouldFilterBySearch() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode));

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, "server", null);

            assertThat(result.content()).hasSize(1);
        }

        @Test
        @DisplayName("should filter out non-matching search")
        void shouldFilterOutNonMatching() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode));

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, "xyz", null);

            assertThat(result.content()).isEmpty();
        }

        @Test
        @DisplayName("should filter by status")
        void shouldFilterByStatus() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode));

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, null, "active");

            assertThat(result.content()).hasSize(1);
        }

        @Test
        @DisplayName("should return empty when tenant has no object types")
        void shouldReturnEmptyForNoData() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(0L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(Collections.emptyList());

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, null, null);

            assertThat(result.content()).isEmpty();
            assertThat(result.totalElements()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("createObjectType")
    class CreateObjectType {

        @Test
        @DisplayName("should create object type with auto-generated code")
        void shouldCreateWithAutoCode() {
            ObjectTypeCreateRequest request = new ObjectTypeCreateRequest(
                    "Application", null, null, "A software application",
                    null, null, null, null);

            when(objectTypeRepository.existsByTypeKeyAndTenantId("application", TENANT_ID)).thenReturn(false);
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(5L);
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.createObjectType(TENANT_ID, request);

            assertThat(result.name()).isEqualTo("Application");
            assertThat(result.typeKey()).isEqualTo("application");
            assertThat(result.code()).isEqualTo("OBJ_006");
            assertThat(result.iconName()).isEqualTo("box");
            assertThat(result.iconColor()).isEqualTo("#428177");
            assertThat(result.status()).isEqualTo("active");
            verify(objectTypeRepository).save(any(ObjectTypeNode.class));
        }

        @Test
        @DisplayName("should create object type with explicit typeKey and code")
        void shouldCreateWithExplicitValues() {
            ObjectTypeCreateRequest request = new ObjectTypeCreateRequest(
                    "Server", "srv", "SRV_001", "A server",
                    "server", "#FF0000", "planned", "default");

            when(objectTypeRepository.existsByTypeKeyAndTenantId("srv", TENANT_ID)).thenReturn(false);
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.createObjectType(TENANT_ID, request);

            assertThat(result.typeKey()).isEqualTo("srv");
            assertThat(result.code()).isEqualTo("SRV_001");
            assertThat(result.iconName()).isEqualTo("server");
            assertThat(result.iconColor()).isEqualTo("#FF0000");
            assertThat(result.status()).isEqualTo("planned");
            assertThat(result.state()).isEqualTo("default");
        }

        @Test
        @DisplayName("should throw CONFLICT when typeKey already exists")
        void shouldThrowConflictOnDuplicateTypeKey() {
            ObjectTypeCreateRequest request = new ObjectTypeCreateRequest(
                    "Server", "server", null, null, null, null, null, null);

            when(objectTypeRepository.existsByTypeKeyAndTenantId("server", TENANT_ID)).thenReturn(true);

            assertThatThrownBy(() -> service.createObjectType(TENANT_ID, request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("already exists");

            verify(objectTypeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getObjectType")
    class GetObjectType {

        @Test
        @DisplayName("should return object type by ID and tenant")
        void shouldReturnObjectType() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            ObjectTypeDTO result = service.getObjectType(TENANT_ID, "ot-001");

            assertThat(result.id()).isEqualTo("ot-001");
            assertThat(result.name()).isEqualTo("Server");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when object type missing")
        void shouldThrowNotFound() {
            when(objectTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getObjectType(TENANT_ID, "missing"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("updateObjectType")
    class UpdateObjectType {

        @Test
        @DisplayName("should partially update object type")
        void shouldPartialUpdate() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeUpdateRequest request = new ObjectTypeUpdateRequest(
                    "Updated Server", null, null, "Updated description",
                    null, null, "retired", null);

            ObjectTypeDTO result = service.updateObjectType(TENANT_ID, "ot-001", request);

            assertThat(result.name()).isEqualTo("Updated Server");
            assertThat(result.description()).isEqualTo("Updated description");
            assertThat(result.status()).isEqualTo("retired");
            // Unchanged fields
            assertThat(result.typeKey()).isEqualTo("server");
            assertThat(result.iconName()).isEqualTo("server");
        }

        @Test
        @DisplayName("should update all optional fields when all are provided")
        void shouldUpdateAllFields() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.existsByTypeKeyAndTenantId("new_server", TENANT_ID))
                    .thenReturn(false);
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeUpdateRequest request = new ObjectTypeUpdateRequest(
                    "New Server", "new_server", "OBJ_999",
                    "Updated desc", "rack", "#FF0000", "planned", "system_defined");

            ObjectTypeDTO result = service.updateObjectType(TENANT_ID, "ot-001", request);

            assertThat(result.name()).isEqualTo("New Server");
            assertThat(result.typeKey()).isEqualTo("new_server");
            assertThat(result.code()).isEqualTo("OBJ_999");
            assertThat(result.description()).isEqualTo("Updated desc");
            assertThat(result.iconName()).isEqualTo("rack");
            assertThat(result.iconColor()).isEqualTo("#FF0000");
            assertThat(result.status()).isEqualTo("planned");
            assertThat(result.state()).isEqualTo("system_defined");
        }

        @Test
        @DisplayName("should throw CONFLICT when updating to existing typeKey")
        void shouldThrowConflictOnTypeKeyUpdate() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.existsByTypeKeyAndTenantId("existing_key", TENANT_ID))
                    .thenReturn(true);

            ObjectTypeUpdateRequest request = new ObjectTypeUpdateRequest(
                    null, "existing_key", null, null, null, null, null, null);

            assertThatThrownBy(() -> service.updateObjectType(TENANT_ID, "ot-001", request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("already exists");
        }
    }

    @Nested
    @DisplayName("deleteObjectType")
    class DeleteObjectType {

        @Test
        @DisplayName("should delete existing object type")
        void shouldDelete() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            service.deleteObjectType(TENANT_ID, "ot-001");

            verify(objectTypeRepository).delete(sampleNode);
        }

        @Test
        @DisplayName("should throw NOT_FOUND when deleting non-existent")
        void shouldThrowNotFoundOnDelete() {
            when(objectTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteObjectType(TENANT_ID, "missing"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("addAttribute")
    class AddAttribute {

        @Test
        @DisplayName("should add attribute to object type")
        void shouldAddAttribute() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            AddAttributeRequest request = new AddAttributeRequest("at-001", true, 1);

            ObjectTypeDTO result = service.addAttribute(TENANT_ID, "ot-001", request);

            assertThat(result.attributes()).hasSize(1);
            assertThat(result.attributes().get(0).attributeTypeId()).isEqualTo("at-001");
            assertThat(result.attributes().get(0).isRequired()).isTrue();
        }

        @Test
        @DisplayName("should throw CONFLICT when attribute already linked")
        void shouldThrowConflictOnDuplicate() {
            HasAttributeRelationship existing = HasAttributeRelationship.builder()
                    .isRequired(false)
                    .displayOrder(0)
                    .attribute(sampleAttribute)
                    .build();
            sampleNode.setAttributes(new ArrayList<>(List.of(existing)));

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));

            AddAttributeRequest request = new AddAttributeRequest("at-001", true, 1);

            assertThatThrownBy(() -> service.addAttribute(TENANT_ID, "ot-001", request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("already linked");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when attribute type missing")
        void shouldThrowNotFoundForMissingAttribute() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(attributeTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            AddAttributeRequest request = new AddAttributeRequest("missing", false, 0);

            assertThatThrownBy(() -> service.addAttribute(TENANT_ID, "ot-001", request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("removeAttribute")
    class RemoveAttribute {

        @Test
        @DisplayName("should remove linked attribute")
        void shouldRemoveAttribute() {
            HasAttributeRelationship existing = HasAttributeRelationship.builder()
                    .isRequired(false)
                    .displayOrder(0)
                    .attribute(sampleAttribute)
                    .build();
            sampleNode.setAttributes(new ArrayList<>(List.of(existing)));

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            service.removeAttribute(TENANT_ID, "ot-001", "at-001");

            assertThat(sampleNode.getAttributes()).isEmpty();
            verify(objectTypeRepository).save(sampleNode);
        }

        @Test
        @DisplayName("should throw NOT_FOUND when attribute not linked")
        void shouldThrowNotFoundForUnlinkedAttribute() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            assertThatThrownBy(() -> service.removeAttribute(TENANT_ID, "ot-001", "at-999"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not linked");
        }
    }

    @Nested
    @DisplayName("addConnection")
    class AddConnection {

        @Test
        @DisplayName("should add connection between object types")
        void shouldAddConnection() {
            ObjectTypeNode targetNode = ObjectTypeNode.builder()
                    .id("ot-002")
                    .tenantId(TENANT_ID)
                    .name("Application")
                    .typeKey("application")
                    .attributes(new ArrayList<>())
                    .connections(new ArrayList<>())
                    .build();

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.findByIdAndTenantId("ot-002", TENANT_ID))
                    .thenReturn(Optional.of(targetNode));
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            AddConnectionRequest request = new AddConnectionRequest(
                    "ot-002", "runs_on", "runs on", "hosts", "one-to-many", true);

            ObjectTypeDTO result = service.addConnection(TENANT_ID, "ot-001", request);

            assertThat(result.connections()).hasSize(1);
            assertThat(result.connections().get(0).targetObjectTypeId()).isEqualTo("ot-002");
            assertThat(result.connections().get(0).relationshipKey()).isEqualTo("runs_on");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when target object type missing")
        void shouldThrowNotFoundForMissingTarget() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            AddConnectionRequest request = new AddConnectionRequest(
                    "missing", "depends_on", "depends on", "is depended on by", "many-to-many", false);

            assertThatThrownBy(() -> service.addConnection(TENANT_ID, "ot-001", request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("removeConnection")
    class RemoveConnection {

        @Test
        @DisplayName("should remove existing connection successfully")
        void shouldRemoveConnection() {
            ObjectTypeNode targetNode = ObjectTypeNode.builder()
                    .id("ot-002").tenantId(TENANT_ID).name("Application").typeKey("application")
                    .attributes(new ArrayList<>()).connections(new ArrayList<>()).build();

            CanConnectToRelationship conn = CanConnectToRelationship.builder()
                    .relationshipKey("runs_on").activeName("runs on").passiveName("hosts")
                    .cardinality("one-to-many").isDirected(true).targetType(targetNode).build();

            sampleNode.getConnections().add(conn);

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.save(any(ObjectTypeNode.class))).thenAnswer(inv -> inv.getArgument(0));

            service.removeConnection(TENANT_ID, "ot-001", "ot-002");

            assertThat(sampleNode.getConnections()).isEmpty();
            verify(objectTypeRepository).save(sampleNode);
        }

        @Test
        @DisplayName("should throw NOT_FOUND when connection does not exist")
        void shouldThrowNotFoundForMissingConnection() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            assertThatThrownBy(() -> service.removeConnection(TENANT_ID, "ot-001", "ot-999"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("Attribute Types")
    class AttributeTypes {

        @Test
        @DisplayName("should list attribute types for tenant")
        void shouldListAttributeTypes() {
            when(attributeTypeRepository.findByTenantId(TENANT_ID))
                    .thenReturn(List.of(sampleAttribute));

            List<AttributeTypeDTO> result = service.listAttributeTypes(TENANT_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Hostname");
            assertThat(result.get(0).attributeKey()).isEqualTo("hostname");
        }

        @Test
        @DisplayName("should return empty list when no attribute types exist")
        void shouldReturnEmptyListWhenNoAttributeTypes() {
            when(attributeTypeRepository.findByTenantId(TENANT_ID))
                    .thenReturn(Collections.emptyList());

            List<AttributeTypeDTO> result = service.listAttributeTypes(TENANT_ID);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should create attribute type")
        void shouldCreateAttributeType() {
            AttributeTypeCreateRequest request = new AttributeTypeCreateRequest(
                    "IP Address", "ip_address", "string", "network",
                    "IPv4 or IPv6 address", null, null);

            when(attributeTypeRepository.save(any(AttributeTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            AttributeTypeDTO result = service.createAttributeType(TENANT_ID, request);

            assertThat(result.name()).isEqualTo("IP Address");
            assertThat(result.attributeKey()).isEqualTo("ip_address");
            assertThat(result.dataType()).isEqualTo("string");
            verify(attributeTypeRepository).save(any(AttributeTypeNode.class));
        }

        @Test
        @DisplayName("should create attribute type with all optional fields populated")
        void shouldCreateAttributeTypeWithAllFields() {
            AttributeTypeCreateRequest request = new AttributeTypeCreateRequest(
                    "CPU Cores", "cpu_cores", "integer", "hardware",
                    "Number of CPU cores", "4", "{\"min\":1,\"max\":128}");

            when(attributeTypeRepository.save(any(AttributeTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            AttributeTypeDTO result = service.createAttributeType(TENANT_ID, request);

            assertThat(result.name()).isEqualTo("CPU Cores");
            assertThat(result.attributeGroup()).isEqualTo("hardware");
            assertThat(result.defaultValue()).isEqualTo("4");
            assertThat(result.validationRules()).isEqualTo("{\"min\":1,\"max\":128}");
            assertThat(result.tenantId()).isEqualTo(TENANT_ID);
            assertThat(result.createdAt()).isNotNull();
            assertThat(result.updatedAt()).isNotNull();
        }

        @Test
        @DisplayName("should get attribute type by ID and tenant")
        void shouldGetAttributeType() {
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));

            AttributeTypeDTO result = service.getAttributeType(TENANT_ID, "at-001");

            assertThat(result.id()).isEqualTo("at-001");
            assertThat(result.name()).isEqualTo("Hostname");
            assertThat(result.dataType()).isEqualTo("string");
            assertThat(result.attributeGroup()).isEqualTo("general");
            assertThat(result.description()).isEqualTo("The server hostname");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when attribute type missing")
        void shouldThrowNotFoundForMissingAttributeType() {
            when(attributeTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getAttributeType(TENANT_ID, "missing"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should partially update attribute type")
        void shouldPartiallyUpdateAttributeType() {
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));
            when(attributeTypeRepository.save(any(AttributeTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            AttributeTypeUpdateRequest request = new AttributeTypeUpdateRequest(
                    "Updated Hostname", null, null, null, "Updated description", null, null);

            AttributeTypeDTO result = service.updateAttributeType(TENANT_ID, "at-001", request);

            assertThat(result.name()).isEqualTo("Updated Hostname");
            assertThat(result.description()).isEqualTo("Updated description");
            // Unchanged fields
            assertThat(result.attributeKey()).isEqualTo("hostname");
            assertThat(result.dataType()).isEqualTo("string");
        }

        @Test
        @DisplayName("should update all fields of attribute type")
        void shouldUpdateAllFieldsOfAttributeType() {
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));
            when(attributeTypeRepository.save(any(AttributeTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            AttributeTypeUpdateRequest request = new AttributeTypeUpdateRequest(
                    "FQDN", "fqdn", "text", "network", "Fully qualified domain name", "example.com", "{\"pattern\":\"^[a-z.]+$\"}");

            AttributeTypeDTO result = service.updateAttributeType(TENANT_ID, "at-001", request);

            assertThat(result.name()).isEqualTo("FQDN");
            assertThat(result.attributeKey()).isEqualTo("fqdn");
            assertThat(result.dataType()).isEqualTo("text");
            assertThat(result.attributeGroup()).isEqualTo("network");
            assertThat(result.description()).isEqualTo("Fully qualified domain name");
            assertThat(result.defaultValue()).isEqualTo("example.com");
            assertThat(result.validationRules()).isEqualTo("{\"pattern\":\"^[a-z.]+$\"}");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when updating non-existent attribute type")
        void shouldThrowNotFoundOnUpdateMissing() {
            when(attributeTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            AttributeTypeUpdateRequest request = new AttributeTypeUpdateRequest(
                    "Updated", null, null, null, null, null, null);

            assertThatThrownBy(() -> service.updateAttributeType(TENANT_ID, "missing", request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should delete attribute type not in use")
        void shouldDeleteAttributeTypeNotInUse() {
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(Collections.emptyList());

            service.deleteAttributeType(TENANT_ID, "at-001");

            verify(attributeTypeRepository).delete(sampleAttribute);
        }

        @Test
        @DisplayName("should throw CONFLICT when deleting attribute type in use")
        void shouldThrowConflictWhenDeletingInUseAttribute() {
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));

            HasAttributeRelationship rel = HasAttributeRelationship.builder()
                    .isRequired(true).displayOrder(0).attribute(sampleAttribute).build();
            ObjectTypeNode usingNode = ObjectTypeNode.builder()
                    .id("ot-002").tenantId(TENANT_ID).name("App").typeKey("app")
                    .attributes(new ArrayList<>(List.of(rel)))
                    .connections(new ArrayList<>())
                    .build();

            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(usingNode));

            assertThatThrownBy(() -> service.deleteAttributeType(TENANT_ID, "at-001"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("in use");

            verify(attributeTypeRepository, never()).delete(any());
        }

        @Test
        @DisplayName("should throw NOT_FOUND when deleting non-existent attribute type")
        void shouldThrowNotFoundOnDeleteMissing() {
            when(attributeTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteAttributeType(TENANT_ID, "missing"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should allow delete when object types exist but none use this attribute")
        void shouldAllowDeleteWhenAttributeNotUsedByAnyObjectType() {
            when(attributeTypeRepository.findByIdAndTenantId("at-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleAttribute));

            // Object type exists but uses a different attribute
            AttributeTypeNode differentAttr = AttributeTypeNode.builder()
                    .id("at-999").tenantId(TENANT_ID).name("Other").attributeKey("other").dataType("string").build();
            HasAttributeRelationship rel = HasAttributeRelationship.builder()
                    .isRequired(false).displayOrder(0).attribute(differentAttr).build();
            ObjectTypeNode nodeWithDifferentAttr = ObjectTypeNode.builder()
                    .id("ot-002").tenantId(TENANT_ID).name("App").typeKey("app")
                    .attributes(new ArrayList<>(List.of(rel)))
                    .connections(new ArrayList<>())
                    .build();

            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(nodeWithDifferentAttr));

            service.deleteAttributeType(TENANT_ID, "at-001");

            verify(attributeTypeRepository).delete(sampleAttribute);
        }
    }

    @Nested
    @DisplayName("duplicateObjectType")
    class DuplicateObjectType {

        @Test
        @DisplayName("should create a copy with user_defined state and (Copy) name")
        void shouldDuplicateWithNewKeyAndName() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.existsByTypeKeyAndTenantId(any(), eq(TENANT_ID)))
                    .thenReturn(false);
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(5L);
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.duplicateObjectType(TENANT_ID, "ot-001");

            assertThat(result.name()).isEqualTo("Server (Copy)");
            assertThat(result.state()).isEqualTo("user_defined");
            assertThat(result.code()).isEqualTo("OBJ_006");
            assertThat(result.typeKey()).contains("server_copy");
        }

        @Test
        @DisplayName("should append suffix to typeKey when copy key already exists")
        void shouldAppendSuffixWhenKeyConflicts() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.existsByTypeKeyAndTenantId("server_copy", TENANT_ID))
                    .thenReturn(true);
            when(objectTypeRepository.existsByTypeKeyAndTenantId("server_copy_1", TENANT_ID))
                    .thenReturn(false);
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(2L);
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.duplicateObjectType(TENANT_ID, "ot-001");

            assertThat(result.typeKey()).isEqualTo("server_copy_1");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when source does not exist")
        void shouldThrowNotFoundOnMissingSource() {
            when(objectTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.duplicateObjectType(TENANT_ID, "missing"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("restoreObjectType")
    class RestoreObjectType {

        @Test
        @DisplayName("should set state to default for customized object type")
        void shouldRestoreCustomizedToDefault() {
            ObjectTypeNode customizedNode = ObjectTypeNode.builder()
                    .id("ot-001").tenantId(TENANT_ID).name("Server").typeKey("server")
                    .code("OBJ_001").iconName("server").iconColor("#428177")
                    .status("active").state("customized")
                    .createdAt(Instant.now()).updatedAt(Instant.now())
                    .attributes(new ArrayList<>()).connections(new ArrayList<>())
                    .build();

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(customizedNode));
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.restoreObjectType(TENANT_ID, "ot-001");

            assertThat(result.state()).isEqualTo("default");
        }

        @Test
        @DisplayName("should throw CONFLICT when state is not customized")
        void shouldThrowConflictForNonCustomizedState() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode)); // state = user_defined

            assertThatThrownBy(() -> service.restoreObjectType(TENANT_ID, "ot-001"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("customized");
        }

        @Test
        @DisplayName("should throw NOT_FOUND when object type does not exist")
        void shouldThrowNotFoundOnMissing() {
            when(objectTypeRepository.findByIdAndTenantId("missing", TENANT_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.restoreObjectType(TENANT_ID, "missing"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("listObjectTypes - edge cases")
    class ListObjectTypesEdgeCases {

        @Test
        @DisplayName("should match search on typeKey")
        void shouldMatchSearchOnTypeKey() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode));

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, "server", null);

            assertThat(result.content()).hasSize(1);
            assertThat(result.content().get(0).typeKey()).isEqualTo("server");
        }

        @Test
        @DisplayName("should filter out non-matching status")
        void shouldFilterOutNonMatchingStatus() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode)); // status = active

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, null, "retired");

            assertThat(result.content()).isEmpty();
        }

        @Test
        @DisplayName("should handle blank search and blank status as no-filter")
        void shouldTreatBlankSearchAndStatusAsNoFilter() {
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.findByTenantId(eq(TENANT_ID), any(PageRequest.class)))
                    .thenReturn(List.of(sampleNode));

            PagedResponse<ObjectTypeDTO> result = service.listObjectTypes(TENANT_ID, 0, 20, "  ", "  ");

            assertThat(result.content()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("toDTO edge cases")
    class ToDTOEdgeCases {

        @Test
        @DisplayName("should handle node with null attributes and connections lists")
        void shouldHandleNullAttributesAndConnections() {
            ObjectTypeNode nodeWithNulls = ObjectTypeNode.builder()
                    .id("ot-002").tenantId(TENANT_ID).name("NullTest").typeKey("null_test")
                    .code("OBJ_002").iconName("box").iconColor("#428177")
                    .status("active").state("user_defined")
                    .createdAt(Instant.now()).updatedAt(Instant.now())
                    .build();
            nodeWithNulls.setAttributes(null);
            nodeWithNulls.setConnections(null);

            when(objectTypeRepository.findByIdAndTenantId("ot-002", TENANT_ID))
                    .thenReturn(Optional.of(nodeWithNulls));

            ObjectTypeDTO result = service.getObjectType(TENANT_ID, "ot-002");

            assertThat(result.attributes()).isEmpty();
            assertThat(result.connections()).isEmpty();
            assertThat(result.parentTypeId()).isNull();
        }

        @Test
        @DisplayName("should include parentTypeId when parentType is set")
        void shouldIncludeParentTypeId() {
            ObjectTypeNode parent = ObjectTypeNode.builder()
                    .id("parent-001").tenantId(TENANT_ID).name("Parent").typeKey("parent")
                    .build();
            sampleNode.setParentType(parent);

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            ObjectTypeDTO result = service.getObjectType(TENANT_ID, "ot-001");

            assertThat(result.parentTypeId()).isEqualTo("parent-001");
        }

        @Test
        @DisplayName("should map attributes with all relationship properties")
        void shouldMapAttributeRelationshipProperties() {
            HasAttributeRelationship rel = HasAttributeRelationship.builder()
                    .relId(42L)
                    .isRequired(true)
                    .displayOrder(5)
                    .attribute(sampleAttribute)
                    .build();
            sampleNode.setAttributes(new ArrayList<>(List.of(rel)));

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            ObjectTypeDTO result = service.getObjectType(TENANT_ID, "ot-001");

            assertThat(result.attributes()).hasSize(1);
            ObjectTypeDTO.AttributeReferenceDTO attrRef = result.attributes().get(0);
            assertThat(attrRef.relId()).isEqualTo(42L);
            assertThat(attrRef.attributeTypeId()).isEqualTo("at-001");
            assertThat(attrRef.name()).isEqualTo("Hostname");
            assertThat(attrRef.attributeKey()).isEqualTo("hostname");
            assertThat(attrRef.dataType()).isEqualTo("string");
            assertThat(attrRef.isRequired()).isTrue();
            assertThat(attrRef.displayOrder()).isEqualTo(5);
        }

        @Test
        @DisplayName("should map connections with all relationship properties")
        void shouldMapConnectionRelationshipProperties() {
            ObjectTypeNode target = ObjectTypeNode.builder()
                    .id("ot-target").tenantId(TENANT_ID).name("Target App").typeKey("target_app")
                    .attributes(new ArrayList<>()).connections(new ArrayList<>()).build();
            CanConnectToRelationship conn = CanConnectToRelationship.builder()
                    .relId(99L)
                    .relationshipKey("depends_on")
                    .activeName("depends on")
                    .passiveName("is depended on by")
                    .cardinality("many-to-many")
                    .isDirected(false)
                    .targetType(target)
                    .build();
            sampleNode.setConnections(new ArrayList<>(List.of(conn)));

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));

            ObjectTypeDTO result = service.getObjectType(TENANT_ID, "ot-001");

            assertThat(result.connections()).hasSize(1);
            var connDTO = result.connections().get(0);
            assertThat(connDTO.relId()).isEqualTo(99L);
            assertThat(connDTO.targetObjectTypeId()).isEqualTo("ot-target");
            assertThat(connDTO.targetObjectTypeName()).isEqualTo("Target App");
            assertThat(connDTO.relationshipKey()).isEqualTo("depends_on");
            assertThat(connDTO.activeName()).isEqualTo("depends on");
            assertThat(connDTO.passiveName()).isEqualTo("is depended on by");
            assertThat(connDTO.cardinality()).isEqualTo("many-to-many");
            assertThat(connDTO.isDirected()).isFalse();
        }
    }

    @Nested
    @DisplayName("duplicateObjectType - edge cases")
    class DuplicateObjectTypeEdgeCases {

        @Test
        @DisplayName("should copy attributes and connections from source")
        void shouldCopyAttributesAndConnections() {
            HasAttributeRelationship attrRel = HasAttributeRelationship.builder()
                    .isRequired(true).displayOrder(1).attribute(sampleAttribute).build();
            sampleNode.setAttributes(new ArrayList<>(List.of(attrRel)));

            ObjectTypeNode target = ObjectTypeNode.builder()
                    .id("ot-target").tenantId(TENANT_ID).name("Target").typeKey("target")
                    .attributes(new ArrayList<>()).connections(new ArrayList<>()).build();
            CanConnectToRelationship connRel = CanConnectToRelationship.builder()
                    .relationshipKey("link").targetType(target).build();
            sampleNode.setConnections(new ArrayList<>(List.of(connRel)));

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.existsByTypeKeyAndTenantId(any(), eq(TENANT_ID)))
                    .thenReturn(false);
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(1L);
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.duplicateObjectType(TENANT_ID, "ot-001");

            assertThat(result.attributes()).hasSize(1);
            assertThat(result.connections()).hasSize(1);
            assertThat(result.state()).isEqualTo("user_defined");
        }

        @Test
        @DisplayName("should handle source with null attributes and connections")
        void shouldHandleNullAttributesAndConnectionsOnSource() {
            sampleNode.setAttributes(null);
            sampleNode.setConnections(null);

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode));
            when(objectTypeRepository.existsByTypeKeyAndTenantId(any(), eq(TENANT_ID)))
                    .thenReturn(false);
            when(objectTypeRepository.countByTenantId(TENANT_ID)).thenReturn(0L);
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeDTO result = service.duplicateObjectType(TENANT_ID, "ot-001");

            assertThat(result.attributes()).isEmpty();
            assertThat(result.connections()).isEmpty();
        }
    }

    @Nested
    @DisplayName("updateObjectType state transitions")
    class UpdateObjectTypeStateTransition {

        @Test
        @DisplayName("should transition state from default to customized on update")
        void shouldTransitionDefaultToCustomized() {
            ObjectTypeNode defaultNode = ObjectTypeNode.builder()
                    .id("ot-001").tenantId(TENANT_ID).name("Server").typeKey("server")
                    .code("OBJ_001").iconName("server").iconColor("#428177")
                    .status("active").state("default")
                    .createdAt(Instant.now()).updatedAt(Instant.now())
                    .attributes(new ArrayList<>()).connections(new ArrayList<>())
                    .build();

            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(defaultNode));
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeUpdateRequest request = new ObjectTypeUpdateRequest(
                    "Renamed Server", null, null, null, null, null, null, null);

            ObjectTypeDTO result = service.updateObjectType(TENANT_ID, "ot-001", request);

            assertThat(result.state()).isEqualTo("customized");
        }

        @Test
        @DisplayName("should preserve user_defined state on update when no explicit state given")
        void shouldPreserveUserDefinedState() {
            when(objectTypeRepository.findByIdAndTenantId("ot-001", TENANT_ID))
                    .thenReturn(Optional.of(sampleNode)); // state = user_defined
            when(objectTypeRepository.save(any(ObjectTypeNode.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ObjectTypeUpdateRequest request = new ObjectTypeUpdateRequest(
                    "Renamed Server", null, null, null, null, null, null, null);

            ObjectTypeDTO result = service.updateObjectType(TENANT_ID, "ot-001", request);

            assertThat(result.state()).isEqualTo("user_defined");
        }
    }
}
