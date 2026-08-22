import { Component, inject } from '@angular/core';
import { LucideSearch } from '@lucide/angular';
import { MenuService } from '../../services/menu-service';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [LucideSearch, NgComponentOutlet],
  template: ` <div
    class="h-auto w-full flex justify-between items-center bg-white p-2 rounded-xl shadow border border-gray-300"
  >
    <div class="flex gap-3 items-center">
      <span class="text-emerald-600">
        <ng-container
          *ngComponentOutlet="menuService.activeIcon(); inputs: { size: 8 }"
        ></ng-container>
      </span>
      <h1 class="text-2xl font-bold">{{ menuService.activeSection() }}</h1>
    </div>

    <svg lucideSearch></svg>
  </div>`,
  styleUrl: './header.css',
  providers: [MenuService],
})
export class Header {
  menuService = inject(MenuService);
}
