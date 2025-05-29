import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripProfitAndLossComponent } from './trip-profit-and-loss.component';

describe('TripProfitAndLossComponent', () => {
  let component: TripProfitAndLossComponent;
  let fixture: ComponentFixture<TripProfitAndLossComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripProfitAndLossComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripProfitAndLossComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
