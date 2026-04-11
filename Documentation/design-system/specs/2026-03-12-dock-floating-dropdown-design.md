# Dock Floating Dropdown — Design Spec

**Date:** 2026-03-12
**Status:** APPROVED
**Prototype:** `Documentation/prototypes/dock-redesign-playground.html`

## 1. Problem

The administration page navigation currently uses a **full-height sidebar drawer** (`<aside class="admin-dock">`) that slides in from `inset-inline-start: -280px`. This pattern:

- Takes 260px from content width on desktop
- Feels heavy for just 4 nav items
- Requires a backdrop overlay that dims the entire page
- Is invisible when closed (no persistent affordance)

**Current implementation:** [administration.page.html](../../frontend/src/app/features/administration/administration.page.html) lines 83-129, [administration.page.scss](../../frontend/src/app/features/administration/administration.page.scss) `.admin-dock` block.

## 2. Solution

Replace the sidebar drawer with a **floating dropdown menu** that appears below the left header island when the hamburger button is clicked. The menu is a neumorphic card matching the island design language.

### 2.1 Design Parameters

| Parameter | Value |
|-----------|-------|
| Menu width | 300px |
| Menu border radius | 22px |
| Menu padding | 6px |
| Item border radius | 20px |
| Item padding | 12px 14px |
| Item gap | 0px |
| Icon size | 42px (circle, neumorphic shadow) |
| Shadow depth | 10px neumorphic (dark + light + ambient) |
| Animation | Fade + drop (opacity + translateY), 250ms ease |
| Offset from island | 10px vertical, 0px horizontal (left-aligned with island) |
| Close triggers | Backdrop click, Escape key, item selection |
| Descriptions | Visible below each label |

### 2.2 Visual Specification

The menu card uses the same neumorphic shadow recipe as the header islands:

```scss
.dock-float {
  box-shadow:
    10px 10px 25px var(--nm-shadow-dark),
    -10px -10px 25px var(--nm-shadow-light),
    0 15px 50px rgba(0, 0, 0, 0.12);
}
```

Each nav item renders an icon circle (42px, neumorphic inset shadow, `--tp-primary` border), a label (13px, weight 600), and a description (10px, muted). The active item gets `color-mix(in srgb, var(--tp-primary) 14%, transparent)` background, and the active icon fills with `var(--tp-primary)` background + white icon color.

## 3. Architecture — Extract `DockMenuComponent`

### 3.1 Rationale

`AdministrationPageComponent` already manages: header islands, section routing (query params), keyboard shortcuts, help dialog, and logout. Adding floating menu positioning, animation, and keyboard handling directly would violate single-responsibility.

A standalone `DockMenuComponent` encapsulates:
- Open/close state + animation
- Backdrop + Escape key handling
- Item rendering with active state
- Positioning relative to anchor element

### 3.2 Component API

```typescript
@Component({
  selector: 'app-dock-menu',
  standalone: true,
  templateUrl: './dock-menu.component.html',
  styleUrl: './dock-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockMenuComponent {
  // Inputs
  items = input.required<readonly AdminDockItem[]>();
  activeSection = input.required<AdminSection>();
  isOpen = input.required<boolean>();

  // Outputs
  sectionSelected = output<AdminSection>();
  closed = output<void>();

  // Methods
  protected onSelect(section: AdminSection): void {
    this.sectionSelected.emit(section);
    this.closed.emit();
  }
}
```

