import { Injectable, inject, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { StreamChunk, SendMessageRequest } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class SseStreamService {
  private readonly ngZone = inject(NgZone);
  private baseUrl = '/api/v1';

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  streamMessage(conversationId: string, request: SendMessageRequest): Observable<StreamChunk> {
    return new Observable<StreamChunk>(observer => {
      const url = `${this.baseUrl}/conversations/${conversationId}/stream`;

      // Get auth headers from storage or service
      const tenantId = sessionStorage.getItem('tenantId') || '';
      const userId = sessionStorage.getItem('userId') || '';

      // We need to use fetch with POST for SSE since EventSource only supports GET
      this.postSSE(url, request, tenantId, userId, observer);

      return () => {
        // Cleanup handled by AbortController in postSSE
      };
    });
  }

  private async postSSE(
    url: string,
    body: SendMessageRequest,
    tenantId: string,
    userId: string,
    observer: { next: (value: StreamChunk) => void; error: (error: unknown) => void; complete: () => void }
  ): Promise<void> {
    const abortController = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId
        },
        body: JSON.stringify(body),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.ngZone.run(() => observer.complete());
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              this.ngZone.run(() => observer.complete());
              return;
            }
            try {
              const chunk: StreamChunk = JSON.parse(data);
              this.ngZone.run(() => observer.next(chunk));

              if (chunk.done) {
                this.ngZone.run(() => observer.complete());
                return;
              }
            } catch (e) {
              console.warn('Failed to parse SSE chunk:', data);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.ngZone.run(() => observer.error(error));
      }
    }
  }
}
