import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Agent,
  AgentCategory,
  CreateAgentRequest,
  UpdateAgentRequest,
  ProviderInfo,
  KnowledgeSource
} from '../models/agent.model';
import { PageResponse } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class AiAgentService {
  private readonly http = inject(HttpClient);
  private baseUrl = '/api/v1';

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  // Agents
  createAgent(request: CreateAgentRequest): Observable<Agent> {
    return this.http.post<Agent>(`${this.baseUrl}/agents`, request);
  }

  getAgent(id: string): Observable<Agent> {
    return this.http.get<Agent>(`${this.baseUrl}/agents/${id}`);
  }

  updateAgent(id: string, request: UpdateAgentRequest): Observable<Agent> {
    return this.http.put<Agent>(`${this.baseUrl}/agents/${id}`, request);
  }

  deleteAgent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/agents/${id}`);
  }

  getMyAgents(page = 0, size = 20): Observable<PageResponse<Agent>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Agent>>(`${this.baseUrl}/agents/my`, { params });
  }

  getAccessibleAgents(page = 0, size = 20): Observable<PageResponse<Agent>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Agent>>(`${this.baseUrl}/agents`, { params });
  }

  searchAgents(query: string, page = 0, size = 20): Observable<PageResponse<Agent>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Agent>>(`${this.baseUrl}/agents/search`, { params });
  }

  getAgentsByCategory(categoryId: string, page = 0, size = 20): Observable<PageResponse<Agent>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Agent>>(`${this.baseUrl}/agents/category/${categoryId}`, { params });
  }

  // Categories
  getCategories(): Observable<AgentCategory[]> {
    return this.http.get<AgentCategory[]>(`${this.baseUrl}/agents/categories`);
  }

  // Providers
  getProviders(): Observable<ProviderInfo[]> {
    return this.http.get<ProviderInfo[]>(`${this.baseUrl}/providers`);
  }

  getEnabledProviders(): Observable<ProviderInfo[]> {
    return this.http.get<ProviderInfo[]>(`${this.baseUrl}/providers/enabled`);
  }

  // Knowledge Sources
  getKnowledgeSources(agentId: string): Observable<KnowledgeSource[]> {
    return this.http.get<KnowledgeSource[]>(`${this.baseUrl}/agents/${agentId}/knowledge`);
  }

  uploadKnowledgeFile(agentId: string, file: File, description?: string): Observable<KnowledgeSource> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<KnowledgeSource>(`${this.baseUrl}/agents/${agentId}/knowledge`, formData);
  }

  addTextKnowledge(agentId: string, name: string, content: string, description?: string): Observable<KnowledgeSource> {
    const params = new HttpParams()
      .set('name', name)
      .set('description', description || '');
    return this.http.post<KnowledgeSource>(
      `${this.baseUrl}/agents/${agentId}/knowledge/text`,
      content,
      { params, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  deleteKnowledgeSource(agentId: string, sourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/agents/${agentId}/knowledge/${sourceId}`);
  }
}
