import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessedSalesComponent } from './processed-sales.component';

describe('ProcessedSalesComponent', () => {
  let component: ProcessedSalesComponent;
  let fixture: ComponentFixture<ProcessedSalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcessedSalesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessedSalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
