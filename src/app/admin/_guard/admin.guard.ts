import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../Services/authentication/auth.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Role } from 'src/app/utils/enums';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private userServie: UserDataService, private router: Router,private jwtHelper: JwtHelperService) {}
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

    const adminItems = menuData.filter((item: any) => item.menuTitle === 'Administration');
    if (adminItems.length === 0) {
      return false;
    }

    const subUrls = adminItems.map((item: any) => item.subUrl.replace('/admin/', ''));

    const userRole = this.userServie.userData.userProfile.toUpperCase();

    const routePath = state.url.replace('/admin/', '');

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

