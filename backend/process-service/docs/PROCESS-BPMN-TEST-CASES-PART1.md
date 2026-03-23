# Process Service & BPMN Modeling Test Cases

## Test Summary

| Category | Count | Percentage |
|----------|-------|------------|
| Backend Unit Tests | 70 | 28% |
| Frontend Unit Tests | 55 | 22% |
| Integration Tests | 50 | 20% |
| E2E Tests | 35 | 14% |
| Edge Cases | 20 | 8% |
| Performance Tests | 10 | 4% |
| Security Tests | 10 | 4% |
| **Total** | **250** | **100%** |

## Test Coverage Matrix

| Component | Unit | Integration | E2E | Total |
|-----------|------|-------------|-----|-------|
| BpmnElementTypeEntity | 12 | 5 | - | 17 |
| BpmnElementTypeDTO | 8 | 3 | - | 11 |
| BpmnElementTypeRepository | 10 | 8 | - | 18 |
| BpmnElementTypeService | 15 | 10 | - | 25 |
| BpmnElementTypeController | 10 | 12 | 5 | 27 |
| BpmnElementTypeMapper | 8 | 2 | - | 10 |
| SecurityConfig | 7 | 5 | 3 | 15 |
| BpmnCanvasComponent | 25 | 5 | 15 | 45 |
| BpmnModelerService | 20 | 5 | 8 | 33 |
| BpmnElementRegistryService | 10 | 5 | 4 | 19 |
| BPMN Model Types | 10 | - | - | 10 |
| Edge Cases | 15 | 3 | 2 | 20 |

---

## 1. Backend Unit Tests

### 1.1 Entity Tests (BpmnElementTypeEntity)

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-001 | Entity creation with Builder | Create entity using @Builder pattern with all fields | Entity created with all fields populated correctly | P1-High |
| TC-PROC-002 | Entity default values | Create entity without optional fields | strokeWidth defaults to 2.0, sortOrder to 0, isActive to true | P1-High |
| TC-PROC-003 | Entity tenant_id null for system defaults | Create system-default entity with null tenantId | Entity valid with tenantId=null | P1-High |
| TC-PROC-004 | Entity UUID generation | Save entity without explicit ID | UUID auto-generated on persist | P2-Medium |
| TC-PROC-005 | Entity code length validation | Set code field to 100 characters | Entity valid, no truncation | P2-Medium |
| TC-PROC-006 | Entity code exceeds max length | Set code field to 101 characters | Validation error or truncation | P2-Medium |
| TC-PROC-007 | Entity strokeColor hex format | Set strokeColor to valid hex "#1E88E5" | Color stored correctly | P1-High |
| TC-PROC-008 | Entity fillColor hex format | Set fillColor to valid hex "#FFFFFF" | Color stored correctly | P1-High |
| TC-PROC-009 | Entity createdAt auto-population | Save new entity | createdAt populated with current timestamp | P2-Medium |
| TC-PROC-010 | Entity updatedAt auto-update | Update existing entity | updatedAt changed, createdAt unchanged | P2-Medium |
| TC-PROC-011 | Entity equals and hashCode | Compare two entities with same ID | equals returns true | P3-Low |
| TC-PROC-012 | Entity toString | Call toString on entity | Returns readable string with key fields | P3-Low |

### 1.2 DTO Tests (BpmnElementTypeDTO)

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-013 | DTO record creation | Create DTO with all fields | Record created correctly | P1-High |
| TC-PROC-014 | DTO builder pattern | Use @Builder to create DTO | DTO created via builder | P1-High |
| TC-PROC-015 | DTO null handling with @JsonInclude | Serialize DTO with null fields | Null fields excluded from JSON | P1-High |
| TC-PROC-016 | DTO ElementSizeDTO nested record | Create DTO with defaultSize populated | Nested record accessible | P2-Medium |
| TC-PROC-017 | DTO ElementSizeDTO null | Create DTO with null defaultSize | defaultSize is null in output | P2-Medium |
| TC-PROC-018 | DTO immutability | Attempt to modify DTO after creation | Compilation error (record immutability) | P2-Medium |
| TC-PROC-019 | DTO JSON serialization | Serialize DTO to JSON | Valid JSON with camelCase fields | P1-High |
| TC-PROC-020 | DTO JSON deserialization | Deserialize JSON to DTO | DTO populated correctly | P1-High |

### 1.3 ListResponse DTO Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-021 | ListResponse with elements | Create response with list of DTOs | elements list populated | P1-High |
| TC-PROC-022 | ListResponse with cssVariables | Create response with CSS variable map | cssVariables map accessible | P1-High |
| TC-PROC-023 | ListResponse total count | Create response, verify total matches list size | total equals elements.size() | P1-High |
| TC-PROC-024 | ListResponse empty list | Create response with empty elements | elements empty, total=0 | P2-Medium |
| TC-PROC-025 | ListResponse cssVariables empty | Create response with empty CSS map | cssVariables empty map | P2-Medium |

