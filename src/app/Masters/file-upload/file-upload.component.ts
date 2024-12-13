import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MastersService } from 'src/app/Services/masters.service';
import { HttpEventType } from '@angular/common/http';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { FileData, DelFileInfo } from '../master.class';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SubSink } from 'subsink';
import { ToastrService } from 'ngx-toastr';
import { UserDataService } from 'src/app/Services/user-data.service';
import { FileDataResponse } from './file.interface';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';

export interface UploadFileRequest {
  file: File;
  mode: string;
  company: string;
  location: string;
  user: string;
  refNo: string;
  tranType: string;
  tranNo: string;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  mode!: string;
  pdfPreview: SafeResourceUrl | null = null;
  private pdfBlob: Blob | null = null;
  selectedFile: File | null = null;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public uploadProgress: number | undefined;
  uploadProgressview: string[] = [];
  imagePreview: string | ArrayBuffer | null = null;
  imageBlob: string | null = null;
  imageView: boolean = false;
  pdfView: boolean = false;
  retMessage: string = "";
  textMessageClass: string = "";
  msg: string[] = ['', '', '', '', ''];
  fileData!: FileData;
  fileName: string = "";
  delFileInfo !: DelFileInfo;
  private loader!: NgxUiLoaderService;
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "fileType", headerName: "File Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "fileFullPath", headerName: "File", sortable: true, filter: true, resizable: true, flex: 2 },
  { field: "fileName", headerName: "File name", sortable: true, filter: true, resizable: true, flex: 2 },
  { field: "fileSizeMb", headerName: "Size", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "unit", headerName: "Units", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "fileStatus", headerName: "File Status", sortable: true, filter: true, resizable: true, flex: 1 },
    //
  ];
  private subsink!: SubSink;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  pdfSrc: SafeResourceUrl | null = null;
  excelBlob: any;
  csvBlob: any;
  constructor(private fileUploadService: MastersService, private sanitizer: DomSanitizer, private toaster: ToastrService,
    private loaderService: NgxUiLoaderService, private userDataService: UserDataService, public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, search: string, tranType: string; }) {
    this.fileData = new FileData();
    this.subsink = new SubSink();
    this.delFileInfo = new DelFileInfo();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  ngOnInit(): void {
    this.mode = this.data.mode;
    if(this.data.tranNo){
      this.loadData(this.data.tranNo);
    }
  }
  loadData(tranNo: string) {
    this.fileData.company = this.userDataService.userData.company;
    this.fileData.location = this.userDataService.userData.location;
    this.fileData.user = this.userDataService.userData.userID;
    this.fileData.refNo = this.userDataService.userData.sessionID;
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      tranNo: tranNo,
      tranType: this.data.tranType
    }
    try {
      this.rowData = [];
      this.subsink.sink = this.fileUploadService.GetFilesList(body).subscribe((res: FileDataResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
      this.rowData = [];
    }

  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }
  onRowClick(row: any, i: number) {
    this.fileName = "";
    this.displayMessage("", "");
    this.imageBlob = null;
    this.fileName = row.data.fileName;
    this.downloadSelectedFile(row.data.fileName);
  }

  ngAfterViewInit(): void {
    this.loader = this.loaderService;
  }
  showImagePreview(filePath: string) {
    const imageElement = document.getElementById('previewImage') as HTMLImageElement;
    fetch(filePath)
      .then(response => response.blob())
      .then(blob => {
        const objectURL = URL.createObjectURL(blob);
        imageElement.src = objectURL;
      })
      .catch(error => {
        // console.error('Error fetching image:', error);
      });
  }

  reset() {
    this.uploadProgressview[0] = "";
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageView = false;
    this.pdfView = false;
    this.imageBlob = null;
    this.retMessage = "";
    this.textMessageClass = "";
    this.excelBlob=null;
    this.fileName = "";
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onFileSelected(event: any) {
    this.displayMessage("", "");
    this.imageBlob = null;
    this.pdfBlob = null;
    // this.reset();
    const fileInput = event.target;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      const file = fileInput.files[0];
      const reader = new FileReader();
      if (this.isImage(file)) {
        this.imageView = true;
        this.pdfView = false;
        reader.onload = () => {
          this.imagePreview = reader.result;
        };
        reader.readAsDataURL(file);
        this.fileData.fileType = 'img';
      }
      else if (this.isPdf(file)) {
        this.pdfView = true;
        this.imageView = false;
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            this.pdfBlob = new Blob([reader.result], { type: 'application/pdf' });
            const unsafeUrl = URL.createObjectURL(this.pdfBlob);
            this.pdfPreview = this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);  // Sanitize the PDF URL
          }
        };
        reader.readAsArrayBuffer(file);
        this.imagePreview = null;
        this.fileData.fileType = 'pdf';
      }
      else if (this.isExcel(file) || this.isCsv(file)) {
        this.imageView = false;
        this.pdfView = false;
        this.imagePreview = null;
        reader.onload = () => {
          // console.log(reader.result);
        };
        reader.readAsText(file);
        this.fileData.fileType = this.isCsv(file) ? 'csv' : 'excel';
      }
      else {
        this.selectedFile = null;
        this.imagePreview = null;
        this.imageView = false;
        this.pdfView = false;
        this.imageBlob = null;
        this.pdfBlob = null;
      }
    }
  }
  isExcel(file: File): boolean {
    return file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  isCsv(file: File): boolean {
    return file.name.endsWith('.csv') || file.type === 'text/csv';
  }

  getBlobUrl(blob: Blob): any {
    return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
  }
  downloadImage() {
    if (this.imageBlob) {
      const blob = this.base64ToBlob(this.imageBlob, 'image/jpeg');
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = 'downloaded-image.jpg';
      link.click();
      URL.revokeObjectURL(url);
    }
    else if (this.pdfBlob) {
      const url = URL.createObjectURL(this.pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'downloaded-file.pdf';
      link.click();
      URL.revokeObjectURL(url);
    }
    else if (this.excelBlob) {
      const url = URL.createObjectURL(this.excelBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'downloaded-file.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    }
    else if (this.csvBlob) {
      const url = URL.createObjectURL(this.csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'downloaded-file.csv'; // Set the CSV file name
      link.click();
      URL.revokeObjectURL(url);
    } else {
      this.toaster.error("No PDF or Image available to download", "ERROR");
    }
  }

  pdfbase64ToBlob(base64: string, type: string): Blob {
    const base64WithoutPrefix = base64;
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: type });
  }

  base64ToBlob(base64Data: string, contentType: string): Blob {
    const base64WithoutPrefix = base64Data.split(',')[1];
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isPdf(file: File): boolean {
    return file.type === 'application/pdf';
  }
  getBlobUrldownload(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  upload() {
    this.displayMessage("", "");
    this.msg[0] = '';
    if (this.selectedFile) {
      const formData: FormData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('mode', this.data.mode);
      formData.append('company', this.userDataService.userData.company);
      formData.append('location', this.userDataService.userData.location);
      formData.append('user', this.userDataService.userData.userID);
      formData.append('refNo', this.userDataService.userData.sessionID);
      formData.append('tranType', this.data.tranType);
      formData.append('tranNo', this.data.tranNo);
      this.loader.start();
      this.subsink.sink = this.fileUploadService.uploadFile(formData).subscribe((event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.loaded % 1024 === 0 || event.loaded === event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
            this.uploadProgressview[0] = `Upload progress: ${this.uploadProgress}%`;
          }
        }
        else if (event.type === HttpEventType.Response) {
          let responseBody = event.body;
          if (responseBody['status'].toUpperCase() === "SUCCESS") {
            this.loader.stop();
            this.displayMessage("Success: " + responseBody.message, "green");
            this.uploadProgressview[0] = "";
            this.selectedFile = null;
            this.imageBlob = null;
            this.pdfBlob = null;
            this.imagePreview = null;
            this.imageView = false;
            if (this.fileInput) {
              this.fileInput.nativeElement.value = '';
            }
            this.fileData.fileFullPath = responseBody['tranNoNew'];
            this.loadData(responseBody['tranNoNew']);

          }
          else {

            this.displayMessage("Error: " + responseBody.message, "red");
          }
        }

      }, error => {
        this.displayMessage("Error during file upload: " + error.message, "red");
        this.loader.stop();
        return;
      });
    }
  }

  private isImageFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpeg');
  }

  private isPdfFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
  }

  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  downloadSelectedFile(fileName: string) {
    this.imageBlob = null;
    this.pdfBlob = null;
    this.pdfPreview = null;
    this.imagePreview= null;
    this.loader.start();
    this.subsink.sink = this.fileUploadService.downloadFile(fileName).subscribe((res: Blob) => {
      this.loader.stop();
      this.convertBlobToBase64(res).then((base64: string) => {
        if (this.isImageFile(fileName)) {
          this.imageBlob = base64;
        }
        else if (this.isPdfFile(fileName)) {
          this.pdfView = true;
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              this.pdfBlob = new Blob([reader.result], { type: 'application/pdf' });
              const unsafeUrl = URL.createObjectURL(this.pdfBlob);
              this.pdfPreview = this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);
            }
          };
          reader.readAsArrayBuffer(res);
        }
        else if (this.isExcelFile(fileName)) {
          const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          this.downloadBlob(blob, fileName);

        } else if (this.isCsvFile(fileName)) {
          const blob = new Blob([res], { type: 'text/csv' });
          this.downloadBlob(blob, fileName);
        }
        else {
          this.toaster.error("Unsupported file type", "ERROR");
        }
      }).catch(() => {
        this.toaster.error("Error converting file", "ERROR");
      });
    });
  }
  isExcelFile(fileName: string): boolean {
    return fileName.match(/\.(xlsx|xls)$/i) !== null;
  }
  isCsvFile(fileName: string): boolean {
    return fileName.match(/\.csv$/i) !== null;
  }
  downloadBlob(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
  deleteFile() {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult != true && dialogResult != "NO") {
        this.deleteSelectedFile();
      }
    });
  }

  deleteSelectedFile() {
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.fileName !== '' && this.fileName != undefined && this.fileName != null) {
      this.delFileInfo.mode = "DELETE";
      this.delFileInfo.company = this.userDataService.userData.company;
      this.delFileInfo.location = this.userDataService.userData.location;
      this.delFileInfo.user = this.userDataService.userData.userID;
      this.delFileInfo.refNo = this.userDataService.userData.sessionID;
      this.delFileInfo.tranType = this.data.tranType;
      this.delFileInfo.tranNo = this.data.tranNo;
      this.delFileInfo.fileName = this.fileName;
      this.loader.start();
      try{
        this.subsink.sink = this.fileUploadService.deleteFile(this.delFileInfo).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.loadData(this.data.tranNo);
            this.imageBlob = null;
            this.selectedFile = null;
            this.displayMessage("Success: " + res.message, "green");
            this.fileName = "";
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
          }
        });
      }
      catch(ex:any){
        this.displayMessage("Exception: " + ex.message, "red");
      }

    }
    else {
      this.displayMessage("Select a file in grid to delete! ", "red");
      return;
    }
  }
}
