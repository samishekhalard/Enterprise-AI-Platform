// ==============================================================================
// V009__update_superadmin_email.cypher
// Updates the superadmin user email from superadmin@emsist.local to
// info@thinkplus.ae to match the Keycloak identity.
//
// Idempotency: Uses MATCH + SET; safe to re-run.
//
// Dependencies:
// - V008__fix_master_tenant_seed_superuser.cypher (creates User node)
// ==============================================================================

MATCH (u:User {id: '00000000-0000-0000-0000-000000000001'})
SET u.email = 'info@thinkplus.ae',
    u.updatedAt = datetime();

// Migration marker
MERGE (m:Migration {version: 'V009'})
ON CREATE SET
    m.name = 'update_superadmin_email',
    m.description = 'Updates superadmin email from superadmin@emsist.local to info@thinkplus.ae',
    m.appliedAt = datetime();
