import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent implements OnInit, OnDestroy {

  constructor(private router: Router,) {

  }
  home(){
    this.router.navigate(['/home']);
  }
  ngOnInit(): void {

    // sessionStorage.clear();
    // this.router.navigate(['/home'], { skipLocationChange: true });
    // this.router.resetConfig([{
    //   path:"/home"
    // }])
    // if(sessionStorage.getItem("token")){
    //   this.router.events.subscribe(event => {
    //     if (event instanceof NavigationEnd) {
    //       console.log(event);
    //       console.log('Navigation successful!');
    //       this.router.navigateByUrl(event.url, { skipLocationChange:fail });
    //     }
    //   });
    // }
  }
  ngOnDestroy(): void {

    // if (sessionStorage.getItem("token")) {
    //   this.router.events.subscribe(event => {
    //     if (event instanceof NavigationEnd) {
    //       // console.log(event);
    //       // console.log('Navigation successful!');
    //       this.router.navigate(['/home']);
    //       window.location.reload();
    //     }
    //   });
    // }
  }

}
