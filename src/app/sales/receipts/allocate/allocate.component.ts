import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
// import { MatTableDataSource } from '@angular/material/table';
import { AutoWidthCalculator, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SalesService } from 'src/app/Services/sales.service';
import { from } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { debug } from 'console';
import { MatSnackBar } from '@angular/material/snack-bar';
export interface Transaction {
  company: string;
  location: string;
  tranNo: string;
  tranDate: string;
  dueDate: string;
  // currency: string;
  actAmount: number;
  dueAmount: number;
  allocatedAmount: number;
  balAmount: number;
  remarks: string;
  selected: boolean;
}
@Component({
  selector: 'app-allocate',
  templateUrl: './allocate.component.html',
  styleUrls: ['./allocate.component.css']
})
export class AllocateComponent implements OnInit, OnDestroy {
checkAllocatedAmount(_t152: any) {
// throw new Error('Method not implemented.');
}
  formName: string = "";
  allocateForm!: FormGroup;
  retMessage: string = "";
  textMessageClass: string = "";
  rowData: Transaction[] = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private subSink!: SubSink;
  isCheck:boolean=false;
  remBal:number=0;
  pageSizes = [50, 50, 100, 250, 500];
  pageSize = 50;
  altered: boolean = false;
  columnDefs: any = [{
    field: "All", headerName: "", width: 50, headerCheckboxSelection: true,
    checkboxSelection: (params: any) => {
      // if (params.data.f_reconciliation_flag === "Y") {
      //   return false;
      // }
      return true; // Return true for other rows to enable checkbox selection
    }

    // to allow selecting all rows with a header checkbox
  }, { field: "slNo", headerName: "S.No", width: 80 },
  { field: "partyName", headerName: "Party", sortable: true, filter: true, resizable: true, flex: 1,width:80},
  { field: "propName", headerName: "Property", sortable: true, filter: true, resizable: true, flex:1,width:80},
  { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, flex:1,width:80 },
  { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1,width:80 },
  { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1,autoSizeColumns: true,
    valueFormatter: function (params: any) {
      if (params.value) {
        const date = new Date(params.value);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return null;
    },
  },
  {
    field: "totalAmount", headerName: "Total Amount", sortable: true, filter: true, resizable: true, flex: 1,autoSizeColumns: true,
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null;
    },
    type: 'rightAligned',
    cellStyle: { justifyContent: "flex-end" },
  },
  {
    field: "editableField",
    headerName: "Editable Text",
    editable: true, // Make the column editable
    cellEditor: 'agTextCellEditor',
    autoSizeColumns: true,// Default text editor
    cellEditorParams: {
      suppressKeyboardEvent: (params: any) => {
        params.event.stopPropagation(); // Prevent the event from closing the dialog
        return false;
      }
    },
    flex: 1,
  }
  ];

  displayedColumns: string[] = ['select','propName','blockName','unitName', 'tranNo', 'tranDate', 'dueDate', 'actAmount', 'dueAmount', 'allocatedAmount', 'balAmount', 'remarks'];
  dataSource: any = [];
  initialTotalAllocated: number = 0;

  constructor(private snackBar: MatSnackBar,@Inject(MAT_DIALOG_DATA) public data: {
    mode: string,
    tranNo: string,
    search: string,
    tranType: string,
    tranAmount: string,
    allocStatus: string,
    tranFor:string,
  }, private dialogRef: MatDialogRef<AllocateComponent>,
    private userDataService: UserDataService, private saleService: SalesService, private loader: NgxUiLoaderService,
    private fb: FormBuilder, private decimalPipe: DecimalPipe) {
    // this.allocateForm = this.initForm();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  reAllocate() {
    this.loader.start();
    this.getAllocationData(this.data.tranNo, this.data.mode, true,this.data.tranFor);
    this.loader.stop();
  }
  // toggleSelection(row: Transaction) {
  //   row.selected = !row.selected;
  // }

  formatDate(date: string): string {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('en-GB');  // Format as dd-mm-yyyy
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(amount);
  }

