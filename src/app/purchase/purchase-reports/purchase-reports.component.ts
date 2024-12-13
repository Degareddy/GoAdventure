import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MastersService } from 'src/app/Services/masters.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { SubSink } from 'subsink';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { UserData } from 'src/app/admin/admin.module';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { forkJoin } from 'rxjs';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
@Component({
  selector: 'app-purchase-reports',
  templateUrl: './purchase-reports.component.html',
  styleUrls: ['./purchase-reports.component.css']
})
export class PurchaseReportsComponent implements OnInit {
  companyList!: any[];
  purRptFrom!: FormGroup;
  branchList!: any[];
  textMessageClass!: string;
  retMessage!: string;
  masterParams!:MasterParams;
  userData!:any;
  private subSink!: SubSink;
  dialogOpen = false;

  constructor(protected route: ActivatedRoute,
    private datepipe: DatePipe,
    public dialog: MatDialog,
    protected router: Router,
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private loader: NgxUiLoaderService,
    protected utlService: UtilitiesService ) {
    this.purRptFrom = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();

  }

  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
      const companybody = {
        Company: this.userData.company,
        Location: this.userData.location,
        Item: "COMPANY",
        refNo: this.userData.sessionID,
        user: this.userData.userID
      };
      const branchbody = {
        Company: this.userData.company,
        Location: this.userData.location,
        Item: "LOCATION",
        refNo: this.userData.sessionID,
        user: this.userData.userID
      };
      const service1 = this.purchaseService.GetMasterItemsList(companybody);
      const service2 = this.purchaseService.GetMasterItemsList(branchbody);
      this.subSink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];

          //console.log(res1);
          //console.log(res2);

          this.companyList = res1.data;
          this.branchList = res2.data;
        },
        (error: any) => {
          this.loader.stop();
          //this.toastr.info(error, "Exception");
        }
      );

    }
  }
  formInit() {
    return this.fb.group({
      company:[''],
      branch:[''],
      supplier:[''],
      fromDate:[''],
      toDate:[''],
      periodType:[''],
      reportType:[''],
      product:['']
    })
  }

  onSupplierSearch() {
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: "SUPPLIER",
      Item: this.purRptFrom.controls['supplier'].value,
      User: this.userData.userID,
      refNo: this.userData.sessionID,
      ItemFirstLevel:"",
      ItemSecondLevel:""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        //console.log(res.data);
        if (res.status != "fail") {
          if (res.data.nameCount === 1) {
            this.purRptFrom.controls['supplier'].patchValue(res.data.selName);
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.purRptFrom.controls['supplier'].value, 'PartyType': "SUPPLIER",
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                //console.log(`Dialog result: ${result}`);
                this.purRptFrom.controls['supplier'].setValue(result.partyName);

                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  onProductSearch(){
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: 'PRODUCT',
      Item: this.purRptFrom.controls['product'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: "",
      User: this.userData.userID,
      refNo: this.userData.sessionID
    }
    //console.log(body);
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        //console.log(res);
        if (res.status != "fail") {
          if (res.data.nameCount === 1) {
            this.purRptFrom.controls['product'].patchValue(res.data.selName);
            //this.code = res.data.itemCode;

          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'project': this.purRptFrom.controls['product'].value, 'type': 'PRODUCT',
                  'search': 'Product Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                //console.log(`Dialog result: ${result}`);
                this.purRptFrom.controls['product'].setValue(result.prodName);
                this.dialogOpen = false;
              });
            }

          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  reset() {
  this.purRptFrom.reset();
  }
}
