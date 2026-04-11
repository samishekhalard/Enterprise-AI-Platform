# Frontend Hardcoded String Inventory

**Total: 652 strings | Externalized: 0 | Completion: 0.0%**

---

## Priority P1 — Login & Auth Pages (~25 strings)

### login.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 19 | tag | "Welcome to" | `auth.login.welcome` |
| 42 | tag | "Empower. Transform. Succeed." | `auth.login.tagline` |
| 47 | tag | "Sign in with Email" | `auth.login.sign_in_email` |
| 54 | tag | "Having trouble signing in?" | `auth.login.trouble` |
| 64 | tag | "Contact support" | `auth.login.contact_support` |
| 77 | placeholder | "Enter your username" | `auth.login.username_placeholder` |
| 87 | placeholder | "Enter your password" | `auth.login.password_placeholder` |
| 100 | placeholder | "Enter tenant ID" | `auth.login.tenant_placeholder` |
| 137 | tag | "Signing in..." | `auth.login.signing_in` |
| 157 | tag | "Sign In" | `auth.login.sign_in` |
| 171 | tag | "Back" | `common.back` |

### login.page.ts
| Line | Context | String | i18n Key |
|------|---------|--------|----------|
| 116 | error | "Email or username and password are required" | `auth.login.error.credentials_required` |
| 142 | error | "Tenant ID is required" | `auth.login.error.tenant_required` |
| 143 | error | "Tenant ID must be a UUID or recognized alias" | `auth.login.error.tenant_invalid` |
| - | toast | "You have been signed out successfully" | `auth.login.signed_out` |
| - | toast | "Your session expired. Please sign in again" | `auth.login.session_expired` |
| - | toast | "Login failed. Please verify your credentials" | `auth.login.error.failed` |

### password-reset-request.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 9 | tag | "Reset Password" | `auth.reset.title` |
| 15 | tag | "Request a secure reset link" | `auth.reset.subtitle` |
| 34 | label | "Email address" | `auth.reset.email_label` |
| 40 | placeholder | "name@company.com" | `auth.reset.email_placeholder` |
| 41 | tag | "Check Your Email" | `auth.reset.check_email` |
| 48 | tag | "Return to sign in" | `auth.reset.return_signin` |

### password-reset-confirm.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 5 | tag | "Password Reset Successfully" | `auth.reset.success` |
| 7 | tag | "Sign In" | `auth.login.sign_in` |
| 12 | label | "New password" | `auth.reset.new_password` |
| 23 | label | "Confirm password" | `auth.reset.confirm_password` |
| 45 | tag | "Return to sign in" | `auth.reset.return_signin` |

---

## Priority P2 — Shell Layout & Error Pages (~15 strings)

### shell-layout.component.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 2 | tag | "Skip to main content" | `layout.skip_to_content` |
| 7 | aria-label | "ThinkPLUS Home" | `layout.home_aria` |
| 8 | alt | "ThinkPLUS" | `layout.logo_alt` |
| 30 | tag | "Sign Out" | `layout.sign_out` |
| 32 | tag | "Sign In" | `auth.login.sign_in` |

### access-denied.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 9 | tag | "Go Back" | `error.access_denied.go_back` |
| 10 | tag | "Go to Administration" | `error.access_denied.go_admin` |
| - | tag | "Access Denied" | `error.access_denied.title` |
| - | tag | "You do not have permission to access this page" | `error.access_denied.message` |

### session-expired.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 7 | tag | "Sign In" | `auth.login.sign_in` |
| - | tag | "Session Expired" | `error.session_expired.title` |

### tenant-not-found.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 8 | tag | "Contact Support" | `error.tenant_not_found.contact` |
| - | tag | "Tenant Not Found" | `error.tenant_not_found.title` |

---

## Priority P3 — Administration Page Chrome (~20 strings)

### administration.page.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 7 | aria-label | "Navigation menu" | `admin.nav_menu_aria` |
| 24 | tag | "ThinkPLUS Home" | `layout.home_aria` |
| 25 | tag | "Administration" | `admin.title` |
| 31 | tag | "Notifications" | `admin.notifications` |
| 32 | tag | "Help" | `admin.help` |
| 37 | tag | "Sign out" | `layout.sign_out` |
| 44 | tag | "Keyboard Shortcuts" | `admin.keyboard_shortcuts` |
| 61 | tag | "Close" | `common.close` |

### administration.page.ts
| Line | Context | String | i18n Key |
|------|---------|--------|----------|
| 79 | help | "Tab" | `admin.shortcut.tab` |
| 80 | help | "Move between interactive controls" | `admin.shortcut.tab_desc` |
| 81 | help | "Shift + Tab" | `admin.shortcut.shift_tab` |
| 82 | help | "Move to previous control" | `admin.shortcut.shift_tab_desc` |
| - | help | "Enter" | `admin.shortcut.enter` |
| - | help | "Activate selected dock item" | `admin.shortcut.enter_desc` |
| - | help | "Esc" | `admin.shortcut.esc` |
| - | help | "Close open overlays or dialogs" | `admin.shortcut.esc_desc` |

