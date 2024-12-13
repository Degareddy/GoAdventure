import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterItems } from '../../../modals/masters.modal';
import { FormBuilder, FormGroup, Validator } from '@angular/forms';
import { MasterParams } from '../../../modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { UserData } from 'src/app/admin/admin.module';

@Component({
  selector: 'app-master-items',
  templateUrl: './master-items.component.html',
  styleUrls: ['./master-items.component.css']
})
export class MasterItemsComponent implements OnInit {

  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  mastForm!: any;
  userData: any;
selected!:string;
  modes!: any[];
  modeIndex!: number;
  typeNamesList!:any[];
  selTypeItemsList!:any[];

  masterParams!: MasterParams;
  constructor(protected masterService: MastersService,
    protected fb: FormBuilder) {
    this.masterParams = new MasterParams();

    this.mastForm = this.fb.group({
      mode: [''],
      company: [''],
      location: [''],
      typeName: [''],
      selTypeItem:[''] ,
      itemCode: [''],
      itemName: [''],
      effectiveDate: [''],
      itemStatus: [''],
      notes: [''],
      imgPath: [''],
      user: [''],
      refNo:['']
    });
  }

  ngOnInit(): void {
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.item = this.userData.item;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    // this.selectedObjects = [{ itemCode: 'View', itemName: 'View' }];

    this.masterService.getModesList(this.masterParams).subscribe((res: any) => {
      //console.log(res);
      this.modes = res['data'];
      this.modeIndex = this.modes.findIndex(x => x.itemCode === "View");
      this.mastForm.controls['mode'].setValue(this.modes[this.modeIndex].itemCode);
    });

    this.masterService.getMasterTypesList(this.masterParams).subscribe((res: any) => {
      ////console.log(res);
      this.typeNamesList = res['data'];
      // this.modeIndex = this.modes.findIndex(x => x.itemCode === "View");
      //this.mastForm.controls['typeName'].setValue(this.typeNamesList[0].itemName);
      this.mastForm.typeName = this.typeNamesList[0].itemName;
      this.mastForm.controls['typeName'].setValue(this.mastForm.typeName);
    });
  }
  onSelectedTypeChanged():void{
    this.masterParams.item = this.mastForm.controls['typeName'].value;
    this.masterService.getSpecificMasterItems (this.masterParams).subscribe((reslt: any) => {
      //console.log(reslt);
      this.selTypeItemsList = reslt['data'];
     // this.mastForm.selTypeItem=this.selTypeItemsList[0].itemName;

    });
  }

  onSelectedItemChanged():void{
    this.masterParams.type = this.mastForm.controls['typeName'].value;
    this.masterParams.item = this.mastForm.controls['selTypeItem'].value;
    //this.masterParams.item =this.mastForm.get('selTypeItem').value;
    //this.masterParams.item =this.mastForm.getRawValue('selTypeItem');
    this.masterService.getSpecificMasterItemDetails (this.masterParams).subscribe((res: any) => {
      this.mastForm.controls['itemCode'].setValue(res['data'].itemCode);
      this.mastForm.controls['itemName'].setValue(res['data'].itemName);
      this.mastForm.controls['effectiveDate'].setValue(res['data'].effectiveDate);
      this.mastForm.controls['itemStatus'].setValue(res['data'].itemStatus);
      this.mastForm.controls['imgPath'].setValue(res['data'].imgPath);
      this.mastForm.controls['notes'].setValue(res['data'].notes);
      //console.log(this.mastForm.value);
    })
  }
  onUpdate():void{
    this.mastForm.controls['company'].setValue(this.userData.company);
    this.mastForm.controls['location'].setValue(this.userData.location);

    this.masterService.updateMasterItemDetails(this.mastForm.value).
    subscribe((result: any) => {
      //console.log(result);
      this.retMessage = result.message;
      this.retNum = result.retVal;

      if (this.retNum === 101 || this.retNum === 102 || this.retNum === 103 || this.retNum === 104) {
        this.textMessageClass = "msgBackColorSuccess"
        //this.retMessage.
      }
      else if (this.retNum < 100) {
        this.textMessageClass = "msgBackColorWarn"
      }
      else if (this.retNum > 200) {
        this.textMessageClass = "msgBackColorWarn"
      }
      else {
        this.textMessageClass = "msgBackColorDefault"
      }

    });
  }
}
