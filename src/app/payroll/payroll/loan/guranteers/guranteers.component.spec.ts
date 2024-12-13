import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuranteersComponent } from './guranteers.component';

describe('GuranteersComponent', () => {
  let component: GuranteersComponent;
  let fixture: ComponentFixture<GuranteersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GuranteersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuranteersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
