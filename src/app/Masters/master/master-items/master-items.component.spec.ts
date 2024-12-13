import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterItemsComponent } from './master-items.component';

describe('MasterItemsComponent', () => {
  let component: MasterItemsComponent;
  let fixture: ComponentFixture<MasterItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MasterItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