### 1.4 Repository Tests (BpmnElementTypeRepository)

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-026 | findAllSystemDefaults returns only null tenant | Query system defaults | Only entities with tenantId=null returned | P0-Critical |
| TC-PROC-027 | findAllSystemDefaults excludes inactive | Query with isActive=false records | Inactive records excluded | P1-High |
| TC-PROC-028 | findAllSystemDefaults ordering | Query system defaults | Results ordered by sortOrder, category, name | P2-Medium |
| TC-PROC-029 | findAllForTenant with tenant override | Tenant has override for element | Tenant override returned, not system default | P0-Critical |
| TC-PROC-030 | findAllForTenant fallback to system | Tenant has no override | System default returned | P0-Critical |
| TC-PROC-031 | findAllForTenant mixed results | Tenant has some overrides | Mix of tenant and system elements | P1-High |
| TC-PROC-032 | findByCodeForTenant tenant override | Tenant has override for code | Tenant-specific element returned | P1-High |
| TC-PROC-033 | findByCodeForTenant fallback | Tenant has no override for code | System default returned | P1-High |
| TC-PROC-034 | findByCodeAndTenantIdIsNull | Query system default by code | System default element returned | P1-High |
| TC-PROC-035 | findByCategory filtering | Query by category "task" | Only task elements returned | P2-Medium |

### 1.5 Service Tests (BpmnElementTypeServiceImpl)

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-036 | getAllElementTypes with null tenantId | Call with null tenant | System defaults returned | P0-Critical |
| TC-PROC-037 | getAllElementTypes with blank tenantId | Call with empty string tenant | System defaults returned | P0-Critical |
| TC-PROC-038 | getAllElementTypes with valid tenantId | Call with "tenant-1" | Tenant-specific or fallback elements | P0-Critical |
| TC-PROC-039 | getAllElementTypes CSS variables generated | Call getAllElementTypes | cssVariables map populated correctly | P1-High |
| TC-PROC-040 | getAllElementTypes CSS variable naming | Verify CSS variable format | Variables like --bpmn-task-stroke | P1-High |
| TC-PROC-041 | getAllElementTypes caching | Call twice with same tenant | Second call uses cache (verify with mock) | P1-High |
| TC-PROC-042 | getElementTypesByCategory valid category | Query category "gateway" | Gateway elements returned | P1-High |
| TC-PROC-043 | getElementTypesByCategory invalid category | Query category "invalid" | Empty list returned | P2-Medium |
| TC-PROC-044 | getElementTypesByCategory case insensitive | Query "TASK" vs "task" | Same results returned | P2-Medium |
| TC-PROC-045 | getElementTypeByCode found | Query existing code | Optional with value returned | P1-High |
| TC-PROC-046 | getElementTypeByCode not found | Query non-existent code | Empty Optional returned | P1-High |
| TC-PROC-047 | getElementTypeByCode tenant fallback | Query with tenant, no override | System default returned | P1-High |
| TC-PROC-048 | invalidateCache operation | Call invalidateCache | Cache evicted (verify with annotation) | P2-Medium |
| TC-PROC-049 | generateCssVariables stroke colors | Generate CSS for elements | Stroke colors as CSS variables | P1-High |
| TC-PROC-050 | generateCssVariables fill colors | Generate CSS for elements | Fill colors as CSS variables | P1-High |

### 1.6 Mapper Tests (BpmnElementTypeMapper)

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-051 | toDTO maps all fields | Map entity to DTO | All fields mapped correctly | P0-Critical |
| TC-PROC-052 | toDTO maps defaultSize | Entity has width/height | ElementSizeDTO created | P1-High |
| TC-PROC-053 | toDTO null width and height | Entity has null dimensions | defaultSize is null | P1-High |
| TC-PROC-054 | toDTO only width present | Entity has width but no height | ElementSizeDTO with null height | P2-Medium |
| TC-PROC-055 | toDTO only height present | Entity has height but no width | ElementSizeDTO with null width | P2-Medium |
| TC-PROC-056 | toDTO excludes tenantId | Map entity with tenantId | DTO does not expose tenantId | P1-High |
| TC-PROC-057 | toDTO excludes isActive | Map entity | DTO does not expose isActive | P2-Medium |
| TC-PROC-058 | toDTO excludes timestamps | Map entity | createdAt/updatedAt not in DTO | P2-Medium |

