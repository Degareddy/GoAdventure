import { Injectable, OnDestroy } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { API_SMS_URL } from 'src/environments/environment.prod';
import { MatDialog } from '@angular/material/dialog';
import { MastersService } from '../masters.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserDataService } from '../user-data.service';
import { SubSink } from 'subsink';
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  helper: JwtHelperService;
  private subSubsink: SubSink = new SubSink();
  constructor(private router: Router, private toaster: ToastrService, private userDataService: UserDataService, private masterService: MastersService,
    private _loader: NgxUiLoaderService, private dialog: MatDialog) {
    this.helper = new JwtHelperService();
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('https://degatech.in/dme/api/MasterItems/Login/') && req.url !== API_SMS_URL &&
      !req.url.includes('https://api.ipify.org/?format=json')) {
      const token = sessionStorage.getItem('token'); // Retrieve the token from sessionStorage
      if (token) {
        const decodedToken = this.helper.decodeToken(token);
        const expirationDate = new Date(decodedToken.exp * 1000); // Convert expiration time to milliseconds
        const currentDate = new Date();
        if (expirationDate < currentDate) {
          sessionStorage.removeItem('token');
          const body = {
            User: this.userDataService.userData.userID,
            RefNo: this.userDataService.userData.sessionID,
            RefTranNo: sessionStorage.getItem('refreshToken')
          }
          return new Observable<HttpEvent<any>>((observer) => {
            this.subSubsink.sink = this.masterService.RegenToken(body).subscribe((res: any) => {
              const newToken = res.token;
              sessionStorage.setItem('token', newToken);
              sessionStorage.setItem('refreshToken', res.refreshToken);
              if (newToken !== null) {
                const updatedReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                });
                this._loader.stop();
                next.handle(updatedReq).subscribe(
                  (event) => observer.next(event),
                  (error) => observer.error(error),
                  () => observer.complete()
                );
              }
              // else {
              //   this._loader.stop();
              //   this.toaster.error('Refresh token generation failed login again!', 'Error');
              //   this.refreshPageLogin();
              // }
            }
            );
          });
        } else {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
              'X-Frame-Options': 'DENY', // Mitigate clickjacking
              'Content-Security-Policy': "default-src 'self'", // Content security policy
              'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // Enforce HTTPS
            }
          });
        }
      }
    }
    return next.handle(req).pipe(tap((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        this._loader.stop();
      }
    }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 412) {
          this._loader.stop();
          this.toaster.error(error.error.message, error.error.status);
        }
        else if (error.status === 401) {
          this.toaster.error('Unauthorized', 'Error');
          this.refreshPageLogin();
        } else if (error.status === 403) {
          this._loader.stop();
          this.toaster.error(error.error.message, error.error.status);
        }
        else if (error.status === 400) {
          this._loader.stop();
          this.toaster.warning('Bad Request', error.error.status);
        }
        else if (error.status === 404) {
          this._loader.stop();
          this.toaster.warning('Not Found', error.statusText);
        }
        else if (error.status === 405) {
          this._loader.stop();
          this.toaster.warning('Method Not Allowed', error.error.status);
        }
        else if (error.status === 422) {
          this._loader.stop();
          this.toaster.error(error.message, error.error.status);
        }
        else if (error.status === 500) {
          this._loader.stop();
          this.toaster.warning('Internal Server Error', error.error.status);
          // this.refreshPageLogin();
        }
        else if (error.status === 502) {
          this.toaster.warning('Please contact administrator, stating error code' + error.status, error.error.status);
          this.refreshPageLogin();
        }
        else {
          this.toaster.error(error.message, 'Error');
          this._loader.stop();
          // this.refreshPageLogin();
        }
        // this.refreshPageLogin();
        this._loader.stop();
        return throwError(error);
      })
    );
  }
  refreshPageLogin() {
    this.router.navigate(['/']);
    this._loader.stop();
    this.dialog.closeAll();
    sessionStorage.clear();
  }
}
