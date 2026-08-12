import { Component, Input } from '@angular/core';
import { LucideUser } from '@lucide/angular';

@Component({
  selector: 'app-account-icon',
  imports: [LucideUser],
  template: `<svg lucideUser [size]="size * 4" [strokeWidth]="1.5"></svg>`,
})
export class AccountIcon {
  @Input() size: number = 6;
}
