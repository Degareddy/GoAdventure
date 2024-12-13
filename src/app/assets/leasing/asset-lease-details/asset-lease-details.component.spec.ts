import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetLeaseDetailsComponent } from './asset-lease-details.component';

describe('AssetLeaseDetailsComponent', () => {
  let component: AssetLeaseDetailsComponent;
  let fixture: ComponentFixture<AssetLeaseDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetLeaseDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetLeaseDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
