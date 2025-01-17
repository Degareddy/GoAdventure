import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin, timeout } from 'rxjs';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { DatePipe } from '@angular/common';
import { SmsService } from 'src/app/Services/sms.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeneratedInvoicesComponent } from './generated-invoices/generated-invoices.component';

@Component({
  selector: 'app-generate-invoices',
  templateUrl: './generate-invoices.component.html',
  styleUrls: ['./generate-invoices.component.css']
})

export class GenerateInvoicesComponent implements OnInit, OnDestroy {
  formTitle: string = "auto generate invoices";
  private API_KEY: string = "";
  private PARTNER_ID: string = "";
  private SHORTCODE: string = "";
  private bulksmsUrl: string = "";
  autoGenForm!: FormGroup;
  propertyList: Item[] = [];
  blockCode!: string;
  blockList: Item[] = [];
  labelPosition: 'before' | 'after' = 'after';
  textMessageClass: string = "";
  private subsink: SubSink;
  masterParams!: MasterParams;
  retMessage: string = "";
  invYear: string = "";
  invMonthName: string = "";
  rentalInv: string = "";
  inclExpenses: string = "";
  IncludeUtilities: string = "";
  authorize: string = "";
  dateGen: string = "";
  currentInvCnt: number = 0;
  lastMontrhInvCnt: number = 0;
  totalUnits: number = 0;
  revProp: number = 0;
  revLandLord: number = 0;

  nextInvCount: number = 0;
  nextInvMonth: number = 0;
  nextInvDate: string = "";
  nextInvYear: string = "";

