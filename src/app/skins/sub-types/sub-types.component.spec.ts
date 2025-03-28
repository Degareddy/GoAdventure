import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubTypesComponent } from './sub-types.component';

describe('SubTypesComponent', () => {
  let component: SubTypesComponent;
  let fixture: ComponentFixture<SubTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubTypesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
