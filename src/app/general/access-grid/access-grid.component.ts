import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { GridOptions } from 'ag-grid-community';
import * as $ from 'jquery';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LinkRendererComponent } from './link-renderer.component';
import { BtnRendererComponent } from './button-renderer.component';
import { DetailRendererComponent } from './detail-renderer.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-access-grid',
  templateUrl: './access-grid.component.html',
  styleUrls: ['./access-grid.component.css']
})
export class AccessGridComponent implements OnInit, OnDestroy {
  @Input() tableName!: string;
  @Input() tranLabel: string = "";
  @Input() reportName: string = "";
  @Input() columnDefs: any = [

  ];
  public themeClass: string =
    "ag-theme-quartz";

  @Input() rowData: any = [];
  @Input() paginationPageSize: any;
  @Input() quickFilter!: string;
  @Input() exportExcel!: boolean;
  @Input() exportPDF!: boolean;
  @Input() fromDate!: Date;
  @Input() toDate!: Date;
  @Input() globalSearch!: boolean;
  @Input() showRecordCount!: boolean;
  @Input() showToolPanel!: boolean;
  @Input() custmExportFunction!: boolean;
  @Input() autoSizeColumns!: boolean;
  @Input() totals: string = "";
  @Input() gridHeight: string = '';
  @Input() excelName: string = 'Report';
  @Output() btnClicked = new EventEmitter();
  @Output() iconClicked = new EventEmitter();
  @Output() linkClicked = new EventEmitter();
  @Output() detailClicked = new EventEmitter();
  @Output() excelClicked = new EventEmitter();
  @Output() cellClicked = new EventEmitter();
  @Output() cloumnFilterChanged = new EventEmitter();
  @Output() rowsSelected = new EventEmitter();
  @Output() filterChanges = new EventEmitter();
  @Output() getGridApi = new EventEmitter();
  @Output() checkBoxFilterChanged = new EventEmitter();
  @Output() isGridExpand = new EventEmitter<boolean>();
  @Output() columnVisibilityChanged = new EventEmitter<any>();
  showMenu: boolean = false;
  public gridOptions!: GridOptions;
  public gridApi: any;
  public context: any;
  public columnApi: any;
  public defaultColDef: any;
  public checkAllColumns = false;
  public frameworkComponents: any;
  public pageSizes = [100, 250, 500];
  public showClose = false;
  public menuState = false;
  isGridExpanded!: boolean;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  // @HostListener('document:click', ['$event'])
  // onclick(event: any) {
  //   if (!this._el.nativeElement.contains(event.target)) {
  //     // this.toggleMenu(false);
  //     this.menuState = !this.menuState;
  //   }
  // }
  constructor(private _el: ElementRef, private router: Router, private datePipe: DatePipe) {
    this.gridOptions = {
      rowSelection: 'single',
      enableCellTextSelection: true,
      rowHeight: 0,
    };
    this.frameworkComponents = {
      agBtnRenderer: BtnRendererComponent,
      agLnkRenderer: LinkRendererComponent,
      agDtlRenderer: DetailRendererComponent,
      // agDateRenderer: DateRendererComponent,
      // agDateFormatRenderer: DateFormatRendererComponent
    };
    this.context = { componentParent: this };

  }
  ngOnDestroy(): void {

  }
  onColumnVisibilityChange(event: any, column: any) {
    column.hide = !event.target.checked;
    this.columnVisibilityChanged.emit({ field: column.field, hide: column.hide });
  }
  ngOnInit(): void {
    this.addSerialNumberColumn();
  }
  addSerialNumberColumn() {
    const isSerialNumberColumnPresent = this.columnDefs.some(
      (col: any) => col.headerName === 'S.No'
    );

    if (!isSerialNumberColumnPresent) {
      const serialNumberColumn = {
        headerName: 'S.No',
        valueGetter: 'node.rowIndex + 1',
        width: 105,
        cellClass: 'serial-number-cell',
        sortable: false,
        filter: false,
        resizable: true,
      };
      this.columnDefs = [serialNumberColumn, ...this.columnDefs];
    }
  }

  changeGridHeight(newHeight: string) {
    this.gridHeight = newHeight;
  }

  onPageSizeChanged(value: any) {
    this.gridApi.paginationSetPageSize(+value.target.value);
  }

  onCheckBoxFilterchanged(event: any) {
    this.checkBoxFilterChanged.emit(event);
  }
  paginationchanged(event: any) { }

