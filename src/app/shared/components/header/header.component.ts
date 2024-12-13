import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef, Input, OnDestroy, HostListener, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/Services/authentication/auth.service';
import { LogoService } from 'src/app/Services/logo.service';
import { MastersService } from 'src/app/Services/masters.service';
import { ThemeService } from 'src/app/Services/theme.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { selectCompany, selectLocation } from 'src/app/utils/location.selectors';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSideBarForMe: EventEmitter<any> = new EventEmitter();
  badgeCount!: number;
  grvCount!: number;
  filePath: string = "";
  userName: string = "";
  company: string = "";
  location: string = "";
  unitStatus: any = [];
  logoPath: string = "";
  private subsink!: SubSink;
  @Input() imageUrl: string | undefined;
  userData$ = this.userService.userData$;
  isDarkTheme = false;
  private subscription: Subscription = new Subscription();
  imageBlob: string = 'assets/img/user.jpg';
  isMenuOpen = false;
  tenantlnld: boolean = true
  isDarkTheme$: Observable<boolean>;
  logoImageBlob: string = "";
  userProfile:string="";
  constructor(private router: Router, private fileUploadService: MastersService, private logoService: LogoService,
    private themeService: ThemeService, private store: Store,
    private authService: AuthService, private userService: UserDataService, private sanitizer: DomSanitizer) {
    this.badgeCount = 0;
    this.subsink = new SubSink();
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  changeLocation() {
    this.router.navigate(['admin/change-location']);
  }
  navigateToHome() {
    this.router.navigate(['/home']);
  }
  toggleTheme() {
    this.themeService.toggleTheme();

  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      document.addEventListener('click', this.onClickOutside.bind(this));
    } else {
      document.removeEventListener('click', this.onClickOutside.bind(this));
    }
  }
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-button') && !target.closest('.user-menu')) {
      this.isMenuOpen = false;
    }
  }

  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu') && !target.closest('.profile-button')) {
      this.isMenuOpen = false;
      document.removeEventListener('click', this.onClickOutside.bind(this));
    }
  }
  closeMenu() {
    this.isMenuOpen = false;
  }

  ngOnInit(): void {
    this.userName = this.userService.userData.userName;
    this.company = this.userService.userData.defaultCompanyName;
    this.location = this.userService.userData.defaultLocnName;
    this.subscription.add(
      this.store.select(selectLocation).subscribe(location => {
        if (location != "") {
          if (location !== this.location) {
            this.location = location;
            this.loadData();
          }
        }
      })
    );
    this.subscription.add(
      this.store.select(selectCompany).subscribe(company => {
        if (company != "") {
          if (company !== this.company) {
            this.company = company;
            this.loadData();
          }
        }
      })
    );
    this.loadData();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
      this.toggleTheme();
    }
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }

  commonParams() {
    return {
      company: this.userService.userData.company,
      location: this.userService.userData.location,
      user: this.userService.userData.userID,
      refNo: this.userService.userData.sessionID,
      langId: this.userService.userData.langId,
    }
  }
  loadData() {

     this.userProfile = this.userService.userData.userProfile.toUpperCase();
    if (this.userProfile === 'TENANT' || this.userProfile === 'LANDLORD'|| this.userProfile === 'CMPUSER') {
      this.tenantlnld = false;
    }
    const userImageFileName = sessionStorage.getItem('fileName') as string;
    const logoFileName = sessionStorage.getItem('logo') as string;
    if (userImageFileName) {
      this.downloadSelectedFile(userImageFileName, 'user');
    }

    if (logoFileName) {
      this.downloadSelectedFile(logoFileName, 'logo');
    }
  }

  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob); // Convert the blob to base64
    });
  }


  async downloadSelectedFile(fileName: string, type: 'user' | 'logo') {
    try {
      this.subsink.sink = await this.fileUploadService.downloadFile(fileName).subscribe({
        next: (res: Blob) => {
          this.convertBlobToBase64(res)
            .then((base64: string) => {
              if (this.isImageFile(fileName)) {
                if (type === 'user') {
                  this.imageBlob = base64;
                } else if (type === 'logo') {
                  this.logoImageBlob = base64;
                  // sessionStorage.setItem('logoImageBlob', base64);
                  this.logoService.setLogoPath(base64);

                }
              } else {
                if (type === 'user') {
                  this.imageBlob = "assets/img/user.jpg";
                } else if (type === 'logo') {
                  this.logoImageBlob = "";
                  sessionStorage.setItem('logoImageBlob', "");
                }
              }
            })
            .catch(() => {
              if (type === 'user') {
                this.imageBlob = "assets/img/user.jpg";
              } else if (type === 'logo') {
                this.logoImageBlob = "";
                sessionStorage.setItem('logoImageBlob', "");
              }
            });
        },
        error: (error) => {
          if (type === 'user') {
            this.imageBlob = "assets/img/user.jpg";
          } else if (type === 'logo') {
            this.logoImageBlob = "";
            sessionStorage.setItem('logoImageBlob', "");
          }
        }
      });
    } catch (ex: any) {
      if (type === 'user') {
        this.imageBlob = "assets/img/user.jpg";
      } else if (type === 'logo') {
        this.logoImageBlob = "";
        sessionStorage.setItem('logoImageBlob', "");
      }
    }
  }

  private isImageFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpeg');
  }
  clearCount() {
    this.badgeCount = 0;
  }
  signOut() {
    this.authService.logOut();
  }
  toggleSideBar() {
    this.toggleSideBarForMe.emit();
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  getBlobUrl(filePath: string): any {
    return this.sanitizer.bypassSecurityTrustUrl(filePath);
  }
  getBlobUrldownload(blob: Blob): string {
    return URL.createObjectURL(blob);
  }
}
