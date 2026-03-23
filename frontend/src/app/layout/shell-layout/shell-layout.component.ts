import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ShellNavItem {
  readonly label: string;
  readonly route: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss',
})
export class ShellLayoutComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() footerText = '';
  @Input() navItems: readonly ShellNavItem[] = [];
  @Input() authenticated = false;
  @Output() logout = new EventEmitter<void>();

  protected onLogout(): void {
    this.logout.emit();
  }
}
