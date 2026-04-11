import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-access-denied-page',
  standalone: true,
  imports: [ButtonModule, CommonModule, RouterLink, PageFrameComponent],
  templateUrl: './access-denied.page.html',
  styleUrl: './access-denied.page.scss',
})
export class AccessDeniedPageComponent {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
