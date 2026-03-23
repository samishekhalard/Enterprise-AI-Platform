import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/shared/breadcrumb';
import { AdminSection } from './models/administration.models';
import { MasterAuthSectionComponent } from './sections/master-auth/master-auth-section.component';
import { LicenseManagerSectionComponent } from './sections/license-manager/license-manager-section.component';
import { MasterLocaleSectionComponent } from './sections/master-locale/master-locale-section.component';
import { TenantManagerSectionComponent } from './sections/tenant-manager/tenant-manager-section.component';
import { MasterDefinitionsSectionComponent } from './sections/master-definitions/master-definitions-section.component';
import { EmisiKeyboardHint, EmisiKeyboardHintsComponent } from 'emisi-ui';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-administration-page',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MasterAuthSectionComponent,
    LicenseManagerSectionComponent,
    MasterLocaleSectionComponent,
    TenantManagerSectionComponent,
    MasterDefinitionsSectionComponent,
    EmisiKeyboardHintsComponent,
    TooltipModule
  ],
  template: `
    <div class="admin-layout">
      <!-- Isometric administration dock -->
      <aside class="admin-dock" aria-label="Administration navigation">
        <div class="card dock-card">
          <ul>
            @for (item of navItems; track item.section) {
              <li
                class="iso-pro"
                [class.active]="activeSection() === item.section"
                [style.--dock-item-color]="item.hue"
                [style.--dock-icon-url]="item.iconMask">
                <span class="layer"></span>
                <span class="layer"></span>
                <span class="layer"></span>
                <button
                  type="button"
                  class="dock-link"
                  [class.active]="activeSection() === item.section"
                  [attr.aria-label]="item.label"
                  [pTooltip]="item.label"
                  tooltipPosition="right"
                  (click)="setSection(item.section)">
                  <span class="svg" aria-hidden="true">
                    <span class="dock-glyph"></span>
                  </span>
                </button>
              </li>
            }
          </ul>
        </div>
      </aside>

      <!-- Main Content -->
      <section class="admin-content" aria-label="Administration content">
        <!-- Breadcrumb for non-tenant-manager sections (tenant-manager has its own) -->
        @if (activeSection() !== 'tenant-manager') {
          <app-breadcrumb [items]="breadcrumbItems()" />
        }

        <emisi-keyboard-hints
          class="admin-kbd-hints"
          [compact]="true"
          title="Administration Keyboard Hints"
          [hints]="keyboardHints" />

        @switch (activeSection()) {
          @case ('tenant-manager') { <app-tenant-manager-section /> }
          @case ('license-manager') { <app-license-manager-section /> }
          @case ('master-locale') { <app-master-locale-section /> }
          @case ('master-definitions') { <app-master-definitions-section /> }
          @case ('master-auth') { <app-master-auth-section /> }
        }
      </section>
    </div>
  `,
  styleUrl: './administration.styles.scss'
})
export class AdministrationPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  activeSection = signal<AdminSection>('tenant-manager');

  private readonly validSections: AdminSection[] = [
    'tenant-manager', 'license-manager', 'master-locale', 'master-definitions', 'master-auth'
  ];

  private readonly sectionTitles: Record<AdminSection, string> = {
    'tenant-manager': 'Tenant Management',
    'license-manager': 'License Management',
    'master-locale': 'Master Locale',
    'master-definitions': 'Master Definitions',
    'master-auth': 'Master Authentication'
  };

  readonly navItems: ReadonlyArray<{
    section: AdminSection;
    label: string;
    iconMask: string;
    hue: string;
  }> = [
    {
      section: 'tenant-manager',
      label: 'Tenant Management',
      iconMask: 'url("assets/icons/dock-building.svg")',
      hue: 'var(--tp-primary)'
    },
    {
      section: 'license-manager',
      label: 'License Management',
      iconMask: 'url("assets/icons/dock-license.svg")',
      hue: 'var(--tp-warning)'
    },
    {
      section: 'master-locale',
      label: 'Master Locale',
      iconMask: 'url("assets/icons/dock-globe.svg")',
      hue: 'var(--tp-info)'
    },
    {
      section: 'master-definitions',
      label: 'Master Definitions',
      iconMask: 'url("assets/icons/dock-layers.svg")',
      hue: 'var(--tp-purple)'
    },
    {
      section: 'master-auth',
      label: 'Master Authentication',
      iconMask: 'url("assets/icons/dock-shield.svg")',
      hue: 'var(--tp-success)'
    }
  ];

  readonly keyboardHints: EmisiKeyboardHint[] = [
    { keys: ['Tab'], description: 'Move between interactive controls' },
    { keys: ['Shift', 'Tab'], description: 'Move to previous control' },
    { keys: ['Enter'], description: 'Activate current section button' },
    { keys: ['Esc'], description: 'Close open overlays or dialogs' }
  ];

  breadcrumbItems = computed((): BreadcrumbItem[] => [
    { label: 'Administration' },
    { label: this.sectionTitles[this.activeSection()] }
  ]);

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const section = params['section'] as AdminSection;
      if (section && this.validSections.includes(section) && section !== this.activeSection()) {
        this.activeSection.set(section);
      }
    });
  }

  setSection(section: AdminSection): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section },
    });
  }
}
