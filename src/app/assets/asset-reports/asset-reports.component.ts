import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { UserData } from 'src/app/admin/admin.module';
import { SubSink } from 'subsink';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { ProjectsService } from 'src/app/Services/projects.service';
import * as moment from 'moment';
import { PropertyCls, propertyReportData } from 'src/app/project/Project.class';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
interface IReportData {
  Company: string;
  Location: string;
  PropCode: string;
  BlockCode: string;
  UnitID: string;
  UnitStatus: string;
  FromDate: Date;
  ToDate: Date;
  Report: string;
  User: string;
  RefNo: string;
}
@Component({
  selector: 'app-asset-reports',
  templateUrl: './asset-reports.component.html',
  styleUrls: ['./asset-reports.component.css']
})

export class AssetReportsComponent implements OnInit {
  assetReoprtForm!: FormGroup;
  @Input() max: any;
  today = new Date();
  masterParams!: MasterParams;
  userData!: UserData;
  properytList!: any[];
  retMessage!: string;
  textMessageClass!: string;
  blocksList!: any[];
  flatsList!: any[];
  disabled!: string;
  rowData: any = [];
  statusList: any = [];

  private propCls: propertyReportData;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  columnDefs: any = [{ field: "unitStatus", headerName: "Status", flex: 1, resizable: true, sortable: true, filter: true, },
  { field: "propName", headerName: "Property", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, flex: 1, },
  { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "llName", headerName: "Land Lord", sortable: true, resizable: true, flex: 1, filter: true },
  { field: "tenant", headerName: "Tenant", sortable: true, resizable: true, width: 210, filter: true },
  { field: "employee", headerName: "Manager", sortable: true, resizable: true, flex: 1, filter: true },
  {
    field: "unitDate",
    headerName: "Date",
    sortable: true,
    resizable: true,
    flex: 1, filter: true,
    valueFormatter: function (params: any) {
      // Format date as dd-MM-yyyy
      if (params.value) {
        const date = new Date(params.value);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return null;
    },
  }]

  storedUserData!: string;
  private subSink: SubSink;

  reoprttList: any = [{ itemCode: 'Allocated', itemName: 'Allocated' },
  { itemCode: 'Vaccant', itemName: 'Vaccant' },
  { itemCode: 'Occupied', itemName: 'Occupied' },
  { itemCode: 'Repair', itemName: 'Repair' },
  { itemCode: 'Renovate', itemName: 'Renovate' }];
  constructor(private fb: FormBuilder,
    protected router: Router,
    private masterService: MastersService,
    private projectService: ProjectsService,
    private loader: NgxUiLoaderService
  ) {
    this.masterParams = new MasterParams();
    this.assetReoprtForm = this.formInit();
    this.subSink = new SubSink();
    this.propCls = new propertyReportData()

  }

  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData
    }
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    this.loadData();
  }

  formInit() {
    return this.fb.group({
      PropCode: ['', [Validators.required]],
      BlockCode: ['', [Validators.required]],
      UnitID: ['', [Validators.required]],
      Report: ['', [Validators.required]],
      UnitStatus: ['', Validators.required],
      FromDate: [new Date()],
      ToDate: [new Date()]
    });
  }

  loadData() {
    const propertybody = {
      company: this.userData.company,
      location: this.userData.location,
      user: this.userData.userID,
      item: 'PROPERTY',
      refNo: this.userData.sessionID
    };
    const property$ = this.masterService.GetMasterItemsList(propertybody);
    this.subSink.sink = forkJoin([property$]).subscribe(
      ([propRes]: any) => {
        this.loader.stop();

        this.properytList = propRes['data'];

      },
      error => {
        this.retMessage = error.message;
        this.textMessageClass = 'red';
      }
    );
  }

  onSelectedPropertyChanged() {
    //this.clearMsgs();
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.assetReoprtForm.controls['PropCode'].value;
    if (this.masterParams.item != 'All') {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {

        if (result.status.toUpperCase() === "SUCCESS") {
          this.blocksList = result['data'];
        }
        else {
          this.retMessage = result.message;
          this.textMessageClass = "red";
        }
      });
    }

  }

  onSelectedBlockChanged() {
    //this.clearMsgs();
    this.masterParams.type = 'FLAT';
    this.masterParams.item = this.assetReoprtForm.controls['PropCode'].value;
    this.masterParams.itemFirstLevel = this.assetReoprtForm.controls['BlockCode'].value;
    if (this.masterParams.item != 'All') {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.flatsList = result['data'];
        }
        else {
          this.retMessage = result.message;
          this.textMessageClass = "red";
        }
      });
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {

  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  downloadExcel() {
    if (this.gridApi) {
      this.loader.start();
      this.gridApi.exportDataAsCsv({ fileName: "Assetanalysis" + '.csv' });
      this.loader.stop();
    }
  }


// downloadPDF() {
//   const params = {
//     orientation: 'landscape' as const,
//   };
//   const logoImage = new Image();
//   logoImage.src = "assets/img/TKGlogo.png"; // Provide the correct path to your company logo

//     logoImage.onload = () => {
//       const rightTopX = pdfDoc.internal.pageSize.width - 30; // Adjust X coordinate
//       const rightTopY = 10; // Adjust Y coordinate
//       pdfDoc.addImage(logoImage, 'PNG', rightTopX, rightTopY, 20, 20);
//     };

//   const pdfDoc: any = new jsPDF(params);
//   const content: any = this.gridApi.getDataAsCsv();
//   const contentWithoutQuotes = content.replace(/"/g, '');
//   const rows = contentWithoutQuotes.split('\n').map((row: any) => row.split(','));
//   const columns = rows.shift() || [];
//   const dateColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('date'));
//   if (dateColumnIndex !== -1) {
//     for (let i = 0; i < rows.length; i++) {
//       const row = rows[i];
//       if (row[dateColumnIndex]) {
//         // Parse the date with the specified format
//         const formattedDate = moment(row[dateColumnIndex], 'YYYY-MM-DDTHH:mm:ss').format('DD-MM-YYYY');
//         row[dateColumnIndex] = formattedDate;
//       }
//     }
//   }
//   if (content) {
//     const currentDate = moment().format('DD-MM-YYYY'); // Format current date
//     const options = {
//       startY: 15, // Adjust startY to add space after the header
//       head: [columns],
//       body: rows,
//       styles: {
//         fontSize: 8, // Set the desired font size
//         maxCellHeight: 6, // Set the desired row height
//       },
//       didDrawPage: (data: any) => {
//         // Decrease header height
//         if (data.pageNumber === 1) {
//           const text = 'Unit Details';
//           const textFontSize = 11; // Set the desired font size for the text
//           pdfDoc.setFontSize(textFontSize);
//           const textWidth = pdfDoc.getStringUnitWidth(text) * 12 / pdfDoc.internal.scaleFactor;
//           const centerPos = (pdfDoc.internal.pageSize.width / 2) - (textWidth / 2);

//           // Draw text
//           pdfDoc.text(text, centerPos, 10);

//           // Draw underline
//           const underlinePos = 11;
//           pdfDoc.setLineWidth(0.5);
//           pdfDoc.line(centerPos, underlinePos, centerPos + textWidth, underlinePos);

//           // Draw current date in the top-right corner
//           const dateText = `Asset Date: ${currentDate}`;
//           pdfDoc.setFontSize(9);
//           const dateTextWidth = pdfDoc.getStringUnitWidth(dateText) * 12 / pdfDoc.internal.scaleFactor;
//           const datePos = pdfDoc.internal.pageSize.width - dateTextWidth - 10;
//           pdfDoc.text(dateText, datePos, 10);
//         }
//       },
//     };
//     pdfDoc.autoTable(options);
//     pdfDoc.save('Unitanalysis.pdf');
//   }
// }

downloadPDF() {
  const params = {
    orientation: 'landscape' as const,
  };

  const logoImage = new Image();
  logoImage.src = "assets/img/TKGlogo.jpg"; // Provide the correct path to your company logo

  logoImage.onload = () => {
    const pdfDoc: any = new jsPDF(params);

    const rightTopX = pdfDoc.internal.pageSize.width -30; // Adjust X coordinate
    const rightTopY = 10; // Adjust Y coordinate
    pdfDoc.addImage(logoImage, 'PNG', rightTopX, rightTopY, 20, 20);

    const content: any = this.gridApi.getDataAsCsv();
    const contentWithoutQuotes = content.replace(/"/g, '');
    const rows = contentWithoutQuotes.split('\n').map((row: any) => row.split(','));
    const columns = rows.shift() || [];
    const dateColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('date'));

    if (dateColumnIndex !== -1) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[dateColumnIndex]) {
          // Parse the date with the specified format
          const formattedDate = moment(row[dateColumnIndex], 'YYYY-MM-DDTHH:mm:ss').format('DD-MM-YYYY');
          row[dateColumnIndex] = formattedDate;
        }
      }
    }

    if (content) {
      const currentDate = moment().format('DD-MM-YYYY'); // Format current date
      const options = {
        startY: 15, // Adjust startY to add space after the header
        head: [columns],
        body: rows,
        styles: {
          fontSize: 8, // Set the desired font size
          maxCellHeight: 6, // Set the desired row height
        },
        didDrawPage: (data: any) => {
          // Decrease header height
          if (data.pageNumber === 1) {
            const text = 'Unit Details';
            const textFontSize = 11; // Set the desired font size for the text
            pdfDoc.setFontSize(textFontSize);
            const textWidth = pdfDoc.getStringUnitWidth(text) * 12 / pdfDoc.internal.scaleFactor;
            const centerPos = (pdfDoc.internal.pageSize.width / 2) - (textWidth / 2);

            // Draw text
            pdfDoc.text(text, centerPos, 10);

            // Draw underline
            const underlinePos = 11;
            pdfDoc.setLineWidth(0.5);
            pdfDoc.line(centerPos, underlinePos, centerPos + textWidth, underlinePos);

            // Draw current date in the top-right corner
            const dateText = `Asset Date: ${currentDate}`;
            pdfDoc.setFontSize(9);
            const dateTextWidth = pdfDoc.getStringUnitWidth(dateText) * 12 / pdfDoc.internal.scaleFactor;
            const datePos = pdfDoc.internal.pageSize.width - dateTextWidth - 10;
            pdfDoc.text(dateText, datePos, 10);
          }
        },
      };
      pdfDoc.autoTable(options);
      pdfDoc.save('Unitanalysis.pdf');

    }
  }
}

close(){
  this.router.navigateByUrl('/home');
}
onSubmit(){
  if (this.assetReoprtForm.valid) {
    const formValues: IReportData = this.assetReoprtForm.value;
    this.propCls.BlockCode = formValues.BlockCode;
    this.propCls.Company = this.userData.company;
    this.propCls.FromDate = formValues.FromDate;
    this.propCls.Location = this.userData.location;
    this.propCls.PropCode = formValues.PropCode;
    this.propCls.RefNo = this.userData.sessionID;
    this.propCls.Report = formValues.Report;
    this.propCls.ToDate = formValues.ToDate;
    this.propCls.UnitID = formValues.UnitID;
    this.propCls.UnitStatus = formValues.UnitStatus;
    this.propCls.User = this.userData.sessionID;
    this.loader.start();
    try {
      this.subSink.sink = this.projectService.GetReportUnitsData(this.propCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        else {
          this.rowData = [];
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
  else {
    return;
  }
}
}
