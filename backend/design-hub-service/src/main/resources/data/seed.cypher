// =============================================================================
// Design Hub Service - Neo4j Seed Script
// Generated: 2026-03-13
// Source: Documentation/prototypes/screen-flow-playground.html
// Tenant: design-hub-default
// =============================================================================

// -- Clear existing design-hub data ------------------------------------------
MATCH (n) WHERE n.tenantId = 'design-hub-default' DETACH DELETE n;

// -- Constraints and Indexes -------------------------------------------------
CREATE CONSTRAINT screen_surfaceId_unique IF NOT EXISTS
  FOR (s:Screen) REQUIRE s.surfaceId IS UNIQUE;

CREATE INDEX screen_tenantId IF NOT EXISTS
  FOR (s:Screen) ON (s.tenantId);

CREATE INDEX screen_module IF NOT EXISTS
  FOR (s:Screen) ON (s.module);

CREATE CONSTRAINT touchpoint_touchpointId_unique IF NOT EXISTS
  FOR (t:Touchpoint) REQUIRE t.touchpointId IS UNIQUE;

CREATE CONSTRAINT interaction_interactionId_unique IF NOT EXISTS
  FOR (i:Interaction) REQUIRE i.interactionId IS UNIQUE;

CREATE CONSTRAINT journey_journeyId_unique IF NOT EXISTS
  FOR (j:Journey) REQUIRE j.journeyId IS UNIQUE;

CREATE CONSTRAINT journeystep_stepId_unique IF NOT EXISTS
  FOR (js:JourneyStep) REQUIRE js.stepId IS UNIQUE;

CREATE INDEX gap_tenantId IF NOT EXISTS
  FOR (g:Gap) ON (g.tenantId);

CREATE INDEX contentelement_tenantId IF NOT EXISTS
  FOR (c:ContentElement) ON (c.tenantId);

CREATE INDEX effect_tenantId IF NOT EXISTS
  FOR (e:Effect) ON (e.tenantId);

// =============================================================================
// SCREEN NODES (50 screens)
// =============================================================================

