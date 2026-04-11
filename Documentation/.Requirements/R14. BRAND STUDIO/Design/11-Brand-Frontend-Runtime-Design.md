# R14 Brand Frontend Runtime Design

**Purpose:** define the frozen frontend runtime architecture for consuming the active brand manifest and applying it safely across login, splash, shell, and governed components.

---

## 1. Frozen runtime rule

Frontend runtime does not build the brand from scattered API calls or hardcoded UI rules.

Frontend runtime consumes one active brand manifest and applies it through one dedicated service pipeline.

---

## 2. Frozen service split

### 2.1 `TenantContextService`

Responsibilities:

- resolve tenant from hostname/login link
- expose tenant identity
- expose whether tenant resolution succeeded or failed

### 2.2 `BrandManifestService`

Responsibilities:

- hold the current active brand manifest in one typed source
- expose current default fallback manifest
- expose derived selectors used by login, shell, splash, and shared components

Frozen inputs:

- `resolve` payload with `tenant` and `activeBrand`

### 2.3 `BrandRuntimeService`

Responsibilities:

- reset previous brand runtime state
- inject foundation variables
- inject component variables
- inject approved font declarations/preloads
- update favicon
- update title/theme metadata
- coordinate asset binding readiness
- mark brand runtime ready

No other feature component should mutate root brand variables directly.

---

## 3. Frozen startup sequence

### 3.1 Anonymous/login

1. app bootstrap starts
2. tenant is resolved by hostname/login link
3. `BrandManifestService` receives `activeBrand`
4. `BrandRuntimeService` applies active brand
5. login route renders final branded state

### 3.2 Authenticated app

1. app bootstrap starts
2. tenant is resolved
3. `activeBrand` is loaded with tenant context
4. `BrandRuntimeService` applies active brand
5. shell and feature routes render final branded state

### 3.3 Tenant switch

1. remove current tenant brand tags and metadata
2. restore platform fallback manifest
3. apply new tenant active brand
4. render new branded state

---

## 4. Frozen DOM contract

### 4.1 Injected style tags

The only allowed injected style tags are:

- `tenant-brand-foundation-vars`
- `tenant-brand-component-vars`
- `tenant-brand-fonts`

### 4.2 Managed metadata

The runtime service owns:

- `<title>`
- `meta[name="theme-color"]`
- favicon `<link rel="icon">`

### 4.3 Managed asset bindings

The runtime service provides the resolved asset values used by:

- splash
- login
- shell header
- any future shared brand banner

---

## 5. Frozen CSS construction

### 5.1 Foundation variable block

`tenant-brand-foundation-vars` must contain:

- semantic palette variables
- typography family variables
- shape variables
- motion variables
- baseline document-level variables

Example responsibilities:

- `--tp-primary`
- `--tp-surface`
- `--tp-text`
- `--tp-font-family-heading`
- `--tp-font-family-body`
- `--nm-radius-md`

### 5.2 Component variable block

`tenant-brand-component-vars` must contain only bounded component token aliases.

Allowed categories:

- button
- input
- dialog
- table
- tag
- message
- paginator
- select

Do not inject arbitrary raw selectors or feature-scoped CSS here.

### 5.3 Font block

`tenant-brand-fonts` must:

- inject only approved font-face declarations or preload links
- never inject arbitrary remote CSS from user text input

---

## 6. Frozen component consumption model

### 6.1 Design-system components

Governed components must consume semantic variables only.

They should not know:

- which starter kit is active
- which palette pack was selected
- which typography pack was selected

They should only consume the final token variables.

### 6.2 Login, splash, shell

These surfaces must bind to manifest-derived selectors from `BrandManifestService`, not static asset paths.

Current as-is static surfaces called out in R14:

- `frontend/src/app/app.html`
- `frontend/src/app/layout/shell-layout/shell-layout.component.html`
- `frontend/src/app/features/auth/login.page.html`
- `frontend/src/index.html`

### 6.3 Preview mode

Preview must be session-local.

Preview application uses the same `BrandRuntimeService`, but with:

- preview manifest source
- explicit preview session scope
- explicit restore-to-active on exit

Preview must never mutate the active manifest source in memory for other sessions.

---

## 7. Frozen current-component reuse strategy

Current as-is editor evidence:

- `branding-studio.component.ts`
- `global-branding-form.component.html`
- component preview catalog under `branding-studio/previews/*`

These existing parts may be reused only as:

- preview library
- policy visualization
- token demonstration surfaces

They should not dictate the future product IA.

Specifically:

- hardcoded preset buttons must be replaced by Starter Kit selection
- readonly typography field must be replaced by Typography Pack selection
- raw asset URL fields must be replaced by governed asset-library selection/upload

---

## 8. Frozen failure and fallback behavior

### 8.1 Missing active brand

- use platform fallback manifest
- render safely
- do not fail the app shell

### 8.2 Broken asset URL

- use governed fallback asset
- log monitoring/audit signal

### 8.3 Partial manifest error

- reject invalid draft at publish time
- runtime uses last valid active brand or platform fallback

### 8.4 Unresolved tenant

- do not apply arbitrary tenant branding
- show unresolved tenant flow with platform fallback

---

## 9. Frozen Playwright acceptance

Frontend runtime is acceptable only when browser tests prove:

- login uses correct logo/background/title/favicon
- shell uses correct logo/title
- splash uses correct brand assets
- tenant switch fully replaces prior brand
- preview mode does not leak after exit
- object-definition icon picker reads from active icon library

---

## 10. Build order

Frozen frontend order:

1. update bootstrap to receive `activeBrand`
2. implement `BrandManifestService`
3. implement `BrandRuntimeService`
4. replace static login/shell/splash/favicon wiring
5. add preview-mode branch
6. add Playwright runtime coverage