### 1.7 Controller Tests (BpmnElementTypeController)

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-059 | GET /element-types returns 200 | Call endpoint without tenant header | 200 OK with system defaults | P0-Critical |
| TC-PROC-060 | GET /element-types with X-Tenant-ID | Call with tenant header | 200 OK with tenant-specific data | P1-High |
| TC-PROC-061 | GET /element-types response structure | Verify response body | Contains elements, cssVariables, total | P1-High |
| TC-PROC-062 | GET /category/{category} valid | Call /category/task | 200 OK with task elements | P1-High |
| TC-PROC-063 | GET /category/{category} invalid | Call /category/nonexistent | 200 OK with empty list | P2-Medium |
| TC-PROC-064 | GET /code/{code} found | Call /code/bpmn:Task | 200 OK with element details | P1-High |
| TC-PROC-065 | GET /code/{code} not found | Call /code/bpmn:Invalid | 404 Not Found | P1-High |
| TC-PROC-066 | POST /cache/invalidate success | Call invalidate endpoint | 204 No Content | P2-Medium |
| TC-PROC-067 | Controller logging | Verify service called with correct params | Debug logs contain tenant info | P3-Low |
| TC-PROC-068 | Controller error handling | Service throws exception | Appropriate error response | P1-High |

### 1.8 Security Config Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PROC-069 | CSRF disabled | Verify CSRF config | CSRF protection disabled | P2-Medium |
| TC-PROC-070 | CORS disabled (gateway handles) | Verify CORS config | CORS disabled at service level | P2-Medium |
| TC-PROC-071 | Element-types endpoint public | Access without auth | 200 OK, no authentication required | P0-Critical |
| TC-PROC-072 | Actuator endpoints public | Access /actuator/health | 200 OK, no auth required | P1-High |
| TC-PROC-073 | Swagger endpoints public | Access /swagger-ui | 200 OK, no auth required | P2-Medium |
| TC-PROC-074 | Other endpoints require auth | Access non-public endpoint | 401 Unauthorized | P0-Critical |
| TC-PROC-075 | Stateless session management | Verify session config | STATELESS policy | P2-Medium |

---

## 2. Frontend Unit Tests

### 2.1 BPMN Model Types Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-BPMN-001 | BpmnElementType union type | Use valid type 'bpmn:Task' | TypeScript compiles | P1-High |
| TC-BPMN-002 | BpmnElementType invalid type | Use invalid type 'bpmn:Invalid' | TypeScript error | P1-High |
| TC-BPMN-003 | BpmnElement interface | Create object matching interface | Valid BpmnElement | P1-High |
| TC-BPMN-004 | ValidationError interface | Create validation error | Valid with elementId, message, severity | P1-High |
| TC-BPMN-005 | ProcessMetadata interface | Create process metadata | All fields accessible | P1-High |
| TC-BPMN-006 | ProcessStatus type | Use valid status 'draft' | Valid ProcessStatus | P2-Medium |
| TC-BPMN-007 | BpmnFileInfo interface | Create file info | Contains name, xml, metadata | P2-Medium |
| TC-BPMN-008 | ExportFormat type | Use 'bpmn', 'svg', 'png', 'pdf' | All valid | P2-Medium |
| TC-BPMN-009 | DEFAULT_ZOOM_CONFIG constants | Access zoom config | min=0.2, max=4, step=0.1, default=1 | P2-Medium |
| TC-BPMN-010 | generateBpmnId function | Generate ID | Returns unique ID with prefix | P1-High |

### 2.2 BPMN Model Utility Functions

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-BPMN-011 | generateBpmnId with prefix | Call with "Task" prefix | ID starts with "Task_" | P1-High |
| TC-BPMN-012 | generateBpmnId uniqueness | Generate multiple IDs | All IDs unique | P1-High |
| TC-BPMN-013 | createEmptyProcessMetadata | Create empty metadata | Default values populated | P1-High |
| TC-BPMN-014 | createEmptyProcessMetadata status | Create metadata | Status defaults to 'draft' | P2-Medium |
| TC-BPMN-015 | getDefaultBpmnXml no processId | Call without ID | Valid XML with generated process ID | P0-Critical |
| TC-BPMN-016 | getDefaultBpmnXml with processId | Call with "MyProcess" | XML contains MyProcess as ID | P1-High |
| TC-BPMN-017 | getDefaultBpmnXml structure | Parse default XML | Contains StartEvent, Task, EndEvent, flows | P1-High |
| TC-BPMN-018 | getDefaultBpmnXml valid BPMN | Validate against BPMN schema | Valid BPMN 2.0 XML | P1-High |

