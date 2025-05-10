import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTripIDComponent } from './search-trip-id.component';

describe('SearchTripIDComponent', () => {
  let component: SearchTripIDComponent;
  let fixture: ComponentFixture<SearchTripIDComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchTripIDComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchTripIDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