### administration.models.ts
| Line | Context | String | i18n Key |
|------|---------|--------|----------|
| 133 | nav-label | "Tenant Manager" | `admin.nav.tenant_manager` |
| 137 | nav-label | "License Manager" | `admin.nav.license_manager` |
| 141 | nav-label | "Master Locale" | `admin.nav.master_locale` |
| 145 | nav-label | "Master Definitions" | `admin.nav.master_definitions` |
| 154 | section-label | "Tenant Management" | `admin.section.tenant_management` |
| 155 | section-label | "License Management" | `admin.section.license_management` |

---

## Priority P4 — Master Locale Section (~40 strings)

### master-locale-section.component.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| - | tab | "Languages" | `admin.locale.tab.languages` |
| - | tab | "Dictionary" | `admin.locale.tab.dictionary` |
| - | tab | "Import / Export" | `admin.locale.tab.import_export` |
| - | tab | "Rollback" | `admin.locale.tab.rollback` |
| 44 | placeholder | "Search locales..." | `admin.locale.search_locales` |
| 52 | header | "Flag" | `admin.locale.col.flag` |
| 53 | header | "Name" | `common.name` |
| 54 | header | "Code" | `admin.locale.col.code` |
| 55 | header | "LCID" | `admin.locale.col.lcid` |
| 56 | header | "Direction" | `admin.locale.col.direction` |
| 57 | header | "Alternative" | `admin.locale.col.alternative` |
| - | header | "Active" | `common.active` |
| 111 | placeholder | "Search keys..." | `admin.locale.search_keys` |
| 118 | header | "Technical Name" | `admin.locale.col.technical_name` |
| 119 | header | "Module" | `admin.locale.col.module` |
| 123 | header | "Actions" | `common.actions` |
| 143 | empty | "No locales found" | `admin.locale.empty.locales` |
| 159 | empty | "No dictionary entries found" | `admin.locale.empty.dictionary` |
| 173 | dialog-header | "Edit Translations" | `admin.locale.dialog.edit_translations` |
| 174 | button | "Cancel" | `common.cancel` |
| - | button | "Save" | `common.save` |
| 185 | heading | "Export Dictionary" | `admin.locale.export.title` |
| 186 | tag | "Download all dictionary keys and translations as a UTF-8 BOM CSV file." | `admin.locale.export.description` |
| 191 | button | "Export CSV" | `admin.locale.export.button` |
| 192 | heading | "Import Dictionary" | `admin.locale.import.title` |
| 196 | tag | "Upload a CSV file (matching export format)." | `admin.locale.import.description` |
| 204 | button | "Choose CSV" | `admin.locale.import.choose` |
| 217 | button | "Confirm Import" | `admin.locale.import.confirm` |
| 267 | header | "Version" | `admin.locale.col.version` |
| - | header | "Type" | `admin.locale.col.type` |
| - | header | "Date" | `common.date` |
| - | header | "Created By" | `common.created_by` |
| - | header | "Status" | `common.status` |
| - | button | "Rollback" | `admin.locale.rollback.button` |

### master-locale-section.component.ts
| Line | Context | String | i18n Key |
|------|---------|--------|----------|
| 113 | dialog | "Cannot Deactivate" | `admin.locale.error.cannot_deactivate` |
| 114 | dialog | "Alternative locale must remain active..." | `admin.locale.error.alternative_must_active` |
| 129 | dialog | "Inactive Locale" | `admin.locale.error.inactive_locale` |
| 130 | dialog | "Locale must be active to be set as alternative." | `admin.locale.error.must_be_active` |
| 177 | toast | "Saved" | `common.saved` |
| 200 | toast | "Translations updated" | `admin.locale.success.translations_updated` |
| 221 | dialog | "Confirm Rollback" | `admin.locale.rollback.confirm_title` |
| 222 | dialog | "Are you sure you want to rollback to version..." | `admin.locale.rollback.confirm_message` |
| 228 | toast | "Rolled Back" | `admin.locale.success.rolled_back` |
| 229 | toast | "Restored version" | `admin.locale.success.restored_version` |

