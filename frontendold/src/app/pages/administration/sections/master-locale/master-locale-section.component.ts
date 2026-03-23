import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocaleTab } from '../../models/administration.models';

@Component({
  selector: 'app-master-locale-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @use '../../administration.styles' as *;
    :host { display: contents; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
          <section class="manager-section">
            <header class="manager-header">
              <div class="header-info">
                <h1 class="manager-title">Master Locale</h1>
                <p class="manager-description">Configure master languages, regions, and localization settings</p>
              </div>
            </header>

            <!-- Locale Tabs -->
            <nav class="section-tabs">
              <button class="section-tab" [class.active]="localeTab() === 'languages'" (click)="localeTab.set('languages')" data-testid="locale-tab-languages">
                <img src="assets/icons/globe.svg" alt="" aria-hidden="true" class="tab-icon">
                Languages
              </button>
              <button class="section-tab" [class.active]="localeTab() === 'regions'" (click)="localeTab.set('regions')" data-testid="locale-tab-regions">
                <img src="assets/icons/building.svg" alt="" aria-hidden="true" class="tab-icon">
                Regions
              </button>
              <button class="section-tab" [class.active]="localeTab() === 'formats'" (click)="localeTab.set('formats')" data-testid="locale-tab-formats">
                <img src="assets/icons/cog.svg" alt="" aria-hidden="true" class="tab-icon">
                Formats
              </button>
              <button class="section-tab" [class.active]="localeTab() === 'translations'" (click)="localeTab.set('translations')" data-testid="locale-tab-translations">
                <img src="assets/icons/edit.svg" alt="" aria-hidden="true" class="tab-icon">
                Translations
              </button>
            </nav>

            <!-- Languages Tab -->
            @if (localeTab() === 'languages') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Supported Languages</h2>
                    <p class="content-desc">Manage available languages for your application</p>
                  </div>
                  <button class="btn btn-primary btn-sm" data-testid="add-language-btn">
                    <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon">
                    Add Language
                  </button>
                </div>

                <!-- Default Language -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Default Language</h3>
                  <div class="default-language">
                    <div class="language-flag">EN</div>
                    <div class="language-info">
                      <span class="language-name">English (US)</span>
                      <span class="language-code">en-US</span>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm">Change</button>
                  </div>
                </div>

                <!-- Languages List -->
                <div class="data-table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th class="col-flag"></th>
                        <th class="col-name">Language</th>
                        <th class="col-code">Code</th>
                        <th class="col-direction">Direction</th>
                        <th class="col-coverage">Translation Coverage</th>
                        <th class="col-status">Status</th>
                        <th class="col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="empty-row">
                        <td colspan="7">
                          <div class="empty-state">
                            <img src="assets/icons/globe.svg" alt="" aria-hidden="true" class="empty-icon">
                            <h4>No Additional Languages</h4>
                            <p>Add languages to support multiple locales in your application</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Language Detection -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Language Detection</h3>
                  <div class="detection-options">
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Auto-detect Browser Language</span>
                        <span class="toggle-desc">Automatically set language based on user's browser settings</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Remember User Preference</span>
                        <span class="toggle-desc">Save user's language selection for future visits</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">URL-based Language Selection</span>
                        <span class="toggle-desc">Support language codes in URL (e.g., /en/products)</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Regions Tab -->
            @if (localeTab() === 'regions') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Regional Settings</h2>
                    <p class="content-desc">Configure region-specific settings and availability</p>
                  </div>
                  <button class="btn btn-primary btn-sm" data-testid="add-region-btn">
                    <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon">
                    Add Region
                  </button>
                </div>

                <!-- Default Region -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Default Region</h3>
                  <div class="default-language">
                    <div class="language-flag">US</div>
                    <div class="language-info">
                      <span class="language-name">United States</span>
                      <span class="language-code">Americas</span>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm">Change</button>
                  </div>
                </div>

                <!-- Regions Grid -->
                <div class="regions-grid">
                  <div class="region-card">
                    <div class="region-header">
                      <h4 class="region-name">Americas</h4>
                      <span class="region-count">0 countries</span>
                    </div>
                    <div class="region-countries">
                      <p class="region-empty">No countries configured</p>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm btn-full">Configure</button>
                  </div>
                  <div class="region-card">
                    <div class="region-header">
                      <h4 class="region-name">Europe</h4>
                      <span class="region-count">0 countries</span>
                    </div>
                    <div class="region-countries">
                      <p class="region-empty">No countries configured</p>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm btn-full">Configure</button>
                  </div>
                  <div class="region-card">
                    <div class="region-header">
                      <h4 class="region-name">Asia Pacific</h4>
                      <span class="region-count">0 countries</span>
                    </div>
                    <div class="region-countries">
                      <p class="region-empty">No countries configured</p>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm btn-full">Configure</button>
                  </div>
                  <div class="region-card">
                    <div class="region-header">
                      <h4 class="region-name">Middle East & Africa</h4>
                      <span class="region-count">0 countries</span>
                    </div>
                    <div class="region-countries">
                      <p class="region-empty">No countries configured</p>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm btn-full">Configure</button>
                  </div>
                </div>

                <!-- Geo Settings -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Geo-Location Settings</h3>
                  <div class="settings-form">
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Auto-detect User Region</span>
                        <span class="toggle-desc">Determine user's region based on IP address</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Region-based Content</span>
                        <span class="toggle-desc">Show different content based on user's region</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Restrict Access by Region</span>
                        <span class="toggle-desc">Block access from specific regions</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Formats Tab -->
            @if (localeTab() === 'formats') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Format Settings</h2>
                    <p class="content-desc">Configure date, time, number, and currency formats</p>
                  </div>
                </div>

                <!-- Date & Time Formats -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Date & Time Formats</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Date Format</label>
                      <select class="form-select">
                        <option>MM/DD/YYYY (12/31/2024)</option>
                        <option>DD/MM/YYYY (31/12/2024)</option>
                        <option>YYYY-MM-DD (2024-12-31)</option>
                        <option>DD MMM YYYY (31 Dec 2024)</option>
                        <option>MMMM D, YYYY (December 31, 2024)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Time Format</label>
                      <select class="form-select">
                        <option>12-hour (2:30 PM)</option>
                        <option>24-hour (14:30)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Default Timezone</label>
                      <select class="form-select">
                        <option>UTC</option>
                        <option>America/New_York (EST/EDT)</option>
                        <option>America/Los_Angeles (PST/PDT)</option>
                        <option>Europe/London (GMT/BST)</option>
                        <option>Asia/Dubai (GST)</option>
                        <option>Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">First Day of Week</label>
                      <select class="form-select">
                        <option>Sunday</option>
                        <option>Monday</option>
                        <option>Saturday</option>
                      </select>
                    </div>
                  </div>
                  <div class="format-preview">
                    <span class="preview-label">Preview:</span>
                    <span class="preview-value">December 31, 2024 at 2:30 PM</span>
                  </div>
                </div>

                <!-- Number Formats -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Number Formats</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Decimal Separator</label>
                      <select class="form-select">
                        <option>Period (1,234.56)</option>
                        <option>Comma (1.234,56)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Thousands Separator</label>
                      <select class="form-select">
                        <option>Comma (1,234,567)</option>
                        <option>Period (1.234.567)</option>
                        <option>Space (1 234 567)</option>
                        <option>None (1234567)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Decimal Places</label>
                      <select class="form-select">
                        <option>0</option>
                        <option selected>2</option>
                        <option>3</option>
                        <option>4</option>
                      </select>
                    </div>
                  </div>
                  <div class="format-preview">
                    <span class="preview-label">Preview:</span>
                    <span class="preview-value">1,234,567.89</span>
                  </div>
                </div>

                <!-- Currency Formats -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Currency Settings</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Default Currency</label>
                      <select class="form-select">
                        <option>USD - US Dollar ($)</option>
                        <option>EUR - Euro (\u20AC)</option>
                        <option>GBP - British Pound (\u00A3)</option>
                        <option>AED - UAE Dirham (AED)</option>
                        <option>JPY - Japanese Yen (\u00A5)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Currency Symbol Position</label>
                      <select class="form-select">
                        <option>Before amount ($100.00)</option>
                        <option>After amount (100.00$)</option>
                      </select>
                    </div>
                  </div>
                  <div class="format-preview">
                    <span class="preview-label">Preview:</span>
                    <span class="preview-value">$1,234.56</span>
                  </div>
                </div>

                <!-- Measurement Units -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Measurement Units</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Unit System</label>
                      <select class="form-select">
                        <option>Metric (km, kg, \u00B0C)</option>
                        <option>Imperial (mi, lb, \u00B0F)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Translations Tab -->
            @if (localeTab() === 'translations') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Translation Management</h2>
                    <p class="content-desc">Manage text translations across all languages</p>
                  </div>
                  <div class="header-actions">
                    <button class="btn btn-outline-secondary btn-sm" data-testid="export-translations-btn">
                      <img src="assets/icons/arrow-right.svg" alt="" aria-hidden="true" class="btn-icon-dark">
                      Export
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" data-testid="import-translations-btn">
                      <img src="assets/icons/arrow-left.svg" alt="" aria-hidden="true" class="btn-icon-dark">
                      Import
                    </button>
                  </div>
                </div>

                <!-- Translation Stats -->
                <div class="stats-row">
                  <div class="stat-card">
                    <div class="stat-icon stat-icon-total">
                      <img src="assets/icons/edit.svg" alt="" aria-hidden="true">
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">0</span>
                      <span class="stat-label">Total Keys</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon stat-icon-active">
                      <img src="assets/icons/check.svg" alt="" aria-hidden="true">
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">0</span>
                      <span class="stat-label">Translated</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon stat-icon-trial">
                      <img src="assets/icons/clock.svg" alt="" aria-hidden="true">
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">0</span>
                      <span class="stat-label">Pending</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon stat-icon-suspended">
                      <img src="assets/icons/times.svg" alt="" aria-hidden="true">
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">0</span>
                      <span class="stat-label">Missing</span>
                    </div>
                  </div>
                </div>

                <!-- Translation Search -->
                <div class="toolbar">
                  <div class="search-box">
                    <img src="assets/icons/search.svg" alt="" class="search-icon">
                    <input type="text" class="search-input" placeholder="Search translation keys or values..." data-testid="translation-search">
                  </div>
                  <div class="filter-group">
                    <select class="filter-select">
                      <option value="">All Languages</option>
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="es">Spanish</option>
                    </select>
                    <select class="filter-select">
                      <option value="">All Categories</option>
                      <option value="ui">UI Elements</option>
                      <option value="messages">Messages</option>
                      <option value="errors">Errors</option>
                    </select>
                    <select class="filter-select">
                      <option value="">All Status</option>
                      <option value="translated">Translated</option>
                      <option value="pending">Pending Review</option>
                      <option value="missing">Missing</option>
                    </select>
                  </div>
                </div>

                <!-- Translations Table -->
                <div class="data-table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th class="col-key">Key</th>
                        <th class="col-category">Category</th>
                        <th class="col-base">Base (English)</th>
                        <th class="col-translation">Translation</th>
                        <th class="col-status">Status</th>
                        <th class="col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="empty-row">
                        <td colspan="6">
                          <div class="empty-state">
                            <img src="assets/icons/edit.svg" alt="" aria-hidden="true" class="empty-icon">
                            <h4>No Translation Keys</h4>
                            <p>Import translation files or add keys manually</p>
                            <button class="btn btn-primary btn-sm" data-testid="add-translation-key-btn">
                              <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon">
                              Add Translation Key
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </section>
  `
})
export class MasterLocaleSectionComponent {
  // Locale tab state
  localeTab = signal<LocaleTab>('languages');
}