  constructor(private fb: FormBuilder, private projService: ProjectsService, private reportsService: PdfReportsService,
    private masterService: MastersService, private router: Router, private datePipe: DatePipe,
    private smsService: SmsService, private userDataService: UserDataService, private snackBar: MatSnackBar,
    private loader: NgxUiLoaderService, public dialog: MatDialog) {
    this.autoGenForm = this.formInit();
    this.subsink = new SubSink();
    this.masterParams = new MasterParams();
  }

  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.refreshData();
    console.log(this.userDataService.userData);
  }

  refreshData() {
    this.autoGenForm.controls.block.valueChanges.subscribe(() => {
      this.resetMessages();
      this.autoGenForm.controls['rentInvoice'].setValue(false);
      this.autoGenForm.controls['includeExpenses'].setValue(false);
      this.autoGenForm.controls['IncludeUtility'].setValue(false);
      this.autoGenForm.controls['authorize'].setValue(false);
      this.autoGenForm.controls['email'].setValue(false);
      this.autoGenForm.controls['sms'].setValue(false);
      this.autoGenForm.controls['whatsapp'].setValue(false);
      this.onSelectedBlockChanged();
    });
  }

  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  private buildRequestParams(item: string): any {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: item
    };
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    }
  }

  async loadData() {
    const propertybody = this.buildRequestParams('PROPERTY');
    const property$ = this.masterService.GetMasterItemsList(propertybody);
    try {
      this.subsink.sink = await forkJoin([property$]).subscribe(
        ([propRes]: any) => {
          this.handleDataLoadSuccess(propRes);
        },
        error => {
          this.handleDataLoadError(error);
        }
      );
    }
    catch (ex: any) {
      this.handleDataLoadError(ex);
    }
    const body = {
      ...this.commonParams(),
      serviceType: "SMS",
      MsgType: "SMS"
    }
    try {
      this.subsink.sink = this.smsService.getMessageCredentials(body).subscribe((res: any) => {
        //  console.log(res);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.API_KEY = res.data.apI_KEY;
          this.PARTNER_ID = res.data.partneR_ID;
          this.SHORTCODE = res.data.shortcode;
          // this.smsUrl = res.data.apI_SMS_URL;
          // this.bulkSmsUrl = res.data.apI_BULK_SMS_URL;
        }
        else {
          // this.retMessage = "SMS credntials are not found!";
          // this.textMessageClass = "red";
        }


      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }

  private handleDataLoadError(error: any): void {
    this.retMessage = error.message;
    this.textMessageClass = 'red';
  }

  private handleDataLoadSuccess(propRes: any): void {
    if (propRes.status.toUpperCase() === "SUCCESS") {
      this.propertyList = propRes['data'];
      if (this.propertyList.length === 1) {
        this.autoGenForm.get('property')!.setValue(this.propertyList[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    }
    else {
      this.retMessage = "Property list empty!";
      this.textMessageClass = "red";
      return;
    }

  }

  async submit() {
    const body = {
      ...this.commonParams(),
      isRentInvoice: this.autoGenForm.get('rentInvoice')!.value,
      Property: this.autoGenForm.get('property')!.value,
      block: this.autoGenForm.get('block')!.value,
      includeExpenses: this.autoGenForm.get('includeExpenses')!.value,
      IncludeUtility: this.autoGenForm.get('IncludeUtility')!.value,
      authorize: this.autoGenForm.get('authorize')!.value,
      email: this.autoGenForm.get('email')!.value,
      sms: this.autoGenForm.get('sms')!.value,
      whatsapp: this.autoGenForm.get('whatsapp')!.value,
    }
    try {
      const startTime = new Date().getTime();
      this.loader.start();
      this.subsink.sink = await this.projService.AutogenerateTenantInvoices(body).subscribe((res: SaveApiResponse) => {
        const endTime = new Date().getTime(); // Capture the end time
        const elapsedTimeInSeconds = (endTime - startTime) / 1000; // Calculate elapsed time in seconds
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message + " Time taken : " + elapsedTimeInSeconds;
          this.textMessageClass = "green";
          this.getReportTenantInvoicesData();

          const dialogRef: MatDialogRef<GeneratedInvoicesComponent> = this.dialog.open(GeneratedInvoicesComponent, {
            width: '90%',
            disableClose: false,
            data: {
              Company: this.userDataService.userData.company,
              Location: this.userDataService.userData.location,
              User: this.userDataService.userData.userID,
              RefNo: this.userDataService.userData.sessionID
            }
          });
        }
        else {
          this.handleDataLoadError(res);
        }
      });
      // console.log('called submit');
    }
    catch (ex: any) {
      this.loader.stop();
      this.handleDataLoadError(ex);
    }
  }


  onGenerate() {
    this.resetMessages();
    if (this.autoGenForm.valid) {
      if (this.autoGenForm.get('authorize')!.value === false) {
        const dialogData = new ConfirmDialogModel("Genetate Invoices", "Are you sure you want to proceed with generating invoices without the necessary authorization?"
        );
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          maxWidth: "400px",
          height: '210px',
          data: dialogData,
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(dialogResult => {
          if (dialogResult === "YES") {
            this.submit();
          }
        });
      }
      else {
        this.submit();
      }

    }
    else {
      this.autoGenForm.markAllAsTouched();
      this.retMessage = "Select all valid fields";
      this.textMessageClass = "red";
      return;
    }
  }

  async getReportTenantInvoicesData() {
    const body = {
      ...this.commonParams(),
      property: this.autoGenForm.controls['property'].value,
      block: this.autoGenForm.controls['block'].value,
    };

    try {
      this.subsink.sink = await this.projService.GetReportTenantInvoicesData(body).subscribe((resp: any) => {
        if (resp.status.toUpperCase() === "SUCCESS") {
          let reportData = resp.data;
          let type: string = "";
          if (this.autoGenForm.controls.email.value === true) {
            type = "EMAIL";
          }
          if (this.autoGenForm.controls.sms.value === true) {
            type = "SMS";
          }
          if (type === "EMAIL" || type === "SMS") {
            if (type.toUpperCase() === "EMAIL") {
              const groupByInvoiceNo = (arr: any) => {
                return arr.reduce((acc: any, invoice: any) => {
                  const { invoiceNo, ...rest } = invoice;
                  if (!acc[invoiceNo]) {
                    acc[invoiceNo] = [];
                  }
                  acc[invoiceNo].push({ invoiceNo, ...rest }); // Include invoiceNo along with the rest of the object
                  return acc;
                }, {});
              };

              const groupedInvoices = groupByInvoiceNo(reportData);
              const filteredInvoices = Object.values(groupedInvoices);
              // for (let i = 0; i < filteredInvoices.length; i++) {
              //   const eachfilterData: any = filteredInvoices[i];

              //   const formFile: any = this.reportsService.generatePDF(filteredInvoices[i], 'GINV', new Date(), type.toUpperCase());

              //   // Alternate the recipient email based on the index
              //   const mailTo = i % 2 === 0 ? 'prathapgundla@gmail.com' : 'dega99@gmail.com';
              //   const mailToName = eachfilterData[0].tenantName;
              //   const mailSubject = 'Invoice : ' + eachfilterData[0].invoiceNo;
              //   const mailMsg = 'Dear ' + eachfilterData[0].tenantName +
              //     ', find the invoice attached for the month of ' + eachfilterData[0].tranYear.toString() +
              //     '-' + eachfilterData[0].tranMonthName + '.';

              //   this.subsink.sink = this.projService.sendEmailWithAttachment(formFile, mailTo, mailToName, mailSubject, mailMsg)
              //     .pipe(timeout(5000))
              //     .subscribe(
              //       (res: any) => {
              //         console.log(res);
              //         this.retMessage = "Email sent successfully";
              //         this.textMessageClass = "green";
              //       },
              //       (error) => {
              //         if (error.name === 'TimeoutError') {
              //           console.error('Request timed out');
              //         } else {
              //           console.error('Error:', error);
              //         }
              //       }
              //     );
              // }

              for (let i = 0; i < filteredInvoices.length; i++) {
                const eachfilterData: any = filteredInvoices[i];
                const formFile: any = this.reportsService.generatePDF(filteredInvoices[i], 'GINV', new Date(), type.toUpperCase());
                const mailTo = eachfilterData[0].emailId;
                // const mailTo = i % 2 === 0 ? 'prathapgundla@gmail.com' : 'dega99@gmail.com';
                const mailToName = eachfilterData[0].tenantName;
                const mailSubject = 'Invoice : ' + eachfilterData[0].invoiceNo;
                const mailMsg = 'Dear ' + eachfilterData[0].tenantName +
                  ', find the invoice attached for the month of ' + eachfilterData[0].tranYear.toString() +
                  '-' + eachfilterData[0].tranMonthName + '.';
                this.subsink.sink = this.projService.sendEmailWithAttachment(formFile, mailTo, mailToName, mailSubject, mailMsg).subscribe(
                  (res: any) => {
                    console.log(res);
                    this.retMessage = "Email sent successfully";
                    this.textMessageClass = "green";
                  },
                  (error) => {
                    if (error.name === 'TimeoutError') {
                      console.error('Request timed out');
                    } else {
                      console.error('Error:', error);
                    }
                  }
                );
              }
            }
            // else if (type.toUpperCase() === "SMS") {
            //   if (this.PARTNER_ID && this.API_KEY && this.SHORTCODE) {
            //     const output: { count?: number; smslist: { [key: string]: any }[] } = {
            //       smslist: []
            //     };
            //     let count = 0;
            //     for (const item of reportData) {
            //       const dateObject = new Date(item.tranDate);
            //       const dueObject = new Date(item.dueDate);
            //       const receiptMonth = this.datePipe.transform(dateObject, 'MMMM');
            //       const receiptYear = this.datePipe.transform(dateObject, 'yyyy');
            //       const dueDate = this.datePipe.transform(dueObject, 'yyyy-MM-dd');
            //       let message = "";
            //       if (this.userDataService.userData.company === "NPML") {

            //         message = `Dear ${item.tenantName},

            //     Rental invoice ${item.invoiceNo} is generated for the unit ${item.unit} at ${item.property} for the month of ${receiptMonth} ${receiptYear}.
            //     The total amount due is KES ${item.totalCharge}. We request you to pay before the due date ${dueDate}.
            //     Thank you,
            //     Nagaad Properties`;
            //       }
            //       else if (this.userDataService.userData.company === "SADASA") {

            //         message = `Mudane/Marwo [${item.tenantName}],
            //         Fadlan bixinta kirada gurigaaga ee Sunnah Towers hubi in la bixiyo kahor 5th January 2025.
            //         Haddii aad su’aalo qabtid, nala soo xiriir [0768757666].

            //       Mahadsanid,
            //       Omar Mumin Mohammed
            //       Sadasa Construction and Property`
            //       }

            //       //               const message = `Dear ${item.tenantName},

            //       // Rental invoice ${item.invoiceNo} is generated for the unit ${item.unit} at ${item.property} for the month of ${receiptMonth} ${receiptYear}.
            //       // The total amount due is KES ${item.totalCharge}. We request you to pay before the due date ${dueDate}.
            //       // Thank you,
            //       // Nagaad Properties`;

            //       if (item.slNo === 1) {
            //         if (item.clientContacts) {
            //           count++;
            //           const smsObject = {
            //             partnerID: this.PARTNER_ID,
            //             apikey: this.API_KEY,
            //             pass_type: "plain",
            //             mobile: item.clientContacts.replace(/[\s+]/g, ''),
            //             message: message,
            //             shortcode: this.SHORTCODE
            //           };
            //           output.smslist.push(smsObject);
            //         }
            //       }
            //       if (count > 0) {
            //         output.count = count;
            //       }
            // //     }
            else if (type.toUpperCase() === "SMS") {
              if (this.PARTNER_ID && this.API_KEY && this.SHORTCODE) {
                const output: { count?: number; smslist: { [key: string]: any }[] } = {
                  smslist: []
                };
                let count = 0;
            
                for (const item of reportData) {
                  const dateObject = new Date(item.tranDate);
                  const dueObject = new Date(item.dueDate);
                  const receiptMonth = this.datePipe.transform(dateObject, 'MMMM');
                  const receiptYear = this.datePipe.transform(dateObject, 'yyyy');
                  const dueDate = this.datePipe.transform(dueObject, 'yyyy-MM-dd');
                  let message = "";
            
                  if (this.userDataService.userData.company === "NPML" && this.autoGenForm.get('rentInvoice')?.value ) {
                    message = `Dear ${item.tenantName},
            
            Rental invoice ${item.invoiceNo} is generated for the unit ${item.unit} at ${item.property} for the month of ${receiptMonth} ${receiptYear}.
            The total amount due is KES ${item.totalCharge}. We request you to pay before the due date ${dueDate}.
            Thank you,
            Nagaad Properties`;
                  }
                  else if (this.userDataService.userData.company === "NPML" && this.autoGenForm.get('IncludeUtility')?.value ) {
                    message = `Dear ${item.tenantName},
            
            Utility invoice ${item.invoiceNo} is generated for the unit ${item.unit} at ${item.property} for the month of ${receiptMonth} ${receiptYear}.
            The total amount due is KES ${item.totalCharge}. We request you to pay before the due date ${dueDate}.
            Thank you,
            Nagaad Properties`;
                  }
                  else if (this.userDataService.userData.company === "SADASA" && this.autoGenForm.get('IncludeUtility')?.value) {
                    message = `Mudane/Marwo [${item.tenantName}],

                    Fadlan bixinta biilka adeega ee gurigaaga ee Sunnah Towers hubi in la bixiyo kahor 5th January 2025.
                    Haddii aad su’aalo qabtid, nala soo xiriir [0768757666].
                    
                    Mahadsanid,  
                    Omar Mumin Mohammed  
                    Sadasa Construction and Property`;
                    
                  }
                   else if (this.userDataService.userData.company === "SADASA" && this.autoGenForm.get('rentInvoice')?.value) {
                    message = `Mudane/Marwo [${item.tenantName}],
            Fadlan bixinta kirada gurigaaga ee Sunnah Towers hubi in la bixiyo kahor 5th January 2025.
            Haddii aad su’aalo qabtid, nala soo xiriir [0768757666].
            
            Mahadsanid,
            Omar Mumin Mohammed
            Sadasa Construction and Property`;
                  }
            
                  if (item.slNo === 1) {
                    if (item.clientContacts) {
                      count++;
                      const smsObject = {
                        partnerID: this.PARTNER_ID,
                        apikey: this.API_KEY,
                        pass_type: "plain",
                        mobile: item.clientContacts.replace(/[\s+]/g, ''),
                        message: message,
                        shortcode: this.SHORTCODE
                      };
                      output.smslist.push(smsObject);
                    }
                  }
                }
            
                if (output.smslist.length > 0) {
                  const batches:any[] = [];
                  for (let i = 0; i < output.smslist.length; i += 20) {
                    batches.push(output.smslist.slice(i, i + 20));
                  }
            
                  const sendBatchSMS = async (batch: { [key: string]: any }[]) => {
                    const batchOutput = { smslist: batch };
                    try {
                      const res = await this.smsService.SendBulkSMS(batchOutput).toPromise();
                      const responses = res.responses;
                      const successCount = responses.filter((res: any) => res['response-code'] === 200).length;
            
                      if (successCount > 0) {
                        this.snackBar.open(`${successCount} message(s) sent successfully`, 'Close', {
                          duration: 10000,
                          panelClass: ['mat-toolbar', 'mat-primary']
                        });
                      } else {
                        this.snackBar.open('Failed to send messages', 'Close', {
                          duration: 10000,
                          panelClass: ['mat-toolbar', 'mat-warn']
                        });
                      }
                    } catch (error) {
                      this.snackBar.open('Error sending messages', 'Close', {
                        duration: 10000,
                        panelClass: ['mat-toolbar', 'mat-warn']
                      });
                      console.error('Error:', error);
                    }
                  };
            
                  const processBatches = async () => {
                    for (const batch of batches) {
                      await sendBatchSMS(batch);
                    }
                  };
            
                  processBatches();
                } else {
                  this.textMessageClass = "red";
                  this.retMessage = "Mobile numbers empty!";
                }
              } else {
                this.textMessageClass = "red";
                this.retMessage = "Credentials not registered for sending bulksms";
              }
            }
            
          }
        }
        else {
          this.textMessageClass = "red";
          this.retMessage = "Getting reports with no data found!";
        }
      });

    } catch (error: any) {
      // Handle error
      this.retMessage = error.message;
      this.textMessageClass = "red";
    }
  }
  
  handleSuccess(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "green";
  }

  clear() {
    this.autoGenForm = this.formInit();
    this.resetMessages();
    this.refreshData();
    this.blockList = [];
    this.invYear = "";
    this.invMonthName = "";
    this.rentalInv = "";
    this.inclExpenses = "";
    this.IncludeUtilities = "";
    this.authorize = "";
    this.dateGen = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  formInit() {
    return this.fb.group({
      property: ['', Validators.required],
      block: ['', Validators.required],
      IncludeUtility: [false],
      // invDate: [new Date(), Validators.required],
      rentInvoice: [false],
      includeExpenses: [false],
      authorize: [false],
      email: [false],
      sms: [false],
      whatsapp: [false]
    }, { validator: this.requireAtLeastOne(['rentInvoice', 'includeExpenses', 'IncludeUtility']) });
  }

  requireAtLeastOne(controlNames: string[]) {
    return (group: FormGroup) => {
      const controls = controlNames.map(name => group.controls[name]);
      const atLeastOne = controls.some(control => control.value);
      return atLeastOne ? null : { requireAtLeastOne: true };
    };
  }

  resetMessages() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  private handlePropertyChangedResponse(result: any): void {
    if (result.message.toUpperCase() === 'SUCCESS') {
      this.blockList = result.data;
      if (this.blockList.length === 1) {
        this.autoGenForm.get('block')!.setValue(this.blockList[0].itemCode);
      }
    } else {
      this.retMessage = `${result.message} for this property`;
      this.textMessageClass = 'red';
      return;
    }
  }

  private handleBlockChangedResponse(result: any): void {
    if (result.status.toUpperCase() === 'SUCCESS') {

      if (result.data.invYear !== 0) {
        this.invYear = result.data.invYear;
        this.invMonthName = result.data.invMonthName;

        if (result.data.rentalInv === true) {
          this.rentalInv = "YES";
        }
        else {
          this.rentalInv = "NO";
        }

        if (result.data.inclExpenses === true) {
          this.inclExpenses = "YES";
        }
        if (result.data.IncludeUtility === true) {
          this.IncludeUtilities = "YES";
        }
        else {
          this.inclExpenses = "NO";
        }

        if (result.data.authorize === true) {
          this.authorize = "YES";
        }
        else {
          this.authorize = "NO";
        }
        this.currentInvCnt = result.data.currMonthInvCount;
        this.lastMontrhInvCnt = result.data.currMonthInvCount;
        this.totalUnits = result.data.totalUnits;
        this.dateGen = result.data.currInvDate;
        this.revLandLord = result.data.revToLandlord;
        this.revProp = result.data.revToProperty;


        this.nextInvCount = result.data.nextInvCount;
        this.nextInvMonth = result.data.nextInvMonthName;
        this.nextInvYear = result.data.nextInvYear;
        this.nextInvDate = result.data.nextInvDate;

      }
      else {
        this.invYear = "";
        this.invMonthName = "";
        this.rentalInv = "";
        this.inclExpenses = "";
        this.IncludeUtilities = "";
        this.authorize = "";
        this.dateGen = "";
      }
    } else {
      this.invYear = "";
      this.invMonthName = "";
      this.rentalInv = "";
      this.inclExpenses = "";
      this.IncludeUtilities = "";
      this.authorize = "";
      this.dateGen = "";
      this.retMessage = `${result.message} for this property`;
      this.textMessageClass = 'red';
    }
  }

  async onSelectedPropertyChanged() {
    this.resetMessages();
    this.autoGenForm.controls['rentInvoice'].setValue(false);
    this.autoGenForm.controls['includeExpenses'].setValue(false);
    this.autoGenForm.controls['IncludeUtility'].setValue(false);
    this.autoGenForm.controls['authorize'].setValue(false);
    this.autoGenForm.controls['email'].setValue(false);
    this.autoGenForm.controls['sms'].setValue(false);
    this.autoGenForm.controls['whatsapp'].setValue(false);
    if (this.autoGenForm.controls['property'].value != "") {
      const propertyValue = this.autoGenForm.controls['property'].value;
      this.masterParams.type = 'BLOCK';
      this.masterParams.item = propertyValue;
      this.blockCode = propertyValue;

      try {
        this.subsink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe(
          (result: any) => {
            this.handlePropertyChangedResponse(result);
          },
          (error: any) => {
            this.handleDataLoadError(error);
          }
        );
      } catch (ex: any) {
        this.handleDataLoadError(ex);
      }
    }
    else {
      this.blockList = [];
    }
  }


  async onSelectedBlockChanged() {

    this.resetMessages();

    if (this.autoGenForm.controls['property'].value != "") {
      // const propertyValue = this.autoGenForm.controls['property'].value;

      this.masterParams.type = this.autoGenForm.controls['property'].value;
      this.masterParams.item = this.autoGenForm.controls['block'].value;

      try {
        this.subsink.sink = await this.projService.GetLastGeneratedInvoiceInfo(this.masterParams).subscribe(
          (result: any) => {
            this.handleBlockChangedResponse(result);
          },
          (error: any) => {
            this.handleDataLoadError(error);
          }
        );
      } catch (ex: any) {
        this.handleDataLoadError(ex);
      }
    }
    else {
      this.blockList = [];
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST916",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  onCheckboxChange(selectedCheckbox: string) {
    //   if (selectedCheckbox === 'rentInvoice') {
    //     this.autoGenForm.patchValue({
    //       includeExpenses: false,
    //     });
    //   } else if (selectedCheckbox === 'includeExpenses') {
    //     this.autoGenForm.patchValue({
    //       rentInvoice: false,
    //     });
    //   }
    //   else if (selectedCheckbox === 'IncludeUtility') {
    //     this.autoGenForm.patchValue({
    //       IncludeUtility: false,
    //     });
    //   }
    if(!this.autoGenForm.get('authorize')?.value){
      this.autoGenForm.get('email')?.setValue(false);
      this.autoGenForm.get('sms')?.setValue(false);
      this.autoGenForm.get('whatsapp')?.setValue(false);
    }
  }
}
