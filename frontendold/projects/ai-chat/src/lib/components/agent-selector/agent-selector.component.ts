import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStore } from '../../store/chat.store';

@Component({
  selector: 'ai-agent-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="agent-selector">
      <button class="selector-btn" (click)="toggleDropdown()">
        @if (store.selectedAgent()) {
          <div class="selected-agent">
            @if (store.selectedAgent()?.avatarUrl) {
              <img [src]="store.selectedAgent()?.avatarUrl" alt="" class="agent-avatar-sm" />
            } @else {
              <div class="agent-avatar-sm placeholder">
                <i class="bi bi-robot"></i>
              </div>
            }
            <span class="agent-name">{{ store.selectedAgent()?.name }}</span>
          </div>
        } @else {
          <span class="placeholder-text">Select Agent</span>
        }
        <i class="bi bi-chevron-down"></i>
      </button>

      @if (showDropdown()) {
        <div class="dropdown-menu show">
          <div class="dropdown-header">
            <span>Recent Agents</span>
            <button class="btn-link" (click)="openExplorer()">
              Browse All <i class="bi bi-arrow-right"></i>
            </button>
          </div>

          @for (agent of store.agents().slice(0, 5); track agent.id) {
            <button
              class="dropdown-item"
              [class.active]="store.selectedAgent()?.id === agent.id"
              (click)="selectAgent(agent)"
            >
              @if (agent.avatarUrl) {
                <img [src]="agent.avatarUrl" alt="" class="agent-avatar-sm" />
              } @else {
                <div class="agent-avatar-sm placeholder">
                  <i class="bi bi-robot"></i>
                </div>
              }
              <div class="agent-info">
                <span class="name">{{ agent.name }}</span>
                <span class="provider">{{ agent.provider }}</span>
              </div>
            </button>
          }

          <div class="dropdown-divider"></div>
          <button class="dropdown-item create-btn" (click)="createAgent()">
            <i class="bi bi-plus-circle"></i>
            <span>Create New Agent</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .agent-selector {
      position: relative;
    }

    .selector-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 8px;
      background: white;
      cursor: pointer;
      min-width: 200px;
      transition: border-color 0.2s;
    }

    .selector-btn:hover {
      border-color: var(--bs-primary, #0d6efd);
    }

    .selected-agent {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .agent-avatar-sm {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
    }

    .agent-avatar-sm.placeholder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    .agent-name {
      font-weight: 500;
    }

    .placeholder-text {
      color: var(--bs-secondary, #6c757d);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      min-width: 280px;
      background: white;
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      padding: 8px 0;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      font-size: 0.85rem;
      color: var(--bs-secondary, #6c757d);
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--bs-primary, #0d6efd);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;
    }

    .dropdown-item:hover {
      background: var(--bs-light, #f8f9fa);
    }

    .dropdown-item.active {
      background: rgba(13, 110, 253, 0.1);
    }

    .agent-info {
      display: flex;
      flex-direction: column;
    }

    .agent-info .name {
      font-weight: 500;
    }

    .agent-info .provider {
      font-size: 0.75rem;
      color: var(--bs-secondary, #6c757d);
    }

    .dropdown-divider {
      height: 1px;
      background: var(--bs-border-color, #dee2e6);
      margin: 8px 0;
    }

    .create-btn {
      color: var(--bs-primary, #0d6efd);
    }

    .create-btn i {
      font-size: 1.1rem;
    }
  `]
})
export class AgentSelectorComponent {
  readonly store = inject(ChatStore);
  readonly showDropdown = signal(false);

  toggleDropdown(): void {
    this.showDropdown.update(v => !v);
  }

  selectAgent(agent: any): void {
    this.store.selectAgent(agent);
    this.showDropdown.set(false);
  }

  openExplorer(): void {
    this.showDropdown.set(false);
    this.store.openAgentExplorer();
  }

  createAgent(): void {
    this.showDropdown.set(false);
    this.store.openAgentCreator();
  }
}
