import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrossMarginComponent } from './gross-margin.component';

describe('GrossMarginComponent', () => {
  let component: GrossMarginComponent;
  let fixture: ComponentFixture<GrossMarginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GrossMarginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GrossMarginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
