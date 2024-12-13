import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollReportsComponent } from './payroll-reports.component';

describe('PayrollReportsComponent', () => {
  let component: PayrollReportsComponent;
  let fixture: ComponentFixture<PayrollReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayrollReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PayrollReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
