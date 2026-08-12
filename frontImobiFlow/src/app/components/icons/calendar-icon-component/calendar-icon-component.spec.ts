import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarIconComponent } from './calendar-icon-component';

describe('CalendarIconComponent', () => {
  let component: CalendarIconComponent;
  let fixture: ComponentFixture<CalendarIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarIconComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
