import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlReportsComponent } from './gl-reports.component';

describe('GlReportsComponent', () => {
  let component: GlReportsComponent;
  let fixture: ComponentFixture<GlReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GlReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GlReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