### 2.3 BpmnElementRegistryService Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-BPMN-019 | getElementTypes HTTP call | Call service method | HTTP GET to /api/process/element-types | P0-Critical |
| TC-BPMN-020 | getElementTypes with tenantId | Call with tenant | X-Tenant-ID header set | P1-High |
| TC-BPMN-021 | getElementTypes caching | Call twice | Second call uses cache (shareReplay) | P1-High |
| TC-BPMN-022 | getElementTypes error handling | API returns error | Fallback defaults used | P0-Critical |
| TC-BPMN-023 | getElementType by code | Get 'bpmn:Task' | Returns task element DTO | P1-High |
| TC-BPMN-024 | getElementType unknown code | Get 'bpmn:Unknown' | Returns undefined | P2-Medium |
| TC-BPMN-025 | getElementsByCategory | Get 'task' category | Returns all task types | P1-High |
| TC-BPMN-026 | getStrokeColor | Get stroke for 'bpmn:Task' | Returns teal color | P2-Medium |
| TC-BPMN-027 | getStrokeColor fallback | Get stroke for unknown | Returns default #585858 | P2-Medium |
| TC-BPMN-028 | getFillColor | Get fill for 'bpmn:Task' | Returns #FFFFFF | P2-Medium |
| TC-BPMN-029 | applyCssVariables | Load element types | CSS variables set on :root | P1-High |
| TC-BPMN-030 | refreshCache | Call refresh | Cache cleared, next call fetches | P2-Medium |
| TC-BPMN-031 | loading signal | During HTTP call | loading() returns true | P2-Medium |
| TC-BPMN-032 | error signal | API fails | error() contains message | P2-Medium |
| TC-BPMN-033 | getDefaultResponse | API unavailable | Returns hardcoded defaults | P1-High |

### 2.4 BpmnModelerService Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-BPMN-034 | setModeler initializes | Call setModeler | modeler instance stored | P0-Critical |
| TC-BPMN-035 | createNewDiagram | Call createNewDiagram | New diagram loaded, isDirty false | P0-Critical |
| TC-BPMN-036 | importDiagram valid XML | Import valid BPMN | Returns true, diagram loaded | P0-Critical |
| TC-BPMN-037 | importDiagram invalid XML | Import invalid XML | Returns false, error logged | P1-High |
| TC-BPMN-038 | exportDiagram BPMN format | Export as 'bpmn' | Returns valid XML string | P0-Critical |
| TC-BPMN-039 | exportDiagram SVG format | Export as 'svg' | Returns SVG string | P1-High |
| TC-BPMN-040 | saveDiagram | Call save | Updates currentXml, isDirty false | P1-High |
| TC-BPMN-041 | undo operation | After making change | Reverts change, canRedo true | P1-High |
| TC-BPMN-042 | redo operation | After undo | Reapplies change | P1-High |
| TC-BPMN-043 | deleteSelected | Select and delete | Element removed from diagram | P1-High |
| TC-BPMN-044 | zoomIn | Call zoomIn | zoomLevel increases by step | P2-Medium |
| TC-BPMN-045 | zoomOut | Call zoomOut | zoomLevel decreases by step | P2-Medium |
| TC-BPMN-046 | zoomFit | Call zoomFit | Diagram fits viewport | P2-Medium |
| TC-BPMN-047 | zoomReset | Call zoomReset | zoomLevel returns to 1 | P2-Medium |
| TC-BPMN-048 | setZoom boundary max | Set zoom to 5 | Clamped to max 4 | P2-Medium |
| TC-BPMN-049 | setZoom boundary min | Set zoom to 0.1 | Clamped to min 0.2 | P2-Medium |
| TC-BPMN-050 | updateElementName | Update element name | Element label changed | P1-High |
| TC-BPMN-051 | updateElementProperty | Update custom property | Property set on element | P2-Medium |
| TC-BPMN-052 | createElement | Create Task at position | Task added to canvas | P0-Critical |
| TC-BPMN-053 | createElement auto-naming | Create multiple tasks | Names Task 1, Task 2, etc. | P2-Medium |
| TC-BPMN-054 | connectElements | Connect two elements | Sequence flow created | P0-Critical |
| TC-BPMN-055 | canConnect valid | Check Task to Task | Returns true | P2-Medium |
| TC-BPMN-056 | canConnect invalid | Check EndEvent to Task | Returns false | P2-Medium |
| TC-BPMN-057 | validate | Validate diagram | Returns validation errors | P1-High |
| TC-BPMN-058 | validate unnamed tasks | Task without name | Warning returned | P2-Medium |
| TC-BPMN-059 | validate disconnected elements | Element with no connections | Error returned | P1-High |
| TC-BPMN-060 | selectElement | Select by ID | Element selected, signal updated | P1-High |
| TC-BPMN-061 | clearSelection | Clear selection | selectedElement is null | P2-Medium |
| TC-BPMN-062 | getViewportCenter | Get center | Returns x,y coordinates | P3-Low |
| TC-BPMN-063 | scrollToElement | Scroll to element | Canvas scrolls to element | P2-Medium |

