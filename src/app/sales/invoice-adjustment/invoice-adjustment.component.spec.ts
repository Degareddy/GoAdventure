import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceAdjustmentComponent } from './invoice-adjustment.component';

describe('InvoiceAdjustmentComponent', () => {
  let component: InvoiceAdjustmentComponent;
  let fixture: ComponentFixture<InvoiceAdjustmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceAdjustmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceAdjustmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
