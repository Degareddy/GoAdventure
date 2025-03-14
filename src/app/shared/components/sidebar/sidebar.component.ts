import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable, shareReplay } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AuthService } from 'src/app/Services/authentication/auth.service';
import { SubSink } from 'subsink';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ThemeService } from 'src/app/Services/theme.service';
interface MenuEntry {
  menu: { function_url: string; text: string, menuItemIcon: string }[];
  sessionKey: string;
  flag: string;
}

type MenuMap = Record<string, MenuEntry>;
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map((result: { matches: any; }) => result.matches),
      shareReplay()
    );
  masterParams!: MasterParams;
  public menudata: any = [];
  public adminMenu: any = [];
  public tenantMenu: any = [];
  public lnlrdMenu: any = [];
  public salesMenu: any = [];
  public purchaseMenu: any = [];
  public skinMenu: any = [];
  public invMenu: any = [];
  public glMenu: any = [];
  public utilMenu: any = [];
  public propertyMenu: any = [];
  public payrollMenu: any = [];
  public assetsMenu: any = [];
  public projectsMenu: any = [];
  public reportMenu: any = [];
  public isReport: boolean = false;
  public isAdmin: boolean = false;
  public isTenant: boolean = false;
  public isLandlord:boolean =false;
  public isSale: boolean = false;
  public isPurchase: boolean = false;
  public isSkin: boolean = false;
  public isInvent: boolean = false;
  public isGl: boolean = false;
  public isPay: boolean = false;
  public isAsset: boolean = false;
  public isUtil: boolean = false;
  public isProject: boolean = false;
  public isProperty: boolean = false;
  public user: string = "";
  activeRoute: string = "";
  private subsink: SubSink;
  isDarkTheme: boolean = false;
  constructor(private router: Router, private authService: AuthService,private themeService: ThemeService, private breakpointObserver: BreakpointObserver) {
    this.masterParams = new MasterParams();
    this.subsink = new SubSink();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
      this.activeRoute = event.urlAfterRedirects;
    });

  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  isRouteActive(route: string): boolean {
    return this.activeRoute.includes(route);
  }
 async ngOnInit() {
    const storedMenuData = sessionStorage.getItem('menuData');
    if (storedMenuData) {
      this.menudata = JSON.parse(storedMenuData);
      if (this.menudata) {
        this.processMenuData(this.menudata);
      }
    }
    else {
      this.subsink.sink = await this.authService.getUserData().subscribe(data => {
        if (data) {
          var res = JSON.parse(data);
          if (res) {
            this.processMenuData(res);
          }
        }
      });
    }
    this.themeService.isDarkTheme$.subscribe((isDark: boolean) => {
      this.isDarkTheme = isDark;
    });
  }

  private processMenuData(menuData: any[]) {
    const menuMap: MenuMap = {
      'Landlord': { menu: this.lnlrdMenu, sessionKey: 'landlord', flag: 'isLandlord' },
      'Tenant': { menu: this.tenantMenu, sessionKey: 'tenant', flag: 'isTenant' },
      'Administration': { menu: this.adminMenu, sessionKey: 'admin', flag: 'isAdmin' },
      'Sales': { menu: this.salesMenu, sessionKey: 'sales', flag: 'isSale' },
      'Purchase': { menu: this.purchaseMenu, sessionKey: 'purchase', flag: 'isPurchase' },
      'Skins': { menu: this.skinMenu, sessionKey: 'skins', flag: 'isSkin' },
      'Inventory': { menu: this.invMenu, sessionKey: 'inventory', flag: 'isInvent' },
      'General Ledger': { menu: this.glMenu, sessionKey: 'gl', flag: 'isGl' },
      'Utilities': { menu: this.utilMenu, sessionKey: 'utilities', flag: 'isUtil' },
      'Payroll': { menu: this.payrollMenu, sessionKey: 'payroll', flag: 'isPay' },
      'Assets': { menu: this.assetsMenu, sessionKey: 'assets', flag: 'isAsset' },
      'Projects': { menu: this.projectsMenu, sessionKey: 'project', flag: 'isProject' },
      'Property': { menu: this.propertyMenu, sessionKey: 'property', flag: 'isProperty' },
      'Reports': { menu: this.reportMenu, sessionKey: 'Reports', flag: 'isReport' }
    };

    for (const item of menuData) {
      const { subUrl: functionUrl, subText: funText, menuItemIcon: menuItemIcon, menuTitle: funTitle } = item;
      const menuEntry = menuMap[funTitle] as MenuEntry | undefined;

      if (menuEntry) {
        menuEntry.menu.push({
          function_url: functionUrl,
          text: funText,
          menuItemIcon: menuItemIcon // added menuItemIcon here
        });
        sessionStorage.setItem(menuEntry.sessionKey, `${menuEntry.sessionKey}Config`);
        (this as any)[menuEntry.flag] = true;
      }
    }
  }

}
