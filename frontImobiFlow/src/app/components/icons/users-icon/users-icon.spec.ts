import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersIcon } from './users-icon';

describe('UsersIcon', () => {
  let component: UsersIcon;
  let fixture: ComponentFixture<UsersIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
