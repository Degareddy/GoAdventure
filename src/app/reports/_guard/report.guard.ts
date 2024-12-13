// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class ReportGuard implements CanActivate {
//   canActivate(){
//     // console.log();
//      if (sessionStorage.getItem("Reports")){
//       return true;
//     }
//     else {
//       return false;
//     }
//   }
// }


import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Role } from 'src/app/utils/enums';

@Injectable({
  providedIn: 'root'
})
export class ReportGuard implements CanActivate {
   constructor(private userServie: UserDataService, private router: Router,private jwtHelper: JwtHelperService) {}
  // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  //   const menu = sessionStorage.getItem('menuData');
  //   if (menu) {
  //     const menuData = JSON.parse(menu);
  //     const propertyItems = menuData.filter((x: any) => x.menuTitle === 'Reports');
  //     if (propertyItems.length > 0) {
  //       const subUrls = propertyItems
  //         .filter((item: any) => item.menuTitle === 'Reports')
  //         .map((item: any) => item.subUrl.replace('/reports/', ''));
  //         const userRole = this.userServie.userData.userProfile.toUpperCase();
  //         const routePath = state.url;
  //         const roleAccessMap: { [role: string]: string[] } = {
  //           CMPADMIN: subUrls,
  //           CMPUSER: subUrls,
  //           GADMIN: subUrls,
  //           ADMIN: subUrls,
  //           GUSER: subUrls,
  //           LADMIN: subUrls,
  //           LUSER: subUrls,
  //           CADMIN: subUrls,
  //           CUSER: subUrls,
  //           SADMIN: subUrls,
  //           SUSER: subUrls,
  //           LANDLORD: subUrls,
  //           TENANT: subUrls
  //         };
  //         if (roleAccessMap[userRole]?.includes(routePath.replace('/reports/', ''))) {
  //           return true;
  //         }
  //         return false;
  //     }
  //     else{
  //       return false;
  //     }
  //   }
  //   else{
  //     return false
  //   }

  // }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const menu = sessionStorage.getItem('menuData');
    const token = sessionStorage.getItem('token');
    const user = this.userServie.userData.userID;

    if (!user) {
      this.router.navigate(['/']);
      return false;
    }

    if (!token || this.jwtHelper.isTokenExpired(token)) {
      this.router.navigate(['/']);
      return false;
    }

    if (!menu) {
      return false;
    }

    const menuData = JSON.parse(menu);

    const reportItems = menuData.filter((item: any) => item.menuTitle === 'Reports');
    if (reportItems.length === 0) {
      return false;
    }

    const subUrls = reportItems.map((item: any) => item.subUrl.replace(/^\/?reports\//, ''));

    const userRole = this.userServie.userData.userProfile.toUpperCase();

    const routePath = state.url.replace(/^\/?reports\//, '');

    const roleAccessMap: { [role: string]: string[] } = {
      [Role.CMPADMIN]: subUrls,
    [Role.CMPUSER]: subUrls,
    [Role.GADMIN]: subUrls,
    [Role.ADMIN]: subUrls,
    [Role.GUSER]: subUrls,
    [Role.LADMIN]: subUrls,
    [Role.LUSER]: subUrls,
    [Role.CADMIN]: subUrls,
    [Role.CUSER]: subUrls,
    [Role.SADMIN]: subUrls,
    [Role.SUSER]: subUrls,
    [Role.LANDLORD]: subUrls,
    [Role.TENANT]: subUrls
    };

    if (roleAccessMap[userRole]?.includes(routePath)) {
      return true;
    }

    return false;
  }

}
