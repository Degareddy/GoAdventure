import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { FlatClass } from '../Project.class';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { ProjectsService } from 'src/app/Services/projects.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin, map, Observable, startWith } from 'rxjs';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { DirectionsComponent } from 'src/app/general/directions/directions.component';
import { Router } from '@angular/router';
import { FinancialsComponent } from './financials/financials.component';
import { ServiceNumbersComponent } from './service-numbers/service-numbers.component';
import { EquipmentComponent } from './equipment/equipment.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import jsPDF from 'jspdf';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { PreBookingComponent } from './pre-booking/pre-booking.component';
import { CustomerDetailsComponent } from 'src/app/sales/customer/customer-details/customer-details.component';
import { SendsmsComponent } from 'src/app/general/sendsms/sendsms.component';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { VacantNoticeComponent } from './vacant-notice/vacant-notice.component';
import { MulticlientsAllocationComponent } from './multiclients-allocation/multiclients-allocation.component';

interface flatHistoyObject {
  company: string;
  location: string;
  PropCode: string;
  BlockCode: string;
  UnitCode: string;
  user: string;
  refNo: string;
}
export interface UnitData {
  company: string;
  location: string;
  unitID: string;
  unitName: string;
  unitDate: string; // Date as ISO string
  tenantJoinDate: string; // Date as ISO string
  propCode: string;
  blockCode: string;
  floorNo: number;
  updateAll: boolean;
  fromFloorNo: number;
  toFloorNo: number;
  firstPart: string;
  secondPart: string;
  totalRooms: number;
  floorType: string;
  usageType: string;
  luxuryType: string;
  size: number;
  flinthArea: number;
  carpetArea: number;
  flatType: string;
  plexType: string;
  landLord: string;
  landLordName: string;
  employee: string;
  empName: string;
  currentTenant: string;
  tenantName: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  bedRooms: number;
  bathRooms: number;
  bolconyCount: number;
  unitStatus: string;
  latitude: number;
  longitude: number;
  rentType: string;
  landlordPayDay: number;
  tenantPayDay: number;
  invDay: number;
  notes: string;
  payWhenVacant: boolean;
  hasExtraStudyroom: boolean;
  hasServantRoom: boolean;
  hasServantToilet: boolean;
  hasUtility: boolean;
  hasStore: boolean;
  hasExtraHall: boolean;
  waterDiscount: boolean;
  noRent: boolean;
  pattern: string;
  discType: string;
  discRate: number;
  mode: string | null;
  user: any;
  refNo: any;
  currency: any;
  unitCost: any;
  llCount: any;
  furnish: string
}
export interface flatApiResponse {
  status: string;
  message: string;
  retVal: number;
  data: UnitData;
}

@Component({
  selector: 'app-flats',
  templateUrl: './flats.component.html',
  styleUrls: ['./flats.component.css']
})

