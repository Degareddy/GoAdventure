import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/Services/authentication/auth.service';
import { environment } from "src/environments/environment.prod";
import { IdleService } from 'src/app/Services/idle.service';
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
export interface loginResponse {
  token: string;
  status: string;
  msg: string;
  refreshToken: string
}
@Component({
  selector: 'app-login-component',
  templateUrl: './login-component.component.html',
  styleUrls: ['./login-component.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public subs = new SubSink();
  email: string = '';
  ipAddress!: string;
  public showPassword: boolean = false;
  password: string = '';
  public isEmailError: boolean = false;
  public emailError: string = '';
  public isPasswordError: boolean = false;
  public passWordError: string = '';
  errors: any[] = [];
  validationErrors: any[] = [];
  public errMsg: string;
  public loginForm: FormGroup;
  public submitted: boolean;
  masterParams!: MasterParams;
  hide: boolean = true;
  helper: any;
  userData !: UserData;
  myIP!: any;
  currentYear!: number;
  version: string = "";
  retMessage: string = "";
  textMessageClass: string = "";
  private readonly AUTH_TOKEN_KEY = 'authToken';
  classtype: string = "";
  colors: string[] = [
    'bg-blue-100',
    'bg-purple-100',
    'bg-indigo-100',
    'bg-green-100',

  ];
  images: string[] = [
    'assets/img/img04.jpg',
    'assets/img/img05.jpg',
  ];
  mainHeaders: string[] = [
    // "Property Management",
    // "Construction",
    "Skins & Hides",
    "Inventory",
    "Asset",
    "Payroll",
    "General Ledger"
  ];

  subHeaders: string[] = [
    // "Simplify tenant and lease management for a seamless property experience.",
    // "Track and manage every detail of your construction projects with ease.",
    "The Collection of your skin assets and the management of your skin assets.",
    "Gain visibility and control over your inventory to avoid stock shortages.",
    "Keep track of your assets effortlessly, from acquisition to disposal.",
    "Process payroll efficiently and accurately, every single time.",
    "Access an intuitive general ledger to maintain clear, organized financial records."
  ];
  currentMainHeader: string = this.mainHeaders[0];
  currentSubHeader: string = this.subHeaders[0];
  messageIndex: number = 0;
  currentImage: string = this.images[0];
  currentColor: string = this.colors[0]; // Default color
  intervalId: any;
  imageIntervalId: any;
  myFunction() {
    this.hide = !this.hide;
  }
  constructor(private formBuilder: FormBuilder,private router: Router,
    private toaster: ToastrService, private _loader: NgxUiLoaderService, private idleService: IdleService,
    private msService: MastersService, private http: HttpClient, private authService: AuthService,
  ) {
    this.helper = new JwtHelperService();
    this.masterParams = new MasterParams();
    this.submitted = false;
    this.errMsg = '';
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }
  startMessageRotation() {
    setInterval(() => {
      this.messageIndex = (this.messageIndex + 1) % this.mainHeaders.length;
      this.currentMainHeader = this.mainHeaders[this.messageIndex];
      this.currentSubHeader = this.subHeaders[this.messageIndex];
    }, 6000);
  }
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  isFieldInvalid(field: string) {
    return (
      (!this.loginForm.get(field)?.valid && this.loginForm.get(field)?.touched) ||
      (this.loginForm.get(field)?.untouched && this.submitted)
    );
  }
  forgotPassword() {
    console.log("forgot password");
    this.router.navigateByUrl('utilities/forgot');
  }
  ngOnInit() {
    this.currentYear = new Date().getFullYear();
    this.version = environment.version;
    this.idleService.stopWatching();
    // this.startColorChange();
    // this.startImageChange();
    this.startMessageRotation();
    this.authService.logOut();
  }
  startColorChange() {
    this.intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.colors.length);
      this.currentColor = this.colors[randomIndex];
    }, 5000); // Change color every 5 seconds
  }

  stopColorChange() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
    // this.stopColorChange();
    // this.stopImageChange();
  }
  startImageChange() {
    this.imageIntervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.images.length);
      this.currentImage = this.images[randomIndex];
    }, 5000); // Change image every 5 seconds
  }

  stopImageChange() {
    if (this.imageIntervalId) {
      clearInterval(this.imageIntervalId);
    }
  }
  Cancel() {
    this.formInit();
    this.retMessage = "";
    this.classtype = "";
  }
  formInit() {
    this.formReset();
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  formReset() {
    if (this.loginForm != null) {
      this.loginForm.reset();
    }
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    this.signin();
  }

  getAuthToken(): string | null {
    return sessionStorage.getItem(this.AUTH_TOKEN_KEY);
  }
  signin() {
    try {
      this.displayMessage("", "");
      sessionStorage.clear();
      localStorage.clear();
      this.subs.sink = this.http.get("https://api.ipify.org/?format=json").subscribe((res: any) => {
        this.ipAddress = res.ip;
        if (this.ipAddress) {
          this.masterParams.item = this.ipAddress;
          this.masterParams.user = this.loginForm.value.email;
          this.masterParams.password = this.loginForm.value.password;
          this._loader.start();
          this.subs.sink = this.msService.login(this.masterParams).subscribe((res: loginResponse) => {
            this._loader.stop();
            if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
              if (res.msg === "Fail : Password does not match.") {
                this.displayMessage("Login failed: The password you entered is incorrect.", "red");
                this.toaster.error("The password you entered is incorrect.", "Login failed");
              } else {
                this.displayMessage("Login unsuccessful. Please contact your system administrator for assistance.", "red");
                this.toaster.error(res.msg, "Login failed");
              }
              return;
            }
            else if (res.token != "") {
              this.idleService.startWatching();
              sessionStorage.removeItem("token");
              localStorage.removeItem('theme');
              sessionStorage.setItem("token", res.token);
              sessionStorage.setItem("refreshToken", res.refreshToken);
              localStorage.setItem('theme', 'dark');
              this.authService.login(res.token, this.masterParams);

            }
          });
        }
        else {
          this._loader.stop();
          this.toaster.error("IP not generated contact admin!", "ERROR");
          this.displayMessage("IP not generated contact admin!", "red");
        }
      });
    } catch (ex: any) {
      this._loader.stop();
      this.toaster.error(ex.message, "Exception");
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.classtype = cssClass;
  }
  resetValidations() {
    this.isEmailError = false;
    this.isPasswordError = false;
    this.errors = [];
  }
}
