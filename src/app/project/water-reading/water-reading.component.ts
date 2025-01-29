// import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { Router } from '@angular/router';
// import { MasterParams } from 'src/app/Masters/Modules/masters.module';
// import { UtilitiesService } from 'src/app/Services/utilities.service';
// import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
// import { SubSink } from 'subsink';
// import { waterReading } from '../Project.class';
// import { ProjectsService } from 'src/app/Services/projects.service';
// import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
// import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
// import { UserDataService } from 'src/app/Services/user-data.service';
// import { Item } from 'src/app/general/Interface/interface';
// import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
// import { DatePipe } from '@angular/common';
// import { NotesComponent } from 'src/app/general/notes/notes.component';
// import { LogComponent } from 'src/app/general/log/log.component';
// import { ExtendedDetailsComponent } from './extended-details/extended-details.component';
// import { ExpenseService } from 'src/app/Services/expense.service';
// import { MatTableDataSource } from '@angular/material/table';
// import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
// import { SideOverlayComponent } from 'src/app/general/side-overlay/side-overlay.component';
// import { MasterItemsComponent } from 'src/app/Masters/master-items/master-items.component';
// import { ProjectComponent } from '../property/project.component';
// import { CustomerComponent } from 'src/app/sales/customer/customer.component';
// import { SearchProjectComponent } from 'src/app/general/search-project/search-project.component';
// import { AccessSettings } from 'src/app/utils/access';
// import { PropertyDetailsResponse } from '../property.interface';
// export interface Expense {
//   id: number;
//   description: string;
//   amount: string;
//   date: Date;
//   category: string;
// }

// @Component({
//   selector: 'app-water-reading',
//   templateUrl: './water-reading.component.html',
//   styleUrls: ['./water-reading.component.css']
// })
// export class WaterReadingComponent implements OnInit, OnDestroy {
//   @ViewChild('overlay') overlay!: SideOverlayComponent;
//   expenses: Expense[] = [];
//   private subsink!: SubSink;
//   expenseForm: FormGroup;
//   masterParams!: MasterParams;
//   clientTypes: Item[] = [
//     { itemCode: 'ACCOUNT', itemName: 'Bank Account' },
//     { itemCode: 'LANDLORD', itemName: 'Landlord' },
//     { itemCode: 'MANAGEMENT', itemName: 'Management' },
//     { itemCode: 'PROPERTY', itemName: 'Property' },
//     { itemCode: 'TENANT', itemName: 'Tenant' }

//   ];
//   today = new Date()
//   editingExpenseId: number | null = null;
//   totalExpense: number = 0;
//   retMessage: string = "";
//   textMessageClass: string = "";
//   landlordCode: any;
//   dialogOpen: boolean = false;
//   rowData: any = [];
//   columnDefs: any = [{ field: "id", headerName: "S.No", width: 80 },
//   { field: "clientType", headerName: "Client Type", sortable: true, filter: true, resizable: true, flex: 1 },
//   { field: "client", headerName: "Client", sortable: true, filter: true, resizable: true, flex: 1 },
//   { field: "description", headerName: "Desc", flex: 1, sortable: true, filter: true, resizable: true },
//   {
//     field: "date", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
//       // Format date as dd-MM-yyyy
//       if (params.value) {
//         const date = new Date(params.value);
//         const day = date.getDate().toString().padStart(2, '0');
//         const month = (date.getMonth() + 1).toString().padStart(2, '0');
//         const year = date.getFullYear();
//         return `${day}-${month}-${year}`;
//       }
//       return null;
//     },
//   },
//   { field: "category", headerName: "Category", sortable: true, filter: true, resizable: true, flex: 1 },
//   {
//     field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
//     valueFormatter: function (params: any) {
//       if (typeof params.value === 'number' || typeof params.value === 'string') {
//         const numericValue = parseFloat(params.value.toString());
//         if (!isNaN(numericValue)) {
//           return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
//         }
//       }
//       return null;
//     },
//   },
//   ]
//   rprtName: string = "";
//   totals: string = "0.00";
//   constructor(private fb: FormBuilder, private expenseService: ExpenseService, public dialog: MatDialog, private router: Router,
//     private utlService: UtilitiesService, private userDataService: UserDataService, private projectService: ProjectsService,) {
//     this.expenseForm = this.formInit();
//     this.subsink = new SubSink();
//     this.masterParams = new MasterParams();
//   }
//   formInit() {
//     return this.fb.group({
//       description: ['', Validators.required],
//       amount: ['0.00', Validators.required],
//       date: [new Date(), Validators.required],
//       category: ['', Validators.required],
//       client: ['', Validators.required],
//       clientType: ['', Validators.required],
//       propertyName:['']
//     });
//   }
//   onColumnVisibilityChanged(event: any) {

