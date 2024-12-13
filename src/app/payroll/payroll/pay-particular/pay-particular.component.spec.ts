import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayParticularComponent } from './pay-particular.component';

describe('PayParticularComponent', () => {
  let component: PayParticularComponent;
  let fixture: ComponentFixture<PayParticularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayParticularComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayParticularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
