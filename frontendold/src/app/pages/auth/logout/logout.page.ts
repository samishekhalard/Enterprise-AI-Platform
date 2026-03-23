import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-logout-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logout-page">
      <div class="logout-content">
        <div class="spinner"></div>
        <h2>Signing Out</h2>
        <p>Please wait...</p>
      </div>
    </div>
  `,
  styles: [`
    .logout-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a2540 0%, #0d3a4d 50%, #047481 100%);
    }
    .logout-content {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; }
    p { opacity: 0.8; }
  `]
})
export class LogoutPage implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
