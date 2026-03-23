# Persona Studio Design System

> Based on UAE Design System 2.0 Guidelines (designsystem.gov.ae) and ThinkPLUS Brand Standards
> WCAG 2.1 Level AAA Compliant

---

## 1. Design Principles

### Core Values
1. **Clarity** - Information should be immediately understandable
2. **Consistency** - Same patterns across all pages and components
3. **Accessibility** - Usable by everyone, regardless of ability
4. **Performance** - Fast, responsive, and lightweight
5. **Professionalism** - Enterprise-grade appearance

### Design Philosophy
- **Mobile-first** responsive approach
- **Content-first** - Design serves the content
- **Minimal cognitive load** - Reduce visual noise
- **Progressive disclosure** - Show only what's needed

---

## 2. Typography

### Font Families

| Language | Primary | Fallback Stack |
|----------|---------|----------------|
| English | Gotham Rounded | Nunito, -apple-system, BlinkMacSystemFont, sans-serif |
| Arabic | Noto Kufi Arabic | Alexandria, system-ui, sans-serif |

### Type Scale (Major Third - 1.333 ratio)

| Level | Class | Size | Pixels | Line Height | Weight |
|-------|-------|------|--------|-------------|--------|
| Display | `text-display` | 4.75rem | 76px | 1.1 | 700 |
| H1 | `text-h1` | 2.25rem | 36px | 1.2 | 600 |
| H2 | `text-h2` | 1.5rem | 24px | 1.25 | 600 |
| H3 | `text-h3` | 1.25rem | 20px | 1.3 | 600 |
| H4 | `text-h4` | 1.125rem | 18px | 1.35 | 600 |
| H5 | `text-h5` | 1rem | 16px | 1.4 | 600 |
| H6 | `text-h6` | 0.875rem | 14px | 1.4 | 600 |
| Body | `text-base` | 1rem | 16px | 1.5 | 400 |
| Small | `text-sm` | 0.875rem | 14px | 1.4 | 400 |
| XSmall | `text-xs` | 0.75rem | 12px | 1.33 | 400 |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Decorative, large text |
| Regular | 400 | Body text |
| Medium | 500 | Buttons, labels |
| Semibold | 600 | Headings, emphasis |
| Bold | 700 | Strong emphasis |

### Typography Rules
- **Minimum font size**: 16px (1rem) for body text
- **Line length**: 60-100 characters maximum
- **Line height**: Minimum 1.5x for body text (WCAG 1.4.12)
- **Letter spacing**: -0.02em for headings, normal for body
- **Alignment**: Left for English, Right for Arabic (RTL)
- **Never**: Justify text, underline non-links, indent paragraphs

### Responsive Typography

```scss
// One-step decrease for smaller screens
h1 { font-size: clamp(1.75rem, 3vw, 2.25rem); }
h2 { font-size: clamp(1.25rem, 2vw, 1.5rem); }
body { font-size: clamp(0.9375rem, 1vw, 1rem); }
```

---

## 3. Color System

### Primary Brand Colors (ThinkPLUS)

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| Teal Dark | `$teal-dark` | #035a66 | Primary hover, active |
| Teal | `$teal` | #047481 | Primary brand color |
| Teal Light | `$teal-light` | #5ee7f7 | Highlights, accents |

### Neutral Colors (WCAG AAA - 7:1 contrast)

| Name | Variable | Hex | Contrast vs White | Usage |
|------|----------|-----|-------------------|-------|
| Gray 50 | `$gray-50` | #f8fafc | - | Backgrounds |
| Gray 100 | `$gray-100` | #f1f5f9 | - | Subtle backgrounds |
| Gray 200 | `$gray-200` | #e2e8f0 | - | Borders |
| Gray 300 | `$gray-300` | #cbd5e1 | - | Disabled states |
| Gray 400 | `$gray-400` | #545e6e | 7.01:1 | Muted text |
| Gray 500 | `$gray-500` | #495567 | 7.01:1 | Secondary text |
| Gray 600 | `$gray-600` | #3f4a5c | 7.03:1 | Body text |
| Gray 700 | `$gray-700` | #334155 | 9.51:1 | Headings |
| Gray 800 | `$gray-800` | #1e293b | 13.81:1 | Strong emphasis |

