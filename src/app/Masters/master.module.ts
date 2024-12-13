import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterRoutingModule } from './master-routing.module';
import { MasterItemsComponent } from './master-items/master-items.component';
import { ExchangeRatesComponent } from './exchange-rates/exchange-rates.component';
import { ReportRemarksComponent } from './report-remarks/report-remarks.component';
import { DocumentNumbersComponent } from '../utilities/document-numbers/document-numbers.component';
import { PeriodClosureComponent } from './period-closure/period-closure.component';
import { SystemParametersComponent } from './system-parameters/system-parameters.component';
import { HelpUpdateComponent } from './help-update/help-update.component';
import { DocumentNumberingDetailsComponent } from '../utilities/document-numbers/document-numbering-details/document-numbering-details.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { GeneralModule } from '../general/general.module';
@NgModule({
  declarations: [
    MasterItemsComponent,
    ExchangeRatesComponent,
    ReportRemarksComponent,
    DocumentNumbersComponent,
    PeriodClosureComponent,
    SystemParametersComponent,
    HelpUpdateComponent,
    DocumentNumberingDetailsComponent,
    FileUploadComponent
  ],
  imports: [
    CommonModule,
    MasterRoutingModule,
    GeneralModule
  ],
})
export class MasterModule { }
