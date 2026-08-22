import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadConversation } from './lead-conversation';

describe('LeadConversation', () => {
  let component: LeadConversation;
  let fixture: ComponentFixture<LeadConversation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadConversation],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadConversation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