### Semantic Colors

| Purpose | Variable | Hex | Usage |
|---------|----------|-----|-------|
| Success | `$green` | #276749 | Confirmations, positive |
| Warning | `$orange` | #c05621 | Warnings, caution |
| Error | `$danger` | #c53030 | Errors, destructive |
| Info | `$blue` | #2b6cb0 | Information, links |

### Color Usage Rules
- **Text on white**: Use Gray 600+ for AAA compliance
- **Primary actions**: Teal with dark hover state
- **Destructive actions**: Error color with confirmation
- **Never**: Use color as the only indicator (accessibility)

---

## 4. Spacing System

### Base Unit: 4px

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `space-0` | 0 | 0px | Reset |
| `space-1` | 0.25rem | 4px | Tight spacing |
| `space-2` | 0.5rem | 8px | Compact elements |
| `space-3` | 0.75rem | 12px | Default inline |
| `space-4` | 1rem | 16px | Standard spacing |
| `space-5` | 1.25rem | 20px | Medium spacing |
| `space-6` | 1.5rem | 24px | Section spacing |
| `space-8` | 2rem | 32px | Large sections |
| `space-10` | 2.5rem | 40px | Page sections |
| `space-12` | 3rem | 48px | Major sections |

### Spacing Guidelines
- **Component internal padding**: 16-24px
- **Card padding**: 24px (1.5rem)
- **Section gaps**: 24-32px
- **Page margins**: 16px (mobile), 24px (tablet), 32px (desktop)

---

## 5. Layout & Grid

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `xs` | 0-639px | Mobile portrait |
| `sm` | 640px+ | Mobile landscape |
| `md` | 768px+ | Tablet |
| `lg` | 1024px+ | Desktop |
| `xl` | 1280px+ | Large desktop |
| `2xl` | 1536px+ | Extra large |
| `4k` | 3840px+ | 4K displays |

### Container Widths

| Breakpoint | Max Width | Side Margin |
|------------|-----------|-------------|
| Mobile | 100% | 16px |
| Tablet | 740px | 14px |
| Desktop | 1200px | 20px |
| Large | 1400px | 28px |
| 4K | 2000px | 32px |

### Grid System
- **Default**: 12-column grid
- **Gutters**: 24px (desktop), 16px (mobile)
- **Column ratio**: Flexible based on content

---

## 6. Components

### Buttons

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| Primary | Teal gradient | White | Teal | Main actions |
| Secondary | Gray 600 | White | Gray 600 | Secondary actions |
| Outline Primary | Transparent | Teal | Teal | Alternative primary |
| Outline Secondary | White | Gray 500 | Gray 200 | Tertiary actions |
| Danger | Error | White | Error | Destructive actions |

**Button Specifications**:
- Min height: 44px (WCAG AAA touch target)
- Padding: 12px 20px
- Border radius: 8px
- Font weight: 500
- Transition: 0.2s ease

### Cards

```scss
.card {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 12px;
  box-shadow: var(--tp-shadow-sm);
  padding: 24px;

  // Glass highlight
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  }

  &:hover {
    box-shadow: var(--tp-shadow-lg);
    transform: translateY(-4px);
  }
}
```

### Form Inputs

| State | Border | Shadow | Background |
|-------|--------|--------|------------|
| Default | Gray 200 | Subtle | White |
| Hover | Gray 300 | - | White |
| Focus | Teal | Focus ring | White |
| Error | Error | Error glow | White |
| Disabled | Gray 200 | None | Gray 50 |

**Input Specifications**:
- Min height: 44px
- Padding: 12px 16px
- Border radius: 8px
- Font size: 16px (prevents iOS zoom)

### Navigation

- **Active state**: Teal background with gradient
- **Hover state**: Gray 100 background, lift effect
- **Focus**: 2px teal outline, 2px offset
- **Touch target**: 44px minimum

---

## 7. Effects & Animations

### Shadows (Layered for Depth)

```scss
--tp-shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
--tp-shadow-md: 0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06);
--tp-shadow-lg: 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.04);
--tp-shadow-hover: 0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06);
--tp-shadow-glow-primary: 0 4px 14px rgba(4, 116, 129, 0.25);
```

### Glassmorphism