//   }
//   private createRequestData(item: string, type: string,): any {
//     return {
//       company: this.userDataService.userData.company,
//       location: this.userDataService.userData.location,
//       user: this.userDataService.userData.userID,
//       item: item,
//       type: type,
//       refNo: this.userDataService.userData.sessionID,
//       itemFirstLevel: "",
//       itemSecondLevel: "",
//     };
//   }
//   propertySearch() {
//     const body = this.createRequestData(this.expenseForm.controls['propertyName'].value || '', "PROPERTY");
//     try {
//       this.subsink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
//         if (res.status.toUpperCase() === "SUCCESS") {
//           if (res && res.data && res.data.nameCount === 1) {
//             this.expenseForm.controls['propertyName'].patchValue(res.data.selName);
//             this.masterParams.item = res.data.selCode;
//             // this.propID = res.data.selCode;
//             // this.getPropertyData(this.masterParams, this.expenseForm.get('mode')?.value);
//           }
//           else {
//             if (!this.dialogOpen) {
//               const dialogRef: MatDialogRef<SearchProjectComponent> = this.dialog.open(SearchProjectComponent, {
//                 disableClose: true,
//                 data: {
//                   'project': this.expenseForm.controls['propertyName'].value, 'type': 'PROPERTY',
//                   'search': 'Property Search'
//                 }
//               });
//               this.dialogOpen = true;
//               dialogRef.afterClosed().subscribe(result => {
//                 this.dialogOpen = false;
//                 if (result != true) {
//                   this.masterParams.item = result.itemCode;
//                   // this.propID = result.itemCode;
//                   // try {
//                   //   this.getPropertyData(this.masterParams, this.expenseForm.get('mode')?.value);
//                   // }
//                   // catch (ex: any) {
//                   //   this.displayMessage("Exception: " + ex.message, "red");
//                   // }
//                 }
//               });
//             }
//           }
//         }
//         else {
//           this.displayMessage("Error: " + res.message, "red");
//         }
//       });
//     }
//     catch (ex: any) {
//       this.displayMessage("Exception: " + ex.message, "red");
//     }

//   }
//   getPropertyData(masterParams: MasterParams, mode: string) {
//     try {
//       this.subsink.sink = this.projectService.getPropertyDetails(masterParams).subscribe((res: PropertyDetailsResponse) => {
//         if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
//           // this.populateFormControls(res.data);
//           // this.handleSuccess(res, mode);
//         }
//         else {
//           this.displayMessage("Error: " + res.message, "red");
//         }
//       });
//     }
//     catch (ex: any) {
//       this.displayMessage("Exception: " + ex.message, "red");

//     }
//   }
//   openOverlay(): void {
//     // this.overlay.open(MasterItemsComponent);
//     if (this.overlay) {
//       this.overlay.open(CustomerComponent);
//     } else {
//       console.error('Overlay component not initialized.');
//     }
//   }
//   Clear() {
//     this.expenseForm = this.formInit();
//     this.displayMessage("", "");
//     this.landlordCode = "";
//     this.rowData = [];
//     this.expenses = [];
//   }
//   Close() {
//     this.router.navigateByUrl('/home');
//   }
//   getTotalExpenses(): number {
//     // return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
//     return this.expenses.reduce((sum, expense) => {
//       // Ensure that the amount is treated as a number
//       const amount = typeof expense.amount === 'string'
//         ? parseFloat(expense.amount.replace(/,/g, ''))
//         : expense.amount;

