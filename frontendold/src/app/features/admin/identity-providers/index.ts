/**
 * Identity Providers Feature Module
 *
 * Public API exports for the Identity Provider Management feature.
 * This allows other parts of the application to import from a single entry point.
 */

// Models
export * from './models/provider-config.model';

// Data
export { PROVIDER_TEMPLATES, PROTOCOL_OPTIONS, COMMON_SCOPES } from './data/provider-templates';

// Services
export { ProviderAdminService } from './services/provider-admin.service';

// Components
export { ProviderFormComponent } from './components/provider-form/provider-form.component';
export { ProviderListComponent } from './components/provider-list/provider-list.component';
export { ProviderEmbeddedComponent } from './components/provider-embedded/provider-embedded.component';

// Pages
export { ProviderManagementPage } from './pages/provider-management.page';

// Routes
export { IDENTITY_PROVIDER_ROUTES } from './identity-providers.routes';
