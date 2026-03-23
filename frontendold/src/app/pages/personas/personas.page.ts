import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonaStudioService } from '../../services/persona-studio.service';
import { PersonaFormComponent } from '../../components/persona-form/persona-form.component';
import { JourneyFormComponent } from '../../components/journey-form/journey-form.component';
import { PreviewComponent } from '../../components/preview/preview.component';
import { ExportComponent } from '../../components/export/export.component';
import { BreadcrumbComponent } from '../../components/shared/breadcrumb';

@Component({
  selector: 'app-personas-page',
  standalone: true,
  imports: [
    CommonModule,
    PersonaFormComponent,
    JourneyFormComponent,
    PreviewComponent,
    ExportComponent,
    BreadcrumbComponent
  ],
  template: `
    <!-- Breadcrumb (Standardized - Fixed Position) -->
    <app-breadcrumb [items]="[{ label: 'Personas' }]" />

    <div class="personas-layout">
      <!-- Tab Navigation -->
      <nav class="persona-tabs" role="tablist" aria-label="Persona sections">
        <button class="tab-btn"
                role="tab"
                [class.active]="service.activeTab() === 'persona'"
                [attr.aria-selected]="service.activeTab() === 'persona'"
                (click)="service.activeTab.set('persona')">
          <span aria-hidden="true">①</span> Persona
          <span class="badge" [class.complete]="service.personaCompleteness() === 5">
            {{ service.personaCompleteness() }}/5
          </span>
        </button>
        <button class="tab-btn"
                role="tab"
                [class.active]="service.activeTab() === 'journey'"
                [attr.aria-selected]="service.activeTab() === 'journey'"
                (click)="service.activeTab.set('journey')">
          <span aria-hidden="true">②</span> Journey
          <span class="badge" [class.complete]="service.journeyCompleteness() === 5">
            {{ service.journeyCompleteness() }}/5
          </span>
        </button>
        <button class="tab-btn"
                role="tab"
                [class.active]="service.activeTab() === 'preview'"
                [attr.aria-selected]="service.activeTab() === 'preview'"
                (click)="service.activeTab.set('preview')">
          Preview
        </button>
        <button class="tab-btn"
                role="tab"
                [class.active]="service.activeTab() === 'export'"
                [attr.aria-selected]="service.activeTab() === 'export'"
                (click)="service.activeTab.set('export')">
          Export
        </button>
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">
        @if (service.activeTab() === 'persona') {
          <section role="tabpanel" class="tab-panel">
            <header class="panel-header">
              <h1 class="h4 fw-bold">Persona Documentation</h1>
              <p class="text-muted">Fill in each section. Every field maps directly to a journey design decision.</p>
            </header>
            <app-persona-form></app-persona-form>
          </section>
        }

        @if (service.activeTab() === 'journey') {
          <section role="tabpanel" class="tab-panel">
            <header class="panel-header">
              <h1 class="h4 fw-bold">Journey Builder</h1>
              <p class="text-muted">Build the journey stage by stage. Link each stage to the persona's goals and frustrations.</p>
            </header>
            <app-journey-form></app-journey-form>
          </section>
        }

        @if (service.activeTab() === 'preview') {
          <section role="tabpanel" class="tab-panel">
            <app-preview></app-preview>
          </section>
        }

        @if (service.activeTab() === 'export') {
          <section role="tabpanel" class="tab-panel">
            <app-export></app-export>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .personas-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: calc(100vh - 60px);
    }

    .persona-tabs {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: white;
      border-bottom: 1px solid rgba(#b9a779, 0.3);
      flex-wrap: wrap;

      @media (min-width: 1920px) {
        padding: 1.25rem 2rem;
      }
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: 1px solid #dee2e6;
      background: white;
      border-radius: 2rem;
      font-family: 'Gotham Rounded', 'Nunito', system-ui, sans-serif;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #3d3a3b;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 44px;

      &:hover {
        border-color: #b9a779;
        background: rgba(#b9a779, 0.1);
      }

      &:focus-visible {
        outline: 3px solid #054239;
        outline-offset: 2px;
      }

      &.active {
        background: #b9a779;
        border-color: #b9a779;
        color: #161616;
      }

      .badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        background: rgba(0, 0, 0, 0.1);

        &.complete {
          background: #054239;
          color: white;
        }
      }
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      background: #edebe0;
    }

    .tab-panel {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.5rem;

      @media (min-width: 1920px) {
        max-width: 1200px;
        padding: 2rem;
      }

      @media (min-width: 3840px) {
        max-width: 1800px;
        padding: 2.5rem;
      }
    }

    .panel-header {
      margin-bottom: 1.5rem;
    }
  `]
})
export class PersonasPage {
  readonly service = inject(PersonaStudioService);
}