  onGridCellClicked(event: any) {
    this.cellClicked.emit(event);
  }

  onSelectionChanged(event: any) {
    const selectedRows = this.gridApi.getSelectedRows();
    this.rowsSelected.emit(selectedRows);
  }


  onFilterChanged() {
    const api = this.gridOptions.api;
    if (api) {
      const remainingData: any[] = [];
      api.forEachNodeAfterFilter((node: any) => {
        remainingData.push(node.data);
      });
      this.filterChanges.emit(remainingData);
    }
  }


  onBtnClicked(cell: any) {
    this.btnClicked.emit(cell);
  }

  onLnkClicked(cell: any) {
    this.linkClicked.emit(cell);
  }
  onDtlClicked(cell: any) {
    this.detailClicked.emit(cell);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.onFilterChanged();
    if (this.quickFilter !== undefined && this.quickFilter.length > 0) {
      this.showClose = true;
      this.gridApi.setQuickFilter(this.quickFilter);
    }
    this.getGridApi.emit(this.gridApi);
    if (this.paginationPageSize !== undefined || this.paginationPageSize !== null) {
      this.gridApi.paginationSetPageSize(+this.paginationPageSize);
    } else {
      this.gridApi.paginationSetPageSize(10);
    }

    this.autoSizeRows(params);
    this.autoSizeAllColumns(params);
    // setTimeout(() => {
    //   this.gridApi.sizeColumnsToFit();
    // }, 3000);
    this.gridApi.sizeColumnsToFit();

  }



  onFilterTextBoxChanged(event: any) {
    if (event.target.value.length > 0) {
      this.showClose = true;
      this.checkBoxFilterChanged.emit('{value: value}');
    } else {
      this.showClose = false;
      this.cloumnFilterChanged.emit('{}');
    }
    this.gridApi.setQuickFilter(event.target.value);
  }
  toggleMenu(state: any) {
    // if (state === undefined) {
    this.menuState = !this.menuState;

  }
  onFilterFocusOut(event: any) {
    if (event.target.value.length > 0) {
      this.resetOtherCheckBoxFilters("");
    }
  }
  // showAllColumns($event: any) {
  //   this.showToolPanel = false;
  //   if ($event.target.checked) {
  //     this.checkAllColumns = true;
  //   } else {
  //     this.checkAllColumns = false;
  //   }
  //   const allColumns: any = [];
  //   this.columnDefs.forEach((element: any) => {
  //     if (element.field) {
  //       allColumns.push(element.field);
  //       if ($event.target.checked) {
  //         element.hide = false;
  //       } else {
  //         element.hide = true;
  //       }
  //     }
  //     this.columnApi.autoSizeColumn(element);
  //   });

  //   $('.columnItems > .colHeader').each((index: any, obj: any) => {
  //     if ($event.target.checked) {
  //       $(obj).prop('checked', true);
  //     } else {
  //       $(obj).prop('checked', false);
  //     }
  //   });
  //   this.columnApi.setColumnVisible(allColumns, $event.target.checked);
  //   this.showToolPanel = true;
  //   this.gridApi.sizeColumnsToFit();
  //   this.gridApi.sizeColumnsToFit();
  // }
  showAllColumns($event: any) {
    // this.showToolPanel = false;
    if ($event.target.checked) {
      this.checkAllColumns = true;
    } else {
      this.checkAllColumns = false;
    }
    const allColumns: any = [];
    this.columnDefs.forEach((element: any) => {
      if (element.field) {
        allColumns.push(element.field);
        if ($event.target.checked) {
          element.hide = false;
        } else {
          element.hide = true;
        }
      }
      this.columnApi.autoSizeColumn(element);
      this.iconClicked.emit(element)
    });

    $('.columnItems > .colHeader').each((index: any, obj: any) => {
      if ($event.target.checked) {
        $(obj).prop('checked', true);
      } else {
        $(obj).prop('checked', false);
      }
    });
    this.columnApi.setColumnVisible(allColumns, $event.target.checked);
    this.showToolPanel = true;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.sizeColumnsToFit();
  }
  checkedFields($event: any) {
    if (!$event.target.checked) {
      this.checkAllColumns = false;
    }
    this.columnApi.setColumnVisible($event.target.value, $event.target.checked);
    this.gridApi.sizeColumnsToFit();
    this.columnDefs.forEach((element: any) => {
      if (element.field && $event.target.value === element.field) {
        if ($event.target.checked) {
          element.hide = false;
        } else {
          element.hide = true;
        }
      }
    });
  }
  resetFilter() {
    this.quickFilter = '';
    this.showClose = false;
    this.cloumnFilterChanged.emit('{}');
    this.gridApi.setQuickFilter(this.quickFilter);
    this.resetOtherCheckBoxFilters("");
  }
  resetOtherCheckBoxFilters(field: string) { }