### 2.5 BpmnCanvasComponent Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-BPMN-064 | Component initialization | Render component | Canvas container visible | P0-Critical |
| TC-BPMN-065 | Modeler initialization | AfterViewInit | bpmn-js modeler initialized | P0-Critical |
| TC-BPMN-066 | Element types loaded | Component init | Element types fetched from API | P1-High |
| TC-BPMN-067 | Context menu on right-click | Right-click element | Context menu appears | P1-High |
| TC-BPMN-068 | Context menu close on backdrop | Click backdrop | Context menu closes | P1-High |
| TC-BPMN-069 | Context menu delete action | Click delete in menu | Element deleted | P1-High |
| TC-BPMN-070 | Context menu copy action | Click copy in menu | Element copied to clipboard | P2-Medium |
| TC-BPMN-071 | Context menu for connection | Right-click sequence flow | Connection-specific menu shown | P2-Medium |
| TC-BPMN-072 | Context menu for pool/lane | Right-click participant | Pool-specific menu with lane options | P2-Medium |
| TC-BPMN-073 | Tooltip delay | Hover over element | Tooltip appears after 800ms | P2-Medium |
| TC-BPMN-074 | Tooltip hide on move | Move mouse while hovering | Tooltip hides | P2-Medium |
| TC-BPMN-075 | Keyboard shortcut Ctrl+S | Press Ctrl+S | Diagram saved | P1-High |
| TC-BPMN-076 | Keyboard shortcut Ctrl+Z | Press Ctrl+Z | Undo executed | P1-High |
| TC-BPMN-077 | Keyboard shortcut Ctrl+Y | Press Ctrl+Y | Redo executed | P1-High |
| TC-BPMN-078 | Keyboard shortcut ? | Press ? | Shortcuts help shown | P2-Medium |
| TC-BPMN-079 | Keyboard shortcut Delete | Select and press Delete | Element deleted | P1-High |
| TC-BPMN-080 | Minimap toggle | Call toggleMinimap | Minimap visibility changes | P2-Medium |
| TC-BPMN-081 | Grid dots toggle | Toggle grid dots | Grid visibility changes | P3-Low |
| TC-BPMN-082 | Loading overlay | During diagram load | Loading spinner visible | P2-Medium |
| TC-BPMN-083 | Add element from context menu | Click Add Element | Element created at position | P1-High |
| TC-BPMN-084 | Append element | Click append in context menu | Element appended with connection | P1-High |
| TC-BPMN-085 | Change element type | Use change type dropdown | Element type changed | P1-High |
| TC-BPMN-086 | Reset element size | Click reset size | Element returns to default size | P2-Medium |
| TC-BPMN-087 | Open properties panel | Click Properties | Panel opens | P1-High |
| TC-BPMN-088 | Palette submenu | Click palette category | Submenu with options appears | P2-Medium |

---

## 3. Integration Tests

### 3.1 API Integration Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-INT-001 | GET /element-types DB query | Call endpoint | Database queried correctly | P0-Critical |
| TC-INT-002 | GET /element-types JSON response | Call endpoint | Valid JSON structure returned | P0-Critical |
| TC-INT-003 | GET /element-types with tenant | Call with X-Tenant-ID | Tenant data queried | P1-High |
| TC-INT-004 | GET /category/{category} filtering | Call /category/event | Only event types returned | P1-High |
| TC-INT-005 | GET /code/{code} lookup | Call /code/bpmn:StartEvent | Single element returned | P1-High |
| TC-INT-006 | POST /cache/invalidate | Call invalidate | Cache cleared, next call fresh | P2-Medium |
| TC-INT-007 | CSS variables in response | GET /element-types | cssVariables map populated | P1-High |
| TC-INT-008 | Total count accuracy | GET /element-types | total matches elements array length | P2-Medium |
| TC-INT-009 | Sorting verification | GET /element-types | Elements sorted by sortOrder | P2-Medium |
| TC-INT-010 | Content-Type header | Any GET request | application/json returned | P2-Medium |

### 3.2 Database Integration Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-INT-011 | Entity persistence | Save new entity | Entity persisted with UUID | P0-Critical |
| TC-INT-012 | Entity update | Update existing entity | Changes persisted | P1-High |
| TC-INT-013 | Entity delete | Delete entity | Entity removed from DB | P1-High |
| TC-INT-014 | Unique constraint violation | Insert duplicate code/tenant | Exception thrown | P1-High |
| TC-INT-015 | Query by tenant null | Query system defaults | Only null tenant records | P1-High |
| TC-INT-016 | Query by tenant specific | Query with tenant ID | Correct records returned | P1-High |
| TC-INT-017 | Query fallback logic | Tenant with partial overrides | Mix of tenant and system | P1-High |
| TC-INT-018 | Query ordering | Query all elements | Ordered by sortOrder, category, name | P2-Medium |
| TC-INT-019 | Transaction rollback | Service throws mid-operation | Transaction rolled back | P1-High |
| TC-INT-020 | Connection pooling | Multiple concurrent requests | Connections properly managed | P2-Medium |

### 3.3 Frontend-Backend Integration Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-INT-021 | Frontend loads element types | Component initializes | API called, data loaded | P0-Critical |
| TC-INT-022 | CSS variables applied | Element types loaded | :root has BPMN CSS vars | P1-High |
| TC-INT-023 | Fallback on API error | API returns 500 | Default colors used | P1-High |
| TC-INT-024 | Tenant header propagation | Angular app with tenant | X-Tenant-ID sent to API | P1-High |
| TC-INT-025 | Response parsing | API returns data | DTOs correctly populated | P1-High |
| TC-INT-026 | Cache behavior | Reload component | Cached data used | P2-Medium |
| TC-INT-027 | Element colors in canvas | Load diagram | Elements use correct colors | P1-High |
| TC-INT-028 | Error display | API fails | Error message shown to user | P2-Medium |