//       return sum + amount;
//     }, 0);
//   }
//   ngOnDestroy(): void {
//     // throw new Error('Method not implemented.');
//     this.subsink.unsubscribe();
//   }
//   commonParams() {
//     return {
//       company: this.userDataService.userData.company,
//       location: this.userDataService.userData.location,
//       user: this.userDataService.userData.userID,
//       refNo: this.userDataService.userData.sessionID,
//       langId: this.userDataService.userData.langId
//     }
//   }
//   onClientSearch() {
//     const body = {
//       ...this.commonParams(),
//       Type: "CLIENT",
//       item: this.expenseForm.controls['client'].value || "",
//       ItemSecondLevel: ""
//     }
//     try {
//       this.subsink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
//         if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
//           if (res && res.data && res.data.nameCount === 1) {
//             this.expenseForm.controls['client'].patchValue(res.data.selName);
//             this.landlordCode = res.data.selCode;
//           }
//           else {
//             if (!this.dialogOpen) {
//               const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
//                 width: '90%',
//                 disableClose: true,
//                 data: {
//                   'PartyName': this.expenseForm.controls['client'].value,
//                   'PartyType': this.expenseForm.controls['clientType'].value,
//                   'search': 'Client Search'
//                 }
//               });
//               this.dialogOpen = true;
//               dialogRef.afterClosed().subscribe(result => {
//                 if (result != true) {
//                   this.expenseForm.controls['client'].patchValue(result.partyName);
//                   this.landlordCode = result.code;
//                 }

//                 this.dialogOpen = false;
//               });
//             }

//           }
//         }
//         else {
//           this.displayMessage("Error: " + res.message, "red");
//         }
//       });
//     }
//     catch (ex: any) {
//       this.displayMessage("Exception: " + ex.message, "red");
//     }
//   }
//   private displayMessage(message: string, cssClass: string) {
//     this.retMessage = message;
//     this.textMessageClass = cssClass;
//   }

//   ngOnInit(): void {
//     this.loadExpenses();
//   }

//   edit(form: any) {
//     this.expenseForm.patchValue(form);
//   }
//   loadExpenses(): void {
//     this.expenseService.getExpenses().subscribe((data: any) => this.expenses = data);
//     this.totalExpense = this.getTotalExpenses();
//   }

//   addExpense(): void {
//     const newExpense: Expense = {
//       id: this.expenses.length + 1,
//       ...this.expenseForm.value
//     };
//     this.expenseService.addExpense(newExpense);
//     this.rowData =[...this.expenses];
//     this.loadExpenses();
//   }

//   deleteExpense(id: number): void {
//     this.expenseService.deleteExpense(id);
//     this.loadExpenses();
//   }

// }


import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { SubSink } from 'subsink';
import { waterReading } from '../Project.class';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { DatePipe } from '@angular/common';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { ExtendedDetailsComponent } from './extended-details/extended-details.component';

