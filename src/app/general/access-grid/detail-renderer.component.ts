// import { Component } from '@angular/core';
// import { ICellRendererAngularComp } from 'ag-grid-angular';

// @Component({
// selector: 'app-dtl-rnder',
// styleUrls: ['./access-grid.component.css'],
// template: '<span class="dtlrenderer" (click)="invokeDtlClick()">{{params.value}}</span>'
// })

// export class DetailRendererComponent implements ICellRendererAngularComp {
//   public params: any;

// agInit(params: any) {

//   this.params = params;
// }

// public invokeDtlClick() {
//   this.params.context.componentParent.onDtlClicked({row: this.params.rowIndex + 1, data: this.params.data,name:'detail'});
// }


// refresh(): boolean {
//   return false;
// }

// }
import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  selector: 'app-dtl-rnder',
  styleUrls: ['./access-grid.component.css'],
  template: `
    <span class="dtlrenderer" (click)="invokeDtlClick()">
      {{formattedValue}}
    </span>
  `
})
export class DetailRendererComponent implements ICellRendererAngularComp {
  public params: any;
  public formattedValue: string | null = null;

  agInit(params: any): void {
    this.params = params;

    // Check if the value is a number and format accordingly
    if (typeof this.params.value === 'number' || typeof this.params.value === 'string') {
      const numericValue = parseFloat(this.params.value.toString());
      if (!isNaN(numericValue)) {
        // Format the number to two decimal places
        this.formattedValue = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numericValue);
      } else {
        this.formattedValue = this.params.value; // Display non-numeric values as-is
      }
    } else {
      this.formattedValue = this.params.value;
    }
  }

  public invokeDtlClick(): void {
    this.params.context.componentParent.onDtlClicked({
      row: this.params.rowIndex + 1,
      data: this.params.data,
      name: 'detail'
    });
  }

  refresh(): boolean {
    return false;
  }
}
