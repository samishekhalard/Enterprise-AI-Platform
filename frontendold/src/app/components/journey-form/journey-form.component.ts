import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonaStudioService } from '../../services/persona-studio.service';
import { STAGE_FRAMEWORKS } from '../../models/journey.model';
import { generateId } from '../../models/persona.model';
import { ACTOR_OPTIONS, CHANNEL_OPTIONS, EMOTION_OPTIONS, PRIORITY_OPTIONS, SEVERITY_OPTIONS, VARIANT_TYPE_OPTIONS, INTEGRATION_TYPE_OPTIONS } from '../../models/constants';

@Component({
  selector: 'app-journey-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journey-form.component.html',
  styleUrl: './journey-form.component.scss'
})
export class JourneyFormComponent {
  readonly service = inject(PersonaStudioService);
  readonly Math = Math;

  frameworks = STAGE_FRAMEWORKS;
  variantTypes = VARIANT_TYPE_OPTIONS;
  actorOptions = ACTOR_OPTIONS;
  channelOptions = CHANNEL_OPTIONS;
  emotionOptions = EMOTION_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;
  severityOptions = SEVERITY_OPTIONS;
  integrationTypes = INTEGRATION_TYPE_OPTIONS;

  // Brand colors for stages
  stageColors = ['#b9a779', '#054239', '#428177', '#988561', '#6b1f2a'];

  getStageColor(index: number): string {
    return this.stageColors[index % this.stageColors.length];
  }

  getEmotionColor(score: number): string {
    if (score > 10) return '#054239'; // Forest - positive
    if (score < -10) return '#6b1f2a'; // Umber - negative
    return '#988561'; // Golden Wheat Dark - neutral
  }

  togglePersonaDriver(stageIndex: number, driverId: string): void {
    const stage = this.service.journey().stages[stageIndex];
    const drivers = stage.persona_drivers.includes(driverId)
      ? stage.persona_drivers.filter(d => d !== driverId)
      : [...stage.persona_drivers, driverId];
    this.service.updateStage(stageIndex, { persona_drivers: drivers });
  }

  // Touchpoints
  addTouchpoint(stageIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const touchpoints = [...stage.touchpoints, { id: generateId(), actor: 'User', action: '', channel: 'Web portal' }];
    this.service.updateStage(stageIndex, { touchpoints });
  }

  updateTouchpoint(stageIndex: number, tpIndex: number, field: string, value: string): void {
    const stage = this.service.journey().stages[stageIndex];
    const touchpoints = [...stage.touchpoints];
    touchpoints[tpIndex] = { ...touchpoints[tpIndex], [field]: value };
    this.service.updateStage(stageIndex, { touchpoints });
  }

  removeTouchpoint(stageIndex: number, tpIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const touchpoints = stage.touchpoints.filter((_, i) => i !== tpIndex);
    this.service.updateStage(stageIndex, { touchpoints });
  }

  // Pain Points
  addPainPoint(stageIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const pain_points = [...stage.pain_points, { id: generateId(), text: '', severity: 'medium' as const }];
    this.service.updateStage(stageIndex, { pain_points });
  }

  updatePainPoint(stageIndex: number, ppIndex: number, field: string, value: string): void {
    const stage = this.service.journey().stages[stageIndex];
    const pain_points = [...stage.pain_points];
    pain_points[ppIndex] = { ...pain_points[ppIndex], [field]: value };
    this.service.updateStage(stageIndex, { pain_points });
  }

  removePainPoint(stageIndex: number, ppIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const pain_points = stage.pain_points.filter((_, i) => i !== ppIndex);
    this.service.updateStage(stageIndex, { pain_points });
  }

  // Opportunities
  addOpportunity(stageIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const opportunities = [...stage.opportunities, { id: generateId(), hmw: '', impact: 'medium' as const, effort: 'medium' as const, backlog_tag: '' }];
    this.service.updateStage(stageIndex, { opportunities });
  }

  updateOpportunity(stageIndex: number, oppIndex: number, field: string, value: string): void {
    const stage = this.service.journey().stages[stageIndex];
    const opportunities = [...stage.opportunities];
    opportunities[oppIndex] = { ...opportunities[oppIndex], [field]: value };
    this.service.updateStage(stageIndex, { opportunities });
  }

  removeOpportunity(stageIndex: number, oppIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const opportunities = stage.opportunities.filter((_, i) => i !== oppIndex);
    this.service.updateStage(stageIndex, { opportunities });
  }

  // Integrations
  addIntegration(stageIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const integrations = [...stage.integrations, { id: generateId(), name: '', type: 'Read' as const, desc: '' }];
    this.service.updateStage(stageIndex, { integrations });
  }

  updateIntegration(stageIndex: number, intIndex: number, field: string, value: string): void {
    const stage = this.service.journey().stages[stageIndex];
    const integrations = [...stage.integrations];
    integrations[intIndex] = { ...integrations[intIndex], [field]: value };
    this.service.updateStage(stageIndex, { integrations });
  }

  removeIntegration(stageIndex: number, intIndex: number): void {
    const stage = this.service.journey().stages[stageIndex];
    const integrations = stage.integrations.filter((_, i) => i !== intIndex);
    this.service.updateStage(stageIndex, { integrations });
  }

  // EBP
  addEbp(stageIndex: number): void {
    this.service.updateStage(stageIndex, { ebp: '' });
  }

  removeEbp(stageIndex: number): void {
    this.service.updateStage(stageIndex, { ebp: null });
  }
}
