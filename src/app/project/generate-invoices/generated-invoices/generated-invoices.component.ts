import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-generated-invoices',
  templateUrl: './generated-invoices.component.html',
  styleUrls: ['./generated-invoices.component.css']
})
export class GeneratedInvoicesComponent implements OnInit {
  private subsink: SubSink;
  retMessage!: string ;
  textMessageClass!: string;
  columnDefs: any = [];
  rowData: any = [];
 private columnApi!: ColumnApi;
  private gridApi!: GridApi;
totals: string='';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      Company: string,
      Location: string,
      User: string,
      RefNo: string,
    },private loader: NgxUiLoaderService,private projService: ProjectsService
  ) {
        this.subsink = new SubSink();
    
   }

  ngOnInit(): void {
    this.loaddata();
  }
  ngAfterViewInit(): void {
    this.columnDefs = [
      // { field: "slNo", headerName: "slNo", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "propertyName", headerName: "Property", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      { field: "blockName", headerName: "block", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      { field: "tranNo", headerName: "Tran", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      { field: "tenant", headerName: "T Code", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      { field: "tenantName", headerName: "Tenant", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },  
      { field: "landlord", headerName: "L Code", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      { field: "landlordName", headerName: "Landlord", sortable: true, filter: true, resizable: true, flex: 1,minWidth: 100, maxWidth: 300 },
      
      // {
      //   field: "rentCharge",
      //   headerName: "Rent",
      //   sortable: true,
      //   filter: true,
      //   resizable: true,
      //   flex: 1,
      //   valueGetter: (params: { data: { rentCharge: number } }) => {
      //     return params.data.rentCharge;
      //   },
      //   valueFormatter: (params: { value: number }) => {
      //     if(params.value){
      //       return `${params.value}%`;
      //     }
      //     else{
      //       return '';
      //     }

      //   },
      // },
      // {
      //   field: "otherCharge",
      //   headerName: "Others",
      //   sortable: true,
      //   filter: true,
      //   resizable: true,
      //   flex: 1,
      //   valueGetter: (params: { data: { otherCharge: number } }) => {
      //     return params.data.otherCharge;
      //   },
      //   valueFormatter: (params: { value: number }) => {
      //     if(params.value){
      //       return `${params.value}%`;
      //     }
      //     else{
      //       return '';
      //     }

      //   },
      // },
      // {
      //   field: "vatCharge",
      //   headerName: "Vat",
      //   sortable: true,
      //   filter: true,
      //   resizable: true,
      //   flex: 1,
      //   valueGetter: (params: { data: { vatCharge: number } }) => {
      //     return params.data.vatCharge;
      //   },
      //   valueFormatter: (params: { value: number }) => {
      //     if(params.value){
      //       return `${params.value}%`;
      //     }
      //     else{
      //       return '';
      //     }

      //   },
      // },
      // {
      //   field: "totalCharge",
      //   headerName: "Total",
      //   sortable: true,
      //   filter: true,
      //   resizable: true,
      //   flex: 1,
      //   valueGetter: (params: { data: { totalCharge: number } }) => {
      //     return params.data.totalCharge;
      //   },
      //   valueFormatter: (params: { value: number }) => {
      //     if(params.value){
      //       return `${params.value}%`;
      //     }
      //     else{
      //       return '';
      //     }

      //   },
      // },

      
      {
        field: "tranDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    ]
  }
  loaddata(){
    const body={
      Company:this.data.Company,
      Location: this.data.Location,
      User: this.data.User,
      RefNo: this.data.RefNo
    }
    try {
          this.loader.start();
          this.subsink.sink = this.projService.GetReportInvoicesList(body).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              this.retMessage = res.message ;
              this.textMessageClass = "green";
              this.rowData=res.data;
                
            }
            else {
              // this.handleDataLoadError(res);
            }
          });
          // console.log('called submit');
        }
        catch (ex: any) {
          this.loader.stop();
          this.handleDataLoadError(ex);
        }
  }
  handleDataLoadError(ex: any) {
    throw new Error('Method not implemented.');
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
  }
  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;
    console.log(field);
    if (field.toUpperCase() === 'AMOUNT') {
      // this.acBalTmp = hide;
    }
    // this.getTotal();

    // this.getTotalLoan();
  }
  processRowPostCreate(params: any) {

    let actual = 0;
    let payble = 0;

    if (params) {
      const processedData = params.map((row: any) => {
        actual += Number(row.amount) || 0;
        if (row.unitStatus === 'Allocated') {
          payble += Number(row.amount) || 0;
        }
        return {
          ...row,
          actual,
          payble
        };
      });
      processedData.push({
        propertyName: "Total",
        amount: "Rent " + actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        unitStatus: "Payble " + payble.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
     
      return processedData;
    }
  }
  onFilterData(event: any) {
    this.processRowPostCreate(event);
    // this.calculateTotalLoan(event);
  }
}
