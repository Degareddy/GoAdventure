import { Injectable } from '@angular/core';
import { Observable, Subject,Subscription, interval, throttle } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class IdleService {
private idleSubject = new Subject<boolean>();
private timeout = 900;
private lastActivity?:Date;
private idleCheckInterval = 100;
private idleSubscription?: Subscription;
  constructor() {
    this.resetTimer();
    this.startWatching();
   }

   get idleState():Observable<boolean>{
    return this.idleSubject.asObservable();
   }

   public startWatching(){
    this.idleSubscription = interval(this.idleCheckInterval * 1000).pipe(throttle(()=>interval(1000))).subscribe(()=>{
        const now = new Date();
        if(now.getTime() - this.lastActivity?.getTime()! > this.timeout *1000){
          this.idleSubject.next(true);
        }
      });
   }
   resetTimer(){
    this.lastActivity = new Date();
    this.idleSubject.next(false);

   }
   stopWatching(){
    if(this.idleSubscription){
      this.idleSubscription.unsubscribe();
    }
   }
}
