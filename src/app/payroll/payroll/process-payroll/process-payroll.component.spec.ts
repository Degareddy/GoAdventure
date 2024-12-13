import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPayrollComponent } from './process-payroll.component';

describe('ProcessPayrollComponent', () => {
  let component: ProcessPayrollComponent;
  let fixture: ComponentFixture<ProcessPayrollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcessPayrollComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessPayrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