### admin-locale.service.ts
| Line | Context | String | i18n Key |
|------|---------|--------|----------|
| 67 | error | "Failed to load locales" | `admin.locale.error.load_locales` |
| 76 | error | "Failed to load active locales" | `admin.locale.error.load_active` |
| 90 | error | "Failed to activate locale" | `admin.locale.error.activate` |
| 106 | error | "Failed to deactivate locale" | `admin.locale.error.deactivate` |
| 122 | error | "Failed to set alternative locale" | `admin.locale.error.set_alternative` |
| 139 | error | "Failed to load dictionary" | `admin.locale.error.load_dictionary` |
| 158 | error | "Failed to update translations" | `admin.locale.error.update_translations` |
| 174 | error | "Failed to export dictionary" | `admin.locale.error.export` |
| 187 | error | "Failed to preview import" | `admin.locale.error.preview_import` |
| 202 | error | "Failed to commit import" | `admin.locale.error.commit_import` |
| 219 | error | "Failed to load versions" | `admin.locale.error.load_versions` |
| 234 | error | "Failed to rollback" | `admin.locale.error.rollback` |

---

## Priority P5 — License Manager Section (~25 strings)

### license-manager-section.component.html
| Line | Type | String | i18n Key |
|------|------|--------|----------|
| 4 | heading | "License Management" | `admin.license.title` |
| 9 | aria-label | "License view mode" | `admin.license.view_mode_aria` |
| 17 | button | "Refresh" | `common.refresh` |
| 26 | button | "Import License" | `admin.license.import` |
| 31 | empty | "No Licenses Configured" | `admin.license.empty.title` |
| 32 | empty | "Add First License" | `admin.license.empty.add_first` |
| 36 | header | "License ID" | `admin.license.col.id` |
| 37 | header | "Product" | `admin.license.col.product` |
| 45 | header | "Version" | `admin.license.col.version` |
| 49 | header | "Expiry" | `admin.license.col.expiry` |
| 50 | header | "Grace Period" | `admin.license.col.grace` |
| 61 | header | "Tenants" | `admin.license.col.tenants` |
| 72 | header | "Features" | `admin.license.col.features` |
| 78 | header | "Customer" | `admin.license.col.customer` |
| 82 | header | "Status" | `common.status` |
| 83 | header | "Actions" | `common.actions` |
| 103 | button | "View Details" | `common.view_details` |
| 110 | dialog | "Import License File" | `admin.license.import_dialog` |
| 120 | tag | "Drop your .lic file here" | `admin.license.drop_file` |
| 131 | tag | "Only .lic files accepted" | `admin.license.file_type_hint` |

---

## Priority P6 — Tenant Manager Section (~55 strings)

### tenant-manager-section.component.html
Key strings include: "Tenant Manager", "Total Tenants", "Active", "Pending", "Suspended", "Decommissioned", "Search tenants...", "Create Tenant", table column headers (Name, Slug, Tier, Status, Created, Actions), "Edit Tenant", "Delete Tenant", "Activate", "Suspend", "Lock", "Decommission", dialog text for confirmations, branding section labels, domain management labels, overview tab labels.

---

## Priority P7 — Master Definitions Section (~50 strings)

Table headers, form labels, object type CRUD dialogs, attribute management, connection management, empty states, error messages.

---

## Priority P8 — Master Auth Section (~10 strings)

Tab labels (Providers, SSO, MFA, Sessions, Policies), section descriptions.

---

## Priority P9 — About Page (~15 strings)

Platform name, tagline, feature titles, technology stack names, mission statement.

---

## Priority P10 — TypeScript Error Messages Across All Services (~50 strings)

Error messages in: admin-locale.service.ts, login.page.ts, user-embedded.component.ts, license-embedded.component.ts, tenants.page.ts, about.page.ts.

---

## Key Conventions

### i18n Key Naming Pattern
```
{module}.{feature}.{context}.{descriptor}

Examples:
  auth.login.welcome              → "Welcome to"
  admin.locale.tab.languages      → "Languages"
  admin.locale.error.load_locales → "Failed to load locales"
  common.save                     → "Save"
  common.cancel                   → "Cancel"
  error.access_denied.title       → "Access Denied"
```

### Common Keys (Reused Across Features)
| Key | String | Used In |
|-----|--------|---------|
| `common.save` | "Save" | Locale, Definitions, Tenant dialogs |
| `common.cancel` | "Cancel" | All dialogs |
| `common.close` | "Close" | All dialogs |
| `common.refresh` | "Refresh" | License, Provider pages |
| `common.actions` | "Actions" | All tables |
| `common.status` | "Status" | All tables |
| `common.name` | "Name" | All tables |
| `common.active` | "Active" | Locale, Provider, Tenant |
| `common.date` | "Date" | Versions, History tables |
| `common.created_by` | "Created By" | Versions, History |
| `common.back` | "Back" | Login, Error pages |
| `common.view_details` | "View Details" | License, Provider tables |
| `common.saved` | "Saved" | All edit actions |
| `auth.login.sign_in` | "Sign In" | Login, Shell, Error pages |
| `layout.sign_out` | "Sign out" | Shell, Admin |
