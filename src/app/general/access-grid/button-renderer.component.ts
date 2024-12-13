import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
selector: 'app-btn-rnder',
template: '<span> <button (click)="invokeBtnClick()" class="btn btn-sm btn-info" style="color:while">{{buttonName}} </button></span>'
})

export class BtnRendererComponent implements ICellRendererAngularComp {
  public params: any;
  @Input() buttonName!: string;

agInit(params: any) {
  this.params = params;
  if ( params['colDef'].buttonName != null) {
    this.buttonName = params['colDef'].buttonName;
  } else {
    this.buttonName = params.value;
  }
}

public invokeBtnClick() {
  this.params.context.componentParent.onBtnClicked({ params: this.params, row: this.params.rowIndex + 1,
                                                     data: this.params.data, buttonName: this.buttonName});
}

refresh(): boolean {
  return false;
}

}
