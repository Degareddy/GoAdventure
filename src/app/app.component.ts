import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdleService } from './Services/idle.service';
import { Subscription } from 'rxjs';
import { AuthService } from './Services/authentication/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from './Services/theme.service';
import { LogoService } from './Services/logo.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class AppComponent implements OnInit, OnDestroy {
  isLoading = true;

  public logoPath: string = "";

  private idleSubscription?: Subscription;
  constructor(private dialog: MatDialog, private idleService: IdleService,
    private themeService: ThemeService, private logoService: LogoService,
    private authService: AuthService, private toaster: ToastrService) {

  }
  ngOnDestroy() {
    if (this.idleSubscription) {
      this.idleSubscription.unsubscribe();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    const dialogRef = this.dialog.openDialogs.length > 0 ? this.dialog.openDialogs[this.dialog.openDialogs.length - 1] : null;
    if (dialogRef && event.key === 'Escape') {
      dialogRef.close(true);
    }
  }
  sideBarOpen: boolean = true;

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false; // Hide loader after 3 seconds
    }, 3500);
    this.idleService.idleState.subscribe((isIdle: boolean) => {
      if (isIdle) {
        this.toaster.error('User session Inactive, Login again', 'INFO');
        this.authService.logOut();
      }
      else {
      }
    });
    this.themeService.isDarkThemeSubject.next(false);
    this.idleSubscription = this.logoService.logoPath$.subscribe(
      (path:string) =>{
        this.logoPath = path
      }
    );

  }

  onUserAction() {
    this.idleService.resetTimer();
  }

}
