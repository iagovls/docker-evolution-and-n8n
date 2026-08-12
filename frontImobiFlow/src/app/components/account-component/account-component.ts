import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-component',
  imports: [],
  templateUrl: './account-component.html',
  styleUrl: './account-component.css',
})
export class AccountComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  loading = signal(false);
  resetSent = signal(false);
  resetError = signal('');

  async ngOnInit(): Promise<void> {
    const email = await this.authService.getUserEmail();
    this.email.set(email);
  }

  async sendResetEmail(): Promise<void> {
    this.resetError.set('');
    this.loading.set(true);

    const result = await this.authService.resetPassword(this.email());

    if (result.error) {
      this.resetError.set(result.error);
      this.loading.set(false);
      return;
    }

    this.resetSent.set(true);
    this.loading.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
