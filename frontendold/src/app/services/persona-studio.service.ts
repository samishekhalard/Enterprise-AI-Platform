import { Injectable, signal, computed } from '@angular/core';
import { Persona, createEmptyPersona, Goal, Frustration, Quote, Assumption, generateId } from '../models/persona.model';
import { Journey, Stage, createEmptyJourney, createEmptyStage, STAGE_FRAMEWORKS } from '../models/journey.model';

@Injectable({
  providedIn: 'root'
})
export class PersonaStudioService {
  // Signals for reactive state
  readonly persona = signal<Persona>(createEmptyPersona());
  readonly journey = signal<Journey>(createEmptyJourney());
  readonly activeTab = signal<'persona' | 'journey' | 'preview' | 'export'>('persona');
  readonly previewTab = signal<'persona' | 'journey'>('persona');

  // Computed values
  readonly personaCompleteness = computed(() => {
    const p = this.persona();
    const checks = [
      p.identity.name,
      p.identity.occupation,
      p.behavioral.goals.length > 0,
      p.behavioral.frustrations.length > 0,
      p.behavioral.systems_used.length > 0,
    ];
    return checks.filter(Boolean).length;
  });

  readonly journeyCompleteness = computed(() => {
    const j = this.journey();
    const checks = [
      j.title,
      j.stages.length > 0,
      j.stages.some(s => s.touchpoints.length > 0),
      j.stages.some(s => s.pain_points.length > 0),
      j.stages.some(s => s.opportunities.length > 0),
    ];
    return checks.filter(Boolean).length;
  });

  readonly confidenceScore = computed(() => {
    const p = this.persona();
    const conf = p.assumptions.filter(a => a.confidence !== 'validated').length;
    return Math.max(0, Math.round(
      100 -
      (conf / Math.max(1, p.assumptions.length)) * 30 -
      (p.behavioral.goals.length === 0 ? 30 : 0) -
      (p.behavioral.frustrations.length === 0 ? 20 : 0)
    ));
  });

  // Persona mutations
  updatePersona(updates: Partial<Persona>): void {
    this.persona.update(p => ({ ...p, ...updates }));
  }

  updatePersonaIdentity(field: string, value: string): void {
    this.persona.update(p => ({
      ...p,
      identity: { ...p.identity, [field]: value }
    }));
  }

  updatePersonaMeta(field: string, value: any): void {
    this.persona.update(p => ({
      ...p,
      meta: { ...p.meta, [field]: value }
    }));
  }