### 3.4 Service-to-Service Integration

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-INT-029 | Controller calls Service | HTTP request | Service method invoked | P0-Critical |
| TC-INT-030 | Service calls Repository | Service method | Repository query executed | P0-Critical |
| TC-INT-031 | Service calls Mapper | Service returns DTO | Mapper.toDTO called | P1-High |
| TC-INT-032 | Caching integration | Multiple calls | Cache hit on second call | P1-High |
| TC-INT-033 | Cache eviction | Invalidate cache | Next call fetches fresh | P2-Medium |
| TC-INT-034 | Transaction propagation | Read-only transaction | Properly applied to queries | P2-Medium |
| TC-INT-035 | Logging integration | Service operations | Log statements generated | P3-Low |

### 3.5 Frontend Service Integration

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-INT-036 | Canvas uses ModelerService | Create element | Service createElement called | P0-Critical |
| TC-INT-037 | Registry provides colors | Get element type | Correct colors returned | P1-High |
| TC-INT-038 | Modeler updates signals | Change diagram | Signals updated reactively | P1-High |
| TC-INT-039 | Selection sync | Select element | selectedElement signal updated | P1-High |
| TC-INT-040 | Validation integration | Validate diagram | Errors displayed in UI | P1-High |
| TC-INT-041 | Export integration | Export diagram | Correct format generated | P1-High |
| TC-INT-042 | Import integration | Import XML | Diagram rendered correctly | P1-High |
| TC-INT-043 | Undo/Redo stack | Multiple operations | Command stack works correctly | P1-High |
| TC-INT-044 | Zoom sync | Zoom in | zoomLevel signal updated | P2-Medium |
| TC-INT-045 | Panel toggle | Open properties | isPanelOpen signal updated | P2-Medium |

### 3.6 BPMN-js Integration

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-INT-046 | Modeler initialization | Load bpmn-js | Modeler instance created | P0-Critical |
| TC-INT-047 | Dynamic imports | Load modules | All modules loaded successfully | P1-High |
| TC-INT-048 | Event bus subscription | Setup events | Events received correctly | P1-High |
| TC-INT-049 | Element registry | Get elements | Elements returned correctly | P1-High |
| TC-INT-050 | Modeling operations | Create/move/delete | Operations succeed | P0-Critical |

---

## 4. E2E Tests

### 4.1 Process Creation Workflow

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-E2E-001 | Load BPMN modeler page | Navigate to modeler | Canvas displayed, default diagram shown | P0-Critical |
| TC-E2E-002 | Create new process | Click New | Empty diagram with Start Event | P0-Critical |
| TC-E2E-003 | Add Task from palette | Drag Task to canvas | Task created at drop position | P0-Critical |
| TC-E2E-004 | Connect elements | Draw connection | Sequence flow created | P0-Critical |
| TC-E2E-005 | Complete simple process | Create Start-Task-End | Valid process created | P0-Critical |
| TC-E2E-006 | Save process | Click Save | Process saved, dirty flag cleared | P0-Critical |
| TC-E2E-007 | Reload saved process | Refresh page | Process restored correctly | P1-High |
| TC-E2E-008 | Export BPMN XML | Export as BPMN | Valid XML downloaded | P1-High |
| TC-E2E-009 | Export SVG | Export as SVG | Valid SVG downloaded | P1-High |
| TC-E2E-010 | Import existing BPMN | Upload XML file | Process loaded correctly | P1-High |

### 4.2 BPMN Canvas Interactions

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-E2E-011 | Select element | Click on Task | Task selected, highlighted | P0-Critical |
| TC-E2E-012 | Multi-select elements | Shift+Click | Multiple elements selected | P1-High |
| TC-E2E-013 | Move element | Drag element | Element repositioned | P0-Critical |
| TC-E2E-014 | Resize element | Drag resize handle | Element resized | P1-High |
| TC-E2E-015 | Delete element | Select and press Delete | Element removed | P0-Critical |
| TC-E2E-016 | Pan canvas | Space+Drag | Canvas panned | P1-High |
| TC-E2E-017 | Zoom with scroll | Ctrl+Scroll | Canvas zoomed | P1-High |
| TC-E2E-018 | Zoom fit to viewport | Click Fit button | Diagram fits view | P1-High |
| TC-E2E-019 | Undo action | Ctrl+Z after delete | Element restored | P0-Critical |
| TC-E2E-020 | Redo action | Ctrl+Y after undo | Element deleted again | P1-High |

