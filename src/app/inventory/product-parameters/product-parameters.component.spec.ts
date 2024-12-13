import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductParametersComponent } from './product-parameters.component';

describe('ProductParametersComponent', () => {
  let component: ProductParametersComponent;
  let fixture: ComponentFixture<ProductParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductParametersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
