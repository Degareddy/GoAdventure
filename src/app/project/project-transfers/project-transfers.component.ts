import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AdminService } from 'src/app/Services/admin.service';
import { TransferDetails } from '../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Router } from '@angular/router';
@Component({
  selector: 'app-project-transfers',
  templateUrl: './project-transfers.component.html',
  styleUrls: ['./project-transfers.component.css']
})
export class ProjectTransfersComponent implements OnInit, OnDestroy {
  transferForm!: FormGroup;
  modes: Item[] = [];
  retMessage: string = "";
  textMessageClass: string = "";
  propertyList: Item[] = [];
  blockList: Item[] = [];
  companyList: Item[] = [];
  private subSink: SubSink = new SubSink();
  masterParams!: MasterParams;
  blockCode: string = "";
  today = new Date();
  ptCls: TransferDetails = new TransferDetails();
  columnDefs: any = [];
  rowData: any = [];
  constructor(private fb: FormBuilder, private masterService: MastersService, private adminService: AdminService, protected router: Router,
    private projectService: ProjectsService, private userDataService: UserDataService, private loader: NgxUiLoaderService,) {
    this.transferForm = this.formInit();
    this.masterParams = new MasterParams();
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    }
  }

  async getCompnayList() {
    const companybody: getPayload = {
      ...this.commonParams(),
      item: 'COMPANY'
    };
    try {
      const company$ = this.adminService.GetMasterItemsList(companybody);
      this.subSink.sink = await forkJoin([company$]).subscribe(
        ([companyRes]: any) => {
          this.companyList = companyRes['data'];
          if (this.companyList.length === 1) {
            this.transferForm.get('transferTo')!.patchValue(this.companyList[0].itemCode);
          }
        },
        error => {
          this.displayMessage("Error: " + error.message, "red");
        }
      );
    } catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  async GetPropertyTransferDetails() {
    const body = {
      ...this.commonParams(),
      Item: this.transferForm.controls.property.value,
      ItemFirstLevel: this.transferForm.controls.block.value
    }

    try {
      this.subSink.sink = this.projectService.GetPropertyTransferDetails(body).subscribe((result: getResponse) => {
        if (result.message.toUpperCase() === 'SUCCESS') {

        } else {
          this.displayMessage("Error: " + result.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  onSelectedBlockChanged(){
    this.GetPropertyTransferDetails();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      property: ['', Validators.required],
      block: ['', Validators.required],
      date: [new Date(), Validators.required],
      transferTo: ['', Validators.required]
    })
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  clear() {
    this.displayMessage("", "");
    this.transferForm = this.formInit();
  }
  Close() {
    this.router.navigateByUrl('/home');
  }


  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.getCompnayList();
  }
  async loadData() {
    const modebody = this.buildRequestParams('SM804');
    const propertybody = this.buildRequestParams('PROPERTY');
    const modes$ = this.masterService.getModesList(modebody);
    const property$ = this.masterService.GetMasterItemsList(propertybody);
    this.subSink.sink = await forkJoin([modes$, property$]).subscribe(
      ([modesRes, propRes]: any) => {
        this.handleDataLoadSuccess(modesRes, propRes);
      },
      error => {
        this.displayMessage("Error: " + error.message, "red");
      }
    );
  }


  private handleDataLoadSuccess(modesRes: getResponse, propRes: getResponse): void {
    if (modesRes.status.toUpperCase() === "SUCCESS") {
      this.modes = modesRes['data'];
      if (this.modes.length === 1) {
        this.transferForm.get('mode')!.patchValue(this.modes[0].itemCode);
      }
    }
    else {
      this.displayMessage("Modes list empty!", "red");
      return;
    }
    if (propRes.status.toUpperCase() === "SUCCESS") {
      this.propertyList = propRes['data'];
      if (this.propertyList.length === 1) {
        this.transferForm.get('property')!.patchValue(this.propertyList[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    }
    else {
      this.displayMessage("Properties list empty!", "red");
      return;
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  private buildRequestParams(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      refNo: this.userDataService.userData.sessionID
    };
  }
  async onSelectedPropertyChanged() {
    this.displayMessage("", "");
    if (this.transferForm.get('mode')?.value != "Add") {
      const propertyValue = this.transferForm.controls['property'].value;
      this.masterParams.type = 'BLOCK';
      this.masterParams.item = propertyValue;
      this.blockCode = propertyValue;
      try {
        this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe(
          (result: getResponse) => {
            this.handlePropertyChangedResponse(result);
          },
          (error: any) => {
            this.displayMessage("Error: " + error.message, "red");
          }
        );
      } catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }
    }
  }

  private handlePropertyChangedResponse(result: getResponse) {
    if (result.message.toUpperCase() === 'SUCCESS') {
      this.blockList = result.data;
      if (this.blockList.length === 1) {
        this.transferForm.get('block')!.patchValue(this.blockList[0].itemCode);
        this.onSelectedBlockChanged();
      }
    } else {
      this.displayMessage("Error: " + `${result.message} for this property`, "red");
    }
  }

  prepareCls() {
    this.ptCls.company = this.userDataService.userData.company;
    this.ptCls.location = this.userDataService.userData.location;
    this.ptCls.user = this.userDataService.userData.userID;
    this.ptCls.refNo = this.userDataService.userData.sessionID;
    this.ptCls.mode = this.transferForm.get('mode')?.value;
    this.ptCls.propCode = this.transferForm.get('property')?.value;
    this.ptCls.blockCode = this.transferForm.get('block')?.value;
    this.ptCls.transferTo = this.transferForm.get('transferTo')?.value;
    this.ptCls.tranDate = this.transferForm.get('date')?.value;
  }
  async onSubmit() {
    if (this.transferForm.invalid) {
      this.displayMessage("Enter all required fields", "red");
      return;
    }
    else {
      try {
        this.prepareCls();
        this.loader.start();
        this.subSink.sink = await this.projectService.UpdatePropertyTransfer(this.ptCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage("Success: " + res.message, "green");
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }
    }

  }
}