  Pdfexport() {
    const params = {
      orientation: 'landscape' as const,
    };
    const pdfDoc: any = new jsPDF(params);
    const content: any = this.gridApi.getDataAsCsv({
      allColumns: false  // This ensures that hidden columns are also included in the CSV export
    });
    const rows = content.trim().split('\n').map((row: any) => {
      const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      return columns?.map((col: string) => col.replace(/^"|"$/g, ''));
    });
    let columns = rows.shift() || [];
    if (!columns || columns.length === 0) {
      console.error('No columns found in CSV data.');
      return;
    }
    columns = columns.filter((column: any) => column !== undefined && column !== null);
    const filteredColumns = columns.filter((column: string) =>
      !column.toLowerCase().includes('detail') && !column.toLowerCase().includes('receipt') && !column.toLowerCase().includes('payment')
    );
    const filteredRows = rows.map((row: any) =>
      row.filter((_: any, index: number) =>
        columns[index] && !columns[index].toLowerCase().includes('detail') && !columns[index].toLowerCase().includes('receipt') && !columns[index].toLowerCase().includes('payment')
      )
    );

    const tranNoColumnIndex = filteredColumns.indexOf('Tran No');

    // Extract values for first and last rows
    const firstRowTranNo = filteredRows[0][tranNoColumnIndex];
    const lastRowTranNo = filteredRows[filteredRows.length - 1][tranNoColumnIndex];

    const dateColumnIndices: any = [];
    const numberColumnIndices: any = [];

    filteredColumns.forEach((column: any, index: number) => {
      if (column && column.toLowerCase().includes('date')) {
        dateColumnIndices.push(index);
      }
      if (column && (column.toLowerCase().includes('amount') || column.toLowerCase().includes('balance') || column.toLowerCase().includes('debit') || column.toLowerCase().includes('credit') || column.toLowerCase().includes('rent') || column.toLowerCase().includes('service') || column.toLowerCase().includes('price') || column.toLowerCase().includes('total') || column.toLowerCase().includes('holdings') || column.toLowerCase().includes('deposit'))) {
        numberColumnIndices.push(index);
      }
    });

    dateColumnIndices.forEach((dateColumnIndex: number) => {
      for (let i = 0; i < filteredRows.length; i++) {
        const row = filteredRows[i];
        const dateValue = row[dateColumnIndex];
        if (dateValue) {
          const formattedDate = this.formatDate(dateValue);
          row[dateColumnIndex] = formattedDate;
        }
      }
    });

    numberColumnIndices.forEach((numberColumnIndex: number) => {
      for (let i = 0; i < filteredRows.length; i++) {
        const row = filteredRows[i];
        const numberValue = row[numberColumnIndex];
        if (numberValue && !isNaN(numberValue)) {
          const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(parseFloat(numberValue));
          row[numberColumnIndex] = formattedNumber;
        }
      }
    });

    if (content) {
      let formattedFromDate: any;
      let formattedToDate: any;
      let toDateLabel!: any;
      let fromDateLabel!: any;
      if (this.reportName.includes('Statement')) {
        formattedFromDate = this.datePipe.transform(this.fromDate, 'dd-MM-yyyy');
        formattedToDate = this.datePipe.transform(this.toDate, 'dd-MM-yyyy');
        fromDateLabel = 'From Date:' + formattedFromDate;
        toDateLabel = 'To Date:' + formattedToDate;
      }
      else {
        formattedFromDate = this.datePipe.transform(new Date(), 'dd-MM-yyyy');
        toDateLabel = '';
        fromDateLabel = 'Report Date:' + formattedFromDate;
      }

      const options = {
        startY: 15,
        head: [filteredColumns],
        body: filteredRows,
        styles: {
          fontSize: 8,
          maxCellHeight: 3,
        },
        didDrawPage: (data: any) => {
          if (data.pageNumber === 1) {
            const text = this.reportName + " Report";
            const textFontSize = 11;
            pdfDoc.setFontSize(textFontSize);
            const textWidth = pdfDoc.getStringUnitWidth(text) * 12 / pdfDoc.internal.scaleFactor;
            const centerPos = (pdfDoc.internal.pageSize.width / 2) - (textWidth / 2);
            pdfDoc.text(text, centerPos, 10);
            const underlinePos = 11;
            pdfDoc.setLineWidth(0.5);
            pdfDoc.line(centerPos, underlinePos, centerPos + textWidth, underlinePos);
            const dateText = `${fromDateLabel} ${toDateLabel}`;
            pdfDoc.setFontSize(9);
            const dateTextWidth = pdfDoc.getStringUnitWidth(dateText) * 12 / pdfDoc.internal.scaleFactor;
            const datePos = pdfDoc.internal.pageSize.width - dateTextWidth - 10;
            pdfDoc.text(dateText, datePos, 10);
          }
        },
        didDrawCell: (data: any) => {
          if (this.reportName.includes('Statement')) {
            if (data.section === 'body') {
              const { cell, table } = data;
              const isFirstRow = data.row.index === 0;
              const isLastRow = data.row.index === table.body.length - 1;

              if (isFirstRow && firstRowTranNo.toUpperCase() === 'OPENING') {
                pdfDoc.setFillColor(200, 255, 200); // Light green color for the first row
                pdfDoc.rect(cell.x, cell.y, cell.width, cell.height, 'F'); // Fill the cell background
                pdfDoc.setTextColor(0, 0, 0); // Set text color to black
                pdfDoc.setFontSize(12); // Larger font size for the first row
                pdfDoc.text(data.cell.text, cell.x, cell.y + 4);
              }

              // Apply style for the last row
              if (isLastRow && lastRowTranNo.toUpperCase() === 'CLOSING') {
                pdfDoc.setFillColor(255, 255, 200); // Light yellow color for the last row
                pdfDoc.rect(cell.x, cell.y, cell.width, cell.height, 'F'); // Fill the cell background
                pdfDoc.setTextColor(0, 0, 0); // Set text color to black
                pdfDoc.setFontSize(12); // Larger font size for the last row
                pdfDoc.text(data.cell.text, cell.x, cell.y + 4);
              }
              else if (isLastRow) {
                pdfDoc.setFillColor(255, 255, 200); // Light yellow color for the last row
                pdfDoc.rect(cell.x, cell.y, cell.width, cell.height, 'F'); // Fill the cell background
                pdfDoc.setTextColor(0, 0, 0); // Set text color to black
                pdfDoc.setFontSize(12); // Larger font size for the last row
                pdfDoc.text(data.cell.text, cell.x, cell.y + 4);
              }
            }
          }
          else {
            if (data.section === 'body') {
              const { cell, table } = data;
              const isFirstRow = data.row.index === 0;
              const isLastRow = data.row.index === table.body.length - 1;
              if (isLastRow) {
                pdfDoc.setFillColor(255, 255, 200); // Light yellow color for the last row
                pdfDoc.rect(cell.x, cell.y, cell.width, cell.height, 'F'); // Fill the cell background
                pdfDoc.setTextColor(0, 0, 0); // Set text color to black
                pdfDoc.setFontSize(12); // Larger font size for the last row
                pdfDoc.text(data.cell.text, cell.x, cell.y + 4);
              }
            }
          }
        }
      };

      pdfDoc.autoTable(options);


      // const lastYPosition = pdfDoc.lastAutoTable.finalY || 0;

      // const footerText = this.totals;
      // pdfDoc.setFontSize(10);
      // pdfDoc.setFont('helvetica', 'bold');

      // const footerWidth = pdfDoc.getStringUnitWidth(footerText) * pdfDoc.internal.getFontSize() / pdfDoc.internal.scaleFactor;
      // const pageWidth = pdfDoc.internal.pageSize.getWidth();

      // const footerXPosition = pageWidth - footerWidth - 15;
      // const footerYPosition = lastYPosition + 10;

      // const footerHeight = 10; // Adjust the height as needed
      // pdfDoc.setFillColor(255, 255, 200); // Light yellow color for the footer background
      // pdfDoc.rect(footerXPosition - 5, footerYPosition - 8, footerWidth + 10, footerHeight, 'F'); // Draw the rectangle with some padding
      // pdfDoc.setFont('helvetica', 'bold');

      // pdfDoc.setTextColor(0, 0, 0); // Set text color to black
      // pdfDoc.text(footerText, footerXPosition, footerYPosition);

      const sanitizedReportName = this.reportName.replace(/\s+/g, '');
      // pdfDoc.save(sanitizedReportName + 'Report.pdf');

      const pdfBlob = pdfDoc.output('blob');

      this.previewOrPrintPDF(pdfBlob, sanitizedReportName + ' Report.pdf');
    }
  }

