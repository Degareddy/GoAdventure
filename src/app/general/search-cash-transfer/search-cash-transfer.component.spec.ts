import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchCashTransferComponent } from './search-cash-transfer.component';

describe('SearchCashTransferComponent', () => {
  let component: SearchCashTransferComponent;
  let fixture: ComponentFixture<SearchCashTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchCashTransferComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchCashTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
