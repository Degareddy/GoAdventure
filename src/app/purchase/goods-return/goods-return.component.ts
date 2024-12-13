import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-goods-return',
  templateUrl: './goods-return.component.html',
  styleUrls: ['./goods-return.component.css']
})
export class GoodsReturnComponent implements OnInit {
  grnForm!: FormGroup;
  modes:Item[]=[];
  private subSink: SubSink = new SubSink();
  retMessage!: string;
  textMessageClass!: string;
  constructor(private fb: FormBuilder, private userDataService: UserDataService, private masterService: MastersService,) {
    this.grnForm = this.forminit();
   }
   commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  ngOnInit(): void {

    const modeBody = {
      ...this.commonParams(),
      item: 'ST111'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(modeBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
        else{
          this.retMessage="Modes list empty!";
          this.textMessageClass="red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }
  forminit() {
    return this.fb.group({
      mode: ['View']
    })
  }
  onSubmit() {

  }
  modeChange(event:any){

  }
}
