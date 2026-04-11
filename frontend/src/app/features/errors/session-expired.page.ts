import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-session-expired-page',
  standalone: true,
  imports: [ButtonModule, CommonModule, RouterLink, PageFrameComponent],
  templateUrl: './session-expired.page.html',
  styleUrl: './session-expired.page.scss',
})
export class SessionExpiredPageComponent {}
