import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { MasterParams } from 'src/app/modals/masters.modal';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { FileData } from 'src/app/Masters/master.class';
@Component({
  selector: 'app-site-files-upload',
  templateUrl: './site-files-upload.component.html',
  styleUrls: ['./site-files-upload.component.css']
})
export class SiteFilesUploadComponent implements OnInit, OnDestroy {
  siteUploadForm!: FormGroup;
  @ViewChild('fileInput') fileInput!: ElementRef;
  properytList: Item[] = [];
  blocksList: Item[] = [];
  flatsList: Item[] = [];
  modes:Item[]=[];
  private subSink: SubSink;
  retMessage: string = "";
  textMessageClass: string = "";
  masterParams!: MasterParams;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  fileData!: FileData;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  imagePreview: string | ArrayBuffer | null = null;
  imageBlob: string | null = null;
  imageView: boolean = false;
  selectedFile: File | null = null;
  fileName:string="";
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "fileType", headerName: "File Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "fileFullPath", headerName: "File", sortable: true, filter: true, resizable: true, flex: 2 },
  { field: "fileName", headerName: "File name", sortable: true, filter: true, resizable: true, flex: 2 },
  { field: "fileSizeMb", headerName: "Size", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "unit", headerName: "Units", sortable: true, filter: true, resizable: true, flex: 1 },
    //
  ];
  rowData: any = [];
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, private userDataService: UserDataService, private masterService: MastersService,) {
    this.siteUploadForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.fileData = new FileData();
  }
  ngOnDestroy() {
    this.subSink.unsubscribe();

  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onRowClick(row: any, i: number) {
    // this.fileName = "";
    // this.displayMessage("", "");
    // this.imageBlob = null;
    // this.fileName = row.data.fileName;
    // this.downloadSelectedFile(row.data.fileName);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }
  upload() {

  }
  onFileSelected(event: any) {
    this.displayMessage("", "");
    this.imageBlob = null;
    // this.reset();
    const fileInput = event.target;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      const file = fileInput.files[0];
      const reader = new FileReader();
      if (this.isImage(file)) {
        this.imageView = true;
        reader.onload = () => {
          this.imagePreview = reader.result;
        };
        reader.readAsDataURL(file);
        this.fileData.fileType = 'img';
      }
      else {
        this.selectedFile = null;
        this.imagePreview = null;
        this.imageView = false;
        this.imageBlob = null;
        this.displayMessage("Invalid file type detected. Only image files (e.g., .jpg, .png) are permitted. Please upload an appropriate image file.", "red");

      }
    }
  }
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  async loadData() {
    const propertybody: getPayload = {
      ...this.commonParams(),
      item: 'PROPERTY'
    };
    const property$ = await this.masterService.GetMasterItemsList(propertybody);
    this.subSink.sink = forkJoin([property$]).subscribe(([propRes]: any) => {
      this.loader.stop();
      if (propRes.status.toUpperCase() === "SUCCESS") {
        this.properytList = propRes['data'];
      }
      else {
        this.retMessage = "Property list empty!";
        this.textMessageClass = "red";
        return;
      }
    },
      error => {
        // this.handleError(error);
      }
    );
  }
  formInit() {
    return this.fb.group({
      mode:['View'],
      property: ['', Validators.required],
      block: ['', Validators.required],
      flat: ['', Validators.required]
    })
  }
  onSubmit() {

  }
  ngOnInit() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    const modeBody = this.createRequestData('SA6');
    this.subSink.sink =  this.masterService.getModesList(modeBody).subscribe((modeRes: getResponse) => {
      if (modeRes.status.toUpperCase() === "SUCCESS") {
        this.modes = modeRes['data'];
        // if (this.modes.length === 1) {
        //   // this.userForm.controls['mode'].patchValue(this.modes[0].itemCode, { emitEvent: false })
        // }
      }
    });
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
  async onSelectedPropertyChanged() {
    this.blocksList = [];
    // this.clearMsgs();
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.siteUploadForm.controls['property'].value;
    if (this.masterParams.item != 'All') {
      this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.blocksList = result['data'];
        }
        else {
          // this.handleError(result);
        }
      });
    }

  }
  async onSelectedBlockChanged() {
    // this.clearMsgs();
    this.masterParams.type = 'FLAT';
    this.masterParams.item = this.siteUploadForm.controls['property'].value;
    this.masterParams.itemFirstLevel = this.siteUploadForm.controls['block'].value;
    if (this.masterParams.item != 'All') {
      try {
        this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: getResponse) => {
          if (result.status.toUpperCase() === "SUCCESS") {
            this.flatsList = result['data'];
          }
          else {
            // this.handleError(result);
          }
        });
      }
      catch (ex: any) {
        // this.handleError(ex);
      }
    }
  }
  reset() {
    this.displayMessage("", "");
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageView = false;
    this.imageBlob = null;
    this.fileName = "";
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  deleteFile() {

  }

}
