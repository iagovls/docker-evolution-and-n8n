import { Component, inject, Input } from '@angular/core';
import { MenuService } from '../../services/menu-service';

@Component({
  selector: 'app-main-component',
  imports: [],
  template: `
    <div class="h-full w-full flex justify-between items-center bg-white  rounded-2xl shadow border border-gray-300">
      <h1 class="">{{ activeSection }}</h1>
    </div>
  `,
  styleUrl: './main-component.css',
})
export class MainComponent {
  activeSection = '';
  public menuService = inject(MenuService);
  constructor() {
    this.activeSection = this.menuService.activeSection();
  }
}
