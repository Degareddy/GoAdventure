import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { debounceTime, forkJoin } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { getResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, TextClr, Type } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
@Component({
  selector: 'app-authorise-invoice',
  templateUrl: './authorise-invoice.component.html',
  styleUrls: ['./authorise-invoice.component.css']
})
export class AuthoriseInvoiceComponent implements OnInit, OnDestroy {
  authoriseInvoiceForm!: FormGroup;
  invoiceType: Item[] = [
    { itemCode: 'TENINV', itemName: 'Tenant Invoice' },

  ];
  buttonEnable: boolean = true;
  isAllSelected: boolean = false;
  checkBoxEnable: boolean = true;
  subTrantype: Item[] = [
    { itemCode: 'TNV', itemName: 'Tenenat Invoice' },
  ];
  count = 0;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  properytList: Item[] = [];
  blocksList: Item[] = [];
  retMessage: string = "";
  textMessageClass: string = "";
  subSink: SubSink = new SubSink();
  displayColumns = ["mapped", "slNo", "tranNo", "tranDate", "tenantName"];
  dataSource: any = [];
  masterParams: MasterParams;
  columnDefs: any = [
    { headerName: 'Property', field: 'propertyName', sortable: false, filter: true, resizable: true, flex: 1 },
    { headerName: 'Block', field: 'blockName', sortable: false, filter: true, resizable: true, flex: 1 },
  ];
  constructor(public dialog: MatDialog, private fb: FormBuilder, private masterService: MastersService, private loader: NgxUiLoaderService, private projService: ProjectsService, private userDataService: UserDataService) {
    this.authoriseInvoiceForm = this.forminit();
    this.masterParams = new MasterParams();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  toggleAllRows(isSelected: boolean) {
    this.isAllSelected = isSelected;
    this.buttonEnable = !isSelected;
    if (isSelected) {
      this.count = this.dataSource.filteredData.length;
    }
    else {
      this.count = 0;
    }
    if (this.dataSource.data && Array.isArray(this.dataSource.data)) {
      this.dataSource.data.forEach((row: any) => (row.mapped = isSelected));
    }
  }



  updateMapStatus(row: any, isSelected: boolean) {

    row.mapped = isSelected;
    if (this.isAllSelected && this.count > 0) {
      this.buttonEnable = false;
    }
    else {
      this.buttonEnable = !isSelected;
    }
    if (isSelected) {
      this.count++;
    }
    else {
      this.count--;
    }
  }
  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();

  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  async loadData() {
    const property$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.PROPERTY });
    this.subSink.sink = await forkJoin([property$]).subscribe(
      ([propertyRes]: any) => {
        this.handleloadRes(propertyRes)
      },
      error => {
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );
  }

  handleloadRes(propertyRes: getResponse) {

    if (propertyRes.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.properytList = propertyRes['data'];
      if (this.properytList.length === 1) {
        this.authoriseInvoiceForm.get('property')!.patchValue(this.properytList[0].itemCode);
        this.propertyChnaged();
      }
    } else {
      this.retMessage = "Property list empty!";
      this.textMessageClass = "red";

    }
  }
  clearMsgs() {
    this.displayMessage("", "");
  }
  async propertyChnaged() {
    this.blocksList = [];
    this.clearMsgs();
    this.masterParams.type = Type.BLOCK;
    this.masterParams.item = this.authoriseInvoiceForm.controls['property'].value;
    try {
      if (this.masterParams.item != 'All' && this.authoriseInvoiceForm.controls['property'].value != '') {
        this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams)
          .pipe(
            debounceTime(300)
          )
          .subscribe((result: getResponse) => {
            if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
              this.blocksList = result['data'];
              if (this.blocksList.length === 1) {
                this.authoriseInvoiceForm.get('block')!.patchValue(this.blocksList[0].itemCode);
              }
            }
            else {
              this.displayMessage(displayMsg.ERROR + "Block list empty!", TextClr.red);
              return;
            }
          });
      }
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  async apply() {
    let response = 1;
    for (let i = 0; i < (this.dataSource.data.length); i++) {
      if (this.count > 0) {
        if (this.dataSource.data[i].mapped && response && this.count > 0) {
          const body = {
            ...this.commonParams(),
            TranType: this.authoriseInvoiceForm.controls['tranType'].value,
            SubTranType: this.authoriseInvoiceForm.controls['subTranType'].value,
            TranNo: this.dataSource.data[i].tranNo,
          };
          try {
            this.loader.start();
            const res: any = await this.projService.authoriseSelectedData(body).toPromise();
            this.loader.stop();
            if (res['status'].toUpperCase() === AccessSettings.SUCCESS) {
              this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
              response = 1;
              --this.count;

            } else {
              this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
              response = 0;
            }
          } catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
            response = 0;
          }
        }
      }
      else {
        this.count = 0;
        this.submit();
        return;
      }

    }
  }

  authoriseSelectedInvoice() {
    const message = `You are about to Authorise   ${this.count} invoices. Are you sure you want to continue?`;
    const dialogData = new ConfirmDialogModel("Do you want to Authorise ?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '210px',
      data: dialogData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult != true && dialogResult === "YES") {
        this.apply();
      }
      else {
        return;
      }
    });


  }
  submit() {
    const body = {
      ...this.commonParams(),
      TranType: this.authoriseInvoiceForm.controls['tranType'].value,
      SubTranType: this.authoriseInvoiceForm.controls['subTranType'].value,
      Property: this.authoriseInvoiceForm.controls['property'].value,
      Block: this.authoriseInvoiceForm.controls['block'].value,
      FromDate: this.authoriseInvoiceForm.controls['fromDate'].value,
      ToDate: this.authoriseInvoiceForm.controls['toDate'].value,
    };
    try {
      this.loader.start();
      this.subSink.sink = this.projService.getAuthoriseInvoicesData(body).subscribe((res: any) => {
        this.loader.stop();
        if (res['status'].toUpperCase() === AccessSettings.SUCCESS) {
          this.checkBoxEnable = false;
          this.dataSource = new MatTableDataSource(res['data']);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.matsort;
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  // handelError(res: any, colour: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = colour;
  // }
  forminit() {
    return this.fb.group({
      tranType: ['', [Validators.required]],
      subTranType: ['', [Validators.required]],
      property: ['', [Validators.required]],
      block: ['', [Validators.required]],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), [Validators.required]],
      toDate: [new Date(), [Validators.required]]
    })
  }


  Clear() {
    this.authoriseInvoiceForm = this.forminit();
    this.dataSource = [];
    this.displayMessage("", "");
  }
}