  previewOrPrintPDF(pdfBlob: Blob, filename: string) {
    const url = URL.createObjectURL(pdfBlob);

    const preview = confirm("Do you want to preview the PDF?");
    if (preview) {
      const newTab = window.open(url, '_blank');
      if (newTab) {
        newTab.onload = () => {
          URL.revokeObjectURL(url);
        };
      } else {
        alert('Pop-up blocked! Please allow pop-ups to preview the PDF.');
      }
      return;
    }

    // const print = confirm("Do you want to print the PDF?");
    // if (print) {
    //   const newTab = window.open(url, '_blank');
    //   if (newTab) {
    //     newTab.onload = () => {
    //       newTab.print();
    //       URL.revokeObjectURL(url);
    //     };
    //   } else {
    //     alert('Pop-up blocked! Please allow pop-ups to print the PDF.');
    //   }
    // }
    else {
      saveAs(pdfBlob, filename);
    }
  }
  autoSizeRows(params: any) {
    // Reset the row heights to automatically adjust based on content
    params.api.resetRowHeights();

  }
  autoSizeAllColumns(params: any) {
    const allColumnIds: string[] = [];
    params.columnApi.getColumns().forEach((column: any) => {
      allColumnIds.push(column.colId);
    });
    params.columnApi.autoSizeColumns(allColumnIds);
  }


