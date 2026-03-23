// Auth Facade - Abstract DI Token
export { AuthFacade } from './auth-facade';

// Implementations
export { KeycloakAuthFacade } from './keycloak-auth-facade';

// Guards — use core/guards/auth.guard.ts (the active implementation)
// The facade-based guards were removed as they were orphaned and never routed.
