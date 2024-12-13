import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Role } from 'src/app/utils/enums';

@Injectable({
  providedIn: 'root'
})
export class InventoryGuard implements CanActivate {
  // canActivate(){
  //   // console.log();
  //    if (sessionStorage.getItem("inventory")){
  //     return true;
  //   }
  //   else {
  //     return false;
  //   }
  // }
  constructor(private userServie: UserDataService, private router: Router,private jwtHelper: JwtHelperService) {}
  // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  //   const menu = sessionStorage.getItem('menuData');
  //   if (menu) {
  //     const menuData = JSON.parse(menu);
  //     const propertyItems = menuData.filter((x: any) => x.menuTitle === 'Inventory');
  //     if (propertyItems.length > 0) {
  //       const subUrls = propertyItems
  //         .filter((item: any) => item.menuTitle === 'Inventory')
  //         .map((item: any) => item.subUrl.replace('/inventory/', ''));
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
  //         if (roleAccessMap[userRole]?.includes(routePath.replace('/inventory/', ''))) {
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

    const inventoryItems = menuData.filter((item: any) => item.menuTitle === 'Inventory');
    if (inventoryItems.length === 0) {
      return false;
    }
    const subUrls = inventoryItems.map((item: any) => item.subUrl.replace('/inventory/', ''));

    const userRole = this.userServie.userData.userProfile.toUpperCase();

    const routePath = state.url.replace('/inventory/', '');

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
