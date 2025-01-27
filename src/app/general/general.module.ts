import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessGridComponent } from './access-grid/access-grid.component';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NumberFormatDirective } from 'src/app/general/number-format.directive';
import { SearchPartyComponent } from './search-party/search-party.component';
import { SearchProductComponent } from './search-product/search-product.component';
import { SearchProjectComponent } from './search-project/search-project.component';
import { DirectionsComponent } from './directions/directions.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ReprotsComponent } from './reprots/reprots.component';
import { FlatSearchComponent } from './flat-search/flat-search.component';
import { SearchAssetComponent } from './search-asset/search-asset.component';
import { MaterialModule } from '../material/material.module';
import { SendsmsComponent } from './sendsms/sendsms.component';
import { SeparatorDirective } from './separator.directive';
import { ExchangeDirective } from './exchange.directive';
import { NotesComponent } from './notes/notes.component';
import { MessageBoxComponent } from './message-box/message-box.component';
import { LogComponent } from './log/log.component';
import { AlphanumericDirective } from './alphanumeric.directive';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from './date-format';
import { ReceiptDetailsDataComponent } from './reprots/receipt-details-data/receipt-details-data.component';
import { LinkRendererComponent } from './access-grid/link-renderer.component';
import { BtnRendererComponent } from './access-grid/button-renderer.component';
import { DetailRendererComponent } from './access-grid/detail-renderer.component';
import { SideOverlayComponent } from './side-overlay/side-overlay.component';
import { SearchCashTransferComponent } from './search-cash-transfer/search-cash-transfer.component';
import { DebitCreditNoteComponent } from './debit-credit-note/debit-credit-note.component';
// import { LoaderComponent } from './loader/loader.component';
@NgModule({
  declarations: [AccessGridComponent,
    SearchPartyComponent,
    SearchProductComponent,
    SearchProjectComponent,
    DirectionsComponent,
    PageNotFoundComponent,
    ConfirmDialogComponent,
    ReprotsComponent,
    FlatSearchComponent,
    SearchAssetComponent,
    NumberFormatDirective,
    SendsmsComponent,
    SeparatorDirective,
    ExchangeDirective,
    NotesComponent,
    MessageBoxComponent,
    LogComponent,
    AlphanumericDirective,
    ReceiptDetailsDataComponent,
    LinkRendererComponent,
    BtnRendererComponent,
    DetailRendererComponent,
    SideOverlayComponent,
    SearchCashTransferComponent,
    DebitCreditNoteComponent,
    // LoaderComponent,
  ],
  imports: [
    CommonModule,
    AgGridModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  exports: [AccessGridComponent, NumberFormatDirective, SearchPartyComponent, SeparatorDirective, ExchangeDirective, AlphanumericDirective,
    SearchProductComponent,
    SearchProjectComponent,
    DirectionsComponent,
    PageNotFoundComponent,
    ConfirmDialogComponent,
    ReprotsComponent,
    FlatSearchComponent,
    LinkRendererComponent,
    DebitCreditNoteComponent,
    DetailRendererComponent,
    SearchAssetComponent, SendsmsComponent, FormsModule, ReactiveFormsModule, AgGridModule,
    MessageBoxComponent, MaterialModule, BtnRendererComponent, SideOverlayComponent, SearchCashTransferComponent],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class GeneralModule { }
