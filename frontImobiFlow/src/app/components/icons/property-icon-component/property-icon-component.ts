import { Component, inject, Input } from '@angular/core';
import {  LucideHouse } from '@lucide/angular';
import { isActive, Router } from '@angular/router';

@Component({
  selector: 'app-property-icon-component',
  imports: [ LucideHouse],
  template: `
    @if (isImoveisActive()) {
      <svg lucideHouse [size]="size * 4" [strokeWidth]="2"></svg>
    } @else {
      <svg lucideHouse [size]="size * 4" [strokeWidth]="1.5"></svg>
    }
  `,
  styleUrl: './property-icon-component.css',
})
export class PropertyIconComponent {
  private router = inject(Router);
  
  isImoveisActive = isActive('/imoveis', this.router);

  @Input() size: number = 6;


}
