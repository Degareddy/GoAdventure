import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripIdComponent } from './trip-id.component';

describe('TripIdComponent', () => {
  let component: TripIdComponent;
  let fixture: ComponentFixture<TripIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripIdComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
