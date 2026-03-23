import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthTab } from '../../models/administration.models';

@Component({
  selector: 'app-master-auth-section',
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
                <h1 class="manager-title">Master Authentication</h1>
                <p class="manager-description">Configure master identity providers, SSO, MFA, and security policies</p>
              </div>
            </header>

            <!-- Auth Tabs -->
            <nav class="section-tabs">
              <button class="section-tab" [class.active]="authTab() === 'providers'" (click)="authTab.set('providers')" data-testid="auth-tab-providers">
                <img src="assets/icons/user-circle.svg" alt="" aria-hidden="true" class="tab-icon">
                Identity Providers
              </button>
              <button class="section-tab" [class.active]="authTab() === 'sso'" (click)="authTab.set('sso')" data-testid="auth-tab-sso">
                <img src="assets/icons/layers.svg" alt="" aria-hidden="true" class="tab-icon">
                Single Sign-On
              </button>
              <button class="section-tab" [class.active]="authTab() === 'mfa'" (click)="authTab.set('mfa')" data-testid="auth-tab-mfa">
                <img src="assets/icons/cog.svg" alt="" aria-hidden="true" class="tab-icon">
                Multi-Factor Auth
              </button>
              <button class="section-tab" [class.active]="authTab() === 'sessions'" (click)="authTab.set('sessions')" data-testid="auth-tab-sessions">
                <img src="assets/icons/clock.svg" alt="" aria-hidden="true" class="tab-icon">
                Sessions
              </button>
              <button class="section-tab" [class.active]="authTab() === 'policies'" (click)="authTab.set('policies')" data-testid="auth-tab-policies">
                <img src="assets/icons/briefcase.svg" alt="" aria-hidden="true" class="tab-icon">
                Policies
              </button>
            </nav>

            <!-- Identity Providers Tab -->
            @if (authTab() === 'providers') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Identity Providers</h2>
                    <p class="content-desc">Configure how users authenticate to the system</p>
                  </div>
                  <button class="btn btn-primary btn-sm" data-testid="add-provider-btn">
                    <img src="assets/icons/plus.svg" alt="" aria-hidden="true" class="btn-icon">
                    Add Provider
                  </button>
                </div>

                <div class="providers-grid">
                  <!-- Local Authentication -->
                  <div class="provider-card">
                    <div class="provider-header">
                      <div class="provider-icon provider-icon-local">
                        <img src="assets/icons/user.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="provider-info">
                        <h3 class="provider-name">Local Authentication</h3>
                        <span class="provider-type">Email & Password</span>
                      </div>
                      <span class="status-pill status-active">Active</span>
                    </div>
                    <div class="provider-settings">
                      <div class="setting-row">
                        <span class="setting-name">Password Policy</span>
                        <span class="setting-value">Strong (12+ chars)</span>
                      </div>
                      <div class="setting-row">
                        <span class="setting-name">Account Lockout</span>
                        <span class="setting-value">After 5 attempts</span>
                      </div>
                    </div>
                    <div class="provider-actions">
                      <button class="btn btn-outline-secondary btn-sm">Configure</button>
                    </div>
                  </div>

                  <!-- OAuth/OIDC -->
                  <div class="provider-card provider-card-disabled">
                    <div class="provider-header">
                      <div class="provider-icon provider-icon-oauth">
                        <img src="assets/icons/layers.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="provider-info">
                        <h3 class="provider-name">OAuth 2.0 / OIDC</h3>
                        <span class="provider-type">OpenID Connect</span>
                      </div>
                      <span class="status-pill status-inactive">Inactive</span>
                    </div>
                    <div class="provider-empty">
                      <p>Connect with OAuth 2.0 or OpenID Connect providers</p>
                    </div>
                    <div class="provider-actions">
                      <button class="btn btn-primary btn-sm">Enable</button>
                    </div>
                  </div>

                  <!-- SAML -->
                  <div class="provider-card provider-card-disabled">
                    <div class="provider-header">
                      <div class="provider-icon provider-icon-saml">
                        <img src="assets/icons/briefcase.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="provider-info">
                        <h3 class="provider-name">SAML 2.0</h3>
                        <span class="provider-type">Enterprise SSO</span>
                      </div>
                      <span class="status-pill status-inactive">Inactive</span>
                    </div>
                    <div class="provider-empty">
                      <p>Configure SAML-based enterprise authentication</p>
                    </div>
                    <div class="provider-actions">
                      <button class="btn btn-primary btn-sm">Enable</button>
                    </div>
                  </div>

                  <!-- LDAP/AD -->
                  <div class="provider-card provider-card-disabled">
                    <div class="provider-header">
                      <div class="provider-icon provider-icon-ldap">
                        <img src="assets/icons/building.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="provider-info">
                        <h3 class="provider-name">LDAP / Active Directory</h3>
                        <span class="provider-type">Directory Service</span>
                      </div>
                      <span class="status-pill status-inactive">Inactive</span>
                    </div>
                    <div class="provider-empty">
                      <p>Connect to LDAP or Active Directory servers</p>
                    </div>
                    <div class="provider-actions">
                      <button class="btn btn-primary btn-sm">Enable</button>
                    </div>
                  </div>

                  <!-- UAE Pass -->
                  <div class="provider-card provider-card-disabled">
                    <div class="provider-header">
                      <div class="provider-icon provider-icon-uaepass">
                        <img src="assets/icons/user-circle.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="provider-info">
                        <h3 class="provider-name">UAE Pass</h3>
                        <span class="provider-type">UAE Digital Identity</span>
                      </div>
                      <span class="status-pill status-inactive">Inactive</span>
                    </div>
                    <div class="provider-empty">
                      <p>Enable UAE Pass for secure digital identity authentication via OAuth 2.0/OIDC</p>
                    </div>
                    <div class="provider-actions">
                      <button class="btn btn-primary btn-sm" (click)="showUaePassConfig.set(true)">Enable</button>
                    </div>
                  </div>
                </div>

                <!-- UAE Pass Configuration Modal -->
                @if (showUaePassConfig()) {
                  <div class="modal-overlay" (click)="showUaePassConfig.set(false)">
                    <div class="config-modal" (click)="$event.stopPropagation()">
                      <div class="modal-header">
                        <h2 class="modal-title">Configure UAE Pass</h2>
                        <button class="btn-close" (click)="showUaePassConfig.set(false)" aria-label="Close">
                          <img src="assets/icons/times.svg" alt="" aria-hidden="true">
                        </button>
                      </div>
                      <div class="modal-body">
                        <p class="modal-desc">Configure UAE Pass integration for secure digital identity authentication in the UAE.</p>

                        <div class="config-section">
                          <h3 class="config-section-title">Environment</h3>
                          <div class="form-group">
                            <label class="form-label" for="uaepass-env">Environment</label>
                            <select class="form-select" id="uaepass-env" [(ngModel)]="uaePassConfig.environment">
                              <option value="staging">Staging (stg-id.uaepass.ae)</option>
                              <option value="production">Production (id.uaepass.ae)</option>
                            </select>
                          </div>
                        </div>

                        <div class="config-section">
                          <h3 class="config-section-title">OAuth 2.0 / OIDC Configuration</h3>
                          <div class="form-group">
                            <label class="form-label" for="uaepass-client-id">Client ID *</label>
                            <input type="text" class="form-control" id="uaepass-client-id"
                                   [(ngModel)]="uaePassConfig.clientId" placeholder="Your UAE Pass Client ID">
                          </div>
                          <div class="form-group">
                            <label class="form-label" for="uaepass-client-secret">Client Secret *</label>
                            <input type="password" class="form-control" id="uaepass-client-secret"
                                   [(ngModel)]="uaePassConfig.clientSecret" placeholder="Your UAE Pass Client Secret">
                          </div>
                          <div class="form-group">
                            <label class="form-label" for="uaepass-redirect">Redirect URI *</label>
                            <input type="text" class="form-control" id="uaepass-redirect"
                                   [(ngModel)]="uaePassConfig.redirectUri" placeholder="https://yourapp.com/auth/uaepass/callback">
                          </div>
                          <div class="form-group">
                            <label class="form-label" for="uaepass-scopes">Scopes</label>
                            <input type="text" class="form-control" id="uaepass-scopes"
                                   [(ngModel)]="uaePassConfig.scopes" placeholder="openid profile email">
                            <small class="form-hint">Space-separated list of OAuth scopes</small>
                          </div>
                        </div>

                        <div class="config-section">
                          <h3 class="config-section-title">Endpoints (Auto-configured)</h3>
                          <div class="endpoint-info">
                            <div class="endpoint-row">
                              <span class="endpoint-label">Authorization:</span>
                              <code class="endpoint-value">{{uaePassConfig.environment === 'staging' ? 'https://stg-id.uaepass.ae/idshub/authorize' : 'https://id.uaepass.ae/idshub/authorize'}}</code>
                            </div>
                            <div class="endpoint-row">
                              <span class="endpoint-label">Token:</span>
                              <code class="endpoint-value">{{uaePassConfig.environment === 'staging' ? 'https://stg-id.uaepass.ae/idshub/token' : 'https://id.uaepass.ae/idshub/token'}}</code>
                            </div>
                            <div class="endpoint-row">
                              <span class="endpoint-label">User Info:</span>
                              <code class="endpoint-value">{{uaePassConfig.environment === 'staging' ? 'https://stg-id.uaepass.ae/idshub/userinfo' : 'https://id.uaepass.ae/idshub/userinfo'}}</code>
                            </div>
                          </div>
                        </div>

                        <div class="config-section">
                          <h3 class="config-section-title">Documentation</h3>
                          <p class="help-text">
                            For integration details, visit the
                            <a href="https://docs.uaepass.ae" target="_blank" rel="noopener noreferrer">UAE Pass Documentation Portal</a>.
                          </p>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button class="btn btn-outline-secondary" (click)="showUaePassConfig.set(false)">Cancel</button>
                        <button class="btn btn-primary" (click)="saveUaePassConfig()" data-testid="save-uaepass-btn">Save Configuration</button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Social Logins Section -->
                <div class="sub-section">
                  <h3 class="sub-section-title">Social Login Providers</h3>
                  <p class="sub-section-desc">Allow users to sign in with social accounts</p>

                  <div class="social-providers">
                    <div class="social-provider">
                      <div class="social-icon social-google">G</div>
                      <span class="social-name">Google</span>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="social-provider">
                      <div class="social-icon social-microsoft">M</div>
                      <span class="social-name">Microsoft</span>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="social-provider">
                      <div class="social-icon social-github">GH</div>
                      <span class="social-name">GitHub</span>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="social-provider">
                      <div class="social-icon social-apple">A</div>
                      <span class="social-name">Apple</span>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- SSO Tab -->
            @if (authTab() === 'sso') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Single Sign-On Configuration</h2>
                    <p class="content-desc">Configure enterprise SSO connections</p>
                  </div>
                </div>

                <!-- SSO Settings -->
                <div class="settings-card">
                  <h3 class="settings-card-title">SAML 2.0 Configuration</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Identity Provider Entity ID</label>
                      <input type="text" class="form-control" placeholder="https://idp.example.com/entity">
                    </div>
                    <div class="form-group">
                      <label class="form-label">SSO URL</label>
                      <input type="text" class="form-control" placeholder="https://idp.example.com/sso">
                    </div>
                    <div class="form-group form-group-full">
                      <label class="form-label">X.509 Certificate</label>
                      <textarea class="form-control" rows="4" placeholder="-----BEGIN CERTIFICATE-----"></textarea>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Name ID Format</label>
                      <select class="form-select">
                        <option>Email Address</option>
                        <option>Persistent</option>
                        <option>Transient</option>
                        <option>Unspecified</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Signature Algorithm</label>
                      <select class="form-select">
                        <option>RSA-SHA256</option>
                        <option>RSA-SHA384</option>
                        <option>RSA-SHA512</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Service Provider Info -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Service Provider Metadata</h3>
                  <p class="settings-card-desc">Share these details with your identity provider</p>
                  <div class="metadata-items">
                    <div class="metadata-item">
                      <span class="metadata-label">Entity ID</span>
                      <div class="metadata-value-row">
                        <code class="metadata-value">https://yourapp.com/saml/metadata</code>
                        <button class="btn-copy-sm" title="Copy">
                          <img src="assets/icons/copy.svg" alt="" aria-hidden="true">
                        </button>
                      </div>
                    </div>
                    <div class="metadata-item">
                      <span class="metadata-label">ACS URL</span>
                      <div class="metadata-value-row">
                        <code class="metadata-value">https://yourapp.com/saml/acs</code>
                        <button class="btn-copy-sm" title="Copy">
                          <img src="assets/icons/copy.svg" alt="" aria-hidden="true">
                        </button>
                      </div>
                    </div>
                    <div class="metadata-item">
                      <span class="metadata-label">SLO URL</span>
                      <div class="metadata-value-row">
                        <code class="metadata-value">https://yourapp.com/saml/slo</code>
                        <button class="btn-copy-sm" title="Copy">
                          <img src="assets/icons/copy.svg" alt="" aria-hidden="true">
                        </button>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-outline-secondary btn-sm" style="margin-top: 1rem;">
                    <img src="assets/icons/arrow-right.svg" alt="" aria-hidden="true" class="btn-icon-dark">
                    Download Metadata XML
                  </button>
                </div>
              </div>
            }

            <!-- MFA Tab -->
            @if (authTab() === 'mfa') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Multi-Factor Authentication</h2>
                    <p class="content-desc">Configure additional security layers for user authentication</p>
                  </div>
                </div>

                <!-- MFA Global Settings -->
                <div class="settings-card">
                  <h3 class="settings-card-title">MFA Enforcement</h3>
                  <div class="mfa-options">
                    <label class="radio-card" [class.selected]="mfaEnforcement() === 'disabled'">
                      <input type="radio" name="mfa" value="disabled" [checked]="mfaEnforcement() === 'disabled'" (change)="mfaEnforcement.set('disabled')">
                      <div class="radio-content">
                        <span class="radio-title">Disabled</span>
                        <span class="radio-desc">MFA is not available for users</span>
                      </div>
                    </label>
                    <label class="radio-card" [class.selected]="mfaEnforcement() === 'optional'">
                      <input type="radio" name="mfa" value="optional" [checked]="mfaEnforcement() === 'optional'" (change)="mfaEnforcement.set('optional')">
                      <div class="radio-content">
                        <span class="radio-title">Optional</span>
                        <span class="radio-desc">Users can choose to enable MFA</span>
                      </div>
                    </label>
                    <label class="radio-card" [class.selected]="mfaEnforcement() === 'required'">
                      <input type="radio" name="mfa" value="required" [checked]="mfaEnforcement() === 'required'" (change)="mfaEnforcement.set('required')">
                      <div class="radio-content">
                        <span class="radio-title">Required</span>
                        <span class="radio-desc">All users must enable MFA</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- MFA Methods -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Available MFA Methods</h3>
                  <div class="mfa-methods">
                    <div class="mfa-method">
                      <div class="method-icon method-icon-totp">
                        <img src="assets/icons/clock.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="method-info">
                        <h4 class="method-name">Authenticator App (TOTP)</h4>
                        <p class="method-desc">Google Authenticator, Microsoft Authenticator, etc.</p>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="mfa-method">
                      <div class="method-icon method-icon-sms">
                        <img src="assets/icons/user.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="method-info">
                        <h4 class="method-name">SMS Verification</h4>
                        <p class="method-desc">Send codes via text message</p>
                      </div>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="mfa-method">
                      <div class="method-icon method-icon-email">
                        <img src="assets/icons/edit.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="method-info">
                        <h4 class="method-name">Email Verification</h4>
                        <p class="method-desc">Send codes via email</p>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="mfa-method">
                      <div class="method-icon method-icon-webauthn">
                        <img src="assets/icons/cog.svg" alt="" aria-hidden="true">
                      </div>
                      <div class="method-info">
                        <h4 class="method-name">Security Keys (WebAuthn)</h4>
                        <p class="method-desc">YubiKey, Touch ID, Windows Hello</p>
                      </div>
                      <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Recovery Options -->
                <div class="settings-card">
                  <h3 class="settings-card-title">Recovery Options</h3>
                  <div class="settings-form">
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Backup Codes</span>
                        <span class="toggle-desc">Generate one-time backup codes for recovery</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Number of Backup Codes</label>
                      <select class="form-select" style="max-width: 200px;">
                        <option>5 codes</option>
                        <option selected>10 codes</option>
                        <option>15 codes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Sessions Tab -->
            @if (authTab() === 'sessions') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Session Management</h2>
                    <p class="content-desc">Configure session timeouts and concurrent session handling</p>
                  </div>
                </div>

                <div class="settings-card">
                  <h3 class="settings-card-title">Session Timeouts</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Idle Timeout</label>
                      <div class="input-with-addon">
                        <input type="number" class="form-control" value="30">
                        <span class="input-addon">minutes</span>
                      </div>
                      <span class="form-hint">Session expires after period of inactivity</span>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Absolute Timeout</label>
                      <div class="input-with-addon">
                        <input type="number" class="form-control" value="24">
                        <span class="input-addon">hours</span>
                      </div>
                      <span class="form-hint">Maximum session duration regardless of activity</span>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Remember Me Duration</label>
                      <div class="input-with-addon">
                        <input type="number" class="form-control" value="30">
                        <span class="input-addon">days</span>
                      </div>
                      <span class="form-hint">How long to remember logged-in users</span>
                    </div>
                  </div>
                </div>

                <div class="settings-card">
                  <h3 class="settings-card-title">Concurrent Sessions</h3>
                  <div class="settings-form">
                    <div class="form-group">
                      <label class="form-label">Maximum Concurrent Sessions</label>
                      <select class="form-select" style="max-width: 250px;">
                        <option>1 session (single device)</option>
                        <option>3 sessions</option>
                        <option selected>5 sessions</option>
                        <option>10 sessions</option>
                        <option>Unlimited</option>
                      </select>
                    </div>
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Revoke Oldest Session</span>
                        <span class="toggle-desc">Automatically revoke oldest session when limit is reached</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                    <div class="setting-toggle">
                      <div class="toggle-info">
                        <span class="toggle-label">Notify on New Login</span>
                        <span class="toggle-desc">Send email notification when account is accessed from new device</span>
                      </div>
                      <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Active Sessions -->
                <div class="settings-card">
                  <div class="settings-card-header">
                    <h3 class="settings-card-title">Active Sessions</h3>
                    <button class="btn btn-outline-danger btn-sm" data-testid="revoke-all-sessions-btn">Revoke All Sessions</button>
                  </div>
                  <div class="empty-state-inline">
                    <img src="assets/icons/user-circle.svg" alt="" aria-hidden="true" class="empty-icon">
                    <p>No active sessions to display</p>
                  </div>
                </div>
              </div>
            }

            <!-- Policies Tab -->
            @if (authTab() === 'policies') {
              <div class="tab-content-section">
                <div class="content-header">
                  <div>
                    <h2 class="content-title">Security Policies</h2>
                    <p class="content-desc">Define password requirements and security rules</p>
                  </div>
                </div>

                <div class="settings-card">
                  <h3 class="settings-card-title">Password Policy</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Minimum Length</label>
                      <input type="number" class="form-control" value="12" min="6" max="128" style="max-width: 120px;">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Password Expiry</label>
                      <div class="input-with-addon" style="max-width: 200px;">
                        <input type="number" class="form-control" value="90">
                        <span class="input-addon">days</span>
                      </div>
                    </div>
                  </div>
                  <div class="checkbox-group">
                    <label class="checkbox-item">
                      <input type="checkbox" checked>
                      <span class="checkbox-label">Require uppercase letter</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" checked>
                      <span class="checkbox-label">Require lowercase letter</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" checked>
                      <span class="checkbox-label">Require number</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" checked>
                      <span class="checkbox-label">Require special character</span>
                    </label>
                    <label class="checkbox-item">
                      <input type="checkbox" checked>
                      <span class="checkbox-label">Prevent password reuse (last 5 passwords)</span>
                    </label>
                  </div>
                </div>

                <div class="settings-card">
                  <h3 class="settings-card-title">Account Lockout</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Failed Attempts Before Lockout</label>
                      <input type="number" class="form-control" value="5" min="1" max="20" style="max-width: 120px;">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Lockout Duration</label>
                      <div class="input-with-addon" style="max-width: 200px;">
                        <input type="number" class="form-control" value="30">
                        <span class="input-addon">minutes</span>
                      </div>
                    </div>
                  </div>
                  <div class="setting-toggle" style="margin-top: 1rem;">
                    <div class="toggle-info">
                      <span class="toggle-label">Progressive Lockout</span>
                      <span class="toggle-desc">Increase lockout duration after repeated lockouts</span>
                    </div>
                    <label class="switch">
                      <input type="checkbox" checked>
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>

                <div class="settings-card">
                  <h3 class="settings-card-title">IP Restrictions</h3>
                  <div class="setting-toggle">
                    <div class="toggle-info">
                      <span class="toggle-label">Enable IP Allowlist</span>
                      <span class="toggle-desc">Only allow access from specific IP addresses</span>
                    </div>
                    <label class="switch">
                      <input type="checkbox">
                      <span class="slider"></span>
                    </label>
                  </div>
                  <div class="form-group" style="margin-top: 1rem;">
                    <label class="form-label">Allowed IP Addresses</label>
                    <textarea class="form-control" rows="3" placeholder="Enter IP addresses or CIDR ranges, one per line" disabled></textarea>
                  </div>
                </div>
              </div>
            }
          </section>
  `
})
export class MasterAuthSectionComponent {
  // Auth tab state
  authTab = signal<AuthTab>('providers');
  mfaEnforcement = signal<'disabled' | 'optional' | 'required'>('optional');

  // UAE Pass configuration
  showUaePassConfig = signal<boolean>(false);
  uaePassConfig = {
    environment: 'staging' as 'staging' | 'production',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: 'openid profile email'
  };

  saveUaePassConfig(): void {
    console.log('Saving UAE Pass configuration:', this.uaePassConfig);
    // In a real application, this would save to backend
    this.showUaePassConfig.set(false);
  }
}
