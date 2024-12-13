import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TenantRoutingModule } from './tenant-routing.module';
import { UtilitiesModule } from 'src/app/utilities/utilities.module';
import { GeneralModule } from 'src/app/general/general.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TenantRoutingModule,
    UtilitiesModule,
    GeneralModule
  ]
})
export class TenantModule { }
