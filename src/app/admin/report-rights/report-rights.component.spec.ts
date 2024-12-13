import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportRightsComponent } from './report-rights.component';

describe('ReportRightsComponent', () => {
  let component: ReportRightsComponent;
  let fixture: ComponentFixture<ReportRightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportRightsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportRightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
