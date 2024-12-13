import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AdminService } from 'src/app/Services/admin.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.css']
})
export class StockDashboardComponent implements OnInit {
  dashboardForm!: FormGroup
  public chartOptions!: any;
  public chartOptions1!: any;
  constructor(private projectService: ProjectsService, private userDataService: UserDataService,
    private adminService: AdminService, private loader: NgxUiLoaderService, private fb: FormBuilder) {
    // this.chartOptions = {}
    this.chartOptions1 = {}
    this.dashboardForm = this.formInit();
    this.chartOptions = {
      autoSize: true,
      data: this.getData(),
      title: {
        text: 'Scheduled Timelines',
        fontSize: 12,
      },
      axes: [
        {
          type: 'category',
          position: 'left',
          label: {
            rotation: 0,
          }
        },
        {
          type: 'time',
          position: 'bottom',
          nice: true,
          label: {
            format: '%b-%y',
          }
        }
      ],
      series: [
        {
          type: 'bar',
          xKey: 'startDate',
          yKey: 'task',
          xName: 'Start Date',
          yName: 'Task',
          grouped: true,
          fillOpacity: 0.3,
          fill: 'blue',
          stroke: 'none',
          highlightStyle: {
            fill: 'orange',
          },
          tooltip: {
            renderer: function(params:any) {
              return {
                content: `Task: ${params.yKey}<br>Start: ${params.xValue.toDateString()}<br>End: ${params.datum.endDate.toDateString()}`
              };
            }
          }
        }
      ],
    };
  }
  getData() {
    return [
      { task: 'Earth Work', startDate: new Date('2023-12-01'), endDate: new Date('2024-01-31') },
      { task: 'Fondation', startDate: new Date('2024-01-01'), endDate: new Date('2024-02-29') },
      { task: 'Framing', startDate: new Date('2024-02-01'), endDate: new Date('2024-03-31') },
      { task: 'Roofing', startDate: new Date('2024-03-01'), endDate: new Date('2024-04-30') },
      { task: 'Plumbing', startDate: new Date('2024-04-01'), endDate: new Date('2024-05-31') },
      { task: 'Electrical', startDate: new Date('2024-05-01'), endDate: new Date('2024-06-30') },
      { task: 'Interior', startDate: new Date('2024-06-01'), endDate: new Date('2024-09-30') },
      { task: 'Exterior', startDate: new Date('2024-07-01'), endDate: new Date('2024-11-30') },
      { task: 'Landscaping', startDate: new Date('2024-12-01'), endDate: new Date('2025-01-31') },
    ];
  }
  formInit() {
    return this.fb.group({
      report: [''],
      reportType: [''],
      project: [''],
      formDate: [new Date()],
      toDate: [new Date()]
    })
  }

  ngOnInit(): void {
  }

}
