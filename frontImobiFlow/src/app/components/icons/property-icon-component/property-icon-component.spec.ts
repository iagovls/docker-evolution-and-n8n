import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyIconComponent } from './property-icon-component';

describe('PropertyIconComponent', () => {
  let component: PropertyIconComponent;
  let fixture: ComponentFixture<PropertyIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyIconComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
