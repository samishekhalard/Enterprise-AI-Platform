/**
 * Users Feature Module
 *
 * Public API exports for the User Management feature.
 * This allows other parts of the application to import from a single entry point.
 */

// Models
export * from './models/user.model';

// Services
export { UserAdminService } from './services/user-admin.service';

// Components
export { UserListComponent } from './components/user-list/user-list.component';
export { UserEmbeddedComponent } from './components/user-embedded/user-embedded.component';
