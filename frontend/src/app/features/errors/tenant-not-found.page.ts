import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PageFrameComponent } from '../../layout/page-frame/page-frame.component';

@Component({
  selector: 'app-tenant-not-found-page',
  standalone: true,
  imports: [ButtonModule, CommonModule, PageFrameComponent],
  templateUrl: './tenant-not-found.page.html',
  styleUrl: './tenant-not-found.page.scss',
})
export class TenantNotFoundPageComponent {}
