import { generateId } from './persona.model';

export interface Touchpoint {
  id: string;
  actor: string;
  action: string;
  channel: string;
}

export interface PainPoint {
  id: string;
  text: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Opportunity {
  id: string;
  hmw: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  backlog_tag: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'Read' | 'Write' | 'Read/Write';
  desc: string;
}

export interface Emotion {
  label: string;
  score: number;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  persona_drivers: string[];
  touchpoints: Touchpoint[];
  pain_points: PainPoint[];
  opportunities: Opportunity[];
  integrations: Integration[];
  emotion: Emotion;
  ebp: string | null;
}

export interface Journey {
  id: string;
  title: string;
  persona_id: string;
  variant_type: string;
  framework: string;
  stages: Stage[];
}

export interface StageFramework {
  id: string;
  label: string;
  stages: string[];
}

export const STAGE_FRAMEWORKS: StageFramework[] = [
  { id: 'govt', label: 'Government / Internal Tool', stages: ['Precondition', 'Start / Login', 'Review & Assess', 'Decision / Submit', 'Post-Submission'] },
  { id: 'product', label: 'Product SaaS', stages: ['Awareness', 'Sign Up', 'Onboarding', 'Core Usage', 'Retention', 'Advocacy'] },
  { id: 'service', label: 'Customer Service', stages: ['Need Recognition', 'Inquiry', 'Investigation', 'Resolution', 'Follow-Up'] },
  { id: 'custom', label: 'Custom', stages: [] },
];

export function createEmptyJourney(): Journey {
  return {
    id: generateId(),
    title: '',
    persona_id: '',
    variant_type: 'happy_path',
    framework: 'govt',
    stages: [],
  };
}

export function createEmptyStage(name: string = ''): Stage {
  return {
    id: generateId(),
    name,
    description: '',
    persona_drivers: [],
    touchpoints: [],
    pain_points: [],
    opportunities: [],
    integrations: [],
    emotion: { label: 'neutral', score: 0 },
    ebp: null,
  };
}
