import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiLandLordComponent } from './multi-land-lord.component';

describe('MultiLandLordComponent', () => {
  let component: MultiLandLordComponent;
  let fixture: ComponentFixture<MultiLandLordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiLandLordComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiLandLordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
