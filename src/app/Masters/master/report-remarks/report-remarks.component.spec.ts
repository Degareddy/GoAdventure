import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportRemarksComponent } from './report-remarks.component';

describe('ReportRemarksComponent', () => {
  let component: ReportRemarksComponent;
  let fixture: ComponentFixture<ReportRemarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportRemarksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportRemarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
