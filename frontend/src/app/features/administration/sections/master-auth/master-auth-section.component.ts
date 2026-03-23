import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ProviderEmbeddedComponent } from '../../../admin/identity-providers/provider-embedded.component';
import { AuthAdminTab } from '../../models/administration.models';

@Component({
  selector: 'app-master-auth-section',
  standalone: true,
  imports: [CommonModule, CardModule, TabsModule, ProviderEmbeddedComponent],
  templateUrl: './master-auth-section.component.html',
  styleUrl: './master-auth-section.component.scss',
})
export class MasterAuthSectionComponent {
  @Input({ required: true }) tenantId!: string;
  @Input() tenantName = 'Master Tenant';

  protected readonly tab = signal<AuthAdminTab>('providers');

  protected onTabChange(value: unknown): void {
    const nextTab =
      value === 'providers' ||
      value === 'sso' ||
      value === 'mfa' ||
      value === 'sessions' ||
      value === 'policies'
        ? value
        : 'providers';

    this.tab.set(nextTab);
  }
}
