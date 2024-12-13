import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodClosureComponent } from './period-closure.component';

describe('PeriodClosureComponent', () => {
  let component: PeriodClosureComponent;
  let fixture: ComponentFixture<PeriodClosureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeriodClosureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeriodClosureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
