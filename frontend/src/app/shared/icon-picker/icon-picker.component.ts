import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgIcon } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { IconService } from '../../core/icons/icon.service';
import { IconEntry, IconCategory, IconSelectedEvent } from '../../core/icons/icon.model';

/**
 * Standalone icon picker component with virtual scrolling, search, and category tabs.
 *
 * Usage:
 * ```html
 * <app-icon-picker
 *   [selectedIcon]="currentIcon()"
 *   [selectedColor]="currentColor()"
 *   (iconSelected)="onIconSelected($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [ButtonModule, FormsModule, ScrollingModule, NgIcon, InputTextModule, TabsModule],
  templateUrl: './icon-picker.component.html',
  styleUrl: './icon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerComponent {
  private readonly iconService = inject(IconService);

  // ── Inputs ──────────────────────────────────────────────────────────────────
  readonly selectedIcon = input<string>('phosphorCubeThin');
  readonly selectedColor = input<string>('var(--tp-primary)');
  readonly showSearch = input<boolean>(true);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly iconSelected = output<IconSelectedEvent>();

  // ── Internal state ──────────────────────────────────────────────────────────
  readonly search = signal('');
  readonly activeCategory = signal<string>('all');
  readonly previewIcon = signal<string | null>(null);
  readonly previewSize = signal(24);

  // ── Derived ─────────────────────────────────────────────────────────────────
  readonly categories = computed<IconCategory[]>(() => {
    return [
      { id: 'all', label: 'All', iconCount: this.iconService.getAllIcons().length },
      ...this.iconService.getCategories(),
    ];
  });

  readonly filteredIcons = computed<IconEntry[]>(() => {
    const query = this.search().trim();
    const category = this.activeCategory();

    let icons: IconEntry[];
    if (query.length > 0) {
      icons = this.iconService.searchIcons(query);
      // If a category is active (not 'all'), further filter by category
      if (category !== 'all') {
        icons = icons.filter((icon) => icon.category === category);
      }
    } else {
      icons = this.iconService.getIconsByCategory(category);
    }
    return icons;
  });

  /** Grid rows for virtual scroll (4 icons per row). */
  readonly iconRows = computed<IconEntry[][]>(() => {
    const icons = this.filteredIcons();
    const rows: IconEntry[][] = [];
    const cols = 8;
    for (let i = 0; i < icons.length; i += cols) {
      rows.push(icons.slice(i, i + cols));
    }
    return rows;
  });

  readonly resultCount = computed(() => this.filteredIcons().length);

  constructor() {
    // Sync previewIcon with selectedIcon input
    effect(() => {
      this.previewIcon.set(this.selectedIcon());
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  onCategoryChange(categoryId: string): void {
    this.activeCategory.set(categoryId);
  }

  onIconClick(icon: IconEntry): void {
    this.previewIcon.set(icon.name);
    this.iconSelected.emit({
      name: icon.name,
      source: icon.source,
    });
  }

  onSearchInput(value: string): void {
    this.search.set(value);
  }

  isSelected(iconName: string): boolean {
    return this.previewIcon() === iconName || this.selectedIcon() === iconName;
  }
}
