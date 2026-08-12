import { Component, inject, Input } from '@angular/core';
import {  LucideUsers } from '@lucide/angular';
import { isActive, Router } from '@angular/router';

@Component({
  selector: 'app-users-icon',
  imports: [ LucideUsers],
  template: `
    @if (isLeadsActive()) {
    <svg lucideUsers [size]="size * 4" [strokeWidth]="2"></svg>
  } @else {
    <svg lucideUsers [size]="size * 4" [strokeWidth]="1.5"></svg>
  }
  `,
  styleUrl: './users-icon.css',
})
export class UsersIcon {
  private router = inject(Router);
  @Input() size: number = 6;
  isLeadsActive = isActive('/leads', this.router);


}