### 4.3 Context Menu Operations

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-E2E-021 | Open context menu | Right-click element | Menu appears at cursor | P1-High |
| TC-E2E-022 | Copy element | Right-click > Copy | Element copied | P2-Medium |
| TC-E2E-023 | Paste element | Right-click > Paste | Element pasted | P2-Medium |
| TC-E2E-024 | Delete from menu | Right-click > Delete | Element deleted | P1-High |
| TC-E2E-025 | Change element type | Use change type | Element type changed | P1-High |
| TC-E2E-026 | Append element | Click append option | New element connected | P1-High |
| TC-E2E-027 | Add annotation | Click Add Annotation | Annotation created | P2-Medium |
| TC-E2E-028 | Add lane to pool | Right-click Pool > Add Lane | Lane added | P2-Medium |

### 4.4 Properties Panel

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-E2E-029 | Open properties | Select element > Properties | Panel opens | P1-High |
| TC-E2E-030 | Edit element name | Change name in panel | Element label updated | P1-High |
| TC-E2E-031 | Edit documentation | Add documentation | Documentation saved | P2-Medium |
| TC-E2E-032 | Close panel | Click close | Panel closes | P2-Medium |
| TC-E2E-033 | Panel updates on selection | Select different element | Panel shows new element | P1-High |

### 4.5 User Journeys

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-E2E-034 | Create approval workflow | Multi-step approval process | Complete workflow created | P1-High |
| TC-E2E-035 | Model with gateways | Exclusive and parallel gateways | Branching process created | P1-High |

---

## 5. Edge Cases

### 5.1 Input Validation Edge Cases

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-EDGE-001 | Empty element code | Query /code/ (empty) | 404 or validation error | P1-High |
| TC-EDGE-002 | Special characters in code | Query /code/bpmn%3ATask | Properly decoded and found | P1-High |
| TC-EDGE-003 | Very long tenant ID | 500 character tenant ID | Handled gracefully | P2-Medium |
| TC-EDGE-004 | Unicode in element name | Name with emojis/unicode | Stored and displayed correctly | P2-Medium |
| TC-EDGE-005 | HTML in element name | Name with <script> tags | HTML escaped, no XSS | P0-Critical |
| TC-EDGE-006 | Null category in query | /category/null | Empty result or error | P2-Medium |
| TC-EDGE-007 | Case sensitivity in code | bpmn:task vs bpmn:Task | Both handled correctly | P2-Medium |

### 5.2 Boundary Condition Edge Cases

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-EDGE-008 | Maximum elements in diagram | 1000 elements | Performance acceptable | P1-High |
| TC-EDGE-009 | Minimum zoom level | Zoom to 0.2 | No further zoom out | P2-Medium |
| TC-EDGE-010 | Maximum zoom level | Zoom to 4.0 | No further zoom in | P2-Medium |
| TC-EDGE-011 | Empty diagram | Create with no elements | Handled gracefully | P2-Medium |
| TC-EDGE-012 | Single element diagram | Only one start event | Valid diagram | P2-Medium |
| TC-EDGE-013 | Maximum element name length | 500 character name | Display truncated or wrapped | P2-Medium |

### 5.3 Error Handling Edge Cases

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-EDGE-014 | API timeout | Backend slow response | Loading state, then timeout | P1-High |
| TC-EDGE-015 | Network disconnection | Network fails mid-operation | Error message displayed | P1-High |
| TC-EDGE-016 | Invalid BPMN XML import | Import malformed XML | Error message, no crash | P1-High |
| TC-EDGE-017 | Concurrent modifications | Two users edit same diagram | Conflict handled | P1-High |
| TC-EDGE-018 | Browser memory limit | Very large diagram | Graceful degradation | P1-High |
| TC-EDGE-019 | Service unavailable | 503 from backend | Retry or fallback | P1-High |
| TC-EDGE-020 | Invalid JSON response | Malformed API response | Error logged, fallback used | P1-High |

---

## 6. Performance Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-PERF-001 | API response time | GET /element-types | < 200ms average | P0-Critical |
| TC-PERF-002 | API with cache | Second request | < 50ms (from cache) | P1-High |
| TC-PERF-003 | Element types load time | Initial page load | < 500ms for types to load | P1-High |
| TC-PERF-004 | Diagram render time | Load 100 element diagram | < 1s render time | P1-High |
| TC-PERF-005 | Zoom/pan responsiveness | Rapid zoom/pan | < 16ms frame time (60fps) | P2-Medium |
| TC-PERF-006 | Element creation latency | Create element | < 50ms visible response | P1-High |
| TC-PERF-007 | Connection drawing | Draw sequence flow | < 100ms completion | P2-Medium |
| TC-PERF-008 | Large diagram save | 500 element diagram | < 2s save time | P1-High |
| TC-PERF-009 | Concurrent API requests | 100 simultaneous requests | All complete < 5s | P1-High |
| TC-PERF-010 | Memory usage | 2 hour session | No memory leaks | P1-High |

---

## 7. Security Tests

