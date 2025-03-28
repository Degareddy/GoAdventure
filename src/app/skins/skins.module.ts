import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypesComponent } from './types/types.component';
import { SkinsRoutingModule } from './skins/skins-routing.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { GeneralModule } from '../general/general.module';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { SubTypesComponent } from './sub-types/sub-types.component';
import { GradeComponent } from './grade/grade.component';
import { MaterialReceiptComponent } from './material-receipt/material-receipt.component';
import { BatchComponent } from './batch/batch.component';
import { ReceiptComponent } from './receipt/receipt.component';
import { LossBookingComponent } from './loss-booking/loss-booking.component';
import { GradeChangeComponent } from './grade-change/grade-change.component';
import { RawSalesComponent } from './raw-sales/raw-sales.component';
import { PackListComponent } from './pack-list/pack-list.component';
import { ProcessedSalesComponent } from './processed-sales/processed-sales.component';
import { TransferComponent } from './transfer/transfer.component';



@NgModule({
  declarations: [
    TypesComponent,
    SubTypesComponent,
    GradeComponent,
    MaterialReceiptComponent,
    BatchComponent,
    ReceiptComponent,
    LossBookingComponent,
    GradeChangeComponent,
    RawSalesComponent,
    PackListComponent,
    ProcessedSalesComponent,
    TransferComponent
  ],
  imports: [
    CommonModule,
    SkinsRoutingModule,
    NgMultiSelectDropDownModule.forRoot(),
        GeneralModule,
  ],
   schemas: [NO_ERRORS_SCHEMA],
    providers: [
      { provide: DateAdapter, useClass: AppDateAdapter },
      { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
    ]
})
export class SkinsModule { }
