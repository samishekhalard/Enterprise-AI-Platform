import { Injectable, signal } from '@angular/core';
import { AuditEntry } from '../models/audit.model';

const STORAGE_KEY = 'persona-studio-audit-logs';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  // Signal-based state
  readonly auditLogs = signal<AuditEntry[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Generate a UUID (with fallback for browsers without crypto.randomUUID)
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Log an action for an entity
   */
  logAction(
    entityType: 'product' | 'persona',
    entityId: string,
    entityName: string,
    action: 'created' | 'updated' | 'deleted',
    description: string
  ): void {
    const entry: AuditEntry = {
      id: this.generateUUID(),
      entityType,
      entityId,
      entityName,
      action,
      timestamp: new Date().toISOString(),
      description
    };

    this.auditLogs.update(logs => [entry, ...logs]);
    this.saveToStorage();
  }

  /**
   * Get logs for a specific entity
   */
  getLogsForEntity(entityType: 'product' | 'persona', entityId: string): AuditEntry[] {
    return this.auditLogs().filter(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }

  /**
   * Get all logs for a product including its personas
   */
  getLogsForProductWithPersonas(productId: string, personaIds: string[]): AuditEntry[] {
    return this.auditLogs().filter(log => {
      if (log.entityType === 'product' && log.entityId === productId) {
        return true;
      }
      if (log.entityType === 'persona' && personaIds.includes(log.entityId)) {
        return true;
      }
      return false;
    });
  }

  /**
   * Clear logs for a specific entity (used when entity is deleted)
   */
  clearLogsForEntity(entityType: 'product' | 'persona', entityId: string): void {
    this.auditLogs.update(logs =>
      logs.filter(log => !(log.entityType === entityType && log.entityId === entityId))
    );
    this.saveToStorage();
  }

  /**
   * Get count of logs for a specific entity
   */
  getLogCountForEntity(entityType: 'product' | 'persona', entityId: string): number {
    return this.getLogsForEntity(entityType, entityId).length;
  }

  /**
   * Get count of logs for a product including its personas
   */
  getLogCountForProductWithPersonas(productId: string, personaIds: string[]): number {
    return this.getLogsForProductWithPersonas(productId, personaIds).length;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const logs = JSON.parse(stored) as AuditEntry[];
        this.auditLogs.set(logs);
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error);
      this.auditLogs.set([]);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.auditLogs()));
    } catch (error) {
      console.error('Failed to save audit logs to storage:', error);
    }
  }
}
