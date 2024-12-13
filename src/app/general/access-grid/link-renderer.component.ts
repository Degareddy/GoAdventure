import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
selector: 'app-lnk-rnder',
styleUrls: ['./access-grid.component.css'],
template: '<span class="lnkrenderer" (click)="invokeLnkClick()">{{params.value}}</span>'
})

export class LinkRendererComponent implements ICellRendererAngularComp {
  public params: any;

agInit(params: any) {

  this.params = params;
}

public invokeLnkClick() {
  this.params.context.componentParent.onLnkClicked({row: this.params.rowIndex + 1, data: this.params.data});
}
// public invokeLnkClick() {
//   if (this.params.colDef.field === 'detail') {
//     this.params.context.componentParent.onDetailClick({ row: this.params.rowIndex + 1, data: this.params.data });
//   } else if (this.params.colDef.field === 'tranNo') {
//     this.params.context.componentParent.onTranNoClick({ row: this.params.rowIndex + 1, data: this.params.data });
//   }
// }

refresh(): boolean {
  return false;
}

}
