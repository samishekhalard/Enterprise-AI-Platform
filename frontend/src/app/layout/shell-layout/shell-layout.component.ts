import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BrandRuntimeService } from '../../core/theme/brand-runtime.service';

export interface ShellNavItem {
  readonly label: string;
  readonly route: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [ButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss',
})
export class ShellLayoutComponent {
  protected readonly brandRuntime = inject(BrandRuntimeService);

  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() titleIconSrc = '';
  @Input() titleIconAlt = '';
  @Input() footerText = '';
  @Input() navItems: readonly ShellNavItem[] = [];
  @Input() authenticated = false;
  @Input() showDefaultHeaderActions = true;
  @Input() hideHeaderRightOnMobile = false;
  @Output() logout = new EventEmitter<void>();

  protected onLogout(): void {
    this.logout.emit();
  }
}
