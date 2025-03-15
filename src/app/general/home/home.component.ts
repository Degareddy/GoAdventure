import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface WidgetPosition {
  top: string;
  left: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('fadeInScale', [
      state('in', style({ transform: 'scale(1)', opacity: 1 })),
      transition(':enter', [
        style({ transform: 'scale(0.5)', opacity: 0 }),
        animate('500ms ease-out')
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ transform: 'scale(0.5)', opacity: 0 }))
      ])
    ])
  ]

})
export class HomeComponent implements OnInit, OnDestroy {
  images: string[] = [];
  private subsink!: SubSink;
  // widgetPositions = [];
  widgetPositions: WidgetPosition[] = [];
  private intervalId: any;
  dashboardData: any[] = [];
  widgetColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#FFC300', '#8A2BE2', '#FF69B4'];
  constructor(private projectService: ProjectsService, private userService: UserDataService) {
    this.subsink = new SubSink();
  }
  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    this.subsink.unsubscribe();
    // throw new Error('Method not implemented.');
  }
  getIconColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'text-green-500'; // Green color for active status
      case 'Inactive':
        return 'text-red-500'; // Red color for inactive status
      case 'Pending':
        return 'text-yellow-500'; // Yellow color for pending status
      default:
        return 'text-gray-500'; // Default gray color
    }
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
  getIconForStatus(status: string): string {
    switch (status) {
      case 'Allocated':
        return 'assignment_turned_in'; // Example icon
      case 'Grievances':
        return 'report_problem';
      case 'Open':
        return 'folder_open';
      case 'Owners':
        return 'person';
      case 'Tenants':
        return 'people';
      default:
        return 'help_outline';
    }
  }

  ngOnInit(): void {
    // console.log(this.userService.userData.company);
    if (this.userService.userData.company != 'SADASA') {
      this.images=['assets/img/img04.jpg', 'assets/img/tk001.jpg', 'assets/img/tk002.jpg',
    'assets/img/img02.jpg', 'assets/img/img03.jpg', 'assets/img/img05.jpg']
    }
    else{
      this.images=['assets/img/Sadasa_araan.png', 'assets/img/Sadasa_Fiftytower.png', 'assets/img/Sadasa_Qamar.png','assets/img/grback.jpg']
    }
    this.loadData();
    // this.initializeWidgetPositions();
    // this.startRandomMovement();
  }

  async loadData() {
    this.dashboardData = [];
    const unitbody = {
      ...this.commonParams(),
      item: "All",
      reportType: 'UNITSTATUS'
    }
    // this.subsink.sink = await this.projectService.GetDashUnitStatus(unitbody).subscribe((res: any) => {
    //   if (res.status.toUpperCase() === "SUCCESS") {
    //     this.dashboardData = res.data;
    //   }
    // });
  }
  initializeWidgetPositions() {
    this.widgetPositions = this.dashboardData.map(() => ({
      top: Math.random() * 80 + 'vh', // Random top position
      left: Math.random() * 80 + 'vw', // Random left position
    }));
  }

  startRandomMovement() {
    this.intervalId = setInterval(() => {
      this.widgetPositions = this.widgetPositions.map(() => ({
        top: Math.random() * 80 + 'vh', // Random top position
        left: Math.random() * 80 + 'vw', // Random left position
      }));
    }, 2000); // Change position every 2 seconds
  }
}
