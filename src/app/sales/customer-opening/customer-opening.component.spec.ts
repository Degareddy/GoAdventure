import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOpeningComponent } from './customer-opening.component';

describe('CustomerOpeningComponent', () => {
  let component: CustomerOpeningComponent;
  let fixture: ComponentFixture<CustomerOpeningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerOpeningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerOpeningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
