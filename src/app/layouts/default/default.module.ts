import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LoginComponent } from 'src/app/layouts/login-component/login-component.component';
import { MaterialModule } from 'src/app/material/material.module';
import { CashTransfersComponent } from '../cash-transfers/cash-transfers.component';
import { GeneralModule } from 'src/app/general/general.module';
@NgModule({
  declarations: [LoginComponent, DefaultComponent,CashTransfersComponent],
  imports: [
    MaterialModule,
    CommonModule,
    RouterModule,
    SharedModule,
    FlexLayoutModule,
    GeneralModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DefaultModule {}
