import { TestBed } from '@angular/core/testing';

import { SkinsGuard } from './skins.guard';

describe('SkinsGuard', () => {
  let guard: SkinsGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SkinsGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
