// BPMN Custom Extensions for Process Documentation

/**
 * Complete process documentation with all extensions
 */
export interface ProcessDocumentation {
  raci: RaciEntry[];
  kpis: ProcessKpi[];
  businessRules: BusinessRule[];
  complianceTags: ComplianceTag[];
  qualityScore: QualityScore;
}

/**
 * RACI Matrix entry per activity
 */
export interface RaciEntry {
  activityId: string;
  activityName: string;
  responsible: string[];
  accountable: string;
  consulted: string[];
  informed: string[];
}

/**
 * Process KPI definition
 */
export interface ProcessKpi {
  id: string;
  name: string;
  description: string;
  targetValue: string;
  unit: string;
  frequency: KpiFrequency;
  owner: string;
  elementId?: string; // Associated BPMN element
}

export type KpiFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Business rule definition
 */
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: RulePriority;
  status: RuleStatus;
  elementId?: string; // Associated BPMN element
}

export type RulePriority = 'high' | 'medium' | 'low';
export type RuleStatus = 'active' | 'draft' | 'deprecated';

/**
 * Compliance tag for regulatory frameworks
 */
export interface ComplianceTag {
  id: string;
  elementId: string;
  framework: ComplianceFramework;
  control: string;
  requirement: string;
  status: ComplianceStatus;
  notes?: string;
  lastAssessed?: Date;
}

export type ComplianceFramework =
  | 'ISO27001'
  | 'GDPR'
  | 'SOX'
  | 'HIPAA'
  | 'PCI-DSS'
  | 'SOC2'
  | 'NIST'
  | 'COBIT'
  | 'ITIL'
  | 'Custom';

export type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';

/**
 * Process quality score
 */
export interface QualityScore {
  overall: number; // 0-100
  completeness: number; // 0-100
  documentation: number; // 0-100
  compliance: number; // 0-100
  lastAssessed: Date;
  assessedBy: string;
}

/**
 * Create empty process documentation
 */
export function createEmptyProcessDocumentation(): ProcessDocumentation {
  return {
    raci: [],
    kpis: [],
    businessRules: [],
    complianceTags: [],
    qualityScore: {
      overall: 0,
      completeness: 0,
      documentation: 0,
      compliance: 0,
      lastAssessed: new Date(),
      assessedBy: ''
    }
  };
}

/**
 * Create empty RACI entry
 */
export function createEmptyRaciEntry(activityId: string, activityName: string = ''): RaciEntry {
  return {
    activityId,
    activityName,
    responsible: [],
    accountable: '',
    consulted: [],
    informed: []
  };
}

/**
 * Create empty KPI
 */
export function createEmptyKpi(): ProcessKpi {
  return {
    id: `kpi_${Date.now()}`,
    name: '',
    description: '',
    targetValue: '',
    unit: '',
    frequency: 'monthly',
    owner: ''
  };
}

/**
 * Create empty business rule
 */
export function createEmptyBusinessRule(): BusinessRule {
  return {
    id: `rule_${Date.now()}`,
    name: '',
    description: '',
    condition: '',
    action: '',
    priority: 'medium',
    status: 'draft'
  };
}

/**
 * Create empty compliance tag
 */
export function createEmptyComplianceTag(elementId: string): ComplianceTag {
  return {
    id: `tag_${Date.now()}`,
    elementId,
    framework: 'Custom',
    control: '',
    requirement: '',
    status: 'not-assessed'
  };
}

/**
 * Calculate quality score based on process documentation
 */
export function calculateQualityScore(
  doc: ProcessDocumentation,
  elementCount: number
): QualityScore {
  // Completeness: ratio of documented elements
  const documentedElements = new Set([
    ...doc.raci.map(r => r.activityId),
    ...doc.kpis.filter(k => k.elementId).map(k => k.elementId),
    ...doc.businessRules.filter(r => r.elementId).map(r => r.elementId),
    ...doc.complianceTags.map(t => t.elementId)
  ]).size;

  const completeness = elementCount > 0
    ? Math.round((documentedElements / elementCount) * 100)
    : 0;

  // Documentation: based on RACI and rules coverage
  const raciCoverage = doc.raci.length > 0
    ? Math.min(100, doc.raci.length * 20)
    : 0;
  const rulesCoverage = doc.businessRules.filter(r => r.status === 'active').length * 10;
  const documentation = Math.min(100, (raciCoverage + rulesCoverage) / 2);

  // Compliance: based on compliance tags
  const assessedTags = doc.complianceTags.filter(t => t.status !== 'not-assessed');
  const compliantTags = assessedTags.filter(t => t.status === 'compliant');
  const compliance = assessedTags.length > 0
    ? Math.round((compliantTags.length / assessedTags.length) * 100)
    : 0;

  // Overall: weighted average
  const overall = Math.round(
    completeness * 0.3 + documentation * 0.35 + compliance * 0.35
  );

  return {
    overall,
    completeness,
    documentation,
    compliance,
    lastAssessed: new Date(),
    assessedBy: 'System'
  };
}

/**
 * Compliance framework labels
 */
export const COMPLIANCE_FRAMEWORKS: { value: ComplianceFramework; label: string }[] = [
  { value: 'ISO27001', label: 'ISO 27001 (Information Security)' },
  { value: 'GDPR', label: 'GDPR (Data Protection)' },
  { value: 'SOX', label: 'SOX (Sarbanes-Oxley)' },
  { value: 'HIPAA', label: 'HIPAA (Healthcare)' },
  { value: 'PCI-DSS', label: 'PCI-DSS (Payment Card)' },
  { value: 'SOC2', label: 'SOC 2 (Service Organization)' },
  { value: 'NIST', label: 'NIST (Cybersecurity Framework)' },
  { value: 'COBIT', label: 'COBIT (IT Governance)' },
  { value: 'ITIL', label: 'ITIL (IT Service Management)' },
  { value: 'Custom', label: 'Custom Framework' }
];

/**
 * Compliance status labels
 */
export const COMPLIANCE_STATUSES: { value: ComplianceStatus; label: string; color: string }[] = [
  { value: 'compliant', label: 'Compliant', color: '#276749' },
  { value: 'partial', label: 'Partially Compliant', color: '#c05621' },
  { value: 'non-compliant', label: 'Non-Compliant', color: '#c53030' },
  { value: 'not-assessed', label: 'Not Assessed', color: '#64748b' }
];
