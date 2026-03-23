import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, CreateConversationRequest } from '../models/conversation.model';
import { Message, SendMessageRequest, PageResponse } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class AiConversationService {
  private readonly http = inject(HttpClient);
  private baseUrl = '/api/v1';

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  createConversation(request: CreateConversationRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations`, request);
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.baseUrl}/conversations/${id}`);
  }

  getConversations(page = 0, size = 20, agentId?: string): Observable<PageResponse<Conversation>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (agentId) {
      params = params.set('agentId', agentId);
    }
    return this.http.get<PageResponse<Conversation>>(`${this.baseUrl}/conversations`, { params });
  }

  getRecentConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations/recent`);
  }

  archiveConversation(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/conversations/${id}/archive`, {});
  }

  deleteConversation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/conversations/${id}`);
  }

  updateTitle(id: string, title: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/conversations/${id}/title`, title, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  getMessages(conversationId: string, page = 0, size = 50): Observable<PageResponse<Message>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Message>>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { params }
    );
  }

  sendMessage(conversationId: string, request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      request
    );
  }
}
