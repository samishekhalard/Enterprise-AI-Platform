import { TestBed } from '@angular/core/testing';
import { PersonaStudioService } from './persona-studio.service';

describe('PersonaStudioService', () => {
  let service: PersonaStudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PersonaStudioService]
    });
    service = TestBed.inject(PersonaStudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===========================================================================
  // Persona Tests
  // ===========================================================================
  describe('Persona Management', () => {
    describe('persona initialization', () => {
      it('should initialize with an empty persona', () => {
        const persona = service.persona();
        expect(persona).toBeDefined();
        expect(persona.id).toBeDefined();
        expect(persona.identity.name).toBe('');
        expect(persona.behavioral.goals).toEqual([]);
      });

      it('should have correct initial completeness score', () => {
        expect(service.personaCompleteness()).toBe(0);
      });

      it('should have correct initial confidence score', () => {
        // With no goals or frustrations, score should be low
        const score = service.confidenceScore();
        expect(score).toBeLessThanOrEqual(50);
      });
    });

    describe('updatePersona()', () => {
      it('should update persona with partial updates', () => {
        const newId = 'new-id-123';
        service.updatePersona({ id: newId });
        expect(service.persona().id).toBe(newId);
      });
    });

    describe('updatePersonaIdentity()', () => {
      it('should update identity fields', () => {
        service.updatePersonaIdentity('name', 'John Doe');
        expect(service.persona().identity.name).toBe('John Doe');

        service.updatePersonaIdentity('occupation', 'Software Engineer');
        expect(service.persona().identity.occupation).toBe('Software Engineer');
      });

      it('should increase completeness when required fields are filled', () => {
        const initialCompleteness = service.personaCompleteness();

        service.updatePersonaIdentity('name', 'Jane Doe');
        service.updatePersonaIdentity('occupation', 'Product Manager');

        expect(service.personaCompleteness()).toBeGreaterThan(initialCompleteness);
      });
    });

    describe('updatePersonaMeta()', () => {
      it('should update meta fields', () => {
        service.updatePersonaMeta('slug', 'john-doe');
        expect(service.persona().meta.slug).toBe('john-doe');

        service.updatePersonaMeta('status', 'validated');
        expect(service.persona().meta.status).toBe('validated');
      });
    });
  });

  // ===========================================================================
  // Goals Tests
  // ===========================================================================
  describe('Goal Management', () => {
    describe('addGoal()', () => {
      it('should add a new goal with default values', () => {
        service.addGoal();
        const goals = service.persona().behavioral.goals;

        expect(goals.length).toBe(1);
        expect(goals[0].id).toBeDefined();
        expect(goals[0].text).toBe('');
        expect(goals[0].priority).toBe('medium');
        expect(goals[0].confidence).toBe('inferred');
      });

      it('should add multiple goals', () => {
        service.addGoal();
        service.addGoal();
        service.addGoal();

        expect(service.persona().behavioral.goals.length).toBe(3);
      });
    });

    describe('updateGoal()', () => {
      it('should update goal at specified index', () => {
        service.addGoal();
        service.updateGoal(0, { text: 'Complete tasks quickly', priority: 'high' });

        const goal = service.persona().behavioral.goals[0];
        expect(goal.text).toBe('Complete tasks quickly');
        expect(goal.priority).toBe('high');
      });

      it('should preserve other goal properties when updating', () => {
        service.addGoal();
        const originalId = service.persona().behavioral.goals[0].id;

        service.updateGoal(0, { text: 'New text' });

        expect(service.persona().behavioral.goals[0].id).toBe(originalId);
      });
    });

    describe('removeGoal()', () => {
      it('should remove goal at specified index', () => {
        service.addGoal();
        service.addGoal();
        service.updateGoal(0, { text: 'Goal 1' });
        service.updateGoal(1, { text: 'Goal 2' });

        service.removeGoal(0);

        expect(service.persona().behavioral.goals.length).toBe(1);
        expect(service.persona().behavioral.goals[0].text).toBe('Goal 2');
      });
    });
  });

  // ===========================================================================
  // Frustrations Tests
  // ===========================================================================
  describe('Frustration Management', () => {
    describe('addFrustration()', () => {
      it('should add a new frustration with default values', () => {
        service.addFrustration();
        const frustrations = service.persona().behavioral.frustrations;

        expect(frustrations.length).toBe(1);
        expect(frustrations[0].id).toBeDefined();
        expect(frustrations[0].text).toBe('');
        expect(frustrations[0].severity).toBe('medium');
        expect(frustrations[0].emotion).toBe('frustrated');
      });
    });

    describe('updateFrustration()', () => {
      it('should update frustration at specified index', () => {
        service.addFrustration();
        service.updateFrustration(0, {
          text: 'Slow system response',
          severity: 'high',
          trigger: 'Peak hours'
        });

        const frustration = service.persona().behavioral.frustrations[0];
        expect(frustration.text).toBe('Slow system response');
        expect(frustration.severity).toBe('high');
        expect(frustration.trigger).toBe('Peak hours');
      });
    });

    describe('removeFrustration()', () => {
      it('should remove frustration at specified index', () => {
        service.addFrustration();
        service.addFrustration();

        service.removeFrustration(0);

        expect(service.persona().behavioral.frustrations.length).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Behaviors Tests
  // ===========================================================================
  describe('Behaviors Management', () => {
    describe('updateBehaviors()', () => {
      it('should update behavior fields', () => {
        service.updateBehaviors('work_pattern', 'remote');
        expect(service.persona().behavioral.behaviors.work_pattern).toBe('remote');

        service.updateBehaviors('decision_style', 'data-driven');
        expect(service.persona().behavioral.behaviors.decision_style).toBe('data-driven');
      });
    });
  });

  // ===========================================================================
  // Tags Tests
  // ===========================================================================
  describe('Tag Management', () => {
    describe('addTag()', () => {
      it('should add domain tag', () => {
        service.addTag('domain_tags', 'finance');
        expect(service.persona().meta.domain_tags).toContain('finance');
      });

      it('should add systems_used tag', () => {
        service.addTag('systems_used', 'SAP');
        expect(service.persona().behavioral.systems_used).toContain('SAP');
      });

      it('should add preferred_channels tag', () => {
        service.addTag('preferred_channels', 'email');
        expect(service.persona().behavioral.behaviors.preferred_channels).toContain('email');
      });

      it('should add values tag', () => {
        service.addTag('values', 'efficiency');
        expect(service.persona().psychographic.values).toContain('efficiency');
      });
    });

    describe('removeTag()', () => {
      it('should remove tag at specified index', () => {
        service.addTag('domain_tags', 'finance');
        service.addTag('domain_tags', 'healthcare');

        service.removeTag('domain_tags', 0);

        expect(service.persona().meta.domain_tags).not.toContain('finance');
        expect(service.persona().meta.domain_tags).toContain('healthcare');
      });
    });
  });

  // ===========================================================================
  // Workarounds Tests
  // ===========================================================================
  describe('Workaround Management', () => {
    describe('addWorkaround()', () => {
      it('should add empty workaround', () => {
        service.addWorkaround();
        expect(service.persona().behavioral.workarounds.length).toBe(1);
        expect(service.persona().behavioral.workarounds[0]).toBe('');
      });
    });

    describe('updateWorkaround()', () => {
      it('should update workaround at index', () => {
        service.addWorkaround();
        service.updateWorkaround(0, 'Uses spreadsheet instead');
        expect(service.persona().behavioral.workarounds[0]).toBe('Uses spreadsheet instead');
      });
    });

    describe('removeWorkaround()', () => {
      it('should remove workaround at index', () => {
        service.addWorkaround();
        service.updateWorkaround(0, 'Workaround 1');
        service.addWorkaround();
        service.updateWorkaround(1, 'Workaround 2');

        service.removeWorkaround(0);

        expect(service.persona().behavioral.workarounds.length).toBe(1);
        expect(service.persona().behavioral.workarounds[0]).toBe('Workaround 2');
      });
    });
  });

  // ===========================================================================
  // Quotes Tests
  // ===========================================================================
  describe('Quote Management', () => {
    describe('addQuote()', () => {
      it('should add a new quote with default values', () => {
        service.addQuote();
        const quotes = service.persona().quotes;

        expect(quotes.length).toBe(1);
        expect(quotes[0].id).toBeDefined();
        expect(quotes[0].text).toBe('');
        expect(quotes[0].basis).toBe('direct');
      });
    });

    describe('updateQuote()', () => {
      it('should update quote at specified index', () => {
        service.addQuote();
        service.updateQuote(0, {
          text: 'I need this to work faster',
          source: 'Interview #3'
        });

        const quote = service.persona().quotes[0];
        expect(quote.text).toBe('I need this to work faster');
        expect(quote.source).toBe('Interview #3');
      });
    });

    describe('removeQuote()', () => {
      it('should remove quote at specified index', () => {
        service.addQuote();
        service.addQuote();

        service.removeQuote(0);

        expect(service.persona().quotes.length).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Assumptions Tests
  // ===========================================================================
  describe('Assumption Management', () => {
    describe('addAssumption()', () => {
      it('should add a new assumption with default values', () => {
        service.addAssumption();
        const assumptions = service.persona().assumptions;

        expect(assumptions.length).toBe(1);
        expect(assumptions[0].id).toBeDefined();
        expect(assumptions[0].confidence).toBe('inferred');
        expect(assumptions[0].flag).toBe('needs validation');
      });
    });

    describe('updateAssumption()', () => {
      it('should update assumption at specified index', () => {
        service.addAssumption();
        service.updateAssumption(0, {
          attribute: 'Tech proficiency',
          assumption: 'User is comfortable with mobile apps',
          confidence: 'validated'
        });

        const assumption = service.persona().assumptions[0];
        expect(assumption.attribute).toBe('Tech proficiency');
        expect(assumption.confidence).toBe('validated');
      });
    });

    describe('removeAssumption()', () => {
      it('should remove assumption at specified index', () => {
        service.addAssumption();
        service.addAssumption();

        service.removeAssumption(0);

        expect(service.persona().assumptions.length).toBe(1);
      });
    });

    describe('confidence score calculation', () => {
      it('should increase confidence score when assumptions are validated', () => {
        service.addGoal();
        service.addFrustration();

        service.addAssumption();
        const scoreWithInferred = service.confidenceScore();

        service.updateAssumption(0, { confidence: 'validated' });
        const scoreWithValidated = service.confidenceScore();

        expect(scoreWithValidated).toBeGreaterThanOrEqual(scoreWithInferred);
      });
    });
  });

  // ===========================================================================
  // Journey Tests
  // ===========================================================================
  describe('Journey Management', () => {
    describe('journey initialization', () => {
      it('should initialize with an empty journey', () => {
        const journey = service.journey();
        expect(journey).toBeDefined();
        expect(journey.id).toBeDefined();
        expect(journey.title).toBe('');
        expect(journey.stages).toEqual([]);
      });

      it('should have correct initial journey completeness', () => {
        expect(service.journeyCompleteness()).toBe(0);
      });
    });

    describe('updateJourney()', () => {
      it('should update journey with partial updates', () => {
        service.updateJourney({ title: 'User Onboarding Journey' });
        expect(service.journey().title).toBe('User Onboarding Journey');
      });
    });

    describe('applyFramework()', () => {
      it('should apply government framework with predefined stages', () => {
        service.applyFramework('govt');

        const journey = service.journey();
        expect(journey.framework).toBe('govt');
        expect(journey.stages.length).toBe(5);
        expect(journey.stages[0].name).toBe('Precondition');
        expect(journey.stages[4].name).toBe('Post-Submission');
      });

      it('should apply product SaaS framework', () => {
        service.applyFramework('product');

        const journey = service.journey();
        expect(journey.framework).toBe('product');
        expect(journey.stages.length).toBe(6);
        expect(journey.stages[0].name).toBe('Awareness');
      });

      it('should apply custom framework with empty stages', () => {
        service.applyFramework('custom');

        const journey = service.journey();
        expect(journey.framework).toBe('custom');
        // Custom framework doesn't auto-create stages
      });
    });

    describe('addStage()', () => {
      it('should add a new stage', () => {
        service.addStage();

        const stages = service.journey().stages;
        expect(stages.length).toBe(1);
        expect(stages[0].name).toBe('Stage 1');
      });

      it('should increment stage numbers', () => {
        service.addStage();
        service.addStage();
        service.addStage();

        const stages = service.journey().stages;
        expect(stages[0].name).toBe('Stage 1');
        expect(stages[1].name).toBe('Stage 2');
        expect(stages[2].name).toBe('Stage 3');
      });
    });

    describe('updateStage()', () => {
      it('should update stage at specified index', () => {
        service.addStage();
        service.updateStage(0, {
          name: 'Discovery',
          description: 'User discovers the product'
        });

        const stage = service.journey().stages[0];
        expect(stage.name).toBe('Discovery');
        expect(stage.description).toBe('User discovers the product');
      });

      it('should update stage touchpoints', () => {
        service.addStage();
        service.updateStage(0, {
          touchpoints: [
            { id: 't1', actor: 'User', action: 'Views homepage', channel: 'Web' }
          ]
        });

        const stage = service.journey().stages[0];
        expect(stage.touchpoints.length).toBe(1);
        expect(stage.touchpoints[0].actor).toBe('User');
      });

      it('should update stage pain points', () => {
        service.addStage();
        service.updateStage(0, {
          pain_points: [
            { id: 'p1', text: 'Confusing navigation', severity: 'high' }
          ]
        });

        const stage = service.journey().stages[0];
        expect(stage.pain_points.length).toBe(1);
        expect(stage.pain_points[0].severity).toBe('high');
      });

      it('should update stage opportunities', () => {
        service.addStage();
        service.updateStage(0, {
          opportunities: [
            { id: 'o1', hmw: 'How might we simplify navigation?', impact: 'high', effort: 'medium', backlog_tag: 'UX' }
          ]
        });

        const stage = service.journey().stages[0];
        expect(stage.opportunities.length).toBe(1);
        expect(stage.opportunities[0].impact).toBe('high');
      });

      it('should update stage emotion', () => {
        service.addStage();
        service.updateStage(0, {
          emotion: { label: 'frustrated', score: -0.7 }
        });

        const stage = service.journey().stages[0];
        expect(stage.emotion.label).toBe('frustrated');
        expect(stage.emotion.score).toBe(-0.7);
      });
    });

    describe('removeStage()', () => {
      it('should remove stage at specified index', () => {
        service.applyFramework('govt');
        const initialCount = service.journey().stages.length;

        service.removeStage(0);

        expect(service.journey().stages.length).toBe(initialCount - 1);
      });
    });

    describe('journey completeness calculation', () => {
      it('should increase completeness as journey is filled', () => {
        expect(service.journeyCompleteness()).toBe(0);

        service.updateJourney({ title: 'Test Journey' });
        const afterTitle = service.journeyCompleteness();
        expect(afterTitle).toBeGreaterThan(0);

        service.addStage();
        const afterStage = service.journeyCompleteness();
        expect(afterStage).toBeGreaterThan(afterTitle);

        service.updateStage(0, {
          touchpoints: [{ id: 't1', actor: 'User', action: 'Click', channel: 'Web' }]
        });
        const afterTouchpoint = service.journeyCompleteness();
        expect(afterTouchpoint).toBeGreaterThan(afterStage);
      });
    });
  });

  // ===========================================================================
  // Export Tests
  // ===========================================================================
  describe('Export Functionality', () => {
    beforeEach(() => {
      // Set up test data
      service.updatePersonaIdentity('name', 'Test User');
      service.updatePersonaIdentity('occupation', 'Developer');
      service.addGoal();
      service.updateGoal(0, { text: 'Be productive', priority: 'high' });
      service.addFrustration();
      service.updateFrustration(0, { text: 'Slow tools', severity: 'medium' });

      service.updateJourney({ title: 'Test Journey' });
      service.addStage();
      service.updateStage(0, {
        name: 'Stage 1',
        description: 'First stage',
        touchpoints: [{ id: 't1', actor: 'User', action: 'Logs in', channel: 'Web' }],
        pain_points: [{ id: 'p1', text: 'Slow login', severity: 'high' }],
        opportunities: [{ id: 'o1', hmw: 'Speed up login', impact: 'high', effort: 'low', backlog_tag: 'perf' }]
      });
    });

    describe('getExportData() - JSON format', () => {
      it('should export valid JSON', () => {
        const exportData = service.getExportData('json');
        const parsed = JSON.parse(exportData);

        expect(parsed.persona).toBeDefined();
        expect(parsed.journey).toBeDefined();
      });

      it('should include persona data', () => {
        const exportData = service.getExportData('json');
        const parsed = JSON.parse(exportData);

        expect(parsed.persona.identity.name).toBe('Test User');
        expect(parsed.persona.behavioral.goals.length).toBe(1);
      });

      it('should include journey data', () => {
        const exportData = service.getExportData('json');
        const parsed = JSON.parse(exportData);

        expect(parsed.journey.title).toBe('Test Journey');
        expect(parsed.journey.stages.length).toBe(1);
      });
    });

    describe('getExportData() - schema format', () => {
      it('should export simplified schema', () => {
        const exportData = service.getExportData('schema');
        const parsed = JSON.parse(exportData);

        expect(parsed.persona_id).toBeDefined();
        expect(parsed.name).toBe('Test User');
        expect(parsed.role).toBe('Developer');
        expect(parsed.goals.length).toBe(1);
        expect(parsed.frustrations.length).toBe(1);
        expect(parsed.journey_title).toBe('Test Journey');
        expect(parsed.stages).toBe(1);
      });

      it('should count pain points and opportunities', () => {
        const exportData = service.getExportData('schema');
        const parsed = JSON.parse(exportData);

        expect(parsed.pain_points).toBe(1);
        expect(parsed.opportunities).toBe(1);
      });
    });

    describe('getExportData() - text format', () => {
      it('should export readable text format', () => {
        const exportData = service.getExportData('text');

        expect(exportData).toContain('STAGE 1: Stage 1');
        expect(exportData).toContain('First stage');
        expect(exportData).toContain('Touchpoints:');
        expect(exportData).toContain('[User] Logs in (Web)');
        expect(exportData).toContain('Pain Points:');
        expect(exportData).toContain('[high] Slow login');
        expect(exportData).toContain('Opportunities:');
        expect(exportData).toContain('HMW: Speed up login');
      });
    });
  });

  // ===========================================================================
  // Tab Navigation Tests
  // ===========================================================================
  describe('Tab Navigation', () => {
    it('should start with persona tab active', () => {
      expect(service.activeTab()).toBe('persona');
    });

    it('should start with persona preview tab', () => {
      expect(service.previewTab()).toBe('persona');
    });
  });
});
