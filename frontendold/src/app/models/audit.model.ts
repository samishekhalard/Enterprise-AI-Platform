export interface AuditEntry {
  id: string;
  entityType: 'product' | 'persona';
  entityId: string;
  entityName: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string; // ISO 8601
  description: string; // Human-readable description
}