@Component({
  selector: 'app-water-reading',
  templateUrl: './water-reading.component.html',
  styleUrls: ['./water-reading.component.css']
})
export class WaterReadingComponent implements OnInit, OnDestroy {
  waterReadingForm!: FormGroup;
  private subSink: SubSink;
  @Input() max: any;
  today = new Date()
  textMessageClass: string = "";
  masterParams!: MasterParams;
  waterCls!: waterReading;
  retMessage: string = "";
  public tenantCode!: string;
  public flatCode!: string;
  public previousReading!: number;
  public previousRdgDate!: Date;
  status!: string;
  dialogOpen: boolean = false;
  props: Item[] = [];
  blocks: Item[] = [];
  modes: Item[] = [];
  totalAmount: number = 0;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private loader: NgxUiLoaderService,
    private projService: ProjectsService,
    private utlService: UtilitiesService, private masterService: MastersService,
    private userDataService: UserDataService, private datePipe: DatePipe,
    private router: Router) {
    this.waterReadingForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.waterCls = new waterReading();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.loadData();
    this.waterReadingForm.get('property')!.valueChanges.subscribe(property => {
      this.onSelectedPropertyChanged();
    });
  }

  onDocsCilcked() {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.waterReadingForm.controls['mode'].value, tranNo: this.waterReadingForm.controls['tranNo'].value, search: 'Extend Docs', tranType: "EXTDBILL" }
    });

  }
  loadData() {
    const modeBody = this.createRequestData('ST915');
    const propertyBody ={...this.createRequestData('PROPERTY'),mode:this.waterReadingForm.get('mode')?.value};
    try {
      const modes$ = this.masterService.getModesList(modeBody);
      const property$ = this.masterService.GetMasterItemsList(propertyBody);

      this.subSink.sink = forkJoin([modes$, property$]).subscribe(
        ([modesRes, propertyRes]: any) => {
          if (modesRes.status.toUpperCase() === "SUCCESS") {
            this.modes = modesRes.data;
          } else {
            this.retMessage = "Modes list Empty!";
            this.textMessageClass = "red";
          }
          if (propertyRes.status.toUpperCase() === "SUCCESS") {
            this.props = propertyRes.data;
            if (this.props.length === 1) {
              this.waterReadingForm.controls['property'].patchValue(this.props[0].itemCode);
              this.onSelectedPropertyChanged();
            }
          }
          else {
            this.retMessage = "Properties list empty!";
            this.textMessageClass = "red";
          }
        },
        error => {
          this.handleError(error.message);
        }
      );
    } catch (ex: any) {
      this.handleError(ex);
    }
  }
  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'red';
  }
  private createRequestData(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: item
    };
  }
  onSubmit() {
    this.textMessageClass = "";
    this.retMessage = "";
    if (this.waterReadingForm.valid) {
      this.populateWaterReadingCls();
      this.loader.start();
      this.subSink.sink = this.projService.UpdateExtendedBillsHdr(this.waterCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          if (this.waterReadingForm.controls['mode'].value === "Add") {
            this.waterReadingForm.controls['tranNo'].patchValue(res.tranNoNew);
            this.waterReadingForm.controls['mode'].patchValue('Modify', { emitEvent: false });

          }
          this.GetExtendedBillsHdr(res.tranNoNew);
        }
        else {
          this.handleError(res);
        }
      })
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
  populateWaterReadingCls() {
    const formControls = this.waterReadingForm.controls;
    this.waterCls = {
      mode: formControls.mode.value || "",
      ...this.commonParams(),
      langID: this.userDataService.userData.langId,
      tranNo: formControls.tranNo.value || "",
      property: formControls.property.value || "",
      block: formControls.block.value || "",
      unit: this.flatCode || "",
      tranDate: this.datePipe.transform(formControls.tranDate.value, 'yyyy-MM-dd') || "",
      notes: formControls.notes.value,
    } as waterReading
  }

  formInit() {
    return this.fb.group({
      property: ['', Validators.required],
      block: ['', Validators.required],
      flat: ['', Validators.required],
      tranDate: ["2024-12-31", Validators.required],
      notes: [''],
      mode: ['View'],
      tranNo: ['']
    });
  }
  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  onSelectedPropertyChanged(): void {
    this.blocks = [];
    if (this.waterReadingForm.controls.property.value != "") {
      this.masterParams.type = 'BLOCK';
      this.masterParams.item = this.waterReadingForm.controls.property.value;
      try {
        this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: getResponse) => {
          if (result.status.toUpperCase() === 'SUCCESS') {
            this.blocks = result.data;
            if (this.blocks.length === 1) {
              this.waterReadingForm.controls['block'].patchValue(this.blocks[0].itemCode);
            }
          } else {
            this.handleError(result);
          }
        });
      }
      catch (ex: any) {
        this.handleError(ex.message);
      }

    }

  }

  onFlatSearch() {
    const body = {
      ...this.commonParams(),
      Type: 'FLAT',
      Item: this.waterReadingForm.controls['flat'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.waterReadingForm.controls['flat'].patchValue(res.data.selName);
            this.masterParams.item = res.data.selCode;
            this.flatCode = res.data.selCode;
            this.onFlatChanged();
            this.retMessage=res.message;
            this.textMessageClass='green';
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'flat': this.waterReadingForm.controls['flat'].value, 'type': 'FLAT',
                  'search': 'Flat Search', property: this.waterReadingForm.controls['property'].value, block: this.waterReadingForm.controls['block'].value,
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.waterReadingForm.controls['flat'].patchValue(result.unitName);
                  this.masterParams.item = result.unitId;
                  this.flatCode = result.unitId;
                  try {
                    this.onFlatChanged();
                    this.retMessage=res.message;
                    this.textMessageClass='green';
                  }
                  catch (ex: any) {
                    this.retMessage = ex;
                    this.textMessageClass = 'red';
                  }
                }
              });
            }
          }
        }
        else {
          this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex);
    }
  }

  onFlatChanged() {
    const body = {
      ...this.commonParams(),
      propCode: this.waterReadingForm.controls['property'].value,
      blockCode: this.waterReadingForm.controls['block'].value,
      unitCode: this.flatCode
    }
    this.subSink.sink = this.projService.GetUnitWaterMeterRdg(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.tenantCode = res.data.tenant;
        this.previousReading = res.data.prevRdg;
        this.previousRdgDate = res.data.prevRdgDate;
        
      }
      else {
        this.handleError(res);
      }
    });
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  onTranSearch() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      tranType: 'EXTDBILL',
      TranNo: this.waterReadingForm.controls['tranNo'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: "",
      FromDate:formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate

    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          // if (res && res.data && res.data.tranCount === 1) {
          //   this.waterReadingForm.controls['tranNo'].patchValue(res.data.selTranNo);
          //   this.GetExtendedBillsHdr(res.data.selTranNo);
          // }
          // else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.waterReadingForm.controls['tranNo'].value, 'TranType': 'EXTDBILL',
                  'search': 'Bill Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.waterReadingForm.controls['tranNo'].patchValue(result);
                  try {
                    this.GetExtendedBillsHdr(result);
                  }
                  catch (ex: any) {
                    this.retMessage = ex.message;
                    this.textMessageClass = 'red';
                  }
                }
              });
            }
          }
        // }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }

  }
  onDetCilcked() {
    const dialogRef = this.dialog.open(ExtendedDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.waterReadingForm.get('mode')?.value,
        tranNo: this.waterReadingForm.get('tranNo')?.value,
        property: this.waterReadingForm.controls.property.value,
        block: this.waterReadingForm.controls.block.value,
        unit: this.flatCode
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result.isAltered){
        this.onTranSearch();
      }
    });

  }
  Close() {
    this.router.navigateByUrl('/home')
  }
  Clear() {
    this.waterReadingForm = this.formInit();
    this.tenantCode = "";
    this.totalAmount = 0;
    // this.previousRdgDate = new Date();
    this.status = "";
    this.clearMsgs();
  }


  onCurrentReadingChanged() {
    this.validateReading();
    if (this.waterReadingForm.controls['currentReading'].hasError('incorrect')) {
      return; // Do not proceed with calculation if current reading is incorrect
    }

    let numUnitRate: number;
    let numUnits: number;
    let numAmount: number;
    let numCurrRdg: number;

    let strUnitRate = this.waterReadingForm.controls['rate'].value.toString();
    let strCurrRdg = this.waterReadingForm.controls['currentReading'].value.toString();
    if (strUnitRate == "") {
      return;
    }

    if (strCurrRdg == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numCurrRdg = Number(strCurrRdg.replace(/,/g, ''));
    numUnits = numCurrRdg - this.previousReading;
    numAmount = numUnits * numUnitRate;
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.waterReadingForm.controls['rate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.waterReadingForm.controls['currentReading'].patchValue(numCurrRdg.toLocaleString(undefined, options));
    this.waterReadingForm.controls['unit'].patchValue(numUnits.toLocaleString(undefined, options));
    this.waterReadingForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }


  validateReading() {
    this.retMessage = "";
    this.textMessageClass = "";
    const currentReadingValue = this.waterReadingForm.controls['currentReading'].value
      .toString()
      .replace(/,/g, '')
      .replace(/\./g, '');

    const previousReadingValue = this.previousReading
      .toString()
      .replace(/,/g, '')
      .replace(/\./g, '');

    // Compare the sanitized values
    if (Number(currentReadingValue) < Number(previousReadingValue)) {
      this.retMessage = "Current reading should be greater than previous reading!";
      this.textMessageClass = "red";
      this.waterReadingForm.controls['currentReading'].setErrors({ 'incorrect': true });
      // this.cdr.detectChanges();
      return;
    }
  }

  onRateChanged() {
    this.validateReading();
    if (this.waterReadingForm.controls['currentReading'].hasError('incorrect')) {
      return;
    }
    let numUnitRate: number;
    let numUnits: number;
    let numAmount: number;
    let numCurrRdg: number;
    let strUnitRate = this.waterReadingForm.controls['rate'].value.toString();
    let strCurrRdg = this.waterReadingForm.controls['currentReading'].value.toString();
    if (strUnitRate == "") {
      return;
    }

    if (strCurrRdg == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numCurrRdg = Number(strCurrRdg.replace(/,/g, ''));
    numUnits = numCurrRdg - this.previousReading;
    numAmount = numUnits * numUnitRate;
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.waterReadingForm.get('rate')!.patchValue(numUnitRate.toLocaleString(undefined, options));
    this.waterReadingForm.get('currentReading')!.patchValue(numCurrRdg.toLocaleString(undefined, options));
    this.waterReadingForm.get('amount')!.patchValue(numAmount.toLocaleString(undefined, options));
  }

  modeChanged(event: any) {
    if (event === 'Add') {
      this.Clear();
      // this.clearMsgs();
      this.waterReadingForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.waterReadingForm.get('tranNo')!.disable();
      this.loadData();
      this.formInit();
      
    }
    else {
      this.waterReadingForm.get('tranNo')!.enable();
      this.waterReadingForm.get('mode')!.patchValue(event, { emitEvent: false });
    }

  }
  GetExtendedBillsHdr(tranNo: string) {
    const body = {
      ...this.commonParams(),
      TranNo: tranNo
    }
    this.subSink.sink = this.projService.GetExtendedBillsHdr(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.tenantCode = res.data.tenant;
        this.waterReadingForm.controls['property'].patchValue(res.data.property);
        setTimeout(() => {
          this.populateDatatoForm(res);
        }, 500);
      }
      else {
        this.handleError(res);
      }
    })
  }
  populateDatatoForm(res: any) {
    this.previousReading = res.data.prevReading;
    this.previousRdgDate = res.data.tranDate;
    this.status = res.data.tranStatus;
    this.flatCode = res.data.unit;
    this.totalAmount = res.data.totalBillAmount;
    this.waterReadingForm.patchValue({
      block: res.data.block,
      flat: res.data.unitName,
      notes: res.data.notes,
      // unit: res.data.unitCount.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0,
      tranDate: res.data.tranDate,
    }, { emitEvent: false });
  }
  dateChanged(event: any, controlName: string) {
    const control = this.waterReadingForm.get(controlName);
    const inputValue = event.target.value;
    const [day, month, year] = inputValue.split('-').map((part: any) => parseInt(part, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        control?.patchValue(date);
      } else {
      }
    } else {
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST915",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }


  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.waterReadingForm.controls['mode'].value,
        'note': this.waterReadingForm.controls['notes'].value,
        'TranType': "EXTDBILL",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Extended Bill Notes"
      }
    });
  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "EXTDBILL",
        'tranNo': tranNo,
        'search': 'Extended Bill Log'
      }
    });
  }
}
