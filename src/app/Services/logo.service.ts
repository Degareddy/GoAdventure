// logo.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogoService {
  private logoPathSource = new BehaviorSubject<string>('');
  logoPath$ = this.logoPathSource.asObservable();

  setLogoPath(path: string) {
    this.logoPathSource.next(path);
  }
}
