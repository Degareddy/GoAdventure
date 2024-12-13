import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminService } from 'src/app/Services/admin.service';
import { SubSink } from 'subsink';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserDataService } from 'src/app/Services/user-data.service';
import { helpApiResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
@Component({
  selector: 'app-app-help',
  templateUrl: './app-help.component.html',
  styleUrls: ['./app-help.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('1000ms', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class AppHelpComponent implements OnInit, OnDestroy {
  private subsink = new SubSink();
  textMessageClass: string = "";
  retMessage: string = "";
  text: string = ""; // Ensure text property is initialized as an empty string
  isEditing = false;
  prevTopic!: number;
  nextTopic!: number;
  slNo!: number;

  constructor(private adminService: AdminService,
    @Inject(MAT_DIALOG_DATA) public helpdata: {
    ScrId: string,
    Page: string,
    SlNo: number,
    IsPrevious: boolean,
    IsNext: boolean,
    User: string,
    RefNo: string;
  }, private userDataService: UserDataService) { }

  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    try {
      this.subsink.sink = this.adminService.getHelpOnline(this.helpdata).subscribe((res: helpApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.text = res.data.helpText;
          this.prevTopic = res.data.preNo;
          this.nextTopic = res.data.nextNo;
          this.helpdata.Page = res.data.page;
          this.slNo = res.data.slNo;
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }

  private createRequestData() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    };
  }

  previousTopic() {
    this.text = "";
    this.helpdata.Page = "";
    this.helpdata.ScrId = "";
    this.helpdata.SlNo = this.slNo;
    this.helpdata.IsPrevious = true;
    this.helpdata.IsNext = false;
    this.isEditing = false;
    if (this.helpdata.SlNo >= 0) {
      this.loadData();
    }
  }

  nextTopics() {
    this.text = "";
    this.helpdata.Page = "";
    this.helpdata.ScrId = "";
    this.helpdata.SlNo = this.slNo;
    this.helpdata.IsPrevious = false;
    this.helpdata.IsNext = true;
    this.isEditing = false;
    if (this.helpdata.SlNo >= 0) {
      this.loadData();
    }
  }

  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  toggleEdit() {
    this.clearMsg();
    if (sessionStorage.getItem("admin")) {
      this.isEditing = !this.isEditing;
    }
    else {
      this.retMessage = "Access restricted: Editing privileges are limited to administrators.";
      this.textMessageClass = "red";
    }
  }

  updateHelpText() {
    const body = {
      ...this.createRequestData(),
      Page: this.helpdata.Page,
      HelpText: this.text
    }
    try {
      this.subsink.sink = this.adminService.updateHelpText(body).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.isEditing = false;
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }
}
