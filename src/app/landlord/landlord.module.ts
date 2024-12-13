import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LandlordRoutingModule } from './landlord-routing.module';
import { UtilitiesModule } from '../utilities/utilities.module';
import { GeneralModule } from '../general/general.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    LandlordRoutingModule,
    UtilitiesModule,
    GeneralModule
  ]
})
export class LandlordModule { }