  // Goals
  addGoal(): void {
    const newGoal: Goal = {
      id: generateId(),
      text: '',
      priority: 'medium',
      evidence: '',
      confidence: 'inferred'
    };
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        goals: [...p.behavioral.goals, newGoal]
      }
    }));
  }

  updateGoal(index: number, updates: Partial<Goal>): void {
    this.persona.update(p => {
      const goals = [...p.behavioral.goals];
      goals[index] = { ...goals[index], ...updates };
      return { ...p, behavioral: { ...p.behavioral, goals } };
    });
  }

  removeGoal(index: number): void {
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        goals: p.behavioral.goals.filter((_, i) => i !== index)
      }
    }));
  }

  // Frustrations
  addFrustration(): void {
    const newFrustration: Frustration = {
      id: generateId(),
      text: '',
      trigger: '',
      emotion: 'frustrated',
      severity: 'medium',
      confidence: 'inferred'
    };
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        frustrations: [...p.behavioral.frustrations, newFrustration]
      }
    }));
  }

  updateFrustration(index: number, updates: Partial<Frustration>): void {
    this.persona.update(p => {
      const frustrations = [...p.behavioral.frustrations];
      frustrations[index] = { ...frustrations[index], ...updates };
      return { ...p, behavioral: { ...p.behavioral, frustrations } };
    });
  }

  removeFrustration(index: number): void {
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        frustrations: p.behavioral.frustrations.filter((_, i) => i !== index)
      }
    }));
  }

  // Behaviors
  updateBehaviors(field: string, value: any): void {
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        behaviors: { ...p.behavioral.behaviors, [field]: value }
      }
    }));
  }

  addTag(field: 'domain_tags' | 'systems_used' | 'preferred_channels' | 'values', tag: string): void {
    this.persona.update(p => {
      if (field === 'domain_tags') {
        return { ...p, meta: { ...p.meta, domain_tags: [...p.meta.domain_tags, tag] } };
      } else if (field === 'systems_used') {
        return { ...p, behavioral: { ...p.behavioral, systems_used: [...p.behavioral.systems_used, tag] } };
      } else if (field === 'preferred_channels') {
        return { ...p, behavioral: { ...p.behavioral, behaviors: { ...p.behavioral.behaviors, preferred_channels: [...p.behavioral.behaviors.preferred_channels, tag] } } };
      } else if (field === 'values') {
        return { ...p, psychographic: { ...p.psychographic, values: [...p.psychographic.values, tag] } };
      }
      return p;
    });
  }

  removeTag(field: 'domain_tags' | 'systems_used' | 'preferred_channels' | 'values', index: number): void {
    this.persona.update(p => {
      if (field === 'domain_tags') {
        return { ...p, meta: { ...p.meta, domain_tags: p.meta.domain_tags.filter((_, i) => i !== index) } };
      } else if (field === 'systems_used') {
        return { ...p, behavioral: { ...p.behavioral, systems_used: p.behavioral.systems_used.filter((_, i) => i !== index) } };
      } else if (field === 'preferred_channels') {
        return { ...p, behavioral: { ...p.behavioral, behaviors: { ...p.behavioral.behaviors, preferred_channels: p.behavioral.behaviors.preferred_channels.filter((_, i) => i !== index) } } };
      } else if (field === 'values') {
        return { ...p, psychographic: { ...p.psychographic, values: p.psychographic.values.filter((_, i) => i !== index) } };
      }
      return p;
    });
  }

  // Workarounds
  addWorkaround(): void {
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        workarounds: [...p.behavioral.workarounds, '']
      }
    }));
  }

  updateWorkaround(index: number, value: string): void {
    this.persona.update(p => {
      const workarounds = [...p.behavioral.workarounds];
      workarounds[index] = value;
      return { ...p, behavioral: { ...p.behavioral, workarounds } };
    });
  }

  removeWorkaround(index: number): void {
    this.persona.update(p => ({
      ...p,
      behavioral: {
        ...p.behavioral,
        workarounds: p.behavioral.workarounds.filter((_, i) => i !== index)
      }
    }));
  }

  // Quotes
  addQuote(): void {
    const newQuote: Quote = { id: generateId(), text: '', source: '', basis: 'direct' };
    this.persona.update(p => ({ ...p, quotes: [...p.quotes, newQuote] }));
  }

  updateQuote(index: number, updates: Partial<Quote>): void {
    this.persona.update(p => {
      const quotes = [...p.quotes];
      quotes[index] = { ...quotes[index], ...updates };
      return { ...p, quotes };
    });
  }

  removeQuote(index: number): void {
    this.persona.update(p => ({ ...p, quotes: p.quotes.filter((_, i) => i !== index) }));
  }

  // Assumptions
  addAssumption(): void {
    const newAssumption: Assumption = { id: generateId(), attribute: '', assumption: '', confidence: 'inferred', flag: 'needs validation' };
    this.persona.update(p => ({ ...p, assumptions: [...p.assumptions, newAssumption] }));
  }

  updateAssumption(index: number, updates: Partial<Assumption>): void {
    this.persona.update(p => {
      const assumptions = [...p.assumptions];
      assumptions[index] = { ...assumptions[index], ...updates };
      return { ...p, assumptions };
    });
  }

  removeAssumption(index: number): void {
    this.persona.update(p => ({ ...p, assumptions: p.assumptions.filter((_, i) => i !== index) }));
  }

  // Journey mutations
  updateJourney(updates: Partial<Journey>): void {
    this.journey.update(j => ({ ...j, ...updates }));
  }

  applyFramework(frameworkId: string): void {
    const fw = STAGE_FRAMEWORKS.find(f => f.id === frameworkId);
    if (fw && fw.stages.length > 0) {
      this.journey.update(j => ({
        ...j,
        framework: frameworkId,
        stages: fw.stages.map(name => createEmptyStage(name))
      }));
    } else {
      this.journey.update(j => ({ ...j, framework: frameworkId }));
    }
  }

  addStage(): void {
    this.journey.update(j => ({
      ...j,
      stages: [...j.stages, createEmptyStage(`Stage ${j.stages.length + 1}`)]
    }));
  }

  updateStage(index: number, updates: Partial<Stage>): void {
    this.journey.update(j => {
      const stages = [...j.stages];
      stages[index] = { ...stages[index], ...updates };
      return { ...j, stages };
    });
  }

  removeStage(index: number): void {
    this.journey.update(j => ({
      ...j,
      stages: j.stages.filter((_, i) => i !== index)
    }));
  }

  // Export
  getExportData(format: 'json' | 'schema' | 'text'): string {
    const persona = this.persona();
    const journey = this.journey();

    if (format === 'json') {
      return JSON.stringify({ persona, journey }, null, 2);
    } else if (format === 'schema') {
      return JSON.stringify({
        persona_id: persona.id,
        name: persona.identity.name,
        role: persona.identity.occupation,
        goals: persona.behavioral.goals.map(g => ({ id: g.id, text: g.text, priority: g.priority })),
        frustrations: persona.behavioral.frustrations.map(f => ({ id: f.id, text: f.text, severity: f.severity })),
        journey_title: journey.title,
        stages: journey.stages.length,
        pain_points: journey.stages.flatMap(s => s.pain_points).length,
        opportunities: journey.stages.flatMap(s => s.opportunities).length
      }, null, 2);
    } else {
      return journey.stages.map((s, i) =>
        `STAGE ${i + 1}: ${s.name}\n${s.description}\n\nTouchpoints:\n${s.touchpoints.map(t => `  - [${t.actor}] ${t.action} (${t.channel})`).join('\n')}\n\nPain Points:\n${s.pain_points.map(p => `  ⚠ [${p.severity}] ${p.text}`).join('\n')}\n\nOpportunities:\n${s.opportunities.map(o => `  💡 HMW: ${o.hmw}`).join('\n')}`
      ).join('\n\n---\n\n');
    }
  }
}
