import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentNumbersComponent } from './document-numbers.component';

describe('DocumentNumbersComponent', () => {
  let component: DocumentNumbersComponent;
  let fixture: ComponentFixture<DocumentNumbersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentNumbersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentNumbersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
