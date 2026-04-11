// =============================================================================
// VOO3 Definitions Seed - ObjectType nodes for EMSIST definition-service
// =============================================================================
// Run against the definition-service Neo4j database.
// Replace $tenantId with your target tenant: 'master' or 'dda'
//
// Usage (Neo4j Browser or cypher-shell):
//   :param tenantId => 'master'
//   <paste this script>
//
// All statements use MERGE for idempotency (safe to re-run).
// =============================================================================

// ============================================================
// EA TRUTH — Business Architecture
// ============================================================

MERGE (n:ObjectType {typeKey: 'business_domain', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Business Domain', n.code = 'DEF_001',
  n.description = 'A distinct area of business activity with clear ownership and boundaries',
  n.iconName = 'globe', n.iconColor = '#2563EB', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'business_capability', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Business Capability', n.code = 'DEF_002',
  n.description = 'An ability or capacity the business possesses or needs to achieve its objectives',
  n.iconName = 'target', n.iconColor = '#7C3AED', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'business_process', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Business Process', n.code = 'DEF_003',
  n.description = 'A structured sequence of activities that produces a specific outcome',
  n.iconName = 'workflow', n.iconColor = '#059669', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'process_activity', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Process Activity', n.code = 'DEF_004',
  n.description = 'An individual task or step within a business process',
  n.iconName = 'activity', n.iconColor = '#059669', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'assessment', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Assessment', n.code = 'DEF_005',
  n.description = 'A formal evaluation of a business area, capability, or process against defined criteria',
  n.iconName = 'clipboard-check', n.iconColor = '#DC2626', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'action_plan', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Action Plan', n.code = 'DEF_006',
  n.description = 'A structured set of actions to address findings from an assessment or close an identified gap',
  n.iconName = 'list-todo', n.iconColor = '#EA580C', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'gap', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Gap', n.code = 'DEF_007',
  n.description = 'A shortfall between current and target state of a capability or process',
  n.iconName = 'alert-triangle', n.iconColor = '#DC2626', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

// ============================================================
// SOLUTION TRUTH — Application Architecture
// ============================================================

MERGE (n:ObjectType {typeKey: 'application', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Application', n.code = 'DEF_008',
  n.description = 'A software application that supports one or more business capabilities',
  n.iconName = 'app-window', n.iconColor = '#2563EB', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Application Component', n.code = 'DEF_009',
  n.description = 'A deployable or functional module within an application (microservice, library, UI module)',
  n.iconName = 'puzzle', n.iconColor = '#7C3AED', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'screen', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Screen', n.code = 'DEF_010',
  n.description = 'A user interface view or page provided by an application component',
  n.iconName = 'monitor', n.iconColor = '#0891B2', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'api_contract', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'API Contract', n.code = 'DEF_011',
  n.description = 'The formal specification of an API (REST, GraphQL, AsyncAPI, gRPC)',
  n.iconName = 'file-json', n.iconColor = '#0891B2', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'data_entity', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Data Entity', n.code = 'DEF_012',
  n.description = 'A data object or aggregate managed by an application component',
  n.iconName = 'database', n.iconColor = '#0891B2', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'rule', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Rule', n.code = 'DEF_013',
  n.description = 'A business or technical constraint enforced by an application component',
  n.iconName = 'shield-check', n.iconColor = '#DC2626', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'test_case', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Test Case', n.code = 'DEF_014',
  n.description = 'A defined scenario to verify that a component, screen, or API functions correctly',
  n.iconName = 'test-tube', n.iconColor = '#059669', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'code_asset', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Code Asset', n.code = 'DEF_015',
  n.description = 'A reusable code artifact such as a library, SDK, or shared module',
  n.iconName = 'file-code', n.iconColor = '#7C3AED', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

// ============================================================
// REALIZATION TRUTH
// ============================================================

MERGE (n:ObjectType {typeKey: 'capability_realization', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Capability Realization', n.code = 'DEF_016',
  n.description = 'The link between a business capability and the application(s) that realize it',
  n.iconName = 'link', n.iconColor = '#EA580C', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

// ============================================================
// CHANGE TRUTH — Project Management
// ============================================================

MERGE (n:ObjectType {typeKey: 'project_instance', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Project Instance', n.code = 'DEF_017',
  n.description = 'A time-boxed initiative with a defined scope, budget, and delivery outcome',
  n.iconName = 'folder-kanban', n.iconColor = '#EA580C', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'epic', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Epic', n.code = 'DEF_018',
  n.description = 'A large body of work that can be broken down into features and user stories',
  n.iconName = 'layers', n.iconColor = '#7C3AED', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'feature', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Feature', n.code = 'DEF_019',
  n.description = 'A user-visible capability or behavior delivered by one or more user stories',
  n.iconName = 'star', n.iconColor = '#EA580C', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'user_story', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'User Story', n.code = 'DEF_020',
  n.description = 'A short description of a desired behavior from the perspective of a user',
  n.iconName = 'book-open', n.iconColor = '#2563EB', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'task', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Task', n.code = 'DEF_021',
  n.description = 'A discrete unit of work assigned to a team member to implement part of a user story',
  n.iconName = 'check-square', n.iconColor = '#059669', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

// ============================================================
// AUDIT
// ============================================================

MERGE (n:ObjectType {typeKey: 'evidence_record', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Evidence Record', n.code = 'DEF_022',
  n.description = 'A documented proof artifact supporting an assessment finding or compliance claim',
  n.iconName = 'file-check', n.iconColor = '#059669', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'safety_assessment', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Safety Assessment', n.code = 'DEF_023',
  n.description = 'A formal evaluation of risks, hazards, and controls for a given process or system',
  n.iconName = 'shield', n.iconColor = '#DC2626', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

MERGE (n:ObjectType {typeKey: 'agent_exchange', tenantId: $tenantId})
ON CREATE SET
  n.id = randomUUID(), n.name = 'Agent Exchange', n.code = 'DEF_024',
  n.description = 'A recorded interaction between an AI agent and the system for traceability and audit',
  n.iconName = 'bot', n.iconColor = '#7C3AED', n.status = 'active',
  n.state = 'default', n.createdAt = datetime(), n.updatedAt = datetime();

// ============================================================
// CONNECTION DEFINITIONS (CAN_CONNECT_TO relationships)
// ============================================================

// 1. orchestrates_process: ApplicationComponent → BusinessProcess
MATCH (src:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
MATCH (tgt:ObjectType {typeKey: 'business_process', tenantId: $tenantId})
MERGE (src)-[r:CAN_CONNECT_TO {relationshipKey: 'orchestrates_process'}]->(tgt)
ON CREATE SET
  r.activeName = 'orchestrates', r.passiveName = 'is orchestrated by',
  r.cardinality = 'many-to-many', r.isDirected = true;

// 2. automates_activity: ApplicationComponent → ProcessActivity
MATCH (src:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
MATCH (tgt:ObjectType {typeKey: 'process_activity', tenantId: $tenantId})
MERGE (src)-[r:CAN_CONNECT_TO {relationshipKey: 'automates_activity'}]->(tgt)
ON CREATE SET
  r.activeName = 'automates', r.passiveName = 'is automated by',
  r.cardinality = 'many-to-many', r.isDirected = true;

// 3. supports_screen: ApplicationComponent → Screen
MATCH (src:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
MATCH (tgt:ObjectType {typeKey: 'screen', tenantId: $tenantId})
MERGE (src)-[r:CAN_CONNECT_TO {relationshipKey: 'supports_screen'}]->(tgt)
ON CREATE SET
  r.activeName = 'supports', r.passiveName = 'is supported by',
  r.cardinality = 'many-to-many', r.isDirected = true;

// 4. exposes_api: ApplicationComponent → ApiContract
MATCH (src:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
MATCH (tgt:ObjectType {typeKey: 'api_contract', tenantId: $tenantId})
MERGE (src)-[r:CAN_CONNECT_TO {relationshipKey: 'exposes_api'}]->(tgt)
ON CREATE SET
  r.activeName = 'exposes', r.passiveName = 'is exposed by',
  r.cardinality = 'one-to-many', r.isDirected = true;

// 5. owns_data_entity: ApplicationComponent → DataEntity
MATCH (src:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
MATCH (tgt:ObjectType {typeKey: 'data_entity', tenantId: $tenantId})
MERGE (src)-[r:CAN_CONNECT_TO {relationshipKey: 'owns_data_entity'}]->(tgt)
ON CREATE SET
  r.activeName = 'owns', r.passiveName = 'is owned by',
  r.cardinality = 'one-to-many', r.isDirected = true;

// 6. enforces_rule: ApplicationComponent → Rule
MATCH (src:ObjectType {typeKey: 'application_component', tenantId: $tenantId})
MATCH (tgt:ObjectType {typeKey: 'rule', tenantId: $tenantId})
MERGE (src)-[r:CAN_CONNECT_TO {relationshipKey: 'enforces_rule'}]->(tgt)
ON CREATE SET
  r.activeName = 'enforces', r.passiveName = 'is enforced by',
  r.cardinality = 'many-to-many', r.isDirected = true;
