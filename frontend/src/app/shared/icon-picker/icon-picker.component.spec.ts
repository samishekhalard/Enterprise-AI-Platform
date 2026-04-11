import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAppIcons } from '../../core/icons/provide-icons';
import { IconPickerComponent } from './icon-picker.component';

describe('IconPickerComponent', () => {
  let component: IconPickerComponent;
  let fixture: ComponentFixture<IconPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconPickerComponent],
      providers: [provideZonelessChangeDetection(), provideAppIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(IconPickerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the search input', () => {
    const el = fixture.nativeElement.querySelector('[data-testid="icon-picker-search"]');
    expect(el).toBeTruthy();
  });

  it('should render category tabs', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.category-tab');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('should default to "all" category', () => {
    expect(component.activeCategory()).toBe('all');
  });

  it('should display icon count', () => {
    expect(component.resultCount()).toBeGreaterThan(50);
  });

  it('should filter icons when category changes', () => {
    const allCount = component.resultCount();
    component.onCategoryChange('navigation');
    expect(component.resultCount()).toBeLessThan(allCount);
    expect(component.resultCount()).toBeGreaterThan(0);
  });

  it('should filter icons when search query changes', () => {
    const allCount = component.resultCount();
    component.onSearchInput('house');
    expect(component.resultCount()).toBeLessThan(allCount);
    expect(component.resultCount()).toBeGreaterThan(0);
  });

  it('should show empty state when search has no results', () => {
    component.onSearchInput('zzzznonexistent');
    expect(component.resultCount()).toBe(0);
  });

  it('should emit iconSelected when an icon is clicked', () => {
    const emitSpy = vi.fn();
    component.iconSelected.subscribe(emitSpy);

    const icons = component.filteredIcons();
    expect(icons.length).toBeGreaterThan(0);

    component.onIconClick(icons[0]);
    expect(emitSpy).toHaveBeenCalledWith({
      name: icons[0].name,
      source: icons[0].source,
    });
  });

  it('should update previewIcon when an icon is clicked', () => {
    const icons = component.filteredIcons();
    component.onIconClick(icons[0]);
    expect(component.previewIcon()).toBe(icons[0].name);
  });

  it('should mark selected icon as selected', () => {
    const icons = component.filteredIcons();
    component.onIconClick(icons[0]);
    expect(component.isSelected(icons[0].name)).toBe(true);
    expect(component.isSelected('some-other-icon')).toBe(false);
  });

  it('should compute icon rows for virtual scroll', () => {
    const rows = component.iconRows();
    expect(rows.length).toBeGreaterThan(0);
    // Each row should have at most 8 icons
    for (const row of rows) {
      expect(row.length).toBeLessThanOrEqual(8);
      expect(row.length).toBeGreaterThan(0);
    }
  });

  it('should include "All" as the first category', () => {
    const cats = component.categories();
    expect(cats[0].id).toBe('all');
    expect(cats[0].label).toBe('All');
  });
});
