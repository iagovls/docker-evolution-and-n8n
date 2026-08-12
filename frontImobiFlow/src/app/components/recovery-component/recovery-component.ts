import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../logo-component/logo-component';

@Component({
  selector: 'app-recovery-component',
  imports: [FormsModule, RouterLink, LogoComponent],
  templateUrl: './recovery-component.html',
  styleUrl: './recovery-component.css',
})
export class RecoveryComponent {
  private authService = inject(AuthService);

  email = '';
  error = signal('');
  success = signal(false);
  loading = signal(false);

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.success.set(false);
    this.loading.set(true);

    const result = await this.authService.resetPassword(this.email);

    if (result.error) {
      this.error.set(result.error);
      this.loading.set(false);
      return;
    }

    this.success.set(true);
    this.loading.set(false);
  }
}
