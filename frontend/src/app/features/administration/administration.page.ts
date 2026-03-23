import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { AuthFacade } from '../../core/auth/auth-facade';
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
    RouterLink,
    TenantManagerSectionComponent,
    LicenseManagerSectionComponent,
    MasterLocaleSectionComponent,
    MasterDefinitionsSectionComponent,
  ],
  templateUrl: './administration.page.html',
  styleUrl: './administration.page.scss',
})
export class AdministrationPageComponent implements OnInit {
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
  protected readonly keyboardHints: readonly { keys: string; description: string }[] = [
    { keys: 'Tab', description: 'Move between interactive controls' },
    { keys: 'Shift + Tab', description: 'Move to previous control' },
    { keys: 'Enter', description: 'Activate selected dock item' },
    { keys: 'Esc', description: 'Close open overlays or dialogs' },
  ];

  protected readonly mobileDrawerOpen = signal(false);
  protected readonly helpDialogOpen = signal(false);
  @ViewChild('helpDialog') private helpDialogRef?: ElementRef<HTMLDialogElement>;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const section = params.get('section');
      if (section && isAdminSection(section)) {
        this.activeSection.set(section);
      }
    });
  }

  protected toggleDrawer(): void {
    this.mobileDrawerOpen.update((v) => !v);
  }

  protected setSection(section: AdminSection): void {
    this.activeSection.set(section);
    this.mobileDrawerOpen.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected openHelpDialog(): void {
    const dialog = this.helpDialogRef?.nativeElement;
    if (dialog && typeof dialog.showModal === 'function') {
      if (dialog.open) return;
      dialog.showModal();
      return;
    }
    this.helpDialogOpen.set(true);
  }

  protected closeHelpDialog(): void {
    const dialog = this.helpDialogRef?.nativeElement;
    if (dialog?.open) dialog.close();
    this.helpDialogOpen.set(false);
  }

  protected onHelpBackdropClick(): void {
    this.helpDialogOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.mobileDrawerOpen()) {
      this.mobileDrawerOpen.set(false);
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
