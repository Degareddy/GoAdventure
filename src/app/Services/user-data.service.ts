import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserData } from '../admin/admin.module';

@Injectable({
  providedIn: 'root', // This makes the service available throughout the application
})
export class UserDataService {
  private userDataSubject = new BehaviorSubject<any>(null);
  userData$ = this.userDataSubject.asObservable();
  userData!: UserData;
  constructor() {
    this.initializeUserData();
  }

  updateUserData(newData: any): Promise<void> {
    //  console.log(newData);
    return new Promise((resolve, reject) => {
      try {
        this.userDataSubject.next(newData);
        sessionStorage.removeItem('userData');
        sessionStorage.setItem('userData', JSON.stringify(newData));
        this.userData = newData;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  private initializeUserData(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      this.userDataSubject.next(JSON.parse(storedUserData));
    }
  }

}
