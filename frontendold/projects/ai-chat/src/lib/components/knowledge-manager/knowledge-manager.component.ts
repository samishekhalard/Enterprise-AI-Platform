import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../store/chat.store';
import { AiAgentService } from '../../services/agent.service';
import { KnowledgeSource } from '../../models/agent.model';

@Component({
  selector: 'ai-knowledge-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()"></div>
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-database"></i> Knowledge Sources
          </h5>
          <button class="btn-close" (click)="close()"></button>
        </div>

        <div class="modal-body">
          <!-- Upload Section -->
          <div class="upload-section">
            <div
              class="upload-area"
              [class.dragover]="isDragover()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <i class="bi bi-cloud-upload"></i>
              <p>Drop files here or click to upload</p>
              <span class="hint">Supports PDF, TXT, MD, CSV (max 50MB)</span>
              <input
                #fileInput
                type="file"
                hidden
                multiple
                accept=".pdf,.txt,.md,.csv"
                (change)="onFileSelect($event)"
              />
            </div>
          </div>

          <!-- Add Text Section -->
          <div class="add-text-section">
            <button
              class="btn btn-outline-secondary btn-sm"
              (click)="showTextInput.set(!showTextInput())"
            >
              <i class="bi bi-file-text"></i> Add Text
            </button>

            @if (showTextInput()) {
              <div class="text-input-form">
                <input
                  type="text"
                  class="form-control mb-2"
                  [(ngModel)]="textSourceName"
                  placeholder="Source name"
                />
                <textarea
                  class="form-control mb-2"
                  [(ngModel)]="textSourceContent"
                  rows="4"
                  placeholder="Paste your text content here..."
                ></textarea>
                <button
                  class="btn btn-primary btn-sm"
                  (click)="addTextSource()"
                  [disabled]="!textSourceName || !textSourceContent"
                >
                  Add Text Source
                </button>
              </div>
            }
          </div>

          <!-- Sources List -->
          <div class="sources-list">
            <h6>Uploaded Sources</h6>

            @if (isLoading()) {
              <div class="loading">
                <div class="spinner-border spinner-border-sm"></div>
                Loading...
              </div>
            } @else if (sources().length === 0) {
              <div class="no-sources">
                <i class="bi bi-folder"></i>
                <p>No knowledge sources yet</p>
              </div>
            } @else {
              @for (source of sources(); track source.id) {
                <div class="source-item">
                  <div class="source-icon">
                    @switch (source.fileType) {
                      @case ('PDF') { <i class="bi bi-file-pdf text-danger"></i> }
                      @case ('TXT') { <i class="bi bi-file-text"></i> }
                      @case ('MD') { <i class="bi bi-markdown"></i> }
                      @case ('CSV') { <i class="bi bi-file-spreadsheet text-success"></i> }
                      @default { <i class="bi bi-file"></i> }
                    }
                  </div>
                  <div class="source-info">
                    <span class="source-name">{{ source.name }}</span>
                    <span class="source-meta">
                      {{ source.chunkCount }} chunks •
                      {{ formatFileSize(source.fileSize) }}
                    </span>
                  </div>
                  <div class="source-status">
                    @switch (source.status) {
                      @case ('PENDING') {
                        <span class="badge bg-secondary">Pending</span>
                      }
                      @case ('PROCESSING') {
                        <span class="badge bg-info">
                          <span class="spinner-border spinner-border-sm"></span>
                          Processing
                        </span>
                      }
                      @case ('COMPLETED') {
                        <span class="badge bg-success">Ready</span>
                      }
                      @case ('FAILED') {
                        <span class="badge bg-danger" [title]="source.errorMessage">Failed</span>
                      }
                    }
                  </div>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    (click)="deleteSource(source)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              }
            }
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }

    .modal-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      z-index: 1050;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--bs-border-color, #dee2e6);
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-weight: 600;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.5;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .upload-section {
      margin-bottom: 20px;
    }

    .upload-area {
      border: 2px dashed var(--bs-border-color, #dee2e6);
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: var(--bs-primary, #0d6efd);
      background: rgba(13, 110, 253, 0.05);
    }

    .upload-area i {
      font-size: 2.5rem;
      color: var(--bs-secondary, #6c757d);
      margin-bottom: 8px;
    }

    .upload-area p {
      margin: 0;
      color: var(--bs-secondary, #6c757d);
    }

    .upload-area .hint {
      display: block;
      font-size: 0.8rem;
      color: var(--bs-secondary, #6c757d);
      margin-top: 4px;
    }

    .add-text-section {
      margin-bottom: 20px;
    }

    .text-input-form {
      margin-top: 12px;
      padding: 12px;
      background: var(--bs-light, #f8f9fa);
      border-radius: 8px;
    }

    .sources-list h6 {
      margin-bottom: 12px;
      font-weight: 600;
    }

    .source-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .source-icon {
      font-size: 1.5rem;
    }

    .source-info {
      flex: 1;
      min-width: 0;
    }

    .source-name {
      display: block;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .source-meta {
      display: block;
      font-size: 0.8rem;
      color: var(--bs-secondary, #6c757d);
    }

    .source-status .badge {
      font-size: 0.75rem;
    }

    .no-sources,
    .loading {
      text-align: center;
      padding: 32px;
      color: var(--bs-secondary, #6c757d);
    }

    .no-sources i {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid var(--bs-border-color, #dee2e6);
    }
  `]
})
export class KnowledgeManagerComponent implements OnInit {
  readonly store = inject(ChatStore);
  private readonly agentService = inject(AiAgentService);

  sources = signal<KnowledgeSource[]>([]);
  isLoading = signal(false);
  isDragover = signal(false);
  showTextInput = signal(false);

  textSourceName = '';
  textSourceContent = '';

  ngOnInit(): void {
    this.loadSources();
  }

  async loadSources(): Promise<void> {
    const agent = this.store.selectedAgent();
    if (!agent) return;

    this.isLoading.set(true);
    try {
      const sources = await this.agentService.getKnowledgeSources(agent.id).toPromise();
      this.sources.set(sources || []);
    } catch (error) {
      console.error('Failed to load knowledge sources', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragover.set(true);
  }

  onDragLeave(): void {
    this.isDragover.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragover.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.uploadFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(Array.from(input.files));
    }
  }

  async uploadFiles(files: File[]): Promise<void> {
    const agent = this.store.selectedAgent();
    if (!agent) return;

    for (const file of files) {
      try {
        await this.agentService.uploadKnowledgeFile(agent.id, file).toPromise();
      } catch (error) {
        console.error('Failed to upload file', error);
      }
    }

    this.loadSources();
  }

  async addTextSource(): Promise<void> {
    const agent = this.store.selectedAgent();
    if (!agent || !this.textSourceName || !this.textSourceContent) return;

    try {
      await this.agentService.addTextKnowledge(
        agent.id,
        this.textSourceName,
        this.textSourceContent
      ).toPromise();

      this.textSourceName = '';
      this.textSourceContent = '';
      this.showTextInput.set(false);
      this.loadSources();
    } catch (error) {
      console.error('Failed to add text source', error);
    }
  }

  async deleteSource(source: KnowledgeSource): Promise<void> {
    const agent = this.store.selectedAgent();
    if (!agent) return;

    try {
      await this.agentService.deleteKnowledgeSource(agent.id, source.id).toPromise();
      this.loadSources();
    } catch (error) {
      console.error('Failed to delete source', error);
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  }

  close(): void {
    this.store.closeKnowledgeManager();
  }
}
