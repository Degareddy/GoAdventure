import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AdminService } from 'src/app/Services/admin.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-property-dashboard',
  templateUrl: './property-dashboard.component.html',
  styleUrls: ['./property-dashboard.component.css']
})
export class PropertyDashboardComponent implements OnInit,OnDestroy {
  public chartData: any[] = [];
  public chartOptions!: any;
  public chartOptions1!: any;
  public chartOptions2!: any;
  public chartOptions3!: any;
  private subsink!: SubSink;
  unitStatus: any = [];
  locationList: any = [];
  retMessage!: string;
  textMessageClass !: string;
  unitData = [
  ]
  constructor(private projectService: ProjectsService,private userDataService: UserDataService,
     private adminService: AdminService, private loader: NgxUiLoaderService) {
    this.subsink = new SubSink();
    this.chartOptions = {}
    this.chartOptions1 = {}
    this.chartOptions2 = {}
    this.chartOptions3 = {}
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  ngOnInit(): void {

    const revbody = {
      ...this.commonParams(),
      item: "All",
      reportType: 'REVENUE'
    }
    const unitbody = {
      ...this.commonParams(),
      item: "All",
      reportType: 'UNITSTATUS'
    }
    this.subsink.sink = this.projectService.GetDashUnitStatus(unitbody).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.unitStatus = res.data;
      }
    });
    this.loader.start();
    this.subsink.sink = this.projectService.GetDashRevenue(revbody).subscribe((res: any) => {
      this.loader.stop();
      // console.log(res);
      this.unitData = res.data;
      // if (res.status.toUpperCase() === "SUCCESS") {
      //   const modifiedData = this.modifyData(this.unitData);
      //   const revenueTypes = Object.keys(modifiedData[0]).filter(key => key !== 'propName');
      //   const series = revenueTypes.map((revenueType, index) => ({
      //     type: 'line',
      //     xKey: 'propName',
      //     yKey: revenueType,
      //     title: revenueType,
      //     stroke: this.getRandomColor(), // Example function to generate random color
      //   }));
      //   this.chartOptions = {
      //     data: modifiedData,
      //     title: {
      //         text: 'Revenue: in x 100K KES',
      //     },
      //     subtitle: {
      //         text: '',
      //     },
      //     series: series,
      //     yAxis: {
      //         type: 'number',
      //         labels: {
      //             format: '{value}',
      //             align: 'left',
      //         },
      //         tick: {
      //           minSpacing: 200,
      //       },
      //         // tickPositions: customTickPositions,
      //     },
      // };
      // }
      if (res.status.toUpperCase() === "SUCCESS") {
        const modifiedData = this.modifyData(this.unitData);
        const revenueTypes = Object.keys(modifiedData[0]).filter(key => key !== 'propName');
        const series = revenueTypes.map((revenueType, index) => ({
          type: 'line',
          xKey: 'propName',
          yKey: revenueType,
          title: revenueType,
          stroke: this.getRandomColor(), // Example function to generate random color
        }));
        this.chartOptions = {
          data: modifiedData,
          series: series,
          legend: {
            position: 'bottom' ,// Place the legend on the right side
            item: {
            marker: {
              size: 15,
              padding: 5,
              strokeWidth: 3,
              shape: 'diamond', // 'circle', 'square', 'cross', 'plus', 'triangle'
            },
            paddingX: 25,
            paddingY: 25,
          }
          },
          axes: [
            {
              type: "category",
              position: "top",
              title: {
                text: "Revenue",
              },
            },
            {
              type: "number",
              position: "left",
              title: {
                text: "Amount(x 100K)",
              },
              tick: {
                interval: 250,
              }
            },

          ],
        };
      }
      if (res.status.toUpperCase() === "SUCCESS") {

        const modifiedData = this.modifyData(this.unitData);
        console.log(modifiedData);
        const totalRent = modifiedData.reduce((acc, item) => acc + item.RENT, 0);
        const pieData = modifiedData.map(item => ({
          propName: item.propName,
          percentage: (item.RENT / totalRent) * 100,
        }));
        this.chartOptions1 = {
          data: pieData,
          title: {
            text: "Rent Revenue %",
            fontSize: 12, align: 'center', // Align subtitle to the center
            offsetY: -30 // Adjust vertical position if needed
          },
          series: [
            {
              type: "pie",
              angleKey: "percentage",
              calloutLabelKey: "propName",
              sectorLabelKey: "percentage",
              sectorLabel: {
                autoRotateAngle: true,
                fontSize: 8,
                formatter: ({ value }: { value: number }) => value !== undefined ? `${value.toFixed(2)}%` : 'N/A',

              },
              calloutLabel: {
                fontSize: 8,

              },
              label: {
                autoRotateAngle: true,
              }

            },

          ],
          legend: {
            item: {

              maxWidth: 100,
              showSeriesStroke: true,
              marker: {
                size: 15,
                padding: 2,
                strokeWidth: 3,
                shape: 'diamond', // 'circle', 'square', 'cross', 'plus', 'triangle'
              },
              paddingX: 25,
              paddingY: 2,
              // marker: {
              //     padding: 2,

              // },
              label: {
                fontSize: 8,
                fontStyle: 'italic',
                fontWeight: 'bold',

                // color: 'red',
                maxLength: 25,
              },
            },
            position: 'right', // Place the legend on the right side
          },
          background: {
            fill: "aliceblue"

          },

          // width: 230, // Set width of the chart to 600px
          // height: 260, // Set height of the chart to 400px

        };
        this.chartOptions2 = {
          data: modifiedData,
          title: {
            text: "Service Revenue %",
            fontSize: 12, align: 'center', // Align subtitle to the center
            offsetY: -30 // Adjust vertical position if needed
          },
          series: [
            {
              type: "pie",
              angleKey: "Service",
              calloutLabelKey: "propName",
              sectorLabelKey: "Service",
              sectorLabel: {
                fontSize: 8,
                formatter: ({ value }: { value: number }) => value !== undefined ? `${value.toFixed(2)}%` : 'N/A',
              },
              calloutLabel: {
                fontSize: 8,
              }
            },
          ],
          legend: {
            item: {

              maxWidth: 100,
              showSeriesStroke: true,
              marker: {
                size: 15,
                padding: 2,
                strokeWidth: 3,
                shape: 'diamond',
              },
              paddingX: 25,
              paddingY: 2,
              label: {
                fontSize: 8,
                fontStyle: 'italic',
                fontWeight: 'bold',
                maxLength: 25,
              },
            },
            position: 'right',
          },
          background: {
            fill: "aliceblue"

          },
        };
      }
      else {
        this.handleError(res);
      }
    });
    const locationbody = {
      ...this.commonParams(),
      item: "USERLOCATION"
      // item: "CMPUSERBRANCH"
    };
    try {
      this.subsink.sink = this.adminService.GetMasterItemsList(locationbody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.locationList = res['data'];
        }
        else {
          this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex);
    }
  }

  modifyData(data: any[]): any[] {
    const modifiedData: any[] = [];
    const aggregatedData: { [key: string]: any } = {};

    data.forEach(item => {
      if (!aggregatedData[item.propName]) {
        aggregatedData[item.propName] = { propName: item.propName };
      }
      aggregatedData[item.propName][item.revenueType] = (aggregatedData[item.propName][item.revenueType] || 0) + item.amount;
    });

    for (const propName in aggregatedData) {
      if (aggregatedData.hasOwnProperty(propName)) {
        modifiedData.push(aggregatedData[propName]);
      }
    }

    return modifiedData;
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: "All",
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      langId: this.userDataService.userData.langId,
    }
  }
  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }
}
