import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandshakeIconComponent } from './handshake-icon-component';

describe('HandshakeIconComponent', () => {
  let component: HandshakeIconComponent;
  let fixture: ComponentFixture<HandshakeIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandshakeIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HandshakeIconComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
