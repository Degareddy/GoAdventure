import { Injectable, OnDestroy } from '@angular/core';
import { MastersService } from '../masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject } from 'rxjs';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IdleService } from '../idle.service';
import { UserDataService } from '../user-data.service';
import { Store } from '@ngrx/store';
import { logout } from 'src/app/utils/auth.actions';
import { CashTransfersComponent } from 'src/app/layouts/cash-transfers/cash-transfers.component';
import { ThemeService } from '../theme.service';
import { LogoService } from '../logo.service';

interface UserData {
  [key: string]: string | unknown;
  company: string;
  location: string;
  userName: string;
  userID: string;
  userProfile: string;
  userCompany: string;
  userCompanyName: string;
  defaultCompany: string;
  defaultCompanyName: string;
  defaultLocn: string;
  defaultLocnName: string;
  expiresOn: string;
  userStatus: string;
  sessionID: string;
  lastLoginOn: string;
  dbMessage: string;
  langId: number;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  user: string = "";
  helper: any;
  private readonly AUTH_TOKEN_KEY = 'authToken';
  public type: any;
  public id: any;
  private subsink!: SubSink;
  userData!: UserData;
  masterParams!: MasterParams;
  private userDataSubject = new BehaviorSubject<any>(null);
  constructor(private msService: MastersService, private router: Router, private themeService: ThemeService, private store: Store,
    private dialog: MatDialog, private userDataService: UserDataService, private logoService: LogoService,
    private toaster: ToastrService, private loader: NgxUiLoaderService, private idleService: IdleService) {
    this.masterParams = new MasterParams();
    this.helper = new JwtHelperService();
    this.subsink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  isLoggedIn(): boolean {
    const storedUserData = sessionStorage.getItem('userData');

    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      this.user = this.userData?.userID;
    }

    return Boolean(this.user);
  }

  private trimData(data: any): UserData {
    const trimmedData: Partial<UserData> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        trimmedData[key] = value.trim();
      } else {
        trimmedData[key] = value as string | unknown;
      }
    }
    return trimmedData as UserData;
  }
  getAuthToken(): string | null {
    return sessionStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  getUserData() {
    return this.userDataSubject.asObservable();
  }
  async login(token: string, masterParams: MasterParams) {
    try {
      if (this.helper.decodeToken(JSON.stringify(token)).iss && this.helper.decodeToken(JSON.stringify(token)).iss != null) {
        this.subsink.sink = await this.msService.getLoggerInfo(masterParams).subscribe((loginfo: any) => {
          if (loginfo && loginfo.data && loginfo.status.toUpperCase() === "SUCCESS") {
            this.toaster.success("You have successfully logged in.", "Success");
            sessionStorage.setItem("logo", loginfo.data.logoFileName);
            sessionStorage.setItem("fileName", loginfo.data.fileName);
            sessionStorage.setItem(this.AUTH_TOKEN_KEY, token);
            this.userData = this.trimData(loginfo.data) as UserData;
            this.userDataService.updateUserData(this.userData);
            this.getDataFromService(loginfo.data.resetStatus);
          } else {
            this.toaster.error(loginfo.message, "Error");
            this.router.navigate(['/']);
          }
        });
      }
      else {
        this.router.navigate(['/']);
      }
    }
    catch (ex: any) {
      this.toaster.error(ex.message, "Exception");
    }
  }
  async getDataFromService(reset:number) {
    this.masterParams.company = this.userData.company
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    try {
      // this.loader.start();
      this.subsink.sink = await this.msService.getsideMenu(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          this.userDataSubject.next(JSON.stringify(res['data']));
          sessionStorage.setItem('menuData', JSON.stringify(res['data']));
          if (reset === 1) {
            setTimeout(() => {
              this.router.navigate(['/utilities/change-password']);
            }, 1500);
          }
          else {
            this.router.navigate(['/home']);
            const body = {
              company: this.userDataService.userData.company,
              location: this.userDataService.userData.location,
              user: this.userDataService.userData.userID,
              refNo: this.userDataService.userData.sessionID,
            };
            this.subsink.sink = this.msService.GetMyCashTransfers(body).subscribe((res: any) => {
              if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
                const dialogRef: MatDialogRef<CashTransfersComponent> = this.dialog.open(CashTransfersComponent, {
                  width: '70%',
                  // height:'65%',// Set the width of the dialog
                  disableClose: true,
                  data: res.data
                });
              }
            });

          }
        }
        else {
          this.toaster.error("You are not given access to this location contact your administrator", "Info");
          this.router.navigate(['/']);
        }
      },
        (error: any) => {
          this.loader.stop();
          this.toaster.error(error.message, "Error");
        }
      );
    }
    catch (ex: any) {
      this.loader.stop();
      this.toaster.error(ex.message, "Exception");
    }

  }

  forgotLog() {
    // sessionStorage.removeItem("userData");
    // sessionStorage.removeItem("token");
    // sessionStorage.removeItem("fileName");
    // sessionStorage.removeItem("logo");
    // sessionStorage.removeItem('menuData')
    localStorage.clear();
    localStorage.removeItem('theme');
    sessionStorage.clear();
    this.dialog.closeAll();
    this.loader.stopAll();
    this.idleService.stopWatching();
    this.themeService.isDarkThemeSubject.next(false);
    this.logoService.setLogoPath('');
    this.userDataService.updateUserData(null);
    this.userDataSubject.next(null);
    this.store.dispatch(logout());
  }

  logOut() {
    this.router.navigate(['/']);
    // sessionStorage.removeItem("userData");
    // sessionStorage.removeItem("token");
    // sessionStorage.removeItem("fileName");
    // sessionStorage.removeItem("logo");
    // sessionStorage.removeItem('menuData')
    localStorage.clear();
    localStorage.removeItem('theme');
    sessionStorage.clear();
    this.dialog.closeAll();
    this.loader.stopAll();
    this.idleService.stopWatching();
    this.themeService.isDarkThemeSubject.next(false);
    this.logoService.setLogoPath('');
    this.userDataService.updateUserData(null);
    this.userDataSubject.next(null);
    this.store.dispatch(logout());
  }

}

