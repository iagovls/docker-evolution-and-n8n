import { Component, inject, Input } from '@angular/core';
import { LucideCalendarDays } from '@lucide/angular';
import { isActive, Router } from '@angular/router';

@Component({
  selector: 'app-calendar-icon-component',
  imports: [ LucideCalendarDays],
  template: `
    @if (isAgendaActive()) {
    <svg lucideCalendarDays [size]="size * 4" [strokeWidth]="2"></svg>
  } @else {
    <svg lucideCalendarDays [size]="size * 4" [strokeWidth]="1.5"></svg>
  }
  `,
  styleUrl: './calendar-icon-component.css',
})
export class CalendarIconComponent {
  private router = inject(Router);
  @Input() size: number = 6;

  isAgendaActive = isActive('/agenda', this.router);


}
