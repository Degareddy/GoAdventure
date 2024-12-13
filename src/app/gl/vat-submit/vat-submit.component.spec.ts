import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VatSubmitComponent } from './vat-submit.component';

describe('VatSubmitComponent', () => {
  let component: VatSubmitComponent;
  let fixture: ComponentFixture<VatSubmitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VatSubmitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VatSubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
