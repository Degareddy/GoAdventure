import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LossBookingComponent } from './loss-booking.component';

describe('LossBookingComponent', () => {
  let component: LossBookingComponent;
  let fixture: ComponentFixture<LossBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LossBookingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LossBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