| ID | Test Case | Description | Expected Result | Priority |
|----|-----------|-------------|-----------------|----------|
| TC-SEC-001 | XSS in element name | Inject script in name | Script not executed | P0-Critical |
| TC-SEC-002 | XSS in SVG icon | Malicious SVG content | Sanitized on render | P0-Critical |
| TC-SEC-003 | SQL injection in code | SQL in /code parameter | Query parameterized, no injection | P0-Critical |
| TC-SEC-004 | Tenant isolation | Tenant A requests Tenant B data | Access denied or not returned | P0-Critical |
| TC-SEC-005 | Authorization on cache invalidate | Call without auth | Requires authentication | P1-High |
| TC-SEC-006 | CSRF protection at gateway | Cross-site request | Blocked by gateway | P1-High |
| TC-SEC-007 | Content-Security-Policy | Check response headers | CSP headers present | P1-High |
| TC-SEC-008 | Input length limits | Very long inputs | Rejected or truncated | P1-High |
| TC-SEC-009 | Rate limiting | Excessive requests | Rate limited | P2-Medium |
| TC-SEC-010 | Audit logging | API calls | Calls logged for audit | P2-Medium |

---

## Test Environment Requirements

### Backend Test Environment
- Java 23
- Spring Boot 3.2.3
- H2 in-memory database for unit/integration tests
- PostgreSQL for E2E tests
- JUnit 5, Mockito
- Spring Boot Test

### Frontend Test Environment
- Angular 21+
- Jasmine/Karma for unit tests
- Cypress for E2E tests
- bpmn-js test utilities

### Test Data Requirements
- System default BPMN element types (seed data)
- Tenant-specific override test data
- Sample BPMN XML files for import tests
- Invalid XML files for error testing

---

## Entry/Exit Criteria

### Entry Criteria
1. Code complete and merged to test branch
2. Build passes with no compilation errors
3. Static analysis (SonarQube) passes quality gates
4. Seed data scripts available
5. Test environment deployed

### Exit Criteria
1. All P0-Critical tests pass (100%)
2. All P1-High tests pass (100%)
3. P2-Medium tests pass (>95%)
4. P3-Low tests pass (>90%)
5. No open critical or high severity defects
6. Performance metrics meet requirements
7. Security scan shows no critical vulnerabilities
8. Test coverage > 80% for backend, > 70% for frontend

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| bpmn-js version incompatibility | High | Medium | Pin version, test upgrades separately |
| Browser-specific rendering issues | Medium | Medium | Cross-browser E2E tests |
| Performance degradation with large diagrams | High | Medium | Load testing, pagination |
| CSS variable browser support | Low | Low | Fallback colors in service |
| Multi-tenant data leakage | Critical | Low | Extensive security testing |
| Cache invalidation failures | Medium | Low | Cache TTL, manual invalidation |

---

## Test Execution Schedule

| Phase | Duration | Tests |
|-------|----------|-------|
| Unit Testing | 3 days | TC-PROC-001 to TC-BPMN-088 |
| Integration Testing | 2 days | TC-INT-001 to TC-INT-050 |
| E2E Testing | 2 days | TC-E2E-001 to TC-E2E-035 |
| Edge Case Testing | 1 day | TC-EDGE-001 to TC-EDGE-020 |
| Performance Testing | 1 day | TC-PERF-001 to TC-PERF-010 |
| Security Testing | 1 day | TC-SEC-001 to TC-SEC-010 |
| Regression & Sign-off | 1 day | Full regression suite |

**Total Estimated Duration: 11 days**

---

## Appendix: Test Data

### Sample BPMN Element Types (Test Data)

```json
{
  "elements": [
    {
      "id": "1",
      "code": "bpmn:StartEvent",
      "name": "Start Event",
      "category": "event",
      "subCategory": "start",
      "strokeColor": "#52B415",
      "fillColor": "#E8F5E9",
      "strokeWidth": 2.0,
      "sortOrder": 100
    },
    {
      "id": "2",
      "code": "bpmn:Task",
      "name": "Task",
      "category": "task",
      "strokeColor": "#047481",
      "fillColor": "#FFFFFF",
      "strokeWidth": 2.0,
      "defaultSize": { "width": 100, "height": 80 },
      "sortOrder": 400
    }
  ]
}
```

### Sample Invalid BPMN XML (For Error Testing)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions>
  <!-- Missing required namespace declarations -->
  <bpmn:process id="Invalid">
    <bpmn:startEvent id="Start">
      <!-- Missing outgoing reference -->
    </bpmn:startEvent>
    <bpmn:endEvent id="End">
      <!-- Missing incoming reference -->
    </bpmn:endEvent>
    <!-- Missing sequence flow -->
  </bpmn:process>
  <!-- Missing diagram information -->
</bpmn:definitions>
```

---

*Document Version: 1.0*
*Created: 2026-02-24*
*Author: QA Lead*
*Review Status: Draft*
