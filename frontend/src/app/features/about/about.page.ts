import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

interface FeatureCard {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly colorVar: string;
}

interface TechBadge {
  readonly name: string;
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageFrameComponent],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPageComponent {
  protected readonly platformName = 'BitX Government Platform';
  protected readonly tagline = 'Intelligent Product Management Powered by AI Agents';
  protected readonly version = '1.0.0';
  protected readonly year = new Date().getFullYear();

  protected readonly features: readonly FeatureCard[] = [
    {
      title: 'Backlog Management',
      description:
        'Centralized product backlog with epics, features, stories, and tasks organized by SDLC phases.',
      icon: 'clipboard',
      colorVar: '--color-discover',
    },
    {
      title: 'AI Agent Orchestration',
      description:
        'Specialized SDLC agents (BA, SA, DEV, QA, SEC) collaborate to deliver features end-to-end.',
      icon: 'brain',
      colorVar: '--color-design',
    },
    {
      title: 'SDLC Phase Gates',
      description:
        'Quality gates enforce Definition of Done at each phase: Discover, Design, Build, Test, Deploy.',
      icon: 'shield',
      colorVar: '--color-build',
    },
    {
      title: 'Artifact Tracking',
      description:
        'Track documentation, ADRs, test reports, and deployment artifacts across the full lifecycle.',
      icon: 'archive',
      colorVar: '--color-test',
    },
  ];

  protected readonly techStack: readonly TechBadge[] = [
    { name: 'Spring Boot' },
    { name: 'Angular' },
    { name: 'PostgreSQL' },
    { name: 'Neo4j' },
  ];

  protected readonly mission =
    'The BitX Government Platform empowers government entities to manage digital products ' +
    'with enterprise-grade multi-tenancy, AI-driven automation, and comprehensive SDLC governance. ' +
    'Our mission is to bring world-class product management practices to public sector digital transformation.';
}
