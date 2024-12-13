import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { DashboardData, DashboardParams } from 'src/app/Masters/Modules/masters.module';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReportsService } from 'src/app/Services/reports.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AgChartOptions } from 'ag-charts-community';
import { AgChartsAngular } from 'ag-charts-angular';
import { UserData } from 'src/app/admin/admin.module';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';

@Component({
  selector: 'app-purchase-dashboard',
  templateUrl: './purchase-dashboard.component.html',
  styleUrls: ['./purchase-dashboard.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class PurchaseDashboardComponent implements OnInit {
  public chartOptions!: AgChartOptions;
  purDashForm!: FormGroup;
  userData: any;
  private subSink!: SubSink;
  dashParams!: DashboardParams;
  dashData!: DashboardData;
  tranTypeList!: any[];
  reportTypeList!: any[];
  groupType!: any[];
  // public chartOptions3: any = {};
  retMessage!: string;
  textMessageClass!: string;
  fiYear!: number;
  @ViewChild('chart', { static: true }) chart: any;
  public chartOptions3: any = {}; // Adjust the type based on your actual chart library's configuration
  public chartData: any[] = [];
  constructor(private utlService: UtilitiesService, private cdr: ChangeDetectorRef,
    private reportService: ReportsService, private agCharts: AgChartsAngular,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private loader: NgxUiLoaderService,) {
    this.dashParams = new DashboardParams();
    this.purDashForm = this.formInit();
    this.chartOptions = {
      data: [], // Initialize data as an empty array
      series: [], // Initialize series as an empty array
    };
  }

  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
    }
  }
  formInit() {
    return this.fb.group({
      tranType: [''],
      reportType: [''],
      productGroup: [''],
      product: [''],
      party: [''],
      fromDate: [new Date(), [Validators.required]],
      toDate: [new Date(), [Validators.required]],
    });
  }

  searchProduct() {
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: "PRODUCT",
      Item: this.purDashForm.controls['product'].value,
      User: this.userData.userID,
      refNo: this.userData.sessionID
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
      if (res.status != "fail") {
        if (res.data.nameCount === 1) {
          this.purDashForm.controls['product'].patchValue(res.data.selName);
          this.dashParams.product = res.data.selName;
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            height: '90%',
            disableClose: true,
            data: {
              'tranNum': this.purDashForm.controls['product'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            this.purDashForm.controls['product'].setValue(result.prodName);
          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  private getLineColor(year: number): string {
    // You can use a color library or generate colors dynamically based on the year
    const colors = ['blue', 'red', 'green', 'orange', 'purple', 'brown'];
    // Use a unique color for each year
    return colors[year % colors.length];
  }
  Submit() {
    this.dashParams.company =this.userData.company;
    this.dashParams.location = this.userData.location;
    this.dashParams.lnagId = 1;
    this.dashParams.tranType = this.purDashForm.controls['tranType'].value;
    this.dashParams.reportType = this.purDashForm.controls['reportType'].value;
    this.dashParams.fromDate = this.purDashForm.controls['fromDate'].value;
    this.dashParams.toDate = this.purDashForm.controls['toDate'].value;
    this.dashParams.party = this.purDashForm.controls['party'].value;
    this.dashParams.productGroup = this.purDashForm.controls['productGroup'].value;
    this.dashParams.product = this.purDashForm.controls['product'].value;
    this.dashParams.user = this.userData.userID;
    this.dashParams.refNo = this.userData.sessionID;
    this.loader.start();
    this.reportService.getDashboardDetails(this.dashParams).subscribe((res: any) => {
      //console.log(res);
      this.loader.stop();
      if (res.status.toUpperCase() != "FAIL") {
          const chartData = res.data;
          // Filter out data for the year 2023
          // const filteredData = chartData.filter((item: any) => item.year !== 2023);
          const groupedData = chartData.reduce((acc: any, item: any) => {
            const year = item.year.toString();
            if (!acc[year]) {
              acc[year] = [];
            }
            acc[year].push(item);
            return acc;
          }, {});
          const series = Object.keys(groupedData).map(year => {
            const sortedData = groupedData[year].sort((a: any, b: any) => a.month - b.month);
            const monthsTemplate = Array.from({ length: 12 }, (_, i) => {
              const monthNumber = i + 1;
              return {
                year: parseInt(year, 10),
                month: monthNumber,
                monthName: new Date(2000, monthNumber - 1, 1).toLocaleString('en-US', { month: 'long' }),
                amount: 0,
              };
            });
            const filledData = monthsTemplate.map(monthTemplate => {
              const matchingData = sortedData.find(
                (item: any) => item.month === monthTemplate.month
              );
              return matchingData || monthTemplate;
            });

            return {
              type: 'line',
              xKey: 'monthName', // X-axis
              yKey: 'amount', // Y-axis
              yAxis: {
                label: {
                  formatter: function (params: any) {
                    return '$' + Math.round(params.value / 100000).toLocaleString() + ' Lakhs';
                  },
                },
              },
              marker: {
                size: 8,
              },
              label: {
                formatter: function (params: any) {
                  return '$' + Math.round(params.value).toLocaleString();
                },
              },
              data: filledData,
              title: year,
            };
          });

          this.chartOptions = {
            autoSize: true,
            series: series as any,
            legend: {
              enabled: true,
              // position: 'right',
            },
          };
          this.retMessage=res.message;
          this.textMessageClass="green";
      }
      else {
        this.chartOptions = {
          data: [],
          series: [{ type: 'line', xKey: 'monthName', yKey: 'amount' }],
        };
        this.retMessage=res.message;
        this.textMessageClass="red";
      }
    });

  }

}

