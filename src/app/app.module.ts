import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, ErrorHandler } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { HomeComponent } from './general/home/home.component';
import { ToastrModule } from 'ngx-toastr';
import { DefaultModule } from './layouts/default/default.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AuthInterceptor } from './Services/authentication/auth.interceptor';
import { AppHelpComponent } from './layouts/app-help/app-help.component';
import { GeneralModule } from './general/general.module';
import { GlobalErrorHandlerService } from './Services/global-error-handler.service';
import { IdleService } from './Services/idle.service';
import { MatCarouselModule } from 'ng-mat-carousel';
import { NgxUiLoaderConfig, PB_DIRECTION, POSITION } from 'ngx-ui-loader';
import { SalesModule } from './sales/sales.module';
import { locationReducer, PLReportReducer, reportReducer, saleReportReducer, TransactionReportReducer } from './utils/location.reducer';
import { StoreModule } from '@ngrx/store';
import { metaReducers } from './utils/clear-state.metareducer';
import { LoaderComponent } from './general/loader/loader.component';
import { LogoService } from './Services/logo.service';
import { ForgotPasswordComponent } from './utilities/forgot-password/forgot-password.component';
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt';


export function jwtOptionsFactory() {
  return {
    tokenGetter: () => sessionStorage.getItem('authToken'), // Retrieve the token from sessionStorage
    // allowedDomains: [''], // Replace with your API's domain
    // disallowedRoutes: ['your-api-domain.com/login'], // Replace with routes where you don't want the token added
  };
}
const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  bgsColor: '#5dcfed',
  bgsOpacity: 0.8,
  bgsPosition: POSITION.bottomCenter,
  bgsSize: 60,
  bgsType: 'three-strings',
  fgsType: 'three-strings',
  pbColor: '#5dcfed',
  pbDirection: PB_DIRECTION.leftToRight,
  pbThickness: 8,
  textColor: 'white',
  fgsColor: '#5dcfed',
  // logoUrl: 'assets/img/TKGlogo.jpg',
  logoSize: 50,
  logoPosition: 'center-center',
  text: 'Request loading...',
  minTime: 300,
  gap: 6,
  fgsSize: 50,
  overlayBorderRadius: "100",
  overlayColor: "rgba(40, 40, 40, 0.8)",
  hasProgressBar: true,
  blur: 15
};
@NgModule({
  declarations: [AppComponent, HomeComponent,
    AppHelpComponent,LoaderComponent,ForgotPasswordComponent],
  imports: [
    DefaultModule,
    BrowserModule,
    AppRoutingModule,
    GeneralModule,
    SalesModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgMultiSelectDropDownModule.forRoot(),
    ToastrModule.forRoot({
      preventDuplicates: true,
      closeButton: true,
      disableTimeOut: false,
      timeOut: 1000,
      tapToDismiss: true
    }),
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
      },
    }),
    MatCarouselModule.forRoot(),
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    StoreModule.forRoot({ location: locationReducer, report: reportReducer,
       saleReport: saleReportReducer, PLReport: PLReportReducer,
        TransactionReport: TransactionReportReducer }, { metaReducers }),
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  providers: [DatePipe, IdleService,LogoService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService }
  ]
})
export class AppModule { }

