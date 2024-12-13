import { Injectable, Input } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { DatePipe } from '@angular/common';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExcelReportsService {

  constructor(private datepipe: DatePipe) { }

  async generateExcel(cmpData: any, headerdata: any, extitle: string, exdate: Date) {
    //console.log(headerdata);
    const data = cmpData;
    const header = [headerdata];
    const mainHeaders = Object.keys(headerdata);

    const title = extitle;
    const unwantedHeaders = ['MODE', 'USER', 'REFNO'];
    const upperUnwantedHeaders = unwantedHeaders.map(header => header.toUpperCase());
    // const mainHeader = ['Product', 'UOM', 'RATE', 'QUANTITY', 'GST', 'AMOUNT'];
    const childHeaders = ['SLNO', ...Object.keys(cmpData[0]).filter((key) => key !== 'SLNO' && !upperUnwantedHeaders.includes(key.toUpperCase()))];


    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(extitle);

    // Add title
    const titleRow = worksheet.addRow([title]);
    titleRow.font = {
      name: 'Corbel',
      family: 4,
      size: 16,
      underline: 'double',
      bold: true,
    };

    // Add empty row after title
    worksheet.addRow([]);

    // Add date
    const day = exdate.getDate().toString().padStart(2, '0');
    const month = (exdate.getMonth() + 1).toString().padStart(2, '0');
    const year = exdate.getFullYear();
    const todayDate = `${day}-${month}-${year}`;
    const subTitleRow = worksheet.addRow(['Date : ' + todayDate]);
    worksheet.mergeCells('A1:D2');
    worksheet.addRow([]);

    // Add child header section
    const HeaderRow = worksheet.addRow(mainHeaders);
    HeaderRow.eachCell((cell: any) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBFBFBF' }, // Ash color
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Add empty row after child header section
    worksheet.addRow([]);

    // Add header data
    header.forEach((d: any, index: number) => {
      const values = mainHeaders.map((key) => d[key]);
      // const values = [d.product, d.uom, d.rate, d.quantity, d.gst, d.amount];
      const row = worksheet.addRow(values);
    });

    // Add empty row after the data
    worksheet.addRow([]);

    const childRow = worksheet.addRow(childHeaders);
    childRow.eachCell((cell: any) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFBFBFBF' }, // Ash color
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

    });

    // Add empty row after main header section
    worksheet.addRow([]);

    // Add main data
    data.forEach((d: any, index: number) => {
      const values = [index + 1, ...childHeaders.slice(1).map((key) => d[key])];
      const row = worksheet.addRow(values);
    });

    // Add empty row after main data
    worksheet.addRow([]);

    // Add footer
    const footerRow = worksheet.addRow([
      'This is a system-generated excel sheet.',
    ]);
    footerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFE5' },
    };
    footerRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Merge Cells for the footer
    worksheet.mergeCells(`A${footerRow.number}:M${footerRow.number}`);

    // Generate Excel File with the given name
    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fs.saveAs(blob, extitle + '.xlsx');
    });
  }

  async generatePurchaseOrderExcel(repData: any) {
    // //console.log(repData);
    let tblArr = [];
    for (let i = 0; i < repData.length; i++) {
      tblArr.push({
        "SLNO": repData[i].slNo,
        "Product": repData[i].itemDesc,
        "UOM": repData[i].uom,
        "RATE": repData[i].unitRate,
        "QUANTITY": repData[i].quantity,
        "VAT": repData[i].vatAmt,
        "AMOUNT": repData[i].rowValue
      })
    }

    const tblHeaders = ['SLNO', 'Product', 'UOM', 'RATE', 'QUANTITY', 'VAT', 'AMOUNT'];
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Purchase Order');
    // Add title
    const titleRow = worksheet.addRow(['Purchase Order']);
    titleRow.font = {
      name: 'Corbel',
      family: 4,
      size: 14,
      underline: 'double',
      bold: true,
    };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:G1');

    worksheet.addRow([]);

    // Add header in B2 row
    worksheet.getCell('B2').value = 'Supplier:';
    worksheet.getCell('B2').font = { bold: true };

    worksheet.getCell('F3').value = 'OrderNo:';
    worksheet.getCell('F3').font = { bold: true };

    worksheet.getCell('F4').value = 'Order Date:';
    worksheet.getCell('F4').font = { bold: true };

    worksheet.getCell('F5').value = 'Currency:';
    worksheet.getCell('F5').font = { bold: true };

    worksheet.getCell('F6').value = 'OrderValue:';
    worksheet.getCell('F6').font = { bold: true };

    worksheet.getCell('F7').value = 'CGST:';
    worksheet.getCell('F7').font = { bold: true };

    worksheet.getCell('F8').value = 'SGST:    ';
    worksheet.getCell('F8').font = { bold: true };

    worksheet.getCell('F9').value = 'PhoneNo:';
    worksheet.getCell('F9').font = { bold: true };

    worksheet.getCell('F10').value = 'Email:';
    worksheet.getCell('F10').font = { bold: true };

    worksheet.getCell('F11').value = 'Total:';
    worksheet.getCell('F11').font = { bold: true };

    worksheet.getCell('B3').value = repData[0].supplier;
    worksheet.getCell('G3').value = repData[0].tranNo;
    const frmtedDate = this.datepipe.transform(repData[0].suppDate, "dd-MM-yyyy")
    worksheet.getCell('G4').value = frmtedDate;
    worksheet.getCell('G5').value = repData[0].currency;
    worksheet.getCell('G6').value = repData[0].orderValue;
    worksheet.getCell('G7').value = repData[0].vatAmt;
    worksheet.getCell('G7').numFmt = '#,##0.00';
    worksheet.getCell('G8').value = repData[0].vatAmt;
    worksheet.getCell('G8').numFmt = '#,##0.00';
    worksheet.getCell('G9').value = repData[0].compPhone1;
    worksheet.getCell('G10').value = repData[0].compEMail;
    worksheet.getCell('G11').value = repData[0].rowValue;
    worksheet.getCell('G11').numFmt = '#,##0.00';

    worksheet.getCell('G11').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '000000' }, // black
    };
    worksheet.getCell('G11').font = {
      color: { argb: 'FFFFFF' }, // white
      bold: true,
    };
    worksheet.columns.forEach((column, index) => {
      let maxWidth = 0;

      // Iterate through all rows in the column
      for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex++) {
        const cell = worksheet.getCell(this.getColumnLetter(index + 1) + rowIndex);
        const cellWidth = cell.value ? cell.value.toString().length : 0;
        if (cellWidth > maxWidth) {
          maxWidth = cellWidth;
        }
      }
      column.width = maxWidth + 3;
    });

    for (let row = 2; row <= 11; row++) {
      for (let col = 1; col <= 7; col++) {
        worksheet.getCell(`${String.fromCharCode(64 + col)}${row}`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    worksheet.addRow([]);

    const tblRow = worksheet.addRow(tblHeaders);
    tblRow.eachCell((cell: any) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '000000' }, // Ash color
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

    });
    let totalAmount = 0;
    tblArr.forEach((d: any, index: number) => {
      const values = [index + 1, ...tblHeaders.slice(1).map((key) => d[key])];
      const row = worksheet.addRow(values);

      // Iterate over each cell in the row
      row.eachCell((cell, colNumber) => {
        // Assign value to each cell
        const cellValue = cell.value;
        if (tblHeaders[colNumber - 1] === 'RATE' || tblHeaders[colNumber - 1] === 'VAT' || tblHeaders[colNumber - 1] === 'AMOUNT') {
          const numericValue = parseFloat(cellValue?.toString().replace(/,/g, '') || '0');
          cell.value = numericValue;
          cell.numFmt = '#,##0.00';
        }
        if (tblHeaders[colNumber - 1] === 'AMOUNT' && cell.value !== null && cell.value !== undefined) {
          totalAmount += parseFloat(cell.value.toString());
        }
      });
    });
    // Add empty row after main data
    //  worksheet.addRow([]);

    const totalRow = worksheet.addRow(['Total', '', '', '', '', '', totalAmount]);
    totalRow.eachCell((cell, colNumber) => {
      // Apply formatting to the total row
      if (colNumber === 7) { // Assuming 'AMOUNT' is the last column
        cell.numFmt = '#,##0.00';
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '000000' }, // black
      };
      cell.font = {
        color: { argb: 'FFFFFF' }, // white
        bold: true,
      };
    });

    // // Add footer
    const footerRow = worksheet.addRow([
      'This is a system-generated excel sheet.',
    ]);
    footerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFE5' },
    };
    footerRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Merge Cells for the footer
    worksheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fs.saveAs(blob, 'PurchaseOrder.xlsx');
    });

  }


  getColumnLetter(index: number): string {
    let columnLetter = '';
    while (index > 0) {
      const remainder = (index - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      index = Math.floor((index - 1) / 26);
    }
    return columnLetter;
  }



  // private getColumnLetters(index: number): string {
  //   let columnLetter = '';
  //   while (index > 0) {
  //     const remainder = (index - 1) % 26;
  //     columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
  //     index = Math.floor((index - 1) / 26);
  //   }
  //   return columnLetter;
  // }

  async generatePurchaseOrderPDF(repData: any) {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(12);  // Adjust the font size as needed
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 0, 0);  // Red color
    const text = 'Purchase Order';
    const textWidth = doc.getStringUnitWidth(text) * 14;  // Adjust the font size accordingly
    const startX = (doc.internal.pageSize.width - textWidth) / 2;
    const startY = 11.3;
    doc.setLineWidth(0.5);
    doc.line(startX, startY, startX + textWidth, startY);

    // Reset settings for the regular text
    // doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);  // Reset to black color
    doc.text('Purchase Order', 105, 10, { align: 'center' });

    doc.setFontSize(10);
    const leftMargin = 15;  // Adjust the left margin value as needed
    const frmtedDate = this.datepipe.transform(repData[0].suppDate, "dd-MM-yyyy")
    doc.text(`Supplier: ${repData[0].supplier}`, leftMargin, 15);
    const rightMargin = doc.internal.pageSize.width - 60;
    doc.text(`OrderNo: ${repData[0].tranNo}`, rightMargin, 15);
    doc.text(`Order Date: ${frmtedDate}`, rightMargin, 20);
    doc.text(`Currency: ${repData[0].currency}`, rightMargin, 25);
    doc.text(`OrderValue: ${repData[0].orderValue}`, rightMargin, 30);
    doc.text(`CGST: ${repData[0].vatAmt}`, rightMargin, 35);
    doc.text(`SGST: ${repData[0].vatAmt}`, rightMargin, 40);
    doc.text(`Phone: ${repData[0].compPhone1}`, rightMargin, 45);
    doc.text(`Email: ${repData[0].compEMail}`, rightMargin, 50);
    doc.text(`Total: ${repData[0].rowValue}`, rightMargin, 55);


    // Add table headers
    const headers = ['SLNO', 'Product', 'UOM', 'RATE', 'QUANTITY', 'VAT', 'AMOUNT'];
    const totalAmount = repData.reduce((total: any, item: { rowValue: any; }) => total + item.rowValue, 0);
    // const data = repData.map((item: any) => [item.slNo, item.itemDesc, item.uom, item.unitRate, item.quantity, item.vatAmt, item.rowValue]);
    const data = repData.map((item: any) => [
      item.slNo,
      item.itemDesc,
      item.uom,
      item.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      item.quantity.toLocaleString(),
      item.vatAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      item.rowValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);
    const totalRow = [
      { content: '', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }, }, // SLNO
      { content: '', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] } }, // Product
      { content: '', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] } }, // UOM
      { content: '', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] } }, // RATE
      { content: '', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] } }, // QUANTITY
      { content: 'Total:', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'right' } }, // VAT
      { content: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'right' } }, // Total Amount
    ];


    data.push(totalRow);
    const options = {
      startY: 60,
      margin: { top: 20 },
      // headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontSize: 10,
        //   halign: 'right',  // Right-align the headers
      },
      bodyStyles: { fontSize: 8 },
      theme: 'grid',
      columnStyles: {
        3: { halign: 'right' }, // 'RATE' column
        4: { halign: 'right' }, // 'QUANTITY' column
        5: { halign: 'right' }, // 'VAT' column
        6: { halign: 'right' }, // 'AMOUNT' column
      },
    };
    (doc as any).autoTable({ head: [headers], body: data, ...options });

    // Add footer
    // Add footer
    doc.text('This is a system-generated PDF.', 105, doc.internal.pageSize.height - 10, { align: 'center' });

    // Save or open the PDF
    const blob = doc.output('blob');
    fs.saveAs(blob, 'PurchaseOrder.pdf');
  }
  // async generateQuotationPDF(repData: any) {
  //   const doc = new jsPDF();
  //   // console.log(repData);
  //   doc.setFontSize(12);  // Adjust the font size as needed
  //   doc.setFont('helvetica', 'bold');
  //   doc.setTextColor(255, 0, 0);  // Red color
  //   const text = 'Quotation';
  //   const logoImage = 'assets/img/TKGlogo.png';
  //   let rightColumnX = doc.internal.pageSize.width - 90;
  //   doc.addImage(logoImage, 'PNG', rightColumnX + 30, 10, 20, 20);
  //   const textWidth = doc.getStringUnitWidth(text) * 14;  // Adjust the font size accordingly
  //   const startX = (doc.internal.pageSize.width - textWidth) / 2;
  //   const startY = 11.3;
  //   doc.setLineWidth(0.5);
  //   doc.line(startX, startY, startX + textWidth, startY);

  //   // Reset settings for the regular text
  //   // doc.setFontSize(10);
  //   doc.setFont('helvetica', 'normal');
  //   doc.setTextColor(0, 0, 0);  // Reset to black color
  //   doc.text(text, 105, 10, { align: 'center' });

  //   doc.setFontSize(10);
  //   const leftMargin = 10;  // Adjust the left margin value as needed
  //   const frmtedDate = this.datepipe.transform(repData[0].tranDate, "dd-MM-yyyy")
  //   const totalAmount = repData.reduce((total: any, item: { amount: any; }) => total + item.amount, 0);

  //   doc.text(`Supplier: ${repData[0].salesRepName}`, leftMargin, 15);

  //   // Company Address
  //   const companyAddressLines = doc.splitTextToSize(`Address: ${repData[0].billAddress}`, 80); // Adjust width as needed
  //   doc.text(companyAddressLines, leftMargin, 20);

  //   // Contact
  //   const contactLines = doc.splitTextToSize(`Contact: ${repData[0].billContacts}`, 80); // Adjust width as needed
  //   doc.text(contactLines, leftMargin, 25);
  //   const rightMargin = doc.internal.pageSize.width - 70;
  //   doc.text(`QuotationNo: ${repData[0].tranNo}`, rightMargin, 35);
  //   doc.text(`Quotation Date: ${frmtedDate}`, rightMargin, 40);
  //   doc.text(`Currency: ${repData[0].currencyName}`, rightMargin, 45);
  //   doc.text(`Value: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightMargin, 50);
  //   doc.text(`CGST: ${repData[0].vatRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightMargin, 55);
  //   doc.text(`SGST: ${repData[0].vatRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightMargin, 60);
  //   // doc.text(`Phone: ${repData[0].compPhone1}`, rightMargin, 45);
  //   // doc.text(`Email: ${repData[0].compEMail}`, rightMargin, 50);
  //   doc.text(`Total: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightMargin, 65);


  //   // Add table headers
  //   const headers = ['SLNO', 'Product', 'UOM', 'RATE', 'QUANTITY', 'DISCOUNT', 'VAT', 'AMOUNT'];
  //   // const totalAmount = repData[0].totalAmt;
  //   // const data = repData.map((item: any) => [item.slNo, item.itemDesc, item.uom, item.unitRate, item.quantity, item.vatAmt, item.rowValue]);
  //   const data = repData.map((item: any) => [
  //     item.slNo,
  //     item.productName,
  //     item.uom,
  //     item.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  //     item.quantity.toLocaleString(),
  //     item.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  //     item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  //     item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  //   ]);
  //   const totalRow = [
  //     { content: '', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255] }, }, // SLNO
  //     { content: '', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255] } }, // Product
  //     { content: '', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255] } }, // UOM
  //     { content: '', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255] } }, // RATE
  //     { content: '', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255] } }, // QUANTITY
  //     { content: '', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255] } }, // QUANTITY
  //     { content: 'Total:', styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'right' } }, // VAT
  //     {
  //       content: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  //       styles: { fillColor: [100, 99, 99], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'right' }
  //     }, // Total Amount
  //   ];


  //   data.push(totalRow);
  //   const options = {
  //     startY: 70,
  //     margin: { top: 20 },
  //     // headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
  //     headStyles: {
  //       fillColor: [100, 99, 99],
  //       textColor: [255, 255, 255],
  //       fontSize: 8,
  //       //   halign: 'right',  // Right-align the headers
  //     },
  //     bodyStyles: { fontSize: 8 },
  //     theme: 'grid',
  //     columnStyles: {
  //       3: { halign: 'right' }, // 'RATE' column
  //       4: { halign: 'right' }, // 'QUANTITY' column
  //       5: { halign: 'right' }, // 'VAT' column
  //       6: { halign: 'right' }, // 'AMOUNT' column
  //       7: { halign: 'right' }, // 'AMOUNT' column
  //     },
  //   };
  //   (doc as any).autoTable({ head: [headers], body: data, ...options });

  //   // Add footer
  //   // Add footer
  //   doc.text('This is a system-generated PDF.', 105, doc.internal.pageSize.height - 10, { align: 'center' });

  //   // Save or open the PDF
  //   const blob = doc.output('blob');
  //   fs.saveAs(blob, 'Quotation.pdf');
  // }
}

