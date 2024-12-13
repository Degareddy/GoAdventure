import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetTransferDetailsComponent } from './asset-transfer-details.component';

describe('AssetTransferDetailsComponent', () => {
  let component: AssetTransferDetailsComponent;
  let fixture: ComponentFixture<AssetTransferDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetTransferDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetTransferDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
