import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeChangeComponent } from './grade-change.component';

describe('GradeChangeComponent', () => {
  let component: GradeChangeComponent;
  let fixture: ComponentFixture<GradeChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GradeChangeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
