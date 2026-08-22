import { Component, inject, Input } from '@angular/core';
import { MenuService } from '../../services/menu-service';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-main-component',
  imports: [RouterOutlet],
  template: `
    <div class="h-full md:h-full w-full min-h-0 flex flex-col bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
      <div class="flex-1 w-full min-h-0 overflow-hidden">
        <router-outlet/>
      </div>
    </div>
  `
})
export class MainComponent {

}