  // autoSizeAllColumns(params: any) {
  //   const allColumnIds: string[] = [];
  //   params.columnApi.getAllColumns().forEach((column: any) => {
  //     allColumnIds.push(column.colId);
  //   });
  //   params.columnApi.autoSizeColumns(allColumnIds);
  // }

  exportCSV() {
    if (this.gridApi) {
      const allRowData = [];
      const rowCount = this.gridApi.getDisplayedRowCount();
      for (let i = 0; i < rowCount; i++) {
        const rowNode = this.gridApi.getDisplayedRowAtIndex(i);
        if (rowNode) {
          allRowData.push(rowNode.data);
        }
      }
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      const columnDefs = this.gridApi.getColumnDefs();

      // Filter out columns with hide: true and 'detail' or 'details' columns
      const visibleColumns = columnDefs.filter((col: any) => !col.hide && !col.headerName.toLowerCase().includes('detail'));
      worksheet.columns = visibleColumns.map((col: any) => ({ header: col.headerName, key: col.field }));

      // Set header row style
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCC00' } // Set header background color to ash
      };
      worksheet.getRow(1).font = { bold: true }; // Make text bold

      // Format cells based on column header
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (rowNumber > 1) { // Skip the header row
            const column = visibleColumns[colNumber - 1];
            if (column) {
              const value = row.getCell(colNumber).value;
              if (column.headerName.toLowerCase().includes('date') && value) {
                cell.numFmt = 'dd-MM-yyyy'; // Format date columns as dd-MM-yyyy
              } else if ((column.headerName.toLowerCase().includes('rent') || column.headerName.toLowerCase().includes('service')
                || column.headerName.toLowerCase().includes('amount') || column.headerName.toLowerCase().includes('total') ||
                column.headerName.toLowerCase().includes('credit') || column.headerName.toLowerCase().includes('debit')
                || column.headerName.toLowerCase().includes('balance')) && value != null) {
                cell.numFmt = '#,##0.00'; // Format amount columns with 2 decimal places and comma separator
              }
            }
          }
        });
      });

      // Add filtered data to the worksheet
      allRowData.forEach(rowData => {
        const filteredRowData: any = {};
        visibleColumns.forEach((col: any) => {
          filteredRowData[col.field] = rowData[col.field];
        });
        worksheet.addRow(filteredRowData);
      });

      // Adjust column widths
      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell: any) => {
          const length = String(cell.value).length;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 3; // Minimum width of 10
      });

      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, this.excelName + '.xlsx' ); // Use saveAs from file-saver
      });
    }
  }


  formatDate(date: any): string {
    if (!date) return ''; // Handle null or undefined date

    // Ensure date is a Date object
    if (!(date instanceof Date)) {
      date = new Date(date); // Assuming date is in a format that can be converted to a Date object
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

}