export class FlatsComponent implements OnInit, OnDestroy {
  unitDetForm!: FormGroup;
  @Input() max: any;
  today = new Date();
  dialogOpen = false;
  flatCls!: FlatClass;
  modes: Item[] = [];
  props: any = [];
  blocks: Item[] = [];
  flats: Item[] = [];
  floorTypes: Item[] = [];
  usageTypes: Item[] = [];
  flatTypes: Item[] = [];
  vats: Item[] = [];
  retMessage!: string;
  textMessageClass!: string;
  retNum!: number;
  modeIndex!: number;
  flatStatus!: string;
  private subSink: SubSink;
  isDisabled: boolean = false;
  masterParams!: MasterParams;
  landlordCode!: string;
  empCode!: string;
  tenantCode!: string;
  llCount: number = 0;
  selCode!: string;
  newMsg!: string;
  newTranMsg: string = "";
  isMenuOpen = false;
  selMode!: string;
  flatCode!: string;
  currencyList: Item[] = [];
  filteredOptions!: Observable<Item[]>
  bedroomList: Item[] = []
  plexTypeList: Item[] = [
    { itemCode: "Simplex", itemName: 'Simplex' },
    { itemCode: "Duplex", itemName: 'Duplex' },
    { itemCode: "Triplex", itemName: 'Triplex' },
    { itemCode: "Multiplex", itemName: 'Multiplex' }

  ]
  loggedInUserProfile: string = "";
  rentTypeList: Item[] = [
    { itemCode: "MM", itemName: 'Monthly' },
    { itemCode: "BM", itemName: 'By Monthly' },
    { itemCode: "QQ", itemName: 'Quarterly' },
    { itemCode: "HY", itemName: 'Half Yearly' },
    { itemCode: "YY", itemName: 'Yearly' }
  ]
  unitTypeList: Item[] = [];
  comfortsList: Item[] = [];
  logoPath: string = "";
  isRentSelected: boolean = false;

  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    private masterService: MastersService, private pdfService: PdfReportsService,
    private projectService: ProjectsService,
    private utlService: UtilitiesService,
    public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    protected router: Router) {
    this.unitDetForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.flatCls = new FlatClass();
  }

  ngOnDestroy() {
    this.subSink.unsubscribe();
  }

  onInputChange(controlName: string, event: any) {
    const value = parseInt(event.target.value, 10);
    if (value < 0) {
      this.unitDetForm.controls[controlName].patchValue(0);
    }
  }

  nonNegativeNumberValidator(control: FormControl) {
    const value = control.value;
    if (isNaN(value) || value < 0) {
      return { nonNegative: true };
    }
    return null;
  }

  onMenuOpened(): void {
    this.isMenuOpen = true;
  }

  onMenuClosed(): void {
    this.isMenuOpen = false;
  }

  formInit() {
    return this.fb.group({
      unitID: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
      unitName: ['', [Validators.required, Validators.maxLength(50)]],
      unitDate: [new Date(), [Validators.required]],
      joinDate: [new Date(), [Validators.required]],
      propCode: ['', [Validators.required, Validators.maxLength(10)]],
      blockCode: ['', [Validators.required, Validators.maxLength(10)]],
      floorNo: [0, [Validators.required]],
      updateAll: [false],
      fromFloorNo: [{ value: 0, disabled: true }],
      toFloorNo: [{ value: 0, disabled: true }],
      first: [{ value: '', disabled: true }],
      second: [{ value: '', disabled: true }],
      pattern: [{ value: '', disabled: true }],
      totalRooms: [0, [Validators.required,]],
      floorType: ['CERATILE', [Validators.required, Validators.maxLength(50)]],
      usageType: ['', [Validators.required, Validators.maxLength(50)]],
      size: [0],
      flinthArea: [0],
      carpetArea: [0],
      flatType: ['SEMIDET', [Validators.required, Validators.maxLength(10)]],
      plexType: ['Simplex', [Validators.required, Validators.maxLength(10)]],
      landLordName: ['', [Validators.maxLength(50)]],
      empName: ['', [Validators.maxLength(50)]],
      tenantName: ['', [Validators.maxLength(50)]],
      petsAllowed: [false],
      smokingAllowed: [false],
      deposit: [0],
      bedRooms: ["", [Validators.required]],
      bathRooms: [0, [Validators.required]],
      rentType: ['', [Validators.required]],
      latitude: [0],
      longitude: [0],
      landlordPayDay: [6, [Validators.required]],
      tenantPayDay: [5, [Validators.required]],
      invDay: [1, [Validators.required]],
      notes: ['', [Validators.maxLength(256)]],
      payWhenVacant: [false],
      mode: ['View'],
      property: ['', [Validators.required]],
      block: ['', [Validators.required]],
      flat: ['', [Validators.required]],
      bolcony: [0, [Validators.required]],
      luxuryType: ['BUDGET', Validators.required],
      studyRoom: [false],
      servantRoom: [false],
      servantToilet: [false],
      utility: [false],
      store: [false],
      extraHall: [false],
      waterDiscount: [false],
      noRent: [false],
      multiLandLord: [false],
      discType: [{ value: '', disabled: true }],
      discRate: [{ value: '0.00', disabled: true }],
      currency: ['', [Validators.required]],
      unitRate: ['0'],
      furnish: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loggedInUserProfile = this.userDataService.userData.userProfile;
    this.loadData();
    this.updateAll();
    this.waterdiscChanges();
    this.filteredOptions = this.unitDetForm.get('currency')!.valueChanges.pipe(
      startWith(''),
      map((value: any) => this._filter(value || '')),
    );

  }
  private _filter(value: string): Item[] {
    const filterValue = value.toLowerCase();

    return this.currencyList.filter((option: any) => option.itemCode.toLowerCase().includes(filterValue));
  }
  private handleDataLoadSuccess(modesRes: getResponse, propertyRes: getResponse, floorRes: getResponse, useTypeRes: getResponse,
    flatTypeRes: getResponse, comfortRes: getResponse, bedRes: getResponse, currency: getResponse, unitType: getResponse) {
    if (modesRes.status.toUpperCase() === "SUCCESS") {
      this.modes = modesRes.data;
    } else {
      this.retMessage = "Modes list Empty!";
      this.textMessageClass = "red";
      return;
    }
    if (propertyRes.status.toUpperCase() === "SUCCESS") {
      this.props = propertyRes.data;
      if (this.props.length === 1) {
        this.unitDetForm.get('property')!.patchValue(this.props[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    }
    else {
      this.retMessage = "Properties list empty!";
      this.textMessageClass = "red";
      return;
    }
    if (floorRes.status.toUpperCase() === "SUCCESS") {
      this.floorTypes = floorRes.data;
      if (this.floorTypes.length === 1) {
        this.unitDetForm.get('floorType')!.patchValue(this.floorTypes[0].itemCode);
      }
    }
    else {
      this.retMessage = "Floortype list empty!";
      this.textMessageClass = "red";
      return;
    }


    if (useTypeRes.status.toUpperCase() === "SUCCESS") {
      this.usageTypes = useTypeRes.data;
      if (this.usageTypes.length === 1) {
        this.unitDetForm.get('usageType')!.patchValue(this.usageTypes[0].itemCode);
      }
    }
    else {
      this.retMessage = "Usagetype list empty!";
      this.textMessageClass = "red";
      return;
    }

    if (flatTypeRes.status.toUpperCase() === "SUCCESS") {
      this.flatTypes = flatTypeRes.data;
      if (this.flatTypes.length === 1) {
        this.unitDetForm.get('flatType')!.patchValue(this.flatTypes[0].itemCode);
      }
    }
    if (unitType.status.toUpperCase() === "SUCCESS") {
      this.unitTypeList = unitType.data;
      if (this.unitTypeList.length === 1) {
        this.unitDetForm.get('furnish')!.patchValue(this.unitTypeList[0].itemCode);
      }
    }
    else {
      this.retMessage = "Furnish list empty!";
      this.textMessageClass = "red";
      return;
    }
    if (comfortRes.status.toUpperCase() === "SUCCESS") {
      this.comfortsList = comfortRes.data;
      if (this.comfortsList.length === 1) {
        this.unitDetForm.get('luxuryType')!.patchValue(this.comfortsList[0].itemCode);
      }
    }
    else {
      this.retMessage = "Comfort list empty!";
      this.textMessageClass = "red";
      return;
    }

    if (bedRes.status.toUpperCase() === "SUCCESS") {
      this.bedroomList = bedRes.data;
      if (this.bedroomList.length === 1) {
        this.unitDetForm.get('bedRooms')!.patchValue(this.bedroomList[0].itemCode);
      }

    }
    else {
      this.retMessage = "Bedroom list empty!";
      this.textMessageClass = "red";
      return;
    }
    if (currency.status.toUpperCase() === "SUCCESS") {
      this.currencyList = currency.data;
      if (this.currencyList.length === 1) {
        this.unitDetForm.get('currency')!.patchValue(this.currencyList[0].itemCode);
      }
    }
    else {
      this.retMessage = "Currency list empty!";
      this.textMessageClass = "red";
      return;
    }
  }
  ifCmpUser() {
    if (this.loggedInUserProfile === 'cmpuser') {
      this.unitDetForm.get('floorNo')?.disable();
      this.unitDetForm.get('size')?.disable();
      this.unitDetForm.get('flinthArea')?.disable();
      this.unitDetForm.get('carpetArea')?.disable();
      this.unitDetForm.get('bathRooms')?.disable();
      this.unitDetForm.get('totalRooms')?.disable();
      this.unitDetForm.get('bolcony')?.disable();
      this.unitDetForm.get('longitude')?.disable();
      this.unitDetForm.get('latitude')?.disable();
      this.unitDetForm.get('unitRate')?.disable();
      this.unitDetForm.get('unitName')?.disable();
      this.unitDetForm.get('plexType')?.disable();
      this.unitDetForm.get('bedRooms')?.disable();
      this.unitDetForm.get('invDay')?.disable();
      this.unitDetForm.get('tenantPayDay')?.disable();
      this.unitDetForm.get('landlordPayDay')?.disable();
      this.unitDetForm.get('rentType')?.disable();
      this.unitDetForm.get('usageType')?.disable();
      this.unitDetForm.get('flatType')?.disable();
      this.unitDetForm.get('floorType')?.disable();
      this.unitDetForm.get('luxuryType')?.disable();
      this.unitDetForm.get('studyRoom')?.disable();
      this.unitDetForm.get('servantRoom')?.disable();
      this.unitDetForm.get('servantToilet')?.disable();
      this.unitDetForm.get('utility')?.disable();
      this.unitDetForm.get('store')?.disable();
      this.unitDetForm.get('extraHall')?.disable();
      this.unitDetForm.get('payWhenVacant')?.disable();
      this.unitDetForm.get('petsAllowed')?.disable();
      this.unitDetForm.get('smokingAllowed')?.disable();
    }
  }
  async loadData() {
    this.ifCmpUser();

    const modeBody = this.createRequestData('SM806');
    const propertyBody = this.createRequestData('PROPERTY');
    const comfortBody = this.createRequestData('COMFORT');
    const floorBody = this.createRequestData('FLOORTYPE');
    const useTypeBody = this.createRequestData('USAGETYPE');
    const flatTypeBody = this.createRequestData('FLATTYPE');
    const bedroomBody = this.createRequestData('BEDROOM');
    const unitTypeBody = this.createRequestData('FURNISH');
    try {
      const modes$ = this.masterService.getModesList(modeBody);
      const currency$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'CURRENCY', })
      const property$ = this.masterService.GetMasterItemsList(propertyBody);
      const floor$ = this.masterService.GetMasterItemsList(floorBody);
      const useType$ = this.masterService.GetMasterItemsList(useTypeBody);
      const flatType$ = this.masterService.GetMasterItemsList(flatTypeBody);
      const comfort$ = this.masterService.GetMasterItemsList(comfortBody);
      const bedroom$ = this.masterService.GetMasterItemsList(bedroomBody);
      const unitTypes$ = this.masterService.GetMasterItemsList(unitTypeBody);
      this.subSink.sink = await forkJoin([modes$, property$, floor$, useType$, flatType$, comfort$, bedroom$, currency$, unitTypes$]).subscribe(
        ([modesRes, propertyRes, floorRes, useTypeRes, flatTypeRes, comfortRes, bedRes, currency, unitType]: any) => {
          this.handleDataLoadSuccess(modesRes, propertyRes, floorRes, useTypeRes, flatTypeRes, comfortRes, bedRes, currency, unitType);
        },
        error => {
          this.handleError(error.message);
        }
      );
    } catch (ex: any) {
      this.handleError(ex);
    }
    this.refreshData();
  }
  refreshData() {

    this.unitDetForm.get('landLordName')?.enable();
    this.ifCmpUser();
    this.unitDetForm.get('updateAll')?.valueChanges.subscribe((ch: any) => {
      console.log(ch);
      if (ch) {
        this.unitDetForm.get('tenantName')?.patchValue('');
        this.unitDetForm.get('empName')?.patchValue('');
        this.unitDetForm.get('landLordName')?.patchValue('');
        this.unitDetForm.get('tenantName')?.disable();
        this.unitDetForm.get('empName')?.disable();
        this.unitDetForm.get('landLordName')?.disable();
        this.landlordCode = "";
        this.empCode = "";
        this.tenantCode = "";

      }
      else {
        this.unitDetForm.get('tenantName')?.enable();
        this.unitDetForm.get('empName')?.enable();
        this.unitDetForm.get('landLordName')?.enable();
      }
    })
  }
  private createRequestData(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      refNo: this.userDataService.userData.sessionID
    };
  }

  private handleError(errorMessage: string): void {
    this.retMessage = errorMessage;
    this.textMessageClass = 'red';
  }

  updateAll(): void {
    this.subSink.sink = this.unitDetForm.get('updateAll')!.valueChanges.subscribe((value: boolean) => {
      const fromFloorNoControl = this.unitDetForm.get('fromFloorNo');
      const toFloorNoControl = this.unitDetForm.get('toFloorNo');
      const firstControl = this.unitDetForm.get('first');
      const secondControl = this.unitDetForm.get('second');
      const thirdControl = this.unitDetForm.get('pattern');
      if (value) {
        fromFloorNoControl!.enable();
        toFloorNoControl!.enable();
        firstControl!.enable();
        secondControl!.enable();
        thirdControl!.enable();
      } else {
        fromFloorNoControl!.disable();
        fromFloorNoControl!.patchValue(0);
        toFloorNoControl!.disable();
        toFloorNoControl!.patchValue(0);
        firstControl!.disable();
        firstControl!.patchValue('');
        secondControl!.disable();
        secondControl!.patchValue('');
        thirdControl!.patchValue('');
        thirdControl!.disable();
      }
    });
  }
  PatternChanged(pattern: any): void {

  }
  onSecondNameCHnages(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\d/g, '');  // Remove numbers
  }


  waterdiscChanges(): void {
    this.subSink.sink = this.unitDetForm.get('waterDiscount')!.valueChanges.subscribe((value: boolean) => {
      const firstControl = this.unitDetForm.get('discType');
      const secondControl = this.unitDetForm.get('discRate');
      if (value) {
        firstControl!.enable();
        secondControl!.enable();
      } else {
        firstControl!.disable();
        firstControl!.patchValue('');
        secondControl!.disable();
        secondControl!.patchValue('0.00');
      }
    });
  }
  modeChange(event: string): void {
    if (event === 'Add') {
      this.flatStatus = '';
      this.unitDetForm = this.formInit();
      this.unitDetForm.controls.mode.patchValue(event, { emitEvent: false });
      this.unitDetForm.get('flat')!.disable({ emitEvent: false });
      this.unitDetForm.controls.unitID.enable({ emitEvent: false });
      this.retMessage = '';
      this.isDisabled = false;
      this.blocks = [];
      this.updateAll();
      this.waterdiscChanges();
      if (this.props.length === 1) {
        this.unitDetForm.get('property')!.patchValue(this.props[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    } else {
      this.isDisabled = true;
      this.unitDetForm.controls.mode.patchValue(event, { emitEvent: false });
      this.unitDetForm.controls.unitID.disable();
      this.unitDetForm.get('flat')!.enable({ emitEvent: false });
    }
    if (event === 'Pending') {
      this.unitDetForm.get('notes')?.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      this.unitDetForm.get('notes')?.clearValidators();
    }
    this.unitDetForm.get('notes')?.updateValueAndValidity();
  }

  async onSelectedPropertyChanged() {
    this.clearMsgs();
    this.unitDetForm.controls.block.patchValue("");
    this.unitDetForm.controls.flat.patchValue("");
    if (this.unitDetForm.controls.property.value != "") {
      this.masterParams.type = 'BLOCK';
      this.masterParams.item = this.unitDetForm.controls.property.value;
      this.unitDetForm.controls.propCode.patchValue(this.unitDetForm.controls.property.value);
      try {
        this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: getResponse) => {
          if (result.status.toUpperCase() === 'SUCCESS') {
            this.blocks = result.data;
            if (this.blocks.length === 1) {
              this.unitDetForm.get('block')!.patchValue(this.blocks[0].itemCode);
              this.onSelectedBlockChanged()
            }
          } else {
            this.handleError(result.message);
          }
        });
      }
      catch (ex: any) {
        this.handleError(ex.message);
      }

    }

  }

  onSelectedBlockChanged() {
    this.clearMsgs();
    this.unitDetForm.controls.flat.patchValue("");
    if (this.unitDetForm.controls.block.value != "") {
      this.masterParams.type = 'FLAT';
      this.masterParams.item = this.unitDetForm.controls['property'].value;
      this.masterParams.itemFirstLevel = this.unitDetForm.controls['block'].value;
      this.unitDetForm.controls['blockCode'].patchValue(this.unitDetForm.controls['block'].value);
    }
  }

  clearMsgs(): void {
    this.retMessage = "";
    this.textMessageClass = "";
    // this.newTranMsg = "";
  }

  populateFlatData(result: flatApiResponse) {

    const flatCls = result.data;
    const formControls = this.unitDetForm.controls;
    formControls.rentType.patchValue(flatCls.rentType);
    const tntJoinedDate = flatCls.tenantJoinDate === "0001-01-01T00:00:00" ? new Date() : flatCls.tenantJoinDate;
    formControls.joinDate.patchValue(tntJoinedDate);
    formControls.unitID.patchValue(flatCls.unitID);
    formControls.flat.patchValue(flatCls.unitName);
    formControls.unitName.patchValue(flatCls.unitName);
    formControls.unitDate.patchValue(flatCls.unitDate);
    formControls.propCode.patchValue(flatCls.propCode);
    formControls.blockCode.patchValue(flatCls.blockCode);
    formControls.floorNo.patchValue(flatCls.floorNo);
    formControls.totalRooms.patchValue(flatCls.totalRooms);
    formControls.floorType.patchValue(flatCls.floorType);
    formControls.usageType.patchValue(flatCls.usageType);
    formControls.size.patchValue(flatCls.size);
    formControls.flinthArea.patchValue(flatCls.flinthArea);
    formControls.carpetArea.patchValue(flatCls.carpetArea);
    formControls.flatType.patchValue(flatCls.flatType);
    formControls.plexType.patchValue(flatCls.plexType);
    formControls.landLordName.patchValue(flatCls.landLordName);
    formControls.pattern.patchValue(flatCls.pattern);
    formControls.bolcony.patchValue(flatCls.bolconyCount < 0 ? 0 : flatCls.bolconyCount);

    formControls.luxuryType.patchValue(flatCls.luxuryType);
    this.landlordCode = flatCls.landLord;
    formControls.empName.patchValue(flatCls.empName);
    this.empCode = flatCls.employee;
    formControls.tenantName.patchValue(flatCls.tenantName);
    this.tenantCode = flatCls.currentTenant;
    formControls.petsAllowed.patchValue(flatCls.petsAllowed);
    formControls.smokingAllowed.patchValue(flatCls.smokingAllowed);
    formControls.bedRooms.patchValue(flatCls.bedRooms);
    // formControls.bathRooms.patchValue(flatCls.bathRooms);
    formControls.bathRooms.patchValue(flatCls.bathRooms < 0 ? 0 : flatCls.bathRooms);

    this.flatStatus = flatCls.unitStatus;
    // formControls.latitude.patchValue(flatCls.latitude);
    formControls.latitude.patchValue(flatCls.latitude < 0 ? 0 : flatCls.latitude);
    // formControls.longitude.patchValue(flatCls.longitude);
    formControls.longitude.patchValue(flatCls.longitude < 0 ? 0 : flatCls.longitude);

    formControls.landlordPayDay.patchValue(flatCls.landlordPayDay);
    formControls.tenantPayDay.patchValue(flatCls.tenantPayDay);
    formControls.invDay.patchValue(flatCls.invDay);
    formControls.notes.patchValue(flatCls.notes);
    formControls.payWhenVacant.patchValue(flatCls.payWhenVacant);
    formControls.extraHall.patchValue(flatCls.hasExtraHall);
    formControls.studyRoom.patchValue(flatCls.hasExtraStudyroom);
    formControls.servantRoom.patchValue(flatCls.hasServantRoom);
    formControls.servantToilet.patchValue(flatCls.hasServantToilet);
    formControls.store.patchValue(flatCls.hasStore);
    formControls.utility.patchValue(flatCls.hasUtility);
    formControls.waterDiscount.patchValue(flatCls.waterDiscount);
    formControls.discType.patchValue(flatCls.discType);
    formControls.discRate.patchValue(flatCls.discRate);
    formControls.noRent.patchValue(flatCls.noRent);

    this.isRentSelected = flatCls.noRent;
    this.flatCode = flatCls.unitID;
    formControls.currency.patchValue(flatCls.currency);
    formControls.unitRate.patchValue(flatCls.unitCost);

    formControls.furnish.patchValue(flatCls.furnish);
    this.llCount = parseInt(flatCls.llCount);
    if (this.llCount > 1) {

      this.unitDetForm.get('landLordName')?.disable();
    }
    else {
      this.unitDetForm.get('landLordName')?.enable();
    }
  }




  async onSelectedFlatChanged(unitId: string, mode: string) {

    this.clearMsgs();
    this.masterParams.type = 'UNIT';
    this.masterParams.item = unitId;
    this.subSink.sink = await this.projectService.getFlatDetails(this.masterParams).subscribe((result: flatApiResponse) => {

      if (result.status.toUpperCase() === 'SUCCESS') {
        this.populateFlatData(result);
        this.msgHandling(result, mode);
        this.newTranMsg = "";

      } else {
        this.handleError(result.message);
      }
    }, (error: any) => {
      this.handleError(error.message);
    });

  }

  async onFlatSearch() {
    this.clearMsgs();
    if (this.unitDetForm.get('flat')!.value === "") {
      this.flatCode = "";
    }
    const body = {
      ...this.commonParams(),
      Type: 'FLAT',
      Item: this.unitDetForm.get('flat')!.value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.unitDetForm.get('flat')!.patchValue(res.data.selName);
            this.flatCode = res.data.selCode;
            this.onSelectedFlatChanged(res.data.selCode, this.unitDetForm.get('mode')?.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'flat': this.unitDetForm.get('flat')?.value, 'type': 'FLAT',
                  'search': 'Flat Search', property: this.unitDetForm.get('property')!.value, block: this.unitDetForm.get('block')!.value,
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {

                  this.unitDetForm.controls['flat'].patchValue(result.unitName);
                  this.flatCode = result.unitId;

                  try {
                    this.onSelectedFlatChanged(result.unitId, this.unitDetForm.get('mode')?.value);
                    // this.isRentSelected = result.data.noRent;

                  }
                  catch (ex: any) {
                    this.retMessage = ex.message;
                    this.textMessageClass = 'red';
                  }
                }
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
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }


  async onUpdate() {

    this.clearMsgs();
    if (this.unitDetForm.valid) {
      this.populateFlatCls();
      try {
        this.loader.start();
        this.subSink.sink = await this.projectService.UpdateFlatDetails(this.flatCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.retVal >= 100 && res.retVal <= 200) {
            if (this.isRentSelected !== this.unitDetForm.get('noRent')?.value) {

              this.finacials();
            }
            if (this.unitDetForm.controls.mode.value == "Add") {
              this.newTranMsg = res.message;
              this.modeChange("Modify");
              this.onSelectedFlatChanged(res.tranNoNew, "Add");
            }
            else {
              this.onSelectedFlatChanged(res.tranNoNew, this.unitDetForm.get('mode')?.value);
              this.newTranMsg = res.message;
            }
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
        });
      } catch (ex: any) {
        this.loader.stop();
        this.handleError(ex.message);
      }
    } else {
      this.retMessage = 'Enter all mandatory fields!';
      this.textMessageClass = 'red';
    }
  }

  msgHandling(res: any, mode: string) {
    if (mode != "View" && this.newTranMsg != "") {
      this.retMessage = this.newTranMsg;
      this.textMessageClass = 'green';
    }
    else {
      this.retMessage = res.message;
      this.textMessageClass = 'green';
    }
  }

  formatDate(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }

  private populateFlatCls() {
    let date: any;
    let joinDate: any;
    const formControls = this.unitDetForm.controls;
    joinDate = this.formatDate(formControls.joinDate.value);
    date = this.formatDate(formControls.unitDate.value);
    this.flatCls = {
      mode: formControls.mode.value,
      rentType: formControls.rentType.value,
      company: this.userDataService.userData.company,
      tenantJoinDate: joinDate,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      unitID: formControls.unitID.value,
      unitName: formControls.unitName.value,
      unitDate: date,
      propCode: formControls.propCode.value,
      blockCode: formControls.blockCode.value,
      floorNo: formControls.floorNo.value,
      updateAll: formControls.updateAll.value,
      fromFloorNo: formControls.fromFloorNo.value,
      toFloorNo: formControls.toFloorNo.value,
      firstPart: formControls.first.value.toString(),
      secondPart: formControls.second.value,
      pattern: formControls.pattern.value,
      totalRooms: formControls.totalRooms.value,
      floorType: formControls.floorType.value,
      usageType: formControls.usageType.value,
      bolconyCount: formControls.bolcony.value,
      luxuryType: formControls.luxuryType.value,
      size: formControls.size.value,
      flinthArea: formControls.flinthArea.value,
      carpetArea: formControls.carpetArea.value,
      flatType: formControls.flatType.value,
      plexType: formControls.plexType.value,
      currentTenant: formControls.tenantName.value ? this.tenantCode : '',
      landLord: formControls.landLordName.value ? this.landlordCode : '',
      employee: formControls.empName.value ? this.empCode : '',
      petsAllowed: formControls.petsAllowed.value,
      smokingAllowed: formControls.smokingAllowed.value,
      bedRooms: formControls.bedRooms.value,
      bathRooms: formControls.bathRooms.value,
      unitStatus: this.flatStatus,
      latitude: formControls.latitude.value,
      longitude: formControls.longitude.value,
      landlordPayDay: formControls.landlordPayDay.value,
      tenantPayDay: formControls.tenantPayDay.value,
      invDay: formControls.invDay.value,
      notes: formControls.notes.value,
      payWhenVacant: formControls.payWhenVacant.value,
      hasExtraStudyroom: formControls.studyRoom.value,
      hasServantRoom: formControls.servantRoom.value,
      hasServantToilet: formControls.servantToilet.value,
      hasUtility: formControls.utility.value,
      hasStore: formControls.store.value,
      hasExtraHall: formControls.extraHall.value,
      noRent: formControls.noRent.value,
      waterDiscount: formControls.waterDiscount.value,
      discType: formControls.discType.value,
      discRate: formControls.discRate.value,
      currency: formControls.currency.value,
      unitCost: formControls.unitRate.value,
      furnish: formControls.furnish.value
    } as FlatClass;
  }

  preBookingFlat() {
    const dialogRef: MatDialogRef<PreBookingComponent> = this.dialog.open(PreBookingComponent, {
      width: '90%',
      disableClose: true,
      data: {
        type: 'FLAT',
        Trantype: "PREBOOK",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value,
      }
    });

  }
  prevacantNotice() {
    const dialogRef: MatDialogRef<VacantNoticeComponent> = this.dialog.open(VacantNoticeComponent, {
      width: '90%',
      disableClose: true,
      data: {
        type: 'FLAT',
        Trantype: "PREBOOK",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value,
        tenant: this.unitDetForm.get('tenantName')!.value,
        tenantCode: this.tenantCode
      }
    });

  }
  sendSMS() {
    const dialogRef: MatDialogRef<SendsmsComponent> = this.dialog.open(SendsmsComponent, {
      disableClose: true,
      data: {
        type: 'FLAT',
        Trantype: "PREBOOK",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value,
        from: "UNIT"
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  reset() {
    this.onSelectedFlatChanged(this.masterParams.item, "View");
  }

  private createRequestDataForSearch(item: string, type: string) {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      type: type,
      refNo: this.userDataService.userData.sessionID,
      itemFirstLevel: "",
      itemSecondLevel: "",
    };
  }

  async onSupplierSearch() {
    const body = this.createRequestDataForSearch(this.unitDetForm.get('landLordName')!.value || "", "LANDLORD");
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.unitDetForm.get('landLordName')!.patchValue(res.data.selName);
            this.landlordCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.unitDetForm.get('landLordName')!.value, 'PartyType': "MAPLL",
                  'search': 'Landlord Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.unitDetForm.get('landLordName')!.patchValue(result.partyName);
                this.landlordCode = result.code;
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

  async onEmployeeSearch() {
    const body = this.createRequestDataForSearch(this.unitDetForm.get('empName')!.value || "", "EMPLOYEE");
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.unitDetForm.get('empName')!.patchValue(res.data.selName);
            this.empCode = res.data.selCode;

          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.unitDetForm.get('empName')!.value, 'PartyType': "EMPLOYEE",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.unitDetForm.get('empName')!.patchValue(result.partyName);
                this.empCode = result.code;
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
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  async onTenantSearch() {
    const body = this.createRequestDataForSearch(this.unitDetForm.get('tenantName')!.value || "", "TENANT");
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.unitDetForm.get('tenantName')!.patchValue(res.data.selName);
            this.tenantCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.unitDetForm.get('tenantName')!.value, 'PartyType': "MAPTNT",
                  'search': 'Tenant Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.unitDetForm.get('tenantName')!.patchValue(result.partyName);
                  this.tenantCode = result.code;
                }

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
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  direction() {
    const dialogRef: MatDialogRef<DirectionsComponent> = this.dialog.open(DirectionsComponent, {
      width: '90%',
      disableClose: true,
      data: { type: 'FLAT', Trantype: "BOUNDARY", TranNo: this.unitDetForm.controls['unitID'].value, mode: this.unitDetForm.controls['mode'].value }
    });

  }

  finacials() {
    const dialogRef: MatDialogRef<FinancialsComponent> = this.dialog.open(FinancialsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        type: 'FLAT',
        Trantype: "Charge",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value,
        status: this.flatStatus
      }
    });
  }

  multiClient() {
    const dialogRef: MatDialogRef<MulticlientsAllocationComponent> = this.dialog.open(MulticlientsAllocationComponent, {
      width: '90%',
      disableClose: false,
      data: {
        type: '',
        Trantype: "",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value,
        status: this.flatStatus
      }
    });

  }

  Services() {
    const dialogRef: MatDialogRef<ServiceNumbersComponent> = this.dialog.open(ServiceNumbersComponent, {
      width: '90%',
      disableClose: true,
      data: {
        type: 'FLAT',
        Trantype: "Service",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value
      }
    });

  }

  Equipements() {
    const dialogRef: MatDialogRef<EquipmentComponent> = this.dialog.open(EquipmentComponent, {
      width: '90%',
      disableClose: true,
      data: {
        type: 'FLAT',
        Trantype: "Equipment",
        Property: this.unitDetForm.get('property')!.value,
        Block: this.unitDetForm.get('block')!.value,
        Flat: this.flatCode,
        mode: this.unitDetForm.get('mode')!.value
      }
    });

  }

  onDocsCilcked() {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.unitDetForm.get('mode')!.value, tranNo: this.flatCode, search: 'Flat Docs', tranType: "FLAT" }
    });

  }

  Clear() {
    this.unitDetForm.get('landLordName')?.enable();
    this.ifCmpUser();
    this.unitDetForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.flatStatus = "";
    this.flatCode = "";
    this.selMode = "";
    this.updateAll();
    this.waterdiscChanges()
    this.refreshData();
    this.landlordCode = "";
    this.empCode = "";
    this.tenantCode = "";
    if (this.props.length === 1) {
      this.unitDetForm.get('property')!.patchValue(this.props[0].itemCode);
      this.onSelectedPropertyChanged();
    }

  }

  async generatePDF() {
    const body = {
      ...this.commonParams(),
      tenant: this.tenantCode,
      property: this.unitDetForm.get('property')?.value,
      block: this.unitDetForm.get('block')?.value,
      unit: this.flatCode,
    }
    try {
      this.subSink.sink = await this.projectService.GetTenantAgreementDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res.data.code == '999') {
            this.retMessage = res.data.sixthNote;
            this.textMessageClass = "red";
            return;
          }
          else {
            this.agreementGeneration(res);
            this.retMessage = res.message;
            this.textMessageClass = "green";
          }


        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      }),
        (error: any) => {
          this.retMessage = error.message;
          this.textMessageClass = "red";
        }
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }


  }

  agreementGeneration(res: any) {
    const selectedProp = this.props.find((p: any) => p.itemCode === this.unitDetForm.get('property')?.value);
    const selectedPropertyName = selectedProp.itemName;
    this.pdfService.agreementGeneration(selectedPropertyName, this.unitDetForm.get('unitID')?.value, res)

  }

  async historyOfFlat() {
    const body: flatHistoyObject = {
      ...this.commonParams(),
      PropCode: this.unitDetForm.get('property')!.value,
      BlockCode: this.unitDetForm.get('block')!.value,
      UnitCode: this.flatCode
    }
    try {
      this.loader.start();
      this.subSink.sink = await this.projectService.GetUnitAllocationDetails(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.pdfService.generatePDfReport(res, "Flat History");
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
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
  async historyOfGrievances() {
    this.clearMsgs();
    const body: flatHistoyObject = {
      ...this.commonParams(),
      PropCode: this.unitDetForm.get('property')!.value,
      BlockCode: this.unitDetForm.get('block')!.value,
      UnitCode: this.flatCode
    }
    try {
      this.loader.start();
      this.subSink.sink = await this.projectService.GetReportUnitGrievancesHistory(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.pdfService.generatePDfReport(res, "Grievances History");
        }
        else {
          this.handleError(res.message);
        }
      })
    }
    catch (ex: any) {
      this.handleError(ex.message);
    }

  }

  dateChanged(event: any, controlName: string) {
    const control = this.unitDetForm.get(controlName);
    const inputValue = event.target.value;
    const [day, month, year] = inputValue.split('-').map((part: any) => parseInt(part, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        control?.patchValue(date);
      } else {
        console.error('Invalid date:', inputValue);
      }
    } else {
      console.error('Invalid date format:', inputValue);
    }
  }



  tenanDetails(id: any) {
    id = this.tenantCode;
    const dialogRef: MatDialogRef<CustomerDetailsComponent> = this.dialog.open(CustomerDetailsComponent, {
      width: '980px',
      disableClose: true,
      data: { customerId: this.tenantCode, customerName: this.tenantCode, mode: "Modify" }, // Pass any data you want to send to CustomerDetailsComponent
    });

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM806",
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
        'mode': this.unitDetForm.get('mode')!.value,
        'note': this.unitDetForm.get('notes')!.value,
        'TranType': "FLAT",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Units Notes"
      }
    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "FLAT",
        'tranNo': tranNo,
        'search': 'FLAT Log Details'
      }
    });
  }
}