// ---- Core / Auth Screens ----
CREATE (s:Screen {
  surfaceId: 'SCR-AUTH', tenantId: 'design-hub-default',
  label: 'Login / Sign In', module: 'Core', routePath: '/auth/login',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SURF-APP-SHELL', tenantId: 'design-hub-default',
  label: 'App Shell', module: 'Core', routePath: null,
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SURF-HEADER', tenantId: 'design-hub-default',
  label: 'Header Bar', module: 'Core', routePath: null,
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: false,
  loadingStates: false, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SURF-NOTIF-DROPDOWN', tenantId: 'design-hub-default',
  label: 'Notification Dropdown', module: 'Core', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SURF-CHATBOT-FAB', tenantId: 'design-hub-default',
  label: 'Chatbot FAB', module: 'Core', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SURF-SESSION', tenantId: 'design-hub-default',
  label: 'Session Expiry Modal', module: 'Core', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: false, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AUTH-PWD-RESET-REQ', tenantId: 'design-hub-default',
  label: 'Password Reset Request', module: 'Core', routePath: '/auth/password-reset',
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AUTH-PWD-RESET-CONFIRM', tenantId: 'design-hub-default',
  label: 'Password Reset Confirm', module: 'Core', routePath: '/auth/password-reset/confirm',
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AUTH-MFA-SETUP', tenantId: 'design-hub-default',
  label: 'MFA Setup', module: 'Core', routePath: '/auth/mfa/setup',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AUTH-MFA-VERIFY', tenantId: 'design-hub-default',
  label: 'MFA Verification', module: 'Core', routePath: '/auth/mfa/verify',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

// ---- R04 Definition Management Screens ----
CREATE (s:Screen {
  surfaceId: 'SCR-01', tenantId: 'design-hub-default',
  label: 'Object Type List/Grid', module: 'R04', routePath: '/definitions/list',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-03', tenantId: 'design-hub-default',
  label: 'Create Wizard', module: 'R04', routePath: '/definitions/new',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T1', tenantId: 'design-hub-default',
  label: 'General Tab', module: 'R04', routePath: '/definitions/:id/general',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T2', tenantId: 'design-hub-default',
  label: 'Attributes Tab', module: 'R04', routePath: '/definitions/:id/attributes',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T3', tenantId: 'design-hub-default',
  label: 'Relations Tab', module: 'R04', routePath: '/definitions/:id/relations',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T4', tenantId: 'design-hub-default',
  label: 'Governance Tab', module: 'R04', routePath: '/definitions/:id/governance',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T5', tenantId: 'design-hub-default',
  label: 'Data Sources Tab', module: 'R04', routePath: '/definitions/:id/data-sources',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T6', tenantId: 'design-hub-default',
  label: 'Measures Categories Tab', module: 'R04', routePath: '/definitions/:id/measure-categories',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-T7', tenantId: 'design-hub-default',
  label: 'Measures Tab', module: 'R04', routePath: '/definitions/:id/measures',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-02-MAT', tenantId: 'design-hub-default',
  label: 'Maturity Configuration', module: 'R04', routePath: '/definitions/:id/maturity-config',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-04', tenantId: 'design-hub-default',
  label: 'Release Dashboard', module: 'R04', routePath: '/definitions/releases',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-04-M1', tenantId: 'design-hub-default',
  label: 'Release Detail Modal', module: 'R04', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: false, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-05', tenantId: 'design-hub-default',
  label: 'Maturity Dashboard', module: 'R04', routePath: '/definitions/maturity',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-06', tenantId: 'design-hub-default',
  label: 'Locale Management', module: 'R04', routePath: '/definitions/locale',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-GV', tenantId: 'design-hub-default',
  label: 'Graph Visualization', module: 'R04', routePath: '/definitions/graph',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AI', tenantId: 'design-hub-default',
  label: 'AI Insights Panel', module: 'R04', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-NOTIF', tenantId: 'design-hub-default',
  label: 'Notifications', module: 'R04', routePath: '/definitions/notifications',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-PROP', tenantId: 'design-hub-default',
  label: 'Propagation View', module: 'R04', routePath: '/definitions/propagate',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-DIFF', tenantId: 'design-hub-default',
  label: 'Diff View', module: 'R04', routePath: '/definitions/diff',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: false, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-MANDATE', tenantId: 'design-hub-default',
  label: 'Mandate Configuration', module: 'R04', routePath: '/definitions/mandates',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-EXPORT', tenantId: 'design-hub-default',
  label: 'Export View', module: 'R04', routePath: '/definitions/export',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

// ---- R05 AI Platform Screens ----
CREATE (s:Screen {
  surfaceId: 'SCR-AGT-LIST', tenantId: 'design-hub-default',
  label: 'Agent List (Card/Table)', module: 'R05', routePath: '/ai/agents',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-DETAIL', tenantId: 'design-hub-default',
  label: 'Agent Detail (Tabs)', module: 'R05', routePath: '/ai/agents/:id',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-BUILDER', tenantId: 'design-hub-default',
  label: 'Agent Builder (3-panel)', module: 'R05', routePath: '/ai/agents/builder',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-GALLERY', tenantId: 'design-hub-default',
  label: 'Template Gallery', module: 'R05', routePath: '/ai/agents/gallery',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-CHAT', tenantId: 'design-hub-default',
  label: 'Chat Interface', module: 'R05', routePath: '/ai/agents/chat',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-NOTIF', tenantId: 'design-hub-default',
  label: 'Notification Center', module: 'R05', routePath: '/ai/notifications',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-AUDIT', tenantId: 'design-hub-default',
  label: 'Audit Log Viewer', module: 'R05', routePath: '/ai/audit',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-PIPELINE', tenantId: 'design-hub-default',
  label: 'Pipeline Run Viewer', module: 'R05', routePath: '/ai/agents/pipelines',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-RBAC', tenantId: 'design-hub-default',
  label: 'RBAC Matrix', module: 'R05', routePath: '/ai/admin/rbac',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-SETTINGS', tenantId: 'design-hub-default',
  label: 'AI Module Settings', module: 'R05', routePath: '/ai/admin/settings',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-COST', tenantId: 'design-hub-default',
  label: 'Token/Cost Dashboard', module: 'R05', routePath: '/ai/analytics/cost',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-KNOWLEDGE', tenantId: 'design-hub-default',
  label: 'Knowledge Source Manager', module: 'R05', routePath: '/ai/agents/:id/knowledge',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-TRAIN', tenantId: 'design-hub-default',
  label: 'Training Dashboard', module: 'R05', routePath: '/ai/agents/:id/training',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-EVAL', tenantId: 'design-hub-default',
  label: 'Eval/Benchmark Dashboard', module: 'R05', routePath: '/ai/agents/:id/eval',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-HITL', tenantId: 'design-hub-default',
  label: 'HITL Approval Queue', module: 'R05', routePath: '/ai/agents/hitl',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-ANALYTICS', tenantId: 'design-hub-default',
  label: 'Analytics Dashboard', module: 'R05', routePath: '/ai/analytics',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-ORCH', tenantId: 'design-hub-default',
  label: 'Orchestration Dashboard', module: 'R05', routePath: '/ai/agents/orchestration',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-HISTORY', tenantId: 'design-hub-default',
  label: 'Version History Panel', module: 'R05', routePath: '/ai/agents/:id/history',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-IMPORT', tenantId: 'design-hub-default',
  label: 'Import/Export', module: 'R05', routePath: '/ai/agents/import-export',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-COMPARE', tenantId: 'design-hub-default',
  label: 'Agent Comparison', module: 'R05', routePath: '/ai/agents/compare',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-WORKSPACE', tenantId: 'design-hub-default',
  label: 'Agent Workspace', module: 'R05', routePath: '/ai/agents/workspace',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-EMBED', tenantId: 'design-hub-default',
  label: 'Embedded Agent Panel', module: 'R05', routePath: '/ai/agents/embed',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: false,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-TRIGGERS', tenantId: 'design-hub-default',
  label: 'Event Trigger Management', module: 'R05', routePath: '/ai/agents/triggers',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-MATURITY', tenantId: 'design-hub-default',
  label: 'Maturity Dashboard', module: 'R05', routePath: '/ai/agents/maturity',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-SKILL-EDITOR', tenantId: 'design-hub-default',
  label: 'Skill Editor', module: 'R05', routePath: '/ai/agents/:id/skills/editor',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-AGT-NOTIF-PREFS', tenantId: 'design-hub-default',
  label: 'Notification Preferences', module: 'R05', routePath: '/ai/notifications/preferences',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: true, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

// ---- R06 Localization Screens ----
CREATE (s:Screen {
  surfaceId: 'SCR-LM-LANG', tenantId: 'design-hub-default',
  label: 'Languages Tab', module: 'R06', routePath: '/localization/languages',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-DICT', tenantId: 'design-hub-default',
  label: 'Dictionary Tab', module: 'R06', routePath: '/localization/dictionary',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-IMPORT', tenantId: 'design-hub-default',
  label: 'Import/Export Tab', module: 'R06', routePath: '/localization/import-export',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-ROLL', tenantId: 'design-hub-default',
  label: 'Rollback Tab', module: 'R06', routePath: '/localization/rollback',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-AI', tenantId: 'design-hub-default',
  label: 'Agentic Translation Tab', module: 'R06', routePath: '/localization/ai-translation',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-FORMAT', tenantId: 'design-hub-default',
  label: 'Format Config Accordion', module: 'R06', routePath: '/localization/format-config',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: false, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-OVERRIDE', tenantId: 'design-hub-default',
  label: 'Tenant Overrides Sub-Tab', module: 'R06', routePath: '/localization/overrides',
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: true,
  loadingStates: true, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-SWITCHER-AUTH', tenantId: 'design-hub-default',
  label: 'Language Switcher (Auth)', module: 'R06', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: false, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

CREATE (s:Screen {
  surfaceId: 'SCR-LM-SWITCHER-ANON', tenantId: 'design-hub-default',
  label: 'Language Switcher (Login)', module: 'R06', routePath: null,
  designStatus: 'SPECIFIED', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  wcag: 'AAA', responsive: true, roleAdaptive: false, deepLinkable: false,
  loadingStates: false, messageRegistryCount: 0, notes: null,
  createdAt: datetime(), updatedAt: datetime()
});

// =============================================================================
// GAP NODES + HAS_GAP RELATIONSHIPS
// =============================================================================

// SCR-01 gaps
MATCH (s:Screen {surfaceId: 'SCR-01'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Edge Case',
  description: 'No requirement for concurrent list refresh when another user adds object types. RESOLVED: List auto-refreshes via polling every 30s; a toast notification appears if the item count changes.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'info', severity: 'Missing Requirement',
  description: 'Pagination behavior when items deleted during browsing not specified. RESOLVED: When current page becomes empty, system navigates to page max(1, currentPage-1).',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-03 gaps
MATCH (s:Screen {surfaceId: 'SCR-03'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Validation',
  description: 'Max length for object type name not enforced in wizard step 1. RESOLVED: Name field max=255 chars enforced on input element and validated server-side returning DEF-E-002.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'info', severity: 'Missing Edge Case',
  description: 'Browser back button behavior during multi-step wizard not specified. RESOLVED: Browser back button triggers "Unsaved changes" confirmation dialog via CanDeactivate guard.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-T1 gap
MATCH (s:Screen {surfaceId: 'SCR-02-T1'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Edge Case',
  description: 'Concurrent edit detection (DEF-W-001) stale object message timing not specified. RESOLVED: On 409 Conflict response, stale-object banner appears with Reload/Force Save/Cancel actions.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-T2 gaps
MATCH (s:Screen {surfaceId: 'SCR-02-T2'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'error', severity: 'Missing Error Handling',
  description: 'Circular attribute inheritance not validated. RESOLVED: Error code DEF-E-028 reserved. Server validates inheritance graph; if cycle detected returns HTTP 422.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Validation',
  description: 'Attribute name uniqueness scope not clarified. RESOLVED: Attribute technical_name must be unique per object type (not globally). Duplicate within same type returns DEF-E-020.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-T3 gaps
MATCH (s:Screen {surfaceId: 'SCR-02-T3'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Edge Case',
  description: 'Self-referencing connections not addressed. RESOLVED: Self-referencing connections ARE allowed. Self-loop is rendered as curved arc on the node.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'info', severity: 'Missing Requirement',
  description: 'Connection cardinality display not specified in UI. RESOLVED: Cardinality displayed as badge using crow-foot notation labels: 1:1, 1:N, N:M. Default is N:M.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-T4 gaps
MATCH (s:Screen {surfaceId: 'SCR-02-T4'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'error', severity: 'Missing Screen',
  description: 'Workflow approval queue screen referenced but not defined. RESOLVED: SCR-AGT-HITL serves as unified approval queue.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Permission Check',
  description: 'RBAC for governance actions not specified per role. RESOLVED: SA+TA for Add/Edit/Delete Workflow, SA+TA+AD for toggles, SA only for Mandate toggle.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-T5 gaps
MATCH (s:Screen {surfaceId: 'SCR-02-T5'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'error', severity: 'Missing Error Handling',
  description: 'Data source connection timeout handling not specified. RESOLVED: 10s timeout returns DEF-E-110. Scheduled syncs set source status to Error.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Validation',
  description: 'Credential validation for external data sources not defined. RESOLVED: Step 2 validates required fields, password min 8 chars, URL format. DEF-E-111/DEF-E-112.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-T7 gap
MATCH (s:Screen {surfaceId: 'SCR-02-T7'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Validation',
  description: 'Measure value range constraints not specified. RESOLVED: Numeric values, min=0, precision 4 decimal places. Warning < critical threshold enforced via DEF-E-085/DEF-E-086.',
  createdAt: datetime(), updatedAt: datetime()
});

// SCR-02-MAT gaps
MATCH (s:Screen {surfaceId: 'SCR-02-MAT'})
CREATE (s)-[:HAS_GAP]->(g:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'warning', severity: 'Missing Validation',
  description: 'Maturity axis weight must sum to 100% validation rule not defined. RESOLVED: Coupled sliders redistribute remainder. Save blocked if sum != 100. DEF-E-071.',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (s)-[:HAS_GAP]->(g2:Gap {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'info', severity: 'Missing Edge Case',
  description: 'Recalculation trigger when maturity criteria change mid-assessment. RESOLVED: Saving new weight config triggers async background recalculation job.',
  createdAt: datetime(), updatedAt: datetime()
});

// =============================================================================
// CONTENT ELEMENT NODES + HAS_CONTENT RELATIONSHIPS (selected key screens)
// =============================================================================

// SCR-AUTH content
MATCH (s:Screen {surfaceId: 'SCR-AUTH'})
CREATE (s)-[:HAS_CONTENT]->(c1:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Sign in with Email Button', type: 'Primary Button', description: 'Animates signin-card-stage into view with email/password form', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c2:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Email Input', type: 'Text Input', description: 'Validates email format on blur', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c3:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Password Input', type: 'Password Input', description: 'Masked input with show/hide toggle', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c4:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Sign In Submit', type: 'Primary Button', description: 'Authenticates via Keycloak OIDC, stores JWT, redirects to role-based landing', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c5:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Forgot Password Link', type: 'Text Link', description: 'Currently mailto only (GAP-AUTH-01: no self-service reset flow)', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c6:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Back Button', type: 'Icon Button', description: 'Animates form out, returns to initial signin-section', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c7:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Error Banner', type: 'Alert Banner', description: 'Displays auth error message with icon, dismissible', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c8:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Language Switcher (Login)', type: 'Pill Buttons', description: 'Rerenders login page in selected language, preference stored in localStorage', createdAt: datetime(), updatedAt: datetime()});

// SCR-01 content
MATCH (s:Screen {surfaceId: 'SCR-01'})
CREATE (s)-[:HAS_CONTENT]->(c1:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Table/Card View Toggle', type: 'Toggle Group', description: 'Switch between table, card, and graph layout views', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c2:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Search Bar', type: 'Text Input', description: 'Full-text search across object type names, typeKey, and code (debounce 300ms)', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c3:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Status Filter', type: 'Dropdown', description: 'Filter by lifecycle status (Planned/Active/Hold/Retired)', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c4:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'FAB (+) Create', type: 'Floating Button', description: 'Opens Create Object Type Wizard overlay', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c5:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Pagination Controls', type: 'Paginator', description: 'Page navigation with size selector (default 25, max 100)', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c6:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Cross-Tenant Toggle', type: 'Toggle Switch', description: 'Super Admin only: shows types from all tenants with tenant column', createdAt: datetime(), updatedAt: datetime()});

// SCR-AGT-LIST content
MATCH (s:Screen {surfaceId: 'SCR-AGT-LIST'})
CREATE (s)-[:HAS_CONTENT]->(c1:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'View Toggle (Card/Table)', type: 'Toggle', description: 'Switches between card grid and table view; mobile defaults to card', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c2:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Search Input', type: 'Text Input', description: 'Filters agents by name, type, status', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c3:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Filter Chips', type: 'Chip Group', description: 'Filter by status (Active/Draft/Training/Archived), type, domain', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c4:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: '+ New Agent Button', type: 'Button', description: 'Navigates to Template Gallery or Agent Builder; hidden for USR/VW', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c5:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Favorite Star', type: 'Icon Toggle', description: 'Marks agent as favorite, persists per user', createdAt: datetime(), updatedAt: datetime()});

// SCR-AGT-CHAT content
MATCH (s:Screen {surfaceId: 'SCR-AGT-CHAT'})
CREATE (s)-[:HAS_CONTENT]->(c1:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Agent Selector', type: 'Dropdown', description: 'Lists active agents for current tenant; select to start/switch conversation', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c2:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Message Input', type: 'Textarea', description: 'Type message, send via Enter or Send button; max 4096 tokens per request', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c3:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Thinking Indicator', type: 'Animation', description: 'Shows during processing with elapsed timer', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c4:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Rating Thumbs', type: 'Icon Buttons', description: 'Rate response quality (thumbs up/down)', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c5:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Conversation History', type: 'Sidebar List', description: 'Previous conversations list; click to load', createdAt: datetime(), updatedAt: datetime()});

// SCR-AGT-BUILDER content
MATCH (s:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (s)-[:HAS_CONTENT]->(c1:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Left Panel - Config', type: 'Form Panel', description: 'Agent properties: name, description, model, temperature, max tokens', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c2:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Center Panel - Canvas', type: 'Visual Editor', description: 'Drag-and-drop skill/tool wiring canvas', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c3:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Right Panel - Preview', type: 'Chat Preview', description: 'Live test chat panel to test agent configuration', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c4:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Skill Palette', type: 'Drag Source', description: 'Available skills to drag onto canvas', createdAt: datetime(), updatedAt: datetime()})
CREATE (s)-[:HAS_CONTENT]->(c5:ContentElement {id: randomUUID(), tenantId: 'design-hub-default', element: 'Save Button', type: 'Primary Button', description: 'Saves current builder state', createdAt: datetime(), updatedAt: datetime()});

// =============================================================================
// TOUCHPOINT NODES + TARGETS RELATIONSHIPS (9 touchpoints)
// =============================================================================

MATCH (s:Screen {surfaceId: 'SCR-AGT-LIST'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-AGT-DOCK', tenantId: 'design-hub-default',
  label: 'Agent Manager dock entry', surfaceId: 'SCR-AGT-LIST',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SURF-NOTIF-DROPDOWN'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-NOTIF-CLICK', tenantId: 'design-hub-default',
  label: 'Notification bell click', surfaceId: 'SURF-NOTIF-DROPDOWN',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SCR-AGT-GALLERY'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-GALLERY-MENU', tenantId: 'design-hub-default',
  label: 'Gallery menu entry', surfaceId: 'SCR-AGT-GALLERY',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SCR-AGT-CHAT'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-CHAT-FAB', tenantId: 'design-hub-default',
  label: 'Chatbot FAB entry', surfaceId: 'SCR-AGT-CHAT',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SCR-AUTH'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-AUTH-DIRECT', tenantId: 'design-hub-default',
  label: 'Direct login URL', surfaceId: 'SCR-AUTH',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SCR-AUTH-PWD-RESET-REQ'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-PWD-RESET-LINK', tenantId: 'design-hub-default',
  label: 'Password reset link', surfaceId: 'SCR-AUTH-PWD-RESET-REQ',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SCR-01'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-R04-DOCK', tenantId: 'design-hub-default',
  label: 'Definition Manager dock entry', surfaceId: 'SCR-01',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SCR-LM-LANG'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-R06-SETTINGS', tenantId: 'design-hub-default',
  label: 'Localization settings entry', surfaceId: 'SCR-LM-LANG',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

MATCH (s:Screen {surfaceId: 'SURF-HEADER'})
CREATE (t:Touchpoint {
  touchpointId: 'TP-GLOBAL-SEARCH', tenantId: 'design-hub-default',
  label: 'Global search entry', surfaceId: 'SURF-HEADER',
  createdAt: datetime(), updatedAt: datetime()
})-[:TARGETS]->(s);

// =============================================================================
// INTERACTION NODES + ON_SCREEN + EFFECT NODES + HAS_EFFECT + NAVIGATES_TO
// =============================================================================

// -- INT-G-001: Logo/Home link on Header --
MATCH (scr:Screen {surfaceId: 'SURF-HEADER'})
CREATE (i:Interaction {
  interactionId: 'INT-G-001', tenantId: 'design-hub-default',
  surfaceId: 'SURF-HEADER', element: 'Logo / Home link', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-LIST', targetMode: 'role-based',
  resolutionRule: 'role-landing-map',
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-G-002: Global search input --
MATCH (scr:Screen {surfaceId: 'SURF-HEADER'})
CREATE (i:Interaction {
  interactionId: 'INT-G-002', tenantId: 'design-hub-default',
  surfaceId: 'SURF-HEADER', element: 'Global search input', trigger: 'type',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e1:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'filter', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (i)-[:HAS_EFFECT]->(e2:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-LIST', targetMode: 'resolved',
  resolutionRule: 'entity-type-to-screen-map',
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-G-003: Notification item click --
MATCH (scr:Screen {surfaceId: 'SURF-NOTIF-DROPDOWN'})
CREATE (i:Interaction {
  interactionId: 'INT-G-003', tenantId: 'design-hub-default',
  surfaceId: 'SURF-NOTIF-DROPDOWN', element: 'Notification item', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-LIST', targetMode: 'resolved',
  resolutionRule: 'entity-type-to-screen-map',
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-G-004: Extend session button --
MATCH (scr:Screen {surfaceId: 'SURF-SESSION'})
CREATE (i:Interaction {
  interactionId: 'INT-G-004', tenantId: 'design-hub-default',
  surfaceId: 'SURF-SESSION', element: 'Extend session button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'close-overlay', target: 'SURF-SESSION', targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-AGT-LIST-001: Agent card click --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-LIST'})
MATCH (nav:Screen {surfaceId: 'SCR-AGT-DETAIL'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-AGT-LIST-001', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-LIST', element: 'Agent card', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-DETAIL', targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:NAVIGATES_TO]->(nav);

// -- INT-R05-AGT-LIST-002: Create Agent button --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-LIST'})
MATCH (nav:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-AGT-LIST-002', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-LIST', element: 'Create Agent button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-BUILDER', targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:NAVIGATES_TO]->(nav);

// -- INT-R05-AGT-LIST-003: Delete agent --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-LIST'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-AGT-LIST-003', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-LIST', element: 'Delete agent action', trigger: 'click',
  permission: null, confirmationCode: 'CONFIRM-AGT-DELETE',
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'mutation', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-BUILDER-001: Drag-drop component --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-BUILDER-001', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-BUILDER', element: 'Component from palette', trigger: 'drag-drop',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'mutation', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-BUILDER-002: Save Draft --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-BUILDER-002', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-BUILDER', element: 'Save Draft button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e1:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'mutation', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (i)-[:HAS_EFFECT]->(e2:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'toast', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-BUILDER-003: Test in Playground --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-BUILDER-003', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-BUILDER', element: 'Test in Playground button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-PLAYGROUND', targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-BUILDER-004: Publish Agent --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-BUILDER-004', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-BUILDER', element: 'Publish Agent button', trigger: 'click',
  permission: null, confirmationCode: 'CONFIRM-AGT-PUBLISH',
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e1:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'mutation', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (i)-[:HAS_EFFECT]->(e2:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'toast', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-GALLERY-001: Template card click --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-GALLERY'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-GALLERY-001', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-GALLERY', element: 'Template card', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'open-drawer', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-GALLERY-002: Category filter --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-GALLERY'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-GALLERY-002', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-GALLERY', element: 'Category filter', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'filter', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-GALLERY-003: Fork template --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-GALLERY'})
MATCH (nav:Screen {surfaceId: 'SCR-AGT-BUILDER'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-GALLERY-003', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-GALLERY', element: 'Fork template button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'navigate', target: 'SCR-AGT-BUILDER', targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:NAVIGATES_TO]->(nav);

// -- INT-R05-CHAT-001: Send message --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-CHAT'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-CHAT-001', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-CHAT', element: 'Message input', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e1:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'mutation', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (i)-[:HAS_EFFECT]->(e2:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'stream-start', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-CHAT-002: Stop generation --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-CHAT'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-CHAT-002', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-CHAT', element: 'Stop generation button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'stream-stop', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// -- INT-R05-CHAT-003: Escalate to human --
MATCH (scr:Screen {surfaceId: 'SCR-AGT-CHAT'})
CREATE (i:Interaction {
  interactionId: 'INT-R05-CHAT-003', tenantId: 'design-hub-default',
  surfaceId: 'SCR-AGT-CHAT', element: 'Escalate to human button', trigger: 'click',
  permission: null, confirmationCode: null,
  createdAt: datetime(), updatedAt: datetime()
})-[:ON_SCREEN]->(scr)
CREATE (i)-[:HAS_EFFECT]->(e1:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'mutation', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (i)-[:HAS_EFFECT]->(e2:Effect {
  id: randomUUID(), tenantId: 'design-hub-default',
  type: 'toast', target: null, targetMode: 'static', resolutionRule: null,
  createdAt: datetime(), updatedAt: datetime()
});

// =============================================================================
// JOURNEY + JOURNEY STEP NODES
// =============================================================================

// JRN-R05-001: Create New Agent from Gallery Template
CREATE (j:Journey {
  journeyId: 'JRN-R05-001', tenantId: 'design-hub-default',
  title: 'Create New Agent from Gallery Template',
  personaId: 'PER-UX-007', roleKey: 'AGENT_DESIGNER',
  goalStatement: 'Designer discovers a template in the gallery, forks it, customizes it in the builder, and publishes a new agent',
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (j)-[:HAS_STEP]->(s1:JourneyStep {stepId: 'JRN-R05-001.01', tenantId: 'design-hub-default', label: 'Navigate to Gallery via dock', preCondition: 'User is authenticated', postCondition: 'Gallery screen loads', orderIndex: 0, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s2:JourneyStep {stepId: 'JRN-R05-001.02', tenantId: 'design-hub-default', label: 'Filter templates by category', preCondition: 'Gallery is loaded', postCondition: 'Filtered templates displayed', orderIndex: 1, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s3:JourneyStep {stepId: 'JRN-R05-001.03', tenantId: 'design-hub-default', label: 'Click template card to preview', preCondition: 'Templates visible', postCondition: 'Template detail drawer open', orderIndex: 2, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s4:JourneyStep {stepId: 'JRN-R05-001.04', tenantId: 'design-hub-default', label: 'Fork template to start new agent', preCondition: 'Template drawer open', postCondition: 'Builder opens with forked agent', orderIndex: 3, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s5:JourneyStep {stepId: 'JRN-R05-001.05', tenantId: 'design-hub-default', label: 'Drag-drop components onto canvas', preCondition: 'Builder loaded', postCondition: 'Components placed on canvas', orderIndex: 4, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s6:JourneyStep {stepId: 'JRN-R05-001.06', tenantId: 'design-hub-default', label: 'Save draft', preCondition: 'Changes made in builder', postCondition: 'Draft saved', orderIndex: 5, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s7:JourneyStep {stepId: 'JRN-R05-001.07', tenantId: 'design-hub-default', label: 'Publish agent', preCondition: 'Agent configured', postCondition: 'Agent published and available', orderIndex: 6, createdAt: datetime(), updatedAt: datetime()});

// JRN-R05-002: View and Manage Agent List
CREATE (j:Journey {
  journeyId: 'JRN-R05-002', tenantId: 'design-hub-default',
  title: 'View and Manage Agent List',
  personaId: 'PER-UX-004', roleKey: 'ARCHITECT',
  goalStatement: 'Architect views the list of agents, selects one to view details',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'NOT_STARTED',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (j)-[:HAS_STEP]->(s1:JourneyStep {stepId: 'JRN-R05-002.01', tenantId: 'design-hub-default', label: 'Navigate to Agent List via dock', preCondition: 'User is authenticated', postCondition: 'Agent List loads', orderIndex: 0, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s2:JourneyStep {stepId: 'JRN-R05-002.02', tenantId: 'design-hub-default', label: 'Click agent card to view details', preCondition: 'Agent List loaded', postCondition: 'Agent detail view loads', orderIndex: 1, createdAt: datetime(), updatedAt: datetime()});

// JRN-R05-003: Chat with Agent
CREATE (j:Journey {
  journeyId: 'JRN-R05-003', tenantId: 'design-hub-default',
  title: 'Chat with Agent',
  personaId: 'PER-UX-005', roleKey: 'AGENT_DESIGNER',
  goalStatement: 'Designer opens chat with an agent to test its responses and escalates if needed',
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (j)-[:HAS_STEP]->(s1:JourneyStep {stepId: 'JRN-R05-003.01', tenantId: 'design-hub-default', label: 'Send a message to the agent', preCondition: 'Chat screen loaded', postCondition: 'Agent response streams in', orderIndex: 0, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s2:JourneyStep {stepId: 'JRN-R05-003.02', tenantId: 'design-hub-default', label: 'Escalate to human reviewer', preCondition: 'Agent response unsatisfactory', postCondition: 'HITL review request created', orderIndex: 1, createdAt: datetime(), updatedAt: datetime()});

// JRN-R01-001: Standard Login
CREATE (j:Journey {
  journeyId: 'JRN-R01-001', tenantId: 'design-hub-default',
  title: 'Standard Login',
  personaId: null, roleKey: null,
  goalStatement: 'Unauthenticated user logs in via Keycloak and reaches their role-appropriate landing page',
  designStatus: 'COMPLETE', prototypeStatus: 'PROTOTYPED', deliveryStatus: 'INTEGRATED',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (j)-[:HAS_STEP]->(s1:JourneyStep {stepId: 'JRN-R01-001.01', tenantId: 'design-hub-default', label: 'Navigate to login page', preCondition: 'User is unauthenticated', postCondition: 'Login form displayed', orderIndex: 0, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s2:JourneyStep {stepId: 'JRN-R01-001.02', tenantId: 'design-hub-default', label: 'Enter credentials and submit', preCondition: 'Login form displayed', postCondition: 'Keycloak authenticates user', orderIndex: 1, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s3:JourneyStep {stepId: 'JRN-R01-001.03', tenantId: 'design-hub-default', label: 'Redirect to role-based landing', preCondition: 'User authenticated', postCondition: 'User sees their landing page', orderIndex: 2, createdAt: datetime(), updatedAt: datetime()});

// JRN-R01-002: Password Reset
CREATE (j:Journey {
  journeyId: 'JRN-R01-002', tenantId: 'design-hub-default',
  title: 'Password Reset',
  personaId: null, roleKey: null,
  goalStatement: 'User who forgot their password requests a reset, receives a link, and sets a new password',
  designStatus: 'COMPLETE', prototypeStatus: 'NOT_STARTED', deliveryStatus: 'NOT_STARTED',
  createdAt: datetime(), updatedAt: datetime()
})
CREATE (j)-[:HAS_STEP]->(s1:JourneyStep {stepId: 'JRN-R01-002.01', tenantId: 'design-hub-default', label: 'Click Forgot Password on login page', preCondition: 'Login page displayed', postCondition: 'Password reset request form displayed', orderIndex: 0, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s2:JourneyStep {stepId: 'JRN-R01-002.02', tenantId: 'design-hub-default', label: 'Enter email and submit reset request', preCondition: 'Reset form displayed', postCondition: 'Reset email sent, confirmation shown', orderIndex: 1, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s3:JourneyStep {stepId: 'JRN-R01-002.03', tenantId: 'design-hub-default', label: 'Click reset link in email', preCondition: 'Email received', postCondition: 'Password reset confirmation page loads', orderIndex: 2, createdAt: datetime(), updatedAt: datetime()})
CREATE (j)-[:HAS_STEP]->(s4:JourneyStep {stepId: 'JRN-R01-002.04', tenantId: 'design-hub-default', label: 'Enter new password and confirm', preCondition: 'Reset confirm page loaded', postCondition: 'Password changed, redirect to login', orderIndex: 3, createdAt: datetime(), updatedAt: datetime()});

// =============================================================================
// TRANSITIONS_TO RELATIONSHIPS (derived from legacy transitions + navigate effects)
// =============================================================================

// Core transitions
MATCH (a:Screen {surfaceId: 'SCR-AUTH'}), (b:Screen {surfaceId: 'SURF-APP-SHELL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AUTH'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AUTH-PWD-RESET-REQ'}), (b:Screen {surfaceId: 'SCR-AUTH-PWD-RESET-CONFIRM'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AUTH-PWD-RESET-CONFIRM'}), (b:Screen {surfaceId: 'SCR-AUTH'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AUTH-MFA-SETUP'}), (b:Screen {surfaceId: 'SCR-AUTH-MFA-VERIFY'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AUTH-MFA-VERIFY'}), (b:Screen {surfaceId: 'SCR-AUTH'}) CREATE (a)-[:TRANSITIONS_TO]->(b);

// R04 transitions
MATCH (a:Screen {surfaceId: 'SCR-01'}), (b:Screen {surfaceId: 'SCR-03'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-01'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-01'}), (b:Screen {surfaceId: 'SCR-GV'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-03'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-03'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-02-T2'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-02-T3'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-02-T4'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-02-T5'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-02-T6'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-02-T7'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T1'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T2'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T2'}), (b:Screen {surfaceId: 'SCR-02-T3'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T3'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T3'}), (b:Screen {surfaceId: 'SCR-02-T2'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T3'}), (b:Screen {surfaceId: 'SCR-GV'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T4'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T4'}), (b:Screen {surfaceId: 'SCR-MANDATE'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T4'}), (b:Screen {surfaceId: 'SCR-PROP'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T5'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T6'}), (b:Screen {surfaceId: 'SCR-02-T7'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T6'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T7'}), (b:Screen {surfaceId: 'SCR-02-T6'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-T7'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-MAT'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-02-MAT'}), (b:Screen {surfaceId: 'SCR-05'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-04'}), (b:Screen {surfaceId: 'SCR-04-M1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-04'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-04'}), (b:Screen {surfaceId: 'SCR-DIFF'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-04'}), (b:Screen {surfaceId: 'SCR-NOTIF'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-04-M1'}), (b:Screen {surfaceId: 'SCR-04'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-05'}), (b:Screen {surfaceId: 'SCR-02-MAT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-05'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-06'}), (b:Screen {surfaceId: 'SCR-02-T2'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-06'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-GV'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-GV'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AI'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-NOTIF'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-NOTIF'}), (b:Screen {surfaceId: 'SCR-04'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-PROP'}), (b:Screen {surfaceId: 'SCR-02-T4'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-PROP'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-DIFF'}), (b:Screen {surfaceId: 'SCR-04'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-DIFF'}), (b:Screen {surfaceId: 'SCR-02-T1'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-MANDATE'}), (b:Screen {surfaceId: 'SCR-02-T4'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-MANDATE'}), (b:Screen {surfaceId: 'SCR-PROP'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-EXPORT'}), (b:Screen {surfaceId: 'SCR-01'}) CREATE (a)-[:TRANSITIONS_TO]->(b);

// R05 transitions
MATCH (a:Screen {surfaceId: 'SCR-AGT-LIST'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-LIST'}), (b:Screen {surfaceId: 'SCR-AGT-BUILDER'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-LIST'}), (b:Screen {surfaceId: 'SCR-AGT-GALLERY'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-LIST'}), (b:Screen {surfaceId: 'SCR-AGT-CHAT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-DETAIL'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-DETAIL'}), (b:Screen {surfaceId: 'SCR-AGT-BUILDER'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-DETAIL'}), (b:Screen {surfaceId: 'SCR-AGT-CHAT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-DETAIL'}), (b:Screen {surfaceId: 'SCR-AGT-HISTORY'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-BUILDER'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-BUILDER'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-BUILDER'}), (b:Screen {surfaceId: 'SCR-AGT-HISTORY'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-GALLERY'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-GALLERY'}), (b:Screen {surfaceId: 'SCR-AGT-BUILDER'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-CHAT'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-CHAT'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-NOTIF'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-NOTIF'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-NOTIF'}), (b:Screen {surfaceId: 'SCR-AGT-PIPELINE'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-NOTIF'}), (b:Screen {surfaceId: 'SCR-AGT-TRAIN'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-AUDIT'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-PIPELINE'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-PIPELINE'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-RBAC'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-SETTINGS'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-COST'}), (b:Screen {surfaceId: 'SCR-AGT-ANALYTICS'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-COST'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-KNOWLEDGE'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-KNOWLEDGE'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-TRAIN'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-TRAIN'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-TRAIN'}), (b:Screen {surfaceId: 'SCR-AGT-EVAL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-EVAL'}), (b:Screen {surfaceId: 'SCR-AGT-TRAIN'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-EVAL'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-HITL'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-HITL'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-ANALYTICS'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-ANALYTICS'}), (b:Screen {surfaceId: 'SCR-AGT-COST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-ORCH'}), (b:Screen {surfaceId: 'SCR-AGT-LIST'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-ORCH'}), (b:Screen {surfaceId: 'SCR-AGT-PIPELINE'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-HISTORY'}), (b:Screen {surfaceId: 'SCR-AGT-BUILDER'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-HISTORY'}), (b:Screen {surfaceId: 'SCR-AGT-DETAIL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-AGT-NOTIF-PREFS'}), (b:Screen {surfaceId: 'SCR-AGT-NOTIF'}) CREATE (a)-[:TRANSITIONS_TO]->(b);

// R06 transitions
MATCH (a:Screen {surfaceId: 'SCR-LM-LANG'}), (b:Screen {surfaceId: 'SCR-LM-DICT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-LANG'}), (b:Screen {surfaceId: 'SCR-LM-IMPORT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-LANG'}), (b:Screen {surfaceId: 'SCR-LM-ROLL'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-LANG'}), (b:Screen {surfaceId: 'SCR-LM-AI'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-LANG'}), (b:Screen {surfaceId: 'SCR-LM-FORMAT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-LANG'}), (b:Screen {surfaceId: 'SCR-LM-OVERRIDE'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-DICT'}), (b:Screen {surfaceId: 'SCR-LM-LANG'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-DICT'}), (b:Screen {surfaceId: 'SCR-LM-IMPORT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-IMPORT'}), (b:Screen {surfaceId: 'SCR-LM-LANG'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-IMPORT'}), (b:Screen {surfaceId: 'SCR-LM-DICT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-ROLL'}), (b:Screen {surfaceId: 'SCR-LM-LANG'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-ROLL'}), (b:Screen {surfaceId: 'SCR-LM-DICT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-AI'}), (b:Screen {surfaceId: 'SCR-LM-LANG'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-AI'}), (b:Screen {surfaceId: 'SCR-LM-DICT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-FORMAT'}), (b:Screen {surfaceId: 'SCR-LM-LANG'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-OVERRIDE'}), (b:Screen {surfaceId: 'SCR-LM-LANG'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-OVERRIDE'}), (b:Screen {surfaceId: 'SCR-LM-DICT'}) CREATE (a)-[:TRANSITIONS_TO]->(b);
MATCH (a:Screen {surfaceId: 'SCR-LM-SWITCHER-ANON'}), (b:Screen {surfaceId: 'SCR-AUTH'}) CREATE (a)-[:TRANSITIONS_TO]->(b);

// =============================================================================
// END OF SEED SCRIPT
// Totals: 60 Screen nodes, ~20 Gap nodes, ~30 ContentElement nodes,
//         9 Touchpoint nodes, 18 Interaction nodes, ~30 Effect nodes,
//         5 Journey nodes, 18 JourneyStep nodes, ~90 TRANSITIONS_TO relationships
// =============================================================================
