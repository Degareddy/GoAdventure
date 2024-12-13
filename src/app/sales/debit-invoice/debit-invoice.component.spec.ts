import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebitInvoiceComponent } from './debit-invoice.component';

describe('DebitInvoiceComponent', () => {
  let component: DebitInvoiceComponent;
  let fixture: ComponentFixture<DebitInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DebitInvoiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DebitInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
