import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TypesComponent } from '../types/types.component';
import { SkinsGuard } from '../skins.guard';
import { SubTypesComponent } from '../sub-types/sub-types.component';
import { GradeComponent } from '../grade/grade.component';
import { MaterialRequestComponent } from 'src/app/inventory/material-request/material-request.component';
import { BatchComponent } from '../batch/batch.component';
import { ReceiptComponent } from '../receipt/receipt.component';
import { LossBookingComponent } from '../loss-booking/loss-booking.component';
import { GradeChangeComponent } from '../grade-change/grade-change.component';
import { RawSalesComponent } from '../raw-sales/raw-sales.component';
import { PackListComponent } from '../pack-list/pack-list.component';
import { ProcessedSalesComponent } from '../processed-sales/processed-sales.component';
import { TransferComponent } from '../transfer/transfer.component';

const routes: Routes = [
  { path: 'types', component:TypesComponent },
  {path:'subtypes',component:SubTypesComponent},
  {path:'grade',component:GradeComponent},
  {path:'mrv',component:MaterialRequestComponent},
  {path:'batch',component:BatchComponent},
  {path:'receipt',component:ReceiptComponent},
  {path:'lossbook',component:LossBookingComponent},
  {path:'grade-change',component:GradeChangeComponent},
  {path:'raw-sales',component:RawSalesComponent},
  {path:'packlist',component:PackListComponent},
  {path:'processed-sales',component:ProcessedSalesComponent},
  {path:'transfer',component:TransferComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SkinsRoutingModule { }
