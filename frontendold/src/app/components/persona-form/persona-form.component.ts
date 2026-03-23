import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonaStudioService } from '../../services/persona-studio.service';
import { TagInputComponent } from '../../shared/tag-input/tag-input.component';
import { ConfidenceBadgeComponent } from '../../shared/confidence-badge/confidence-badge.component';
import { TECH_LITERACY_OPTIONS, DECISION_STYLE_OPTIONS, PRIORITY_OPTIONS, SEVERITY_OPTIONS, EMOTION_OPTIONS, QUOTE_BASIS_OPTIONS } from '../../models/constants';
import { ConfidenceLevel } from '../../models/persona.model';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TagInputComponent, ConfidenceBadgeComponent],
  templateUrl: './persona-form.component.html',
  styleUrl: './persona-form.component.scss'
})
export class PersonaFormComponent {
  readonly service = inject(PersonaStudioService);

  techLiteracyOptions = TECH_LITERACY_OPTIONS;
  decisionStyleOptions = DECISION_STYLE_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;
  severityOptions = SEVERITY_OPTIONS;
  emotionOptions = EMOTION_OPTIONS;
  quoteBasisOptions = QUOTE_BASIS_OPTIONS;

  updateGoalConfidence(index: number, confidence: ConfidenceLevel): void {
    this.service.updateGoal(index, { confidence });
  }

  updateFrustrationConfidence(index: number, confidence: ConfidenceLevel): void {
    this.service.updateFrustration(index, { confidence });
  }

  updateAssumptionConfidence(index: number, confidence: ConfidenceLevel): void {
    this.service.updateAssumption(index, { confidence });
  }
}
