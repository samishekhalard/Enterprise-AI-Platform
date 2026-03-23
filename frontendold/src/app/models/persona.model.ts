export type ConfidenceLevel = 'validated' | 'inferred' | 'assumed';

export interface Goal {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  evidence: string;
  confidence: 'validated' | 'inferred' | 'assumed';
}

export interface Frustration {
  id: string;
  text: string;
  trigger: string;
  emotion: string;
  severity: 'high' | 'medium' | 'low';
  confidence: 'validated' | 'inferred' | 'assumed';
}

export interface Quote {
  id: string;
  text: string;
  source: string;
  basis: 'direct' | 'paraphrased' | 'composite';
}

export interface Assumption {
  id: string;
  attribute: string;
  assumption: string;
  confidence: 'validated' | 'inferred' | 'assumed';
  flag: string;
}

export interface Behaviors {
  preferred_channels: string[];
  work_pattern: string;
  decision_style: string;
}

export interface Persona {
  id: string;
  meta: {
    slug: string;
    status: string;
    domain_tags: string[];
    product_scope: string[];
  };
  identity: {
    name: string;
    archetype: string;
    age_range: string;
    occupation: string;
    location: string;
    tech_literacy: string;
  };
  behavioral: {
    goals: Goal[];
    frustrations: Frustration[];
    behaviors: Behaviors;
    workarounds: string[];
    systems_used: string[];
  };
  psychographic: {
    values: string[];
    motivations: string[];
    personality_traits: string[];
  };
  quotes: Quote[];
  assumptions: Assumption[];
}

export function createEmptyPersona(): Persona {
  return {
    id: generateId(),
    meta: { slug: '', status: 'draft', domain_tags: [], product_scope: [] },
    identity: { name: '', archetype: '', age_range: '', occupation: '', location: '', tech_literacy: 'intermediate' },
    behavioral: {
      goals: [],
      frustrations: [],
      behaviors: { preferred_channels: [], work_pattern: '', decision_style: '' },
      workarounds: [],
      systems_used: [],
    },
    psychographic: { values: [], motivations: [], personality_traits: [] },
    quotes: [],
    assumptions: [],
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 8);
}
