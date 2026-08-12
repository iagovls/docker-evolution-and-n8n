import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-logo-component',
  imports: [NgOptimizedImage],
  template: `
          <img class="w-40" [ngSrc]="logoUrl" [alt]="logoAlt" width="2039" height="607" priority /> 
     `,
  styleUrl: './logo-component.css',
})
export class LogoComponent {
  logoUrl = '/imobiFlowLogo02.png';
  logoAlt = 'ImobiFlow logo';
}
