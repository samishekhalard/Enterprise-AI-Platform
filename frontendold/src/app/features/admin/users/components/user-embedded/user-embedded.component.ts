import {
  Component,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListComponent } from '../user-list/user-list.component';

/**
 * Embedded user management component for tenant factsheet.
 *
 * This component is designed to be embedded in the tenant "Users" tab,
 * providing a streamlined view of tenant users without routing.
 * Follows the same pattern as ProviderEmbeddedComponent.
 */
@Component({
  selector: 'app-user-embedded',
  standalone: true,
  imports: [CommonModule, UserListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="user-embedded">
      <div class="embedded-header">
        <div class="header-info">
          <h3 class="section-title">Tenant Users</h3>
          <p class="section-description">
            View and manage users assigned to this tenant.
          </p>
        </div>
      </div>

      <div class="embedded-content">
        <app-user-list [tenantId]="tenantId" />
      </div>
    </div>
  `,
  styles: [`
    $gray-500: #64748b;
    $gray-800: #1e293b;
    $font-family: 'Gotham Rounded', 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;

    .user-embedded {
      font-family: $font-family;
      position: relative;
    }

    .embedded-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (max-width: 640px) {
        flex-direction: column;
      }
    }

    .header-info {
      flex: 1;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: $gray-800;
      margin: 0 0 0.25rem;
    }

    .section-description {
      font-size: 0.875rem;
      color: $gray-500;
      margin: 0;
    }

    .embedded-content {
      min-height: 200px;
    }
  `]
})
export class UserEmbeddedComponent {
  @Input({ required: true }) tenantId!: string;
}
