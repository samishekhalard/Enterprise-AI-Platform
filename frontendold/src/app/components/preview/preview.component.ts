import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonaStudioService } from '../../services/persona-studio.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent {
  readonly service = inject(PersonaStudioService);

  // Brand colors
  stageColors = ['#b9a779', '#054239', '#428177', '#988561', '#6b1f2a'];

  getStageColor(index: number): string {
    return this.stageColors[index % this.stageColors.length];
  }

  getScoreColor(score: number): string {
    if (score > 70) return '#054239'; // Forest - good
    if (score > 40) return '#988561'; // Golden Wheat Dark - medium
    return '#6b1f2a'; // Umber - low
  }

  getEmotionColor(score: number): string {
    if (score > 20) return '#054239'; // Forest - positive
    if (score < -20) return '#6b1f2a'; // Umber - negative
    return '#988561'; // Golden Wheat Dark - neutral
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#6b1f2a'; // Umber
      case 'medium': return '#988561'; // Golden Wheat Dark
      default: return '#3d3a3b'; // Charcoal
    }
  }

  getTotalPainPoints(): number {
    return this.service.journey().stages.reduce((sum, s) => sum + s.pain_points.length, 0);
  }

  getTotalOpportunities(): number {
    return this.service.journey().stages.reduce((sum, s) => sum + s.opportunities.length, 0);
  }

  getPainPointsText(stage: any): string {
    const text = stage.pain_points.map((p: any) => p.text).filter(Boolean).join('; ');
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }

  getOpportunitiesText(stage: any): string {
    const text = stage.opportunities.map((o: any) => o.hmw).filter(Boolean).join('; ');
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }
}
