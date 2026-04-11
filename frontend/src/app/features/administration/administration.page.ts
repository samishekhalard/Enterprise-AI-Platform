import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { take } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth-facade';
import {
  HELP_DIALOG_STYLE,
  helpDialogPt as sharedHelpDialogPt,
} from '../../core/theme/overlay-presets';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';
import { ShellLayoutComponent } from '../../layout/shell-layout/shell-layout.component';
import {
  ADMIN_NAV_ITEMS,
  ADMIN_SECTION_LABELS,
  AdminNavItem,
  AdminSection,
} from './models/administration.models';
import { LicenseManagerSectionComponent } from './sections/license-manager/license-manager-section.component';
import { MasterDefinitionsSectionComponent } from './sections/master-definitions/master-definitions-section.component';
import { MasterLocaleSectionComponent } from './sections/master-locale/master-locale-section.component';
import { TenantManagerSectionComponent } from './sections/tenant-manager/tenant-manager-section.component';
import { cleanupStalePrimeDialogMasks } from './administration-overlay.util';

interface AdminDockItem extends AdminNavItem {
  readonly iconMask: string;
  readonly hue: string;
}

const ADMIN_DOCK_META: Record<AdminSection, Omit<AdminDockItem, keyof AdminNavItem>> = {
  'tenant-manager': {
    iconMask: 'url("assets/icons/dock-building.svg")',
    hue: 'var(--tp-primary)',
  },
  'license-manager': {
    iconMask: 'url("assets/icons/dock-license.svg")',
    hue: 'var(--tp-primary)',
  },
  'master-locale': {
    iconMask: 'url("assets/icons/dock-globe.svg")',
    hue: 'var(--tp-primary)',
  },
  'master-definitions': {
    iconMask: 'url("assets/icons/dock-layers.svg")',
    hue: 'var(--tp-primary)',
  },
} as const;

@Component({
  selector: 'app-administration-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    PageFrameComponent,
    ShellLayoutComponent,
    TenantManagerSectionComponent,
    LicenseManagerSectionComponent,
    MasterLocaleSectionComponent,
    MasterDefinitionsSectionComponent,
  ],
  templateUrl: './administration.page.html',
  styleUrl: './administration.page.scss',
})
export class AdministrationPageComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthFacade);

  protected readonly navItems: readonly AdminDockItem[] = ADMIN_NAV_ITEMS.map((item) => ({
    ...item,
    ...ADMIN_DOCK_META[item.section],
  }));
  protected readonly activeSection = signal<AdminSection>('tenant-manager');

  protected readonly activeSectionLabel = computed(
    () => ADMIN_SECTION_LABELS[this.activeSection()] ?? 'Administration',
  );
  protected readonly activeSectionDescription = computed(
    () =>
      this.navItems.find((item) => item.section === this.activeSection())?.description ??
      'Administration workspace.',
  );
  protected readonly keyboardHints: readonly { keys: string; description: string }[] = [
    { keys: 'Tab', description: 'Move between interactive controls' },
    { keys: 'Shift + Tab', description: 'Move to previous control' },
    { keys: 'Enter', description: 'Activate selected dock item' },
    { keys: 'Esc', description: 'Close open overlays or dialogs' },
  ];
  protected readonly helpDialogPt = sharedHelpDialogPt;
  protected readonly helpDialogStyle = HELP_DIALOG_STYLE;

  protected readonly menuOpen = signal(false);
  protected readonly helpDialogOpen = signal(false);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const section = params.get('section');
      const resolvedSection = section && isAdminSection(section) ? section : 'tenant-manager';
      this.activeSection.set(resolvedSection);
      queueMicrotask(() => cleanupStalePrimeDialogMasks(this.document, resolvedSection));
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected setSection(section: AdminSection): void {
    this.activeSection.set(section);
    this.menuOpen.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected openHelpDialog(): void {
    this.helpDialogOpen.set(true);
  }

  protected onHelpDialogVisibleChange(visible: boolean): void {
    this.helpDialogOpen.set(visible);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      return;
    }
    if (this.helpDialogOpen()) {
      this.helpDialogOpen.set(false);
    }
  }

  protected onLogout(): void {
    this.auth.logout().pipe(take(1)).subscribe();
  }
}

function isAdminSection(value: string): value is AdminSection {
  return ADMIN_NAV_ITEMS.some((item) => item.section === value);
}