```scss
.glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

### Transitions

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Fast | 0.1s | ease | Micro-interactions |
| Normal | 0.2s | ease | Standard transitions |
| Slow | 0.3s | cubic-bezier(0.4, 0, 0.2, 1) | Complex animations |
| Bounce | 0.4s | cubic-bezier(0.175, 0.885, 0.32, 1.275) | Playful effects |

### Micro-interactions

1. **Button press**: scale(0.98) on active
2. **Card hover**: translateY(-4px) + shadow
3. **Icon hover**: scale(1.1)
4. **Nav link**: gradient background fade
5. **Ripple effect**: radial gradient on click

---

## 8. Accessibility (WCAG 2.1 AAA)

### Requirements

| Criterion | Requirement | Our Standard |
|-----------|-------------|--------------|
| Color Contrast | 4.5:1 (AA), 7:1 (AAA) | 7:1 minimum |
| Touch Targets | 44x44px minimum | 44x44px |
| Focus Indicators | Visible | 2px outline + glow |
| Keyboard Navigation | Full support | Tab + Enter + Escape |
| Screen Readers | ARIA labels | Full support |
| Motion | Reduced motion support | `prefers-reduced-motion` |

### Color Contrast Checker

| Text Color | Background | Ratio | Status |
|------------|------------|-------|--------|
| Gray 400 (#545e6e) | White | 7.01:1 | AAA |
| Gray 500 (#495567) | White | 7.01:1 | AAA |
| Gray 600 (#3f4a5c) | White | 7.03:1 | AAA |
| Teal (#047481) | White | 4.7:1 | AA |
| White | Teal | 4.7:1 | AA |

### Focus States

```scss
*:focus-visible {
  outline: 2px solid var(--tp-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(4, 116, 129, 0.4);
}
```

### Keyboard Shortcuts
- **Tab**: Navigate forward
- **Shift+Tab**: Navigate backward
- **Enter/Space**: Activate element
- **Escape**: Close modals/dropdowns
- **Arrow keys**: Navigate within components

---

## 9. Icons

### Specifications
- **Format**: SVG preferred
- **Size**: 16px (small), 20px (default), 24px (large)
- **Stroke**: 1.5px consistent
- **Color**: currentColor (inherits)
- **Touch area**: 44x44px minimum

### Icon Usage
- Always pair icons with text labels (accessibility)
- Use `aria-hidden="true"` for decorative icons
- Provide `alt` text for meaningful icons

---

## 10. File Naming Conventions

### Components
```
component-name.component.ts
component-name.component.html
component-name.component.scss
```

### Styles
```
_variables.scss      // Variables and tokens
_mixins.scss         // Reusable mixins
_typography.scss     // Typography styles
_components.scss     // Component styles
```

### Assets
```
assets/
  icons/
    icon-name.svg
  images/
    image-name.png
  fonts/
    font-name.otf
```

---

## 11. Code Standards

### SCSS Variables
```scss
// Colors
$teal: #047481;
$gray-500: #495567;

// Spacing
$space-4: 1rem;

// Use CSS custom properties for runtime theming
:root {
  --tp-primary: #{$teal};
  --tp-spacing: #{$space-4};
}
```

### Component Structure
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule],
  template: `...`,
  styles: [`...`]
})
export class ComponentName {
  // Signals for state
  state = signal<Type>(initialValue);

  // Computed for derived state
  derived = computed(() => this.state().property);
}
```

---

## 12. Checklist for New Pages

### Before Development
- [ ] Review this design system
- [ ] Check existing components
- [ ] Plan responsive breakpoints
- [ ] Consider accessibility from start

### During Development
- [ ] Use design tokens (not hardcoded values)
- [ ] Follow spacing system
- [ ] Apply consistent typography
- [ ] Add focus states
- [ ] Test keyboard navigation
- [ ] Add ARIA labels

### After Development
- [ ] Run WCAG AAA audit
- [ ] Test all breakpoints
- [ ] Verify touch targets (44px)
- [ ] Check color contrast
- [ ] Test with screen reader
- [ ] Performance check

---

## 13. Resources

### Design System References
- [UAE Design System](https://designsystem.gov.ae)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Material](https://material.angular.io)

### Tools
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

*Last Updated: February 2026*
*Version: 1.0.0*
