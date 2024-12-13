import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SalesService } from 'src/app/Services/sales.service';
import { UserData } from 'src/app/admin/admin.module';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { PricingDetailsComponent } from './pricing-details/pricing-details.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent implements OnInit {
  pricingForm!: FormGroup;
  userData!: any;
  masterParams!: MasterParams;
  modes!: any[];
  modeIndex!: number;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  constructor(private fb: FormBuilder, private saleService: SalesService, public dialog: MatDialog) {
    this.pricingForm = this.fornInit();
    this.masterParams = new MasterParams();
  }
  fornInit() {
    return this.fb.group({
      mode: [''],
      priceId: [''],
      id: [''],
      name: [''],
      date: [''],
      notes: [''],
      status: ['']
    });
  }

  onDetailsCilcked(quotationNo: any) {
    //console.log(quotationNo);
    // //console.log(code);
    // this.customerId = code;
    // const dialogRef = this.dialog.open(CustomerDetailsComponent);
    const dialogRef: MatDialogRef<PricingDetailsComponent> = this.dialog.open(PricingDetailsComponent, {
      width: '90%', // Set the width of the dialog
      height: '90%', // Set the height of the dialog
      disableClose: true,
      data: quotationNo  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
  }
  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    // const body = {
    this.masterParams.company = this.userData.company,
      this.masterParams.location = this.userData.location,
      this.masterParams.user = this.userData.userID,
      this.masterParams.item = 'SS7',
      this.masterParams.refNo = this.userData.sessionID
    // };
    this.saleService.getModesList(this.masterParams).subscribe((res: any) => {
      //console.log(res);
      this.modes = res['data'];
      this.modeIndex = this.modes.findIndex(x => x.itemCode === "View");
      this.pricingForm.controls['mode'].setValue(this.modes[this.modeIndex].itemCode);
    });
  }
  onSubmit() {

  }
  Close() {

  }
  reset() {
    this.pricingForm.reset();
  }
}
