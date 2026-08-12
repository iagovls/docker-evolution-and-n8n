import { Component, inject, Input } from '@angular/core';
import { LucideHandshake } from '@lucide/angular';
import { isActive, Router } from '@angular/router';

@Component({
  selector: 'app-handshake-icon-component',
  imports: [LucideHandshake],
  template: `
  @if (isNegotiationsActive()) {
    <svg lucideHandshake [size]="size * 4" [strokeWidth]="2"></svg>
  } @else {
    <svg lucideHandshake [size]="size * 4" [strokeWidth]="1.5"></svg>
  }
    
  `,
  styleUrl: './handshake-icon-component.css',
})
export class HandshakeIconComponent {
  private router = inject(Router);
  @Input() size: number = 6;

  isNegotiationsActive = isActive('/negociacoes', this.router);
  
}
