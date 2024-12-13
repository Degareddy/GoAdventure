import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
@Component({
  selector: 'app-asset-amc-details',
  templateUrl: './asset-amc-details.component.html',
  styleUrls: ['./asset-amc-details.component.css']
})
export class AssetAMCDetailsComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  retMessage: string = "";
  textMessageClass: string = "";
  AMCDetailsForm!: FormGroup;
  slNum: number = 0;
  dataFlag: boolean = false;
  private subSink: SubSink = new SubSink();
  constructor(protected assetservice: AssetsService, private fb: FormBuilder,
    private loader: NgxUiLoaderService, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.AMCDetailsForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      assetID: ['', [Validators.required, Validators.maxLength(20)]],
      traceNo: ['', [Validators.required, Validators.maxLength(30)]],
      assetDesc: [''],
      remarks: [''],
    });

  }

  ngOnInit(): void {
    // //console.log(this.data);
    // const storedUserData = sessionStorage.getItem('userData');
    // if (storedUserData) {
    //   this.userData = JSON.parse(storedUserData) as UserData;
    //   // //console.log(this.userData);
    // }
    this.get(this.data);
  }
  get(tranNo: string) {

    this.masterParams.tranNo = tranNo;
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    //console.log(this.masterParams);
    try {
      this.loader.start();
      this.subSink.sink = this.assetservice.getAMCDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        // //console.log(res);
        // this.dataSource = res['data'];
        // this.dataSource = new MatTableDataSource(res['data']);
        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.matsort;
      });
    }
    catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onSubmit() {
    const sessionData = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: this.masterParams.tranNo,
      slNo: this.slNum,
      mode: "Modify"
    };
    const requestData = {
      ...sessionData,
      ...this.AMCDetailsForm.value
    };


    this.loader.start();
    try {
      this.subSink.sink = this.assetservice.UpdateAMCDetails(requestData).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.get(res.TranNo);
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }

      });
    } catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }
  onRowClick(row: any, i: number) {
    this.slNum = row.slNo;
    this.AMCDetailsForm.patchValue(row);
  }
}
