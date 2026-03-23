/**
 * Neo4j Entity classes for the Identity Graph.
 *
 * This package contains Spring Data Neo4j node entities representing
 * the identity graph structure:
 *
 * <h2>Core Entities</h2>
 * <ul>
 *   <li>{@link com.ems.auth.graph.entity.TenantNode} - Multi-tenant root node</li>
 *   <li>{@link com.ems.auth.graph.entity.ProviderNode} - Identity providers (Keycloak, Auth0, etc.)</li>
 *   <li>{@link com.ems.auth.graph.entity.ProtocolNode} - Auth protocols (OIDC, SAML, LDAP)</li>
 *   <li>{@link com.ems.auth.graph.entity.ConfigNode} - Tenant-specific provider configuration</li>
 * </ul>
 *
 * <h2>RBAC Entities</h2>
 * <ul>
 *   <li>{@link com.ems.auth.graph.entity.UserNode} - User identity</li>
 *   <li>{@link com.ems.auth.graph.entity.GroupNode} - User groups</li>
 *   <li>{@link com.ems.auth.graph.entity.RoleNode} - RBAC roles with inheritance</li>
 * </ul>
 *
 * <h2>Graph Structure</h2>
 * <pre>
 * (Tenant)-[:USES]->(Provider)-[:SUPPORTS]->(Protocol)
 * (Tenant)-[:CONFIGURED_WITH]->(Config)<-[:HAS_CONFIG]-(Provider)
 * (User)-[:MEMBER_OF]->(Group)-[:HAS_ROLE]->(Role)-[:INHERITS_FROM]->(Role)
 * </pre>
 *
 * @see com.ems.auth.graph.repository.AuthGraphRepository
 */
package com.ems.auth.graph.entity;
