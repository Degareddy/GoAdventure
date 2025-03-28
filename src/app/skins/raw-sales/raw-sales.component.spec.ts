import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawSalesComponent } from './raw-sales.component';

describe('RawSalesComponent', () => {
  let component: RawSalesComponent;
  let fixture: ComponentFixture<RawSalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RawSalesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RawSalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