The component receives `AdminDockItem[]` (which includes `iconMask` and `hue` from the parent's `ADMIN_DOCK_META` mapping). The `AdminDockItem` interface is already defined in the parent — it will be moved to `administration.models.ts` along with `ADMIN_DOCK_META` so both the parent and the new component can import it.

### 3.3 File Layout

```
frontend/src/app/features/administration/
├── components/
│   └── dock-menu/
│       ├── dock-menu.component.ts
│       ├── dock-menu.component.html
│       └── dock-menu.component.scss
├── administration.page.ts          (modified — remove dock, add DockMenuComponent)
├── administration.page.html        (modified — replace <aside> with <app-dock-menu>)
├── administration.page.scss        (modified — remove .admin-dock block)
└── models/
    └── administration.models.ts    (modified — receives AdminDockItem + ADMIN_DOCK_META)
```

### 3.4 Template Structure

The menu is rendered inside the parent template as a sibling of the left island, positioned via CSS (`position: absolute` relative to a wrapper). No `anchorRef` input needed.

**dock-menu.component.html:**
```html
<div
  class="dock-backdrop"
  [class.visible]="isOpen()"
  (click)="closed.emit()"
></div>
<div
  class="dock-float"
  [class.visible]="isOpen()"
  role="menu"
  aria-label="Administration sections"
>
  @for (item of items(); track item.section) {
    <button
      class="dock-item"
      [class.active]="activeSection() === item.section"
      role="menuitem"
      (click)="onSelect(item.section)"
    >
      <span class="dock-icon" [style.--dock-icon-url]="item.iconMask">
        <span class="dock-glyph"></span>
      </span>
      <span class="dock-item-text">
        <span class="dock-item-label">{{ item.label }}</span>
        <span class="dock-item-desc">{{ item.description }}</span>
      </span>
    </button>
  }
</div>
```

### 3.5 Positioning Strategy — CSS-Based

Instead of computing position from `getBoundingClientRect()` (which is imperative and won't reactively update), the menu uses **CSS-based positioning**:

The parent template wraps the left island and `<app-dock-menu>` in a positioned container:

```html
<div class="island-menu-anchor">
  <div class="h-island">
    <!-- existing left island content -->
  </div>
  <app-dock-menu
    [items]="navItems"
    [activeSection]="activeSection()"
    [isOpen]="dockMenuOpen()"
    (sectionSelected)="setSection($event)"
    (closed)="dockMenuOpen.set(false)"
  />
</div>
```

```scss
.island-menu-anchor {
  position: relative;  // establishes positioning context
  pointer-events: auto;
}
```

The menu itself uses `position: absolute`:

```scss
.dock-float {
  position: absolute;
  top: calc(100% + 10px);  // 10px below island
  left: 0;
  width: 300px;
  z-index: 38;
}
```

This is simpler and more robust than JavaScript positioning — it automatically adjusts if the island size changes, and needs no resize listeners.

The backdrop uses `position: fixed; inset: 0` to cover the viewport regardless of the menu's position in the DOM.

### 3.6 Keyboard Handling

Escape is handled **only by the parent** — not by the child component. This avoids the double-firing problem where both a child and parent `@HostListener('document:keydown.escape')` would fire on the same keypress with non-deterministic ordering.

The parent's existing `onEscape()` method is updated to check `dockMenuOpen` first:

```typescript
@HostListener('document:keydown.escape')
protected onEscape(): void {
  if (this.dockMenuOpen()) {
    this.dockMenuOpen.set(false);
    return;
  }
  if (this.helpDialogOpen()) {
    this.helpDialogOpen.set(false);
  }
}
```

This ensures Escape priority: dock menu (highest) → help dialog → no-op.

Arrow key navigation within the menu items is a future enhancement (not in scope for this change).

## 4. Parent Integration

### 4.1 AdministrationPageComponent Changes

**Signal rename:** `mobileDrawerOpen` → `dockMenuOpen` (same boolean signal, clearer name).

**Template change:** Replace `<aside class="admin-dock">...</aside>` + drawer backdrop with the `.island-menu-anchor` wrapper described in Section 3.5. The `<app-dock-menu>` is a sibling of the left island `<div class="h-island">`, both wrapped in `.island-menu-anchor`. No `ViewChild` or `ElementRef` needed — positioning is pure CSS.

### 4.2 Escape Key Priority

The parent's `onEscape()` handles all Escape key logic. The child component does **not** listen for Escape — this avoids the double-firing problem described in Section 3.6. Priority order: dock menu (highest) → help dialog → no-op.

Backdrop click is handled by the child (emits `closed`); Escape is handled by the parent (sets `dockMenuOpen.set(false)` directly).

## 5. SCSS Changes

### 5.1 Remove from `administration.page.scss`

Delete the entire `.admin-dock` block (~80 lines), `.dock-card`, `.dock-link`, `.dock-footer`, `.iso-pro`, `.drawer-backdrop`, and the `.drawer-open` class on `.administration-page`.

### 5.2 New `dock-menu.component.scss`

Key tokens to use (all from `styles.scss` or `administration.page.scss` existing tokens):

| CSS Variable | Purpose |
|-------------|---------|
| `--tp-bg` | Menu background |
| `--tp-primary` | Active icon bg, item hover tint |
| `--tp-text` | Item label color |
| `--tp-text-muted` | Description color |
| `--nm-shadow-dark` | Neumorphic dark shadow |
| `--nm-shadow-light` | Neumorphic light shadow |

### 5.3 Responsive Behavior

On all breakpoints, the floating dropdown renders identically — positioned below the left island, 300px wide. No breakpoint-specific layout changes needed (unlike the sidebar which had mobile-specific slide-in behavior).

The left island is always visible on all breakpoints (existing behavior), so the dropdown anchor point is always available.

## 6. Migration Checklist

### What Gets Removed
- `<aside class="admin-dock">` element and all children
- `.drawer-backdrop` element
- `[class.drawer-open]="mobileDrawerOpen()"` binding on root div
- `mobileDrawerOpen` signal (renamed to `dockMenuOpen`)
- `toggleDrawer()` method (replaced by `dockMenuOpen.update(v => !v)`)
- `.admin-dock` SCSS block and related classes
- `.dock-footer` with sign-out button (sign-out already exists in header right island)

### What Gets Added
- `DockMenuComponent` (new component, 3 files)
- `<app-dock-menu>` in parent template inside `.island-menu-anchor` wrapper
- `dockMenuOpen` signal (renamed from `mobileDrawerOpen`)

### What Gets Modified
- `administration.models.ts` — receives `AdminDockItem` interface and `ADMIN_DOCK_META` mapping (moved from `administration.page.ts`)

### What Stays Unchanged
- `navItems` array and `AdminNavItem` interface (both stay; `AdminDockItem` extends `AdminNavItem`)
- `setSection()` method
- `activeSection` signal
- Header islands (left + right)
- Content area and section switching
- Help dialog
- Keyboard shortcut for Escape (adapted for dock priority)
- Sign-out in header right island

## 7. Accessibility

| Requirement | Implementation |
|------------|----------------|
| Role | `role="menu"` on container, `role="menuitem"` on items |
| Label | `aria-label="Administration sections"` on container |
| Keyboard | Escape closes menu |
| Focus | Menu items are `<button>` elements (natively focusable) |
| Active state | `aria-current="page"` on active item (future enhancement) |
| Trigger | `aria-expanded` on hamburger button reflects `dockMenuOpen()` |

## 8. Animation Specification

**Open:**
```css
.dock-float {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  pointer-events: none;
  transition: opacity 250ms ease, transform 250ms ease;
}

.dock-float.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
```

**Close:** Same transition in reverse (CSS handles this automatically).

No `@angular/animations` needed — pure CSS transitions suffice.

## 9. Scope Exclusions

- Arrow key navigation within menu items (future)
- `aria-current="page"` on active item (future)
- Touch gestures (swipe to close) — not needed for 4-item dropdown
- Resize/scroll repositioning — header is fixed, so position is stable