  amountChanged(element: any, i: number) {
    
    if(parseFloat(element.allocatedAmount) > 0.0 || parseFloat(element.allocatedAmount)>0){
      element.checked=true;
    }
    else{
      element.checked=false;
    }
    this.displayMessage("", "");
    element.SlNo = true;
    const safeParse = (value: any) => {
      const parsedValue = parseFloat(value?.toString().replace(/,/g, '') || '0');
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

    // element.balAmount = safeParse(element.actAmount) - safeParse(element.allocatedAmount);
    const totalAmount = safeParse(this.data.tranAmount);
    let totalAllocated = 0;
    this.dataSource[i].allocatedAmount = element.allocatedAmount;
    totalAllocated = this.dataSource.map((item: any) => safeParse(item.allocatedAmount)).reduce((a: any, b: any) => a + b, 0);
    // totalAllocated = this.initialTotalAllocated - totalAllocated;
    // 
    if (totalAllocated <= totalAmount) {
      
      
      let remainingAmount = totalAmount - totalAllocated;
      element.balAmount = safeParse(element.dueAmount) - safeParse(element.allocatedAmount);
      // if (i + 1 < this.dataSource.length) {
      
      // }
        if(remainingAmount >this.dataSource[i + 1].dueAmount){
          
          // this.dataSource[i + 1].allocatedAmount = safeParse(this.dataSource[i + 1].dueAmount) ;
          // remainingAmount=remainingAmount-safeParse(this.dataSource[i + 1].allocatedAmount)
        }
        else{
          
          // this.dataSource[i + 1].allocatedAmount =remainingAmount;

         if(this.remBal>0 && remainingAmount>0 && element.allocatedAmount < this.remBal  && element.allocatedAmount < remainingAmount ){
          remainingAmount=remainingAmount-element.allocatedAmount ;
         }
        }
        // this.dataSource[i + 1].allocatedAmount = safeParse(this.dataSource[i + 1].allocatedAmount) + remainingAmount;
        this.dataSource[i + 1].balAmount = safeParse(this.dataSource[i + 1].actAmount) - safeParse(this.dataSource[i + 1].allocatedAmount);
        // element.SlNo=true;
        this.dataSource[i + 1].SlNo = true;
      this.remBal=remainingAmount;
    }
    else {
      this.displayMessage("The allocated amount exceeds the available transaction amount.", "red");
    }


  }


  initForm() {
    return this.fb.group({
      refTranNo: ['', Validators.required],
      tranDate: [new Date(), Validators.required],
      dueDate: [new Date(), Validators.required],
      currency: ['', Validators.required],
      actAmount: ['0.00', [Validators.required,]],
      dueAmount: ['0.00', [Validators.required,]],
      allocatedAmount: ['0.00', [Validators.required,]],
      balAmount: ['0.00', [Validators.required,]],
      remarks: ['', Validators.maxLength(200)]
    });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  ngOnInit(): void {
    // console.log(this.data);
    if (this.data.tranNo) {
      this.getAllocationData(this.data.tranNo, this.data.mode, false,this.data.tranFor);
    }
    for(let j=0;j<this.dataSource.length;j++){
      if(this.dataSource[j].allocatedAmount >0){
        this.dataSource[j].checked=true;
        this.dataSource[j]
      }
      else{
        this.dataSource[j].checked=false;
      }
    }
    

  }
    isDis(element:any):boolean{
    if(element.allocatedAmount >0){
      element.checked=true;
      return false;
    }
    else if(element.allocatedAmount <= 0 && this.remBal <=0){
      element.checked=false;
      return true;
    }
    else if(this.remBal > 0){
      return false
    }
    else if(element.remarks === 'Allocation is done'){
      return true;
    }
    return false
  }
  getAllocationData(tranNo: string, mode: string, reAllocate: boolean, tranFor:string) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      tranNo: tranNo,
      tranFor:tranFor,
      reAllocate: reAllocate
    }
    try {
      this.subSink.sink = this.saleService.FetchPaymentsReceiptsToAllocate(body).subscribe((res: any) => {
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          this.dataSource = res.data;
          
          const safeParse = (value: any) => {
            const parsedValue = parseFloat(value?.toString().replace(/,/g, '') || '0');
            return isNaN(parsedValue) ? 0 : parsedValue;
          };
          if (mode === "View") {
            this.displayMessage("Success: " + res.message, "green");
          }
        }
        else {
          this.displayMessage("No transactions available at the moment.", "red");
        }
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  toggleAllSelection(checked: boolean): void {
    this.dataSource.forEach((item: { checked: boolean; allocatedAmount: null; dueAmount: any; }) => {
      item.checked = checked;
      if (checked) {
        item.allocatedAmount = item.dueAmount;
      } else {
        item.allocatedAmount = null;
      }
    });
  }
  
  toggleSelection(element: any): void {
    
    if(!element.checked){
      this.remBal = this.remBal + element.allocatedAmount
    }
    // if(element.checked){
    //   if()
    //   this.remBal = this.remBal + element.allocatedAmount
    // }
    if (this.remBal === 0 && element.checked) {
      this.snackBar.open('Balance amount is 0 or negative', 'Close', {
        duration: 5000, // Popup will stay for 5 seconds
        panelClass: ['mat-toolbar', 'mat-warn'] // You can customize the style, like using 'mat-warn' for a warning color
      });
      element.checked = false;
    }
    else{
      
      if(element.checked && this.remBal >= parseFloat(element.dueAmount)){
        element.allocatedAmount=(element.dueAmount);
        this.remBal=this.remBal- (element.allocatedAmount);
        element.balAmount=0;
      }
      else if(element.checked && this.remBal < parseFloat(element.dueAmount)){
        element.allocatedAmount = this.remBal;
        this.remBal=0;
        element.balAmount=element.dueAmount-element.allocatedAmount;
      }
      else if(!element.checked){
        element.allocatedAmount=0;
        element.balAmount=element.dueAmount;
      }
    }
    // if(this.remBal >0){
    //   for(let j=0;j<element.length();j++){
    //     if(element[j].checked || element[j].allocatedAmount>0){
    //       element[j].checked=true;
    //     }
    //     else if(this.remBal <=0 && !element[j].checked){
    //       element[j].checked= false;
    //     }
    // }
    
    // }
    
    // console.log(element);
    // if (element.checked) {
    //   element.allocatedAmount = element.dueAmount;
    // } else {
    //   element.allocatedAmount = null;
    // }
  }
  
  isAllSelected(): boolean {
    return this.dataSource.every((item: { checked: any; }) => item.checked);
  }

  onSubmit(): void {
    // Create an array of bodies to loop through
    this.loader.start();
    const requestBodies = this.dataSource.map((item: any) => ({
      mode: this.data.mode,
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      langId: this.userDataService.userData.langId,
      tranNo: this.data.tranNo,
      slNo: item.slNo,
      refTranNo: item.tranNo,
      tranDate: item.tranDate,
      dueDate: item.dueDate,
      currency: item.currency,
      actAmount: item.actAmount,           // Assuming numeric values
      dueAmount: item.dueAmount,           // Assuming numeric values
      allocatedAmount: parseFloat(item.allocatedAmount),    // Assuming numeric values
      balAmount: item.balAmount,           // Assuming numeric values
      remarks: item.remarks,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      blockId: item.blockId,
      propCode:item.propCode,
      unitId:item.unitId
    }));

    // Use from() to emit each body one after the other
    from(requestBodies)
      .pipe(
        // Sequentially process each request
        concatMap((body) =>
          this.saleService.UpdatePaymentReceiptAllocationDetails(body).pipe(
            catchError((err) => {
              this.displayMessage("Error: " + err.message, "red");
              this.loader.stop();
              throw err; // rethrow the error to stop further execution
            })
          )
        )
      )
      .subscribe({
        next: (res: any) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage("Success: " + res.message, "green");
            // this.getAllocationData(this.data.tranNo, this.data.mode, true);
            this.altered = true;
          } else {
            this.displayMessage("Error: " + res.message, "red");
          }
        },
        error: (ex: any) => {
          this.displayMessage("Exception: " + ex.message, "red");
          this.loader.stop();
        },
        complete: () => {
          this.loader.stop();
          // console.log("All requests completed successfully.");
          // this.displayMessage("All requests completed successfully.", "green");
        }
      });
  }

  formattedAmount(amount: any): string {
    return amount ? this.decimalPipe.transform(amount, '1.2-2') || '0.00' : '0.00';
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.dialogRef.close(event.data.tranNo);
  }

}