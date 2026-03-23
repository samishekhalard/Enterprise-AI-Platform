import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, shareReplay, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * DTO for BPMN element type from backend
 */
export interface BpmnElementTypeDTO {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  defaultSize?: {
    width: number;
    height: number;
  };
  iconSvg?: string;
  sortOrder: number;
}

/**
 * Response from the element types API
 */
export interface BpmnElementTypeListResponse {
  elements: BpmnElementTypeDTO[];
  cssVariables: Record<string, string>;
  total: number;
}

/**
 * Service for fetching BPMN element type definitions from the backend.
 * Acts as a single source of truth for element colors, sizes, and styling.
 */
@Injectable({
  providedIn: 'root'
})
export class BpmnElementRegistryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/process/element-types`;

  // Cache the response
  private elementTypesCache$?: Observable<BpmnElementTypeListResponse>;
  private elementsMap = new Map<string, BpmnElementTypeDTO>();

  // Signal for CSS variables
  cssVariables = signal<Record<string, string>>({});

  // Signal for loading state
  loading = signal(false);

  // Signal for error state
  error = signal<string | null>(null);

  /**
   * Fetch all element types from the backend.
   * Results are cached for the session.
   */
  getElementTypes(tenantId?: string): Observable<BpmnElementTypeListResponse> {
    if (this.elementTypesCache$) {
      return this.elementTypesCache$;
    }

    this.loading.set(true);
    this.error.set(null);

    const headers = tenantId
      ? new HttpHeaders().set('X-Tenant-ID', tenantId)
      : new HttpHeaders();

    this.elementTypesCache$ = this.http.get<BpmnElementTypeListResponse>(
      this.apiUrl,
      { headers }
    ).pipe(
      tap(response => {
        this.loading.set(false);
        this.cssVariables.set(response.cssVariables);
        this.buildElementsMap(response.elements);
        this.applyCssVariables(response.cssVariables);
      }),
      catchError(err => {
        this.loading.set(false);
        this.error.set('Failed to load BPMN element types');
        console.error('Failed to load BPMN element types:', err);
        // Return empty response as fallback
        return of(this.getDefaultResponse());
      }),
      shareReplay(1)
    );

    return this.elementTypesCache$;
  }

  /**
   * Get element type by code (e.g., "bpmn:Task", "bpmn:StartEvent")
   */
  getElementType(code: string): BpmnElementTypeDTO | undefined {
    return this.elementsMap.get(code);
  }

  /**
   * Get elements by category
   */
  getElementsByCategory(category: string): BpmnElementTypeDTO[] {
    return Array.from(this.elementsMap.values())
      .filter(e => e.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get stroke color for an element type
   */
  getStrokeColor(code: string): string {
    return this.getElementType(code)?.strokeColor || '#585858';
  }

  /**
   * Get fill color for an element type
   */
  getFillColor(code: string): string {
    return this.getElementType(code)?.fillColor || '#FFFFFF';
  }

  /**
   * Get stroke width for an element type
   */
  getStrokeWidth(code: string): number {
    return this.getElementType(code)?.strokeWidth || 2.0;
  }

  /**
   * Invalidate cache and refetch
   */
  refreshCache(): void {
    this.elementTypesCache$ = undefined;
    this.elementsMap.clear();
  }

  /**
   * Build a map of elements by code for quick lookup
   */
  private buildElementsMap(elements: BpmnElementTypeDTO[]): void {
    this.elementsMap.clear();
    for (const element of elements) {
      this.elementsMap.set(element.code, element);
    }
  }

  /**
   * Apply CSS variables to the document root
   */
  private applyCssVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value);
    }
  }

  /**
   * Default response when API is unavailable
   * Uses ThinkPLUS BPMN colors as fallback
   */
  private getDefaultResponse(): BpmnElementTypeListResponse {
    const defaultElements: BpmnElementTypeDTO[] = [
      // Start Events (Green)
      { id: '1', code: 'bpmn:StartEvent', name: 'Start Event', category: 'event', subCategory: 'start', strokeColor: '#52B415', fillColor: '#E8F5E9', strokeWidth: 2.0, sortOrder: 100 },
      // Intermediate Events (Orange)
      { id: '2', code: 'bpmn:IntermediateCatchEvent', name: 'Intermediate Catch Event', category: 'event', subCategory: 'intermediate', strokeColor: '#F97316', fillColor: '#FFF7ED', strokeWidth: 2.0, sortOrder: 200 },
      { id: '3', code: 'bpmn:IntermediateThrowEvent', name: 'Intermediate Throw Event', category: 'event', subCategory: 'intermediate', strokeColor: '#F97316', fillColor: '#FFF7ED', strokeWidth: 2.0, sortOrder: 201 },
      // Boundary Events (Purple)
      { id: '4', code: 'bpmn:BoundaryEvent', name: 'Boundary Event', category: 'event', subCategory: 'boundary', strokeColor: '#8B5CF6', fillColor: '#F5F3FF', strokeWidth: 2.0, sortOrder: 250 },
      // End Events (Red)
      { id: '5', code: 'bpmn:EndEvent', name: 'End Event', category: 'event', subCategory: 'end', strokeColor: '#C02520', fillColor: '#FFEBEE', strokeWidth: 3.0, sortOrder: 300 },
      // Tasks (Teal)
      { id: '6', code: 'bpmn:Task', name: 'Task', category: 'task', strokeColor: '#047481', fillColor: '#FFFFFF', strokeWidth: 2.0, sortOrder: 400 },
      { id: '7', code: 'bpmn:UserTask', name: 'User Task', category: 'task', subCategory: 'user', strokeColor: '#047481', fillColor: '#FFFFFF', strokeWidth: 2.0, sortOrder: 401 },
      { id: '8', code: 'bpmn:ServiceTask', name: 'Service Task', category: 'task', subCategory: 'service', strokeColor: '#047481', fillColor: '#FFFFFF', strokeWidth: 2.0, sortOrder: 402 },
      // Gateways (Gold)
      { id: '9', code: 'bpmn:ExclusiveGateway', name: 'Exclusive Gateway', category: 'gateway', subCategory: 'exclusive', strokeColor: '#b9a779', fillColor: '#FFF8E1', strokeWidth: 2.0, sortOrder: 500 },
      { id: '10', code: 'bpmn:ParallelGateway', name: 'Parallel Gateway', category: 'gateway', subCategory: 'parallel', strokeColor: '#b9a779', fillColor: '#FFF8E1', strokeWidth: 2.0, sortOrder: 501 },
      { id: '11', code: 'bpmn:InclusiveGateway', name: 'Inclusive Gateway', category: 'gateway', subCategory: 'inclusive', strokeColor: '#b9a779', fillColor: '#FFF8E1', strokeWidth: 2.0, sortOrder: 502 },
      // Data (Gray)
      { id: '12', code: 'bpmn:DataObjectReference', name: 'Data Object', category: 'data', subCategory: 'object', strokeColor: '#585858', fillColor: '#F5F7FA', strokeWidth: 2.0, sortOrder: 600 },
      { id: '13', code: 'bpmn:DataStoreReference', name: 'Data Store', category: 'data', subCategory: 'store', strokeColor: '#585858', fillColor: '#F5F7FA', strokeWidth: 2.0, sortOrder: 601 },
    ];

    const cssVariables: Record<string, string> = {
      '--bpmn-event-start-stroke': '#52B415',
      '--bpmn-event-start-fill': '#E8F5E9',
      '--bpmn-event-intermediate-stroke': '#F97316',
      '--bpmn-event-intermediate-fill': '#FFF7ED',
      '--bpmn-event-boundary-stroke': '#8B5CF6',
      '--bpmn-event-boundary-fill': '#F5F3FF',
      '--bpmn-event-end-stroke': '#C02520',
      '--bpmn-event-end-fill': '#FFEBEE',
      '--bpmn-task-stroke': '#047481',
      '--bpmn-task-fill': '#FFFFFF',
      '--bpmn-gateway-stroke': '#b9a779',
      '--bpmn-gateway-fill': '#FFF8E1',
      '--bpmn-data-stroke': '#585858',
      '--bpmn-data-fill': '#F5F7FA'
    };

    this.buildElementsMap(defaultElements);
    this.applyCssVariables(cssVariables);

    return {
      elements: defaultElements,
      cssVariables,
      total: defaultElements.length
    };
  }
}
