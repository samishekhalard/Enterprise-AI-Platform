import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../store/chat.store';
import { Agent, AgentCategory } from '../../models/agent.model';

@Component({
  selector: 'ai-agent-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="side-panel-overlay" (click)="close()"></div>
    <aside class="side-panel">
      <div class="panel-header">
        <h5 class="panel-title">
          <i class="bi bi-grid"></i> Browse Agents
        </h5>
        <button class="panel-close" (click)="close()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="panel-body">
          <!-- Search & Filter -->
          <div class="search-bar">
            <div class="search-input-wrapper">
              <i class="bi bi-search"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch($event)"
                placeholder="Search agents..."
                class="form-control"
              />
            </div>
            <select class="form-select category-filter" [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange($event)">
              <option value="">All Categories</option>
              @for (category of store.categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button
              class="tab"
              [class.active]="activeTab() === 'all'"
              (click)="setTab('all')"
            >
              All Agents
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'my'"
              (click)="setTab('my')"
            >
              My Agents
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'public'"
              (click)="setTab('public')"
            >
              Public
            </button>
          </div>

          <!-- Agent Grid -->
          <div class="agent-grid">
            @if (store.isLoading()) {
              <div class="loading">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            } @else if (store.agents().length === 0) {
              <div class="no-results">
                <i class="bi bi-emoji-frown"></i>
                <p>No agents found</p>
                <button class="btn btn-primary" (click)="createAgent()">
                  Create Your First Agent
                </button>
              </div>
            } @else {
              @for (agent of store.agents(); track agent.id) {
                <div class="agent-card" (click)="selectAgent(agent)">
                  <div class="agent-avatar">
                    @if (agent.avatarUrl) {
                      <img [src]="agent.avatarUrl" alt="" />
                    } @else {
                      <div class="avatar-placeholder">
                        <i class="bi bi-robot"></i>
                      </div>
                    }
                  </div>
                  <div class="agent-details">
                    <h6 class="agent-name">{{ agent.name }}</h6>
                    <p class="agent-description">{{ agent.description || 'No description' }}</p>
                    <div class="agent-meta">
                      <span class="provider-badge" [class]="agent.provider.toLowerCase()">
                        {{ agent.provider }}
                      </span>
                      @if (agent.ragEnabled) {
                        <span class="rag-badge">
                          <i class="bi bi-database"></i> RAG
                        </span>
                      }
                      <span class="usage">
                        <i class="bi bi-chat"></i> {{ agent.usageCount }}
                      </span>
                    </div>
                  </div>
                  @if (agent.isSystem) {
                    <span class="system-badge">System</span>
                  }
                  @if (agent.isPublic) {
                    <span class="public-badge">Public</span>
                  }
                </div>
              }
            }
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn btn-outline-primary" (click)="createAgent()">
            <i class="bi bi-plus-lg"></i> Create Agent
          </button>
        </div>
    </aside>
  `,
  styles: [`
    .side-panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1040;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .side-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 480px;
      background: white;
      z-index: 1050;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 32px rgba(0, 0, 0, 0.12), -2px 0 8px rgba(0, 0, 0, 0.06);
      animation: slideIn 0.25s ease;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @media (min-width: 768px) {
      .side-panel {
        max-width: 560px;
      }
    }

    @media (min-width: 1200px) {
      .side-panel {
        max-width: 640px;
      }
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #faf9f5;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-weight: 600;
      font-size: 1.1rem;
      color: #1a202c;
    }

    .panel-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: #545e6e;
      transition: all 0.15s ease;
    }

    .panel-close svg {
      width: 20px;
      height: 20px;
    }

    .panel-close:hover {
      background: #e2e8f0;
      color: #1a202c;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .search-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .search-input-wrapper {
      flex: 1;
      position: relative;
    }

    .search-input-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--bs-secondary, #6c757d);
    }

    .search-input-wrapper input {
      padding-left: 36px;
    }

    .category-filter {
      width: 200px;
    }

    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--bs-border-color, #dee2e6);
    }

    .tab {
      padding: 10px 16px;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--bs-secondary, #6c757d);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.2s, border-color 0.2s;
    }

    .tab:hover {
      color: var(--bs-primary, #0d6efd);
    }

    .tab.active {
      color: var(--bs-primary, #0d6efd);
      border-bottom-color: var(--bs-primary, #0d6efd);
    }

    .agent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .agent-card {
      position: relative;
      padding: 16px;
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
      display: flex;
      gap: 12px;
    }

    .agent-card:hover {
      border-color: var(--bs-primary, #0d6efd);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .agent-avatar {
      flex-shrink: 0;
    }

    .agent-avatar img,
    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .agent-details {
      flex: 1;
      min-width: 0;
    }

    .agent-name {
      margin: 0 0 4px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .agent-description {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--bs-secondary, #6c757d);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .agent-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .provider-badge {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .provider-badge.openai { background: #10a37f20; color: #10a37f; }
    .provider-badge.anthropic { background: #d4a27420; color: #d4a274; }
    .provider-badge.gemini { background: #4285f420; color: #4285f4; }
    .provider-badge.ollama { background: #6c757d20; color: #6c757d; }

    .rag-badge {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: #6f42c120;
      color: #6f42c1;
    }

    .usage {
      font-size: 0.75rem;
      color: var(--bs-secondary, #6c757d);
    }

    .system-badge,
    .public-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .system-badge {
      background: #ffc10720;
      color: #ffc107;
    }

    .public-badge {
      background: #0dcaf020;
      color: #0dcaf0;
    }

    .loading,
    .no-results {
      text-align: center;
      padding: 48px;
      color: var(--bs-secondary, #6c757d);
    }

    .no-results i {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .panel-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #faf9f5;
    }

    .panel-footer button {
      width: 100%;
    }
  `]
})
export class AgentExplorerComponent implements OnInit {
  readonly store = inject(ChatStore);

  searchQuery = '';
  selectedCategory = '';
  activeTab = signal<'all' | 'my' | 'public'>('all');

  ngOnInit(): void {
    this.store.loadAgents();
  }

  onSearch(query: string): void {
    if (query.length > 2) {
      this.store.searchAgents(query);
    } else if (query.length === 0) {
      this.store.loadAgents();
    }
  }

  onCategoryChange(categoryId: string): void {
    // Implement category filtering
    this.store.loadAgents();
  }

  setTab(tab: 'all' | 'my' | 'public'): void {
    this.activeTab.set(tab);
    if (tab === 'my') {
      this.store.loadMyAgents();
    } else {
      this.store.loadAgents();
    }
  }

  selectAgent(agent: Agent): void {
    this.store.selectAgent(agent);
    this.close();
  }

  createAgent(): void {
    this.store.openAgentCreator();
  }

  close(): void {
    this.store.closeAgentExplorer();
  }
}
