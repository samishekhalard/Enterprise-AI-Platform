import {
  createEmptyProcessDocumentation,
  createEmptyRaciEntry,
  createEmptyKpi,
  createEmptyBusinessRule,
  createEmptyComplianceTag,
  calculateQualityScore,
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_STATUSES,
  type ProcessDocumentation,
  type RaciEntry,
  type ProcessKpi,
  type BusinessRule,
  type ComplianceTag,
  type QualityScore,
  type KpiFrequency,
  type RulePriority,
  type RuleStatus,
  type ComplianceFramework,
  type ComplianceStatus
} from './bpmn-extensions.model';

describe('bpmn-extensions.model', () => {
  // ==========================================================================
  // createEmptyProcessDocumentation Tests
  // ==========================================================================
  describe('createEmptyProcessDocumentation()', () => {
    it('should create empty process documentation', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc).toBeDefined();
    });

    it('should have empty RACI array', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.raci).toEqual([]);
    });

    it('should have empty KPIs array', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.kpis).toEqual([]);
    });

    it('should have empty business rules array', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.businessRules).toEqual([]);
    });

    it('should have empty compliance tags array', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.complianceTags).toEqual([]);
    });

    it('should have quality score with all zeros', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.qualityScore.overall).toBe(0);
      expect(doc.qualityScore.completeness).toBe(0);
      expect(doc.qualityScore.documentation).toBe(0);
      expect(doc.qualityScore.compliance).toBe(0);
    });

    it('should have quality score lastAssessed as Date', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.qualityScore.lastAssessed).toBeInstanceOf(Date);
    });

    it('should have empty assessedBy', () => {
      const doc = createEmptyProcessDocumentation();

      expect(doc.qualityScore.assessedBy).toBe('');
    });
  });

  // ==========================================================================
  // createEmptyRaciEntry Tests
  // ==========================================================================
  describe('createEmptyRaciEntry()', () => {
    it('should create RACI entry with provided activityId', () => {
      const entry = createEmptyRaciEntry('task_1');

      expect(entry.activityId).toBe('task_1');
    });

    it('should create RACI entry with provided activityName', () => {
      const entry = createEmptyRaciEntry('task_1', 'My Task');

      expect(entry.activityName).toBe('My Task');
    });

    it('should default activityName to empty string', () => {
      const entry = createEmptyRaciEntry('task_1');

      expect(entry.activityName).toBe('');
    });

    it('should have empty responsible array', () => {
      const entry = createEmptyRaciEntry('task_1');

      expect(entry.responsible).toEqual([]);
    });

    it('should have empty accountable string', () => {
      const entry = createEmptyRaciEntry('task_1');

      expect(entry.accountable).toBe('');
    });

    it('should have empty consulted array', () => {
      const entry = createEmptyRaciEntry('task_1');

      expect(entry.consulted).toEqual([]);
    });

    it('should have empty informed array', () => {
      const entry = createEmptyRaciEntry('task_1');

      expect(entry.informed).toEqual([]);
    });
  });

  // ==========================================================================
  // createEmptyKpi Tests
  // ==========================================================================
  describe('createEmptyKpi()', () => {
    it('should create KPI with generated id', () => {
      const kpi = createEmptyKpi();

      expect(kpi.id).toBeDefined();
      expect(kpi.id.startsWith('kpi_')).toBe(true);
    });

    it('should create unique IDs for sequential calls', async () => {
      const kpi1 = createEmptyKpi();
      await new Promise(resolve => setTimeout(resolve, 1));
      const kpi2 = createEmptyKpi();

      expect(kpi1.id).not.toBe(kpi2.id);
    });

    it('should have empty name', () => {
      const kpi = createEmptyKpi();

      expect(kpi.name).toBe('');
    });

    it('should have empty description', () => {
      const kpi = createEmptyKpi();

      expect(kpi.description).toBe('');
    });

    it('should have empty targetValue', () => {
      const kpi = createEmptyKpi();

      expect(kpi.targetValue).toBe('');
    });

    it('should have empty unit', () => {
      const kpi = createEmptyKpi();

      expect(kpi.unit).toBe('');
    });

    it('should have default frequency as monthly', () => {
      const kpi = createEmptyKpi();

      expect(kpi.frequency).toBe('monthly');
    });

    it('should have empty owner', () => {
      const kpi = createEmptyKpi();

      expect(kpi.owner).toBe('');
    });

    it('should not have elementId set', () => {
      const kpi = createEmptyKpi();

      expect(kpi.elementId).toBeUndefined();
    });
  });

  // ==========================================================================
  // createEmptyBusinessRule Tests
  // ==========================================================================
  describe('createEmptyBusinessRule()', () => {
    it('should create business rule with generated id', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.id).toBeDefined();
      expect(rule.id.startsWith('rule_')).toBe(true);
    });

    it('should create unique IDs for sequential calls', async () => {
      const rule1 = createEmptyBusinessRule();
      await new Promise(resolve => setTimeout(resolve, 5));
      const rule2 = createEmptyBusinessRule();

      expect(rule1.id).not.toBe(rule2.id);
    });

    it('should have empty name', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.name).toBe('');
    });

    it('should have empty description', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.description).toBe('');
    });

    it('should have empty condition', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.condition).toBe('');
    });

    it('should have empty action', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.action).toBe('');
    });

    it('should have default priority as medium', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.priority).toBe('medium');
    });

    it('should have default status as draft', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.status).toBe('draft');
    });

    it('should not have elementId set', () => {
      const rule = createEmptyBusinessRule();

      expect(rule.elementId).toBeUndefined();
    });
  });

  // ==========================================================================
  // createEmptyComplianceTag Tests
  // ==========================================================================
  describe('createEmptyComplianceTag()', () => {
    it('should create compliance tag with generated id', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.id).toBeDefined();
      expect(tag.id.startsWith('tag_')).toBe(true);
    });

    it('should create unique IDs for sequential calls', async () => {
      const tag1 = createEmptyComplianceTag('element_1');
      await new Promise(resolve => setTimeout(resolve, 5));
      const tag2 = createEmptyComplianceTag('element_2');

      expect(tag1.id).not.toBe(tag2.id);
    });

    it('should set provided elementId', () => {
      const tag = createEmptyComplianceTag('my_element');

      expect(tag.elementId).toBe('my_element');
    });

    it('should have default framework as Custom', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.framework).toBe('Custom');
    });

    it('should have empty control', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.control).toBe('');
    });

    it('should have empty requirement', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.requirement).toBe('');
    });

    it('should have default status as not-assessed', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.status).toBe('not-assessed');
    });

    it('should not have notes set', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.notes).toBeUndefined();
    });

    it('should not have lastAssessed set', () => {
      const tag = createEmptyComplianceTag('element_1');

      expect(tag.lastAssessed).toBeUndefined();
    });
  });

  // ==========================================================================
  // calculateQualityScore Tests
  // ==========================================================================
  describe('calculateQualityScore()', () => {
    it('should return zero scores for empty documentation', () => {
      const doc = createEmptyProcessDocumentation();

      const score = calculateQualityScore(doc, 0);

      expect(score.overall).toBe(0);
      expect(score.completeness).toBe(0);
      expect(score.documentation).toBe(0);
      expect(score.compliance).toBe(0);
    });

    it('should calculate completeness based on documented elements', () => {
      const doc = createEmptyProcessDocumentation();
      doc.raci.push(createEmptyRaciEntry('task_1'));

      const score = calculateQualityScore(doc, 5);

      expect(score.completeness).toBe(20); // 1/5 = 20%
    });

    it('should calculate documentation score based on RACI', () => {
      const doc = createEmptyProcessDocumentation();
      doc.raci.push(createEmptyRaciEntry('task_1'));
      doc.raci.push(createEmptyRaciEntry('task_2'));

      const score = calculateQualityScore(doc, 10);

      expect(score.documentation).toBeGreaterThan(0);
    });

    it('should calculate documentation score based on active rules', () => {
      const doc = createEmptyProcessDocumentation();
      const rule = createEmptyBusinessRule();
      rule.status = 'active';
      doc.businessRules.push(rule);

      const score = calculateQualityScore(doc, 10);

      expect(score.documentation).toBeGreaterThan(0);
    });

    it('should calculate compliance score based on assessed tags', () => {
      const doc = createEmptyProcessDocumentation();
      const tag = createEmptyComplianceTag('element_1');
      tag.status = 'compliant';
      doc.complianceTags.push(tag);

      const score = calculateQualityScore(doc, 1);

      expect(score.compliance).toBe(100);
    });

    it('should calculate partial compliance correctly', () => {
      const doc = createEmptyProcessDocumentation();

      const compliantTag = createEmptyComplianceTag('element_1');
      compliantTag.status = 'compliant';
      doc.complianceTags.push(compliantTag);

      const nonCompliantTag = createEmptyComplianceTag('element_2');
      nonCompliantTag.status = 'non-compliant';
      doc.complianceTags.push(nonCompliantTag);

      const score = calculateQualityScore(doc, 2);

      expect(score.compliance).toBe(50); // 1/2 compliant
    });

    it('should ignore not-assessed tags in compliance calculation', () => {
      const doc = createEmptyProcessDocumentation();

      const compliantTag = createEmptyComplianceTag('element_1');
      compliantTag.status = 'compliant';
      doc.complianceTags.push(compliantTag);

      const notAssessedTag = createEmptyComplianceTag('element_2');
      notAssessedTag.status = 'not-assessed';
      doc.complianceTags.push(notAssessedTag);

      const score = calculateQualityScore(doc, 2);

      expect(score.compliance).toBe(100); // not-assessed is ignored
    });

    it('should set lastAssessed to current date', () => {
      const doc = createEmptyProcessDocumentation();
      const beforeDate = new Date();

      const score = calculateQualityScore(doc, 0);

      expect(score.lastAssessed.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
    });

    it('should set assessedBy to System', () => {
      const doc = createEmptyProcessDocumentation();

      const score = calculateQualityScore(doc, 0);

      expect(score.assessedBy).toBe('System');
    });

    it('should calculate overall as weighted average', () => {
      const doc = createEmptyProcessDocumentation();

      // Add elements for completeness
      doc.raci.push(createEmptyRaciEntry('task_1'));
      doc.raci.push(createEmptyRaciEntry('task_2'));

      // Add active rule for documentation
      const rule = createEmptyBusinessRule();
      rule.status = 'active';
      doc.businessRules.push(rule);

      // Add compliant tag for compliance
      const tag = createEmptyComplianceTag('element_1');
      tag.status = 'compliant';
      doc.complianceTags.push(tag);

      const score = calculateQualityScore(doc, 10);

      // Overall is weighted: completeness * 0.3 + documentation * 0.35 + compliance * 0.35
      const expectedOverall = Math.round(
        score.completeness * 0.3 + score.documentation * 0.35 + score.compliance * 0.35
      );
      expect(score.overall).toBe(expectedOverall);
    });

    it('should cap documentation score at 100', () => {
      const doc = createEmptyProcessDocumentation();

      // Add many RACI entries
      for (let i = 0; i < 20; i++) {
        doc.raci.push(createEmptyRaciEntry(`task_${i}`));
      }

      // Add many active rules
      for (let i = 0; i < 20; i++) {
        const rule = createEmptyBusinessRule();
        rule.status = 'active';
        doc.businessRules.push(rule);
      }

      const score = calculateQualityScore(doc, 100);

      expect(score.documentation).toBeLessThanOrEqual(100);
    });

    it('should handle zero element count', () => {
      const doc = createEmptyProcessDocumentation();
      doc.raci.push(createEmptyRaciEntry('task_1'));

      const score = calculateQualityScore(doc, 0);

      expect(score.completeness).toBe(0);
    });

    it('should count unique documented elements', () => {
      const doc = createEmptyProcessDocumentation();

      // Same element in RACI and KPI
      doc.raci.push(createEmptyRaciEntry('task_1'));

      const kpi = createEmptyKpi();
      kpi.elementId = 'task_1';
      doc.kpis.push(kpi);

      const score = calculateQualityScore(doc, 5);

      // Should count as 1 documented element, not 2
      expect(score.completeness).toBe(20); // 1/5 = 20%
    });
  });

  // ==========================================================================
  // COMPLIANCE_FRAMEWORKS Tests
  // ==========================================================================
  describe('COMPLIANCE_FRAMEWORKS', () => {
    it('should contain ISO27001', () => {
      const iso = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'ISO27001');

      expect(iso).toBeDefined();
      expect(iso?.label).toContain('Information Security');
    });

    it('should contain GDPR', () => {
      const gdpr = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'GDPR');

      expect(gdpr).toBeDefined();
      expect(gdpr?.label).toContain('Data Protection');
    });

    it('should contain SOX', () => {
      const sox = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'SOX');

      expect(sox).toBeDefined();
      expect(sox?.label).toContain('Sarbanes-Oxley');
    });

    it('should contain HIPAA', () => {
      const hipaa = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'HIPAA');

      expect(hipaa).toBeDefined();
      expect(hipaa?.label).toContain('Healthcare');
    });

    it('should contain PCI-DSS', () => {
      const pci = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'PCI-DSS');

      expect(pci).toBeDefined();
      expect(pci?.label).toContain('Payment Card');
    });

    it('should contain SOC2', () => {
      const soc2 = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'SOC2');

      expect(soc2).toBeDefined();
      expect(soc2?.label).toContain('Service Organization');
    });

    it('should contain NIST', () => {
      const nist = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'NIST');

      expect(nist).toBeDefined();
      expect(nist?.label).toContain('Cybersecurity');
    });

    it('should contain COBIT', () => {
      const cobit = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'COBIT');

      expect(cobit).toBeDefined();
      expect(cobit?.label).toContain('IT Governance');
    });

    it('should contain ITIL', () => {
      const itil = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'ITIL');

      expect(itil).toBeDefined();
      expect(itil?.label).toContain('IT Service Management');
    });

    it('should contain Custom', () => {
      const custom = COMPLIANCE_FRAMEWORKS.find(f => f.value === 'Custom');

      expect(custom).toBeDefined();
      expect(custom?.label).toContain('Custom Framework');
    });

    it('should have 10 frameworks', () => {
      expect(COMPLIANCE_FRAMEWORKS.length).toBe(10);
    });
  });

  // ==========================================================================
  // COMPLIANCE_STATUSES Tests
  // ==========================================================================
  describe('COMPLIANCE_STATUSES', () => {
    it('should contain compliant status', () => {
      const status = COMPLIANCE_STATUSES.find(s => s.value === 'compliant');

      expect(status).toBeDefined();
      expect(status?.label).toBe('Compliant');
      expect(status?.color).toBe('#276749');
    });

    it('should contain partial status', () => {
      const status = COMPLIANCE_STATUSES.find(s => s.value === 'partial');

      expect(status).toBeDefined();
      expect(status?.label).toBe('Partially Compliant');
      expect(status?.color).toBe('#c05621');
    });

    it('should contain non-compliant status', () => {
      const status = COMPLIANCE_STATUSES.find(s => s.value === 'non-compliant');

      expect(status).toBeDefined();
      expect(status?.label).toBe('Non-Compliant');
      expect(status?.color).toBe('#c53030');
    });

    it('should contain not-assessed status', () => {
      const status = COMPLIANCE_STATUSES.find(s => s.value === 'not-assessed');

      expect(status).toBeDefined();
      expect(status?.label).toBe('Not Assessed');
      expect(status?.color).toBe('#64748b');
    });

    it('should have 4 statuses', () => {
      expect(COMPLIANCE_STATUSES.length).toBe(4);
    });

    it('should have valid hex colors', () => {
      COMPLIANCE_STATUSES.forEach(status => {
        expect(status.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  // ==========================================================================
  // Type Interface Tests
  // ==========================================================================
  describe('Type Interfaces', () => {
    describe('ProcessDocumentation interface', () => {
      it('should allow creating ProcessDocumentation object', () => {
        const doc: ProcessDocumentation = {
          raci: [],
          kpis: [],
          businessRules: [],
          complianceTags: [],
          qualityScore: {
            overall: 50,
            completeness: 60,
            documentation: 40,
            compliance: 50,
            lastAssessed: new Date(),
            assessedBy: 'User'
          }
        };

        expect(doc.raci).toEqual([]);
        expect(doc.qualityScore.overall).toBe(50);
      });
    });

    describe('RaciEntry interface', () => {
      it('should allow creating RaciEntry object', () => {
        const entry: RaciEntry = {
          activityId: 'task_1',
          activityName: 'Review Document',
          responsible: ['John', 'Jane'],
          accountable: 'Manager',
          consulted: ['Expert'],
          informed: ['Stakeholder']
        };

        expect(entry.responsible.length).toBe(2);
        expect(entry.accountable).toBe('Manager');
      });
    });

    describe('ProcessKpi interface', () => {
      it('should allow creating ProcessKpi object', () => {
        const kpi: ProcessKpi = {
          id: 'kpi_1',
          name: 'Cycle Time',
          description: 'Time to complete process',
          targetValue: '24',
          unit: 'hours',
          frequency: 'weekly',
          owner: 'Process Manager',
          elementId: 'task_1'
        };

        expect(kpi.frequency).toBe('weekly');
        expect(kpi.elementId).toBe('task_1');
      });
    });

    describe('BusinessRule interface', () => {
      it('should allow creating BusinessRule object', () => {
        const rule: BusinessRule = {
          id: 'rule_1',
          name: 'Approval Required',
          description: 'Manager approval required for amounts over $1000',
          condition: 'amount > 1000',
          action: 'Route to manager',
          priority: 'high',
          status: 'active',
          elementId: 'gateway_1'
        };

        expect(rule.priority).toBe('high');
        expect(rule.status).toBe('active');
      });
    });

    describe('ComplianceTag interface', () => {
      it('should allow creating ComplianceTag object', () => {
        const tag: ComplianceTag = {
          id: 'tag_1',
          elementId: 'task_1',
          framework: 'GDPR',
          control: 'A.15.1',
          requirement: 'Data encryption required',
          status: 'compliant',
          notes: 'Verified by audit',
          lastAssessed: new Date()
        };

        expect(tag.framework).toBe('GDPR');
        expect(tag.status).toBe('compliant');
      });
    });

    describe('QualityScore interface', () => {
      it('should allow creating QualityScore object', () => {
        const score: QualityScore = {
          overall: 85,
          completeness: 90,
          documentation: 80,
          compliance: 85,
          lastAssessed: new Date(),
          assessedBy: 'Auditor'
        };

        expect(score.overall).toBe(85);
        expect(score.assessedBy).toBe('Auditor');
      });
    });

    describe('KpiFrequency type', () => {
      it('should allow valid frequencies', () => {
        const frequencies: KpiFrequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

        expect(frequencies.length).toBe(5);
      });
    });

    describe('RulePriority type', () => {
      it('should allow valid priorities', () => {
        const priorities: RulePriority[] = ['high', 'medium', 'low'];

        expect(priorities.length).toBe(3);
      });
    });

    describe('RuleStatus type', () => {
      it('should allow valid statuses', () => {
        const statuses: RuleStatus[] = ['active', 'draft', 'deprecated'];

        expect(statuses.length).toBe(3);
      });
    });

    describe('ComplianceFramework type', () => {
      it('should allow valid frameworks', () => {
        const frameworks: ComplianceFramework[] = [
          'ISO27001', 'GDPR', 'SOX', 'HIPAA', 'PCI-DSS',
          'SOC2', 'NIST', 'COBIT', 'ITIL', 'Custom'
        ];

        expect(frameworks.length).toBe(10);
      });
    });

    describe('ComplianceStatus type', () => {
      it('should allow valid statuses', () => {
        const statuses: ComplianceStatus[] = ['compliant', 'partial', 'non-compliant', 'not-assessed'];

        expect(statuses.length).toBe(4);
      });
    });
  });
});
