import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import 'jspdf-autotable';
import { UserDataService } from '../Services/user-data.service';
import { SubSink } from 'subsink';
import { MastersService } from '../Services/masters.service';
import { LogoService } from '../Services/logo.service';

@Injectable({
  providedIn: 'root'
})
export class PdfReportsService {
  logoPath: string = "";
  constructor(private userService: UserDataService, private fileUploadService: MastersService, private logoService: LogoService

  ) {
    const logoFileName = sessionStorage.getItem('logo') as string;
    this.downloadSelectedFile(logoFileName, 'logo');
    if (this.userService.userData.defaultCompanyName.includes('Takow')) {
      this.logoPath = "assets/img/TKGlogo.jpg";
    }

    if (this.userService.userData.defaultCompanyName.includes('Sadasa')) {
      this.logoPath = "assets/img/sadaslogo.png";
    }
  }
  private subSink!: SubSink;
  logoImageBlob: string = "";
  imageBlob: string = 'assets/img/user.jpg';
  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob); // Convert the blob to base64
    });
  }
  private isImageFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpeg');
  }
  downloadSelectedFile(fileName: string, type: 'user' | 'logo'): Promise<string> {

    return new Promise((resolve, reject) => {
      try {
        this.subSink.sink = this.fileUploadService.downloadFile(fileName).subscribe({
          next: (res: Blob) => {
            this.convertBlobToBase64(res)
              .then((base64: string) => {
                if (this.isImageFile(fileName)) {
                  if (type === 'user') {
                    this.imageBlob = base64;
                    resolve(this.imageBlob);
                  } else if (type === 'logo') {
                    this.logoImageBlob = base64;
                    this.logoService.setLogoPath(base64);
                    resolve(this.logoImageBlob);
                  }
                } else {
                  if (type === 'user') {
                    this.imageBlob = "assets/img/user.jpg";
                    resolve(this.imageBlob);
                  } else if (type === 'logo') {
                    this.logoImageBlob = "";
                    sessionStorage.setItem('logoImageBlob', "");
                    resolve(this.logoImageBlob);
                  }
                }
              })
              .catch(() => {
                if (type === 'user') {
                  this.imageBlob = "assets/img/user.jpg";
                  resolve(this.imageBlob);
                } else if (type === 'logo') {
                  this.logoImageBlob = "";
                  sessionStorage.setItem('logoImageBlob', "");
                  resolve(this.logoImageBlob);
                }
              });
          },
          error: (error) => {
            if (type === 'user') {
              this.imageBlob = "assets/img/user.jpg";
              resolve(this.imageBlob);
            } else if (type === 'logo') {
              this.logoImageBlob = "";
              sessionStorage.setItem('logoImageBlob', "");
              resolve(this.logoImageBlob);
            }
          }
        });
      } catch (ex: any) {
        if (type === 'user') {
          this.imageBlob = "assets/img/user.jpg";
          resolve(this.imageBlob);
        } else if (type === 'logo') {
          this.logoImageBlob = "";
          sessionStorage.setItem('logoImageBlob', "");
          resolve(this.logoImageBlob);
        }
      }
    });
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

  generatePDF(cmpData: any, extitle: string, exdate: Date, type: string) {

    const data = cmpData;
    const doc = new jsPDF();
    const text = extitle;
    const textWidth = doc.getStringUnitWidth(text) * 14;
    const startX = (doc.internal.pageSize.width - textWidth) / 2;
    const startY = 11.3;
    doc.setLineWidth(0.5);
    doc.line(startX, startY, startX + textWidth, startY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(text, 105, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    let leftColumnX = 10;
    let rightColumnX = doc.internal.pageSize.width - 90;
    const formatDate = (dateString: any) => {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      const dateObject = new Date(dateString);
      const formattedDate = dateObject.toLocaleDateString('en-GB', options as any);
      const [day, month, year] = formattedDate.split('/');

      // Join the parts with dashes
      return `${day}-${month}-${year}`;
    };
    const formatNumber = (number: any) => {
      const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      return number.toLocaleString('en-US', options);
    };
    const logoImage = this.logoImageBlob;
    doc.addImage(logoImage, 'PNG', rightColumnX + 30, 10, 20, 20);
    data.forEach((item: any, index: number) => {
      doc.setTextColor(52, 152, 219);
      doc.setFontSize(10);
      doc.text('Tenant:', leftColumnX + 5, 30);

      doc.text('Property:', leftColumnX + 5, 35);

      doc.text('Unit:', leftColumnX + 5, 40);
      doc.text('Email:', leftColumnX + 5, 45);
      doc.text('Date:', leftColumnX + 5, 50);
      doc.text('Due Date:', leftColumnX + 5, 55);
      doc.text('Invoice No:', leftColumnX + 5, 60);
      doc.text('Invoice Month:', leftColumnX + 5, 65);
      doc.setTextColor(139, 69, 19);
      doc.text(`${item.tenantName}`, leftColumnX + 30, 30);
      doc.text(`${item.property}`, leftColumnX + 30, 35);
      doc.text(`${item.unit}`, leftColumnX + 30, 40);
      doc.text(`${item.emailId}`, leftColumnX + 30, 45);
      doc.text(`${formatDate(item.tranDate)}`, leftColumnX + 30, 50);
      doc.text(`${formatDate(item.dueDate)}`, leftColumnX + 30, 55);
      doc.text(`${item.invoiceNo}`, leftColumnX + 30, 60);
      doc.text(`${item.tranMonthName}-${item.tranYear}`, leftColumnX + 30, 65);
      doc.setTextColor(139, 69, 19);


      doc.setFontSize(10);
      const compAddressesLines = doc.splitTextToSize(item.compAddresses, 50);
      doc.text(compAddressesLines, rightColumnX + 30, 35);
      const compContactsLines = doc.splitTextToSize(item.compContacts, 50);
      doc.text(compContactsLines, rightColumnX + 30, 50);
      const emailInfoLines = doc.splitTextToSize(item.emailInfo, 50);
      doc.text(emailInfoLines, rightColumnX + 30, 60);
      leftColumnX = 10;
      const headers = [
        { content: 'S.No', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'Charge Type', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'Charge Amount', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'VAT Amount', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Total', styles: { halign: 'right', lineColor: [0, 0, 0] } }
      ];
      let totalItemAmount = 0;
      let totalVatAmount = 0;
      let totalNetAmount = 0;
      const data1 = data.map((item: any) => {
        const itemAmount = parseFloat(item.itemAmount);
        const vatAmount = parseFloat(item.vatAmount);
        const netAmount = parseFloat(item.netAmount);

        totalItemAmount += itemAmount;
        totalVatAmount += vatAmount;
        totalNetAmount += netAmount;

        return [
          item.slNo,
          item.costItemDesc,
          itemAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ];
      });
      const totalRow = [
        { content: '' },
        { content: '' },
        { content: totalItemAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fillColor: [169, 169, 169], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold' } }, // VAT Amount
        { content: totalVatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fillColor: [169, 169, 169], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold' } }, // VAT Amount
        { content: totalNetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fillColor: [169, 169, 169], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold' } },
      ];
      data1.push(totalRow);
      const options = {
        startY: 75,
        headStyles: {
          fillColor: [169, 169, 169],
          textColor: [0, 0, 0],
          fontSize: 10,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          border: [0, 0, 0, 1]
        },
        bodyStyles: { fontSize: 10 },
        theme: 'grid',
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
        }
      };

      (doc as any).autoTable({ head: [headers], body: data1, ...options });
      const noteText = 'This is a system-generated invoice. It does not need any signature.';
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(noteText, 105, (doc as any).autoTable.previous.finalY + 10, { align: 'center' });

    });
    const blob = doc.output('blob');
    const filename = extitle + '.pdf';
    const fileWithFilename = new File([blob], filename, { type: 'application/pdf' });
    if (type.toUpperCase() === "EMAIL" && type != "" && (['GINV', "INVOICE"].includes(extitle.toUpperCase()))) {
      return fileWithFilename;
    }
    else if (extitle.toUpperCase() != "GINV") {
      this.previewOrPrintPDF(blob, extitle);
      // saveAs(blob, extitle + '.pdf');
      return;
    }
    else {
      return;
    }
  }

  formatDatetoString(dateString: string) {
    const dateObj = new Date(dateString);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const day = dateObj.getDate();
    const month = dateObj.getMonth(); // This will return a number from 0 to 11, representing the month index
    const year = dateObj.getFullYear().toString();

    const formattedYear = year;

    let suffix;
    if (day >= 11 && day <= 13) {
      suffix = "th";
    } else {
      switch (day % 10) {
        case 1: suffix = "st"; break;
        case 2: suffix = "nd"; break;
        case 3: suffix = "rd"; break;
        default: suffix = "th";
      }
    }

    const formattedDate = day + suffix + " " + months[month] + " " + formattedYear;

    return formattedDate;
  }
  agreementGeneration(property: string, unit: string, res: any) {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    const rightImage = new Image();
    rightImage.src = "assets/img/TKGlogo.jpg";
    pdf.setFont('Helvetica', 'bold');
    pdf.text('TENANCY AGREEMENT ', 70, 20);
    pdf.setFontSize(10);
    pdf.text('OF ', 90, 25);
    pdf.text('UNIT NO. ' + property + ",  " + unit, 65, 30);
    pdf.setTextColor('');
    pdf.setFontSize(10);
    pdf.setFont('Helvetica', 'normal')
    const date = this.formatDatetoString(res.data.joinDate);
    const company = "Nagaad Property Management Limited";
    const tenantName = res.data.name;
    const idtype = "";
    const idNumber = res.data.idNo;
    const rentAmount = res.data.rentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const refundAmount = res.data.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const textLine1 = 'THIS AGREEMENT is made on ' + date + ' BETWEEN ' + company + ' (hereinafter called "the Landlord" and ' + tenantName + ' a' + idtype + ' and ' + idNumber + ' (hereinafter called "the Tenant").';
    const textLine2 = 'WHEREAS the Landlord demises unto the Tenant ALL THAT Unit.'
    const textLine3 = 'NOW THIS AGREEMENT WITNESSETH that in consideration of the rent hereinafter reserved and of the covenants conditions agreements restrictions  stipulations  and provisions hereinafter' +
      'contained or implied and on the part of the Tenant to be performed and observed the Landlord DO THE HEREBY LEASE  the unit to the Tenant for a term of One (1) ' + date + '.'
    const textLine4 = 'SUBJECT to the following terms and conditions:';
    const textLine5 = '1. The Tenant to the intent that the obligations hereinafter set out may continue throughout the continuance of the term covenants and agrees with the Landlord as follows:';
    const textLine6 = "a. The rent shall be Kshs " + rentAmount + " per month payable on or before 5th of every month.";
    const textLine7 = "b. On or before signing this agreement the Tenant shall pay one month’s rent and equivalent of one month’s rent as refundable security deposit giving a total sum of Kshs " + refundAmount;
    const textLine8 = "c. Thereafter the rent together with service charge shall be paid monthly in advance and in any event not later than the 5th day of the month the same is due.";
    const textLine9 = "d. To pay all charges for water, electricity during the tenancy period.";
    const textLine10 = "e. To keep the interior of the demised premises including all doors, windows, floors, walls and ceilings and glass clean and pipes sanitary, water apparatus internal pipes and the Landlord fixtures and fittings therein in the same good and tenantable repair and conditions as they were at the commencement of the term (repairs rendered necessary by tear and wear, loss or damage by fire, burglary explosion from tempest, riot, civil commotion, falling aircraft or articles dropped there from or other causes outside the control of the Tenant only exempted).";
    const textLine11 = "f. Not to make or permit to be made any alterations in or additions to the property nor erect any fixtures therein nor to drive any nails screws bolts or wedges in the floors, walls or ceilings thereof without the consent in writing of the Landlord first had and obtained.";
    const textLine12 = "g. Not to sublet the said premises without the Landlord’s prior consent, AND IT IS HEREBY AGREED AND DECLARED that upon the breach by the Tenant of this sub-clause it shall be lawful for the Landlord to re-enter the property after giving 14 days notice calling upon the tenant to remedy the breach and failing which the term hereby created shall cease and determine absolutely.";
    const textLine13 = "h. Not to use the said premises or any part thereof for any other purpose than as residential premises/commercial as agreed.";
    const textLine14 = "i. Not to do or permit to be done anything in or upon the property or any part thereof which may at any time be or become a nuisance or annoyance to the tenant or occupiers of any neighboring property.";
    const textLine15 = "j. To permit the management or agents and surveyors with or without workmen at all reasonable times upon request to enter the premises and examine the property and upon notice make good any defect.";
    const textLine16 = "k. Immediately prior to the termination of this agreement (howsoever determined) to paint with sufficient coats of good oil plastic emulsion paint in a proper and workman like manner in a color and otherwise to the reasonable satisfaction of the Landlord or her authorized agents in all respects all the internal iron, wood or other internal parts of the property therein before or usually painted.";
    const textLine17 = "l. At the termination of the term to deliver up the property together with the Landlord’s fixtures if any and fittings therein with all locks keys and fastenings complete and in such a state of repair order and condition as shall be in strict compliance with the covenants agreements in that behalf on the part of the Tenant herein contained.";
    const textLine18 = "m. To keep the property and environment in a clean, tidy and sanitary condition at all times.  Any garbage should be stored in the garbage bin provided by or to be provided by the refuse collectors or the tenant.  Not to place, leave or cause any items or vehicle at or on any entrance or pathways.";
    const leftMargin = 15;
    const pageWidth = 210;
    const maxWidth = pageWidth - (2 * leftMargin);
    // const maxWidth = 175; // Adjust this value according to your document's width
    const splitText = pdf.splitTextToSize(textLine1, maxWidth);
    pdf.text(splitText, leftMargin, 40);

    const splitText1 = pdf.splitTextToSize(textLine2, maxWidth);
    pdf.text(splitText1, leftMargin, 55);

    const splitText2 = pdf.splitTextToSize(textLine3, maxWidth);
    pdf.text(splitText2, leftMargin, 65);

    const splitText3 = pdf.splitTextToSize(textLine4, maxWidth);
    pdf.text(splitText3, leftMargin, 85);

    const splitText4 = pdf.splitTextToSize(textLine5, maxWidth);
    pdf.text(splitText4, leftMargin + 5, 95);

    const splitText5 = pdf.splitTextToSize(textLine6, maxWidth - 5);
    pdf.text(splitText5, leftMargin + 10, 105);

    const splitText6 = pdf.splitTextToSize(textLine7, maxWidth - 5);
    pdf.text(splitText6, leftMargin + 10, 110);


    const splitText7 = pdf.splitTextToSize(textLine8, maxWidth - 5);
    pdf.text(splitText7, leftMargin + 10, 120);

    const splitText8 = pdf.splitTextToSize(textLine9, maxWidth - 5);
    pdf.text(splitText8, leftMargin + 10, 130);

    const splitText9 = pdf.splitTextToSize(textLine10, maxWidth - 5);
    pdf.text(splitText9, leftMargin + 10, 135);

    const splitText10 = pdf.splitTextToSize(textLine11, maxWidth - 5);
    pdf.text(splitText10, leftMargin + 10, 157);

    const splitText11 = pdf.splitTextToSize(textLine12, maxWidth - 5);
    pdf.text(splitText11, leftMargin + 10, 170);

    const splitText12 = pdf.splitTextToSize(textLine13, maxWidth - 5);
    pdf.text(splitText12, leftMargin + 10, 188);

    const splitText13 = pdf.splitTextToSize(textLine14, maxWidth - 5);
    pdf.text(splitText13, leftMargin + 10, 198);


    const splitText14 = pdf.splitTextToSize(textLine15, maxWidth - 5);
    pdf.text(splitText14, leftMargin + 10, 208);

    const splitText15 = pdf.splitTextToSize(textLine16, maxWidth - 5);
    pdf.text(splitText15, leftMargin + 10, 218);

    const splitText16 = pdf.splitTextToSize(textLine17, maxWidth - 5);
    pdf.text(splitText16, leftMargin + 10, 236);

    const splitText17 = pdf.splitTextToSize(textLine18, maxWidth - 5);
    pdf.text(splitText17, leftMargin + 10, 252);

    const textLine19 = "2. THE LANDLORD to the intent that the obligations hereinafter set out may continue throughout the continuance of the term covenants and agrees with the Tenant as follows:"
    const splitText18 = pdf.splitTextToSize(textLine19, maxWidth);
    pdf.text(splitText18, leftMargin + 5, 268);

    const textLine20 = "a. To permit the Tenant paying rent hereby reserved and observing the covenants agreements herein contained have quiet and peaceful enjoyment of the property without any interruptions.";
    const splitText19 = pdf.splitTextToSize(textLine20, maxWidth - 5);
    pdf.text(splitText19, leftMargin + 10, 277);


    pdf.addPage();


    const textLine21 = "3. PROVIDED ALWAYS AND IT IS HEREBY AGREED AND DECLARED THAT:"
    const splitText20 = pdf.splitTextToSize(textLine21, maxWidth);
    pdf.text(splitText20, leftMargin + 5, 20);

    const textLine22 = "a. Each party to give the other one month written notice to vacate the property.";
    const splitText21 = pdf.splitTextToSize(textLine22, maxWidth - 5);
    pdf.text(splitText21, leftMargin + 10, 25);

    const textLine23 = "b. The Tenant may request for extension by signifying to the Landlord at least one (1) calendar month prior to the expiry date of the Tenancy Agreement which the Landlord may accept or not and at such rent that is mutually agreed between them.";
    const splitText22 = pdf.splitTextToSize(textLine23, maxWidth - 5);
    pdf.text(splitText22, leftMargin + 10, 30);

    const textLine24 = "IN WITNESS WHEREOF the Landlord and the Tenant have hereunto set their hands, the day and year first hereinbefore written."
    const splitText23 = pdf.splitTextToSize(textLine24, maxWidth);
    pdf.text(splitText23, leftMargin + 5, 46);

    const textLine25 = "SIGNED by the said               )\n\nLANDLORD                           )\n\n\n_________________            )\n\n\n" +
      "In the presence of                 )\n\n\n_________________            )\n\n\n_________________            )\n\n\n_________________            )\n\n\n" +
      "SIGNED by the said             )\n\n\TENANT                               )\n\n\n_________________            )\n\n\n" +
      "In the presence of                 )\n\n\n_________________            )\n\n\n_________________            )\n\n\n_________________            )\n\n\n\n\n\n" +
      "Drawn By:\nAbdullahi & Associate Advocates\nHughes Building, 4th floor,\nKenyatta Avenue,\nP.O.Box 42724-00100\nNairobi."
    const splitText24 = pdf.splitTextToSize(textLine25, maxWidth);
    pdf.text(splitText24, leftMargin + 5, 60);
    // pdf.save('rental_agreement.pdf');
    const pdfBlob = pdf.output('blob');

    this.previewOrPrintPDF(pdfBlob, 'rental_agreement.pdf');
  }
  generateQuotationPDF(cmpData: any, extitle: string, exdate: Date, type: string) {
    const data = cmpData;
    const doc = new jsPDF();
    const text = extitle;
    const textWidth = doc.getStringUnitWidth(text) * 14;
    const startX = (doc.internal.pageSize.width - textWidth) / 2;
    const startY = 11.3;
    doc.setLineWidth(0.5);
    doc.line(startX, startY, startX + textWidth, startY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(text, 105, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    let leftColumnX = 10;
    let rightColumnX = doc.internal.pageSize.width - 90;
    const formatDate = (dateString: any) => {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      const dateObject = new Date(dateString);
      const formattedDate = dateObject.toLocaleDateString('en-GB', options as any);
      const [day, month, year] = formattedDate.split('/');
      return `${day}-${month}-${year}`;
    };
    const formatNumber = (number: any) => {
      const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      return number.toLocaleString('en-US', options);
    };
    const logoImage = 'assets/img/TKGlogo.jpg';
    doc.addImage(logoImage, 'PNG', rightColumnX + 30, 10, 20, 20);
    data.forEach((item: any, index: number) => {
      doc.setTextColor(52, 152, 219);
      doc.setFontSize(10);
      const totalAmount = cmpData.reduce((total: any, item: { amount: any; }) => total + item.amount, 0);

      doc.text('Customer:', leftColumnX + 5, 30);
      doc.text('Address:', leftColumnX + 5, 35);
      doc.text('Contact:', leftColumnX + 5, 45);
      doc.text('Currency:', leftColumnX + 5, 55);
      doc.text('Valid Days:', leftColumnX + 5, 60);
      doc.text('Date:', leftColumnX + 5, 65);
      doc.text('VAT:', leftColumnX + 5, 70);
      doc.text('Total:', leftColumnX + 5, 75);
      doc.text('In Words:', leftColumnX + 5, 80);
      doc.setTextColor(139, 69, 19);
      doc.text(`${item.customerName}`, leftColumnX + 30, 30);
      doc.text(`${item.billAddress}`, leftColumnX + 30, 35);
      doc.text(`${item.billContacts}`, leftColumnX + 30, 45);
      doc.text(`${item.currencyName}`, leftColumnX + 30, 55);
      doc.text(`${item.validDays}`, leftColumnX + 30, 60);
      doc.text(`${formatDate(item.tranDate)}`, leftColumnX + 30, 65);
      doc.text(`${item.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftColumnX + 30, 70);
      doc.text(`${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftColumnX + 30, 75);
      doc.text(`${item.inWords}`, leftColumnX + 30, 80);
      doc.setTextColor(139, 69, 19);


      doc.setFontSize(10);
      const compAddressesLines = doc.splitTextToSize(item.compAddress, 50);
      doc.text(compAddressesLines, rightColumnX + 30, 35);
      const compContactsLines = doc.splitTextToSize(item.compContacts, 50);
      doc.text(compContactsLines, rightColumnX + 30, 50);
      leftColumnX = 10;
      const headers = [
        { content: 'S.No', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'Product', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'UOM', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Rate', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Quantity', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Discount', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'VAT', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Amount', styles: { halign: 'right', lineColor: [0, 0, 0] } }
      ];
      const data1 = data.map((item: any) => {
        return [
          item.slNo,
          item.productName,
          item.uom,
          item.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          item.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ];
      });
      const totalRow = [
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fillColor: [169, 169, 169], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold' } },
      ];
      data1.push(totalRow);
      const options = {
        startY: 85,
        headStyles: {
          fillColor: [169, 169, 169],
          textColor: [0, 0, 0],
          fontSize: 10,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          border: [0, 0, 0, 1]
        },
        bodyStyles: { fontSize: 10 },
        theme: 'grid',
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
        }
      };

      (doc as any).autoTable({ head: [headers], body: data1, ...options });
      const noteText = 'This is a system-generated invoice. It does not need any signature.';
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(noteText, 105, (doc as any).autoTable.previous.finalY + 10, { align: 'center' });

    });
    const blob = doc.output('blob');
    const filename = extitle + '.pdf';
    const fileWithFilename = new File([blob], filename, { type: 'application/pdf' });

    if (type.toUpperCase() === "EMAIL" && type != "" && extitle == "GINV") {
      return fileWithFilename;
    }
    else if (extitle != "GINV") {
      saveAs(blob, extitle + '.pdf');
      return;
    }
    else {
      return;
    }
  }
  generateInvoicePDF(cmpData: any, extitle: string, exdate: Date, type: string) {
    const data = cmpData;
    const doc = new jsPDF();
    const text = extitle;
    const textWidth = doc.getStringUnitWidth(text) * 14;
    const startX = (doc.internal.pageSize.width - textWidth) / 2;
    const startY = 11.3;
    doc.setLineWidth(0.5);
    doc.line(startX, startY, startX + textWidth, startY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(text, 105, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    let leftColumnX = 10;
    let rightColumnX = doc.internal.pageSize.width - 90;
    const formatDate = (dateString: any) => {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      const dateObject = new Date(dateString);
      const formattedDate = dateObject.toLocaleDateString('en-GB', options as any);
      const [day, month, year] = formattedDate.split('/');
      return `${day}-${month}-${year}`;
    };
    const formatNumber = (number: any) => {
      const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      return number.toLocaleString('en-US', options);
    };
    const logoImage = this.logoPath;
    doc.addImage(logoImage, 'PNG', rightColumnX + 30, 10, 20, 20);
    data.forEach((item: any, index: number) => {
      doc.setTextColor(52, 152, 219);
      doc.setFontSize(10);
      const totalAmount = cmpData.reduce((total: any, item: { rowPayAmt: any; }) => total + item.rowPayAmt, 0);

      doc.text('Customer:', leftColumnX + 5, 30);
      doc.text('Ship To:', leftColumnX + 5, 35);
      doc.text('Bill To:', leftColumnX + 5, 40);
      doc.text('Currency:', leftColumnX + 5, 45);
      doc.text('Payterm:', leftColumnX + 5, 50);
      doc.text('Date:', leftColumnX + 5, 55);
      doc.text('VAT:', leftColumnX + 5, 60);
      doc.text('Total:', leftColumnX + 5, 65);
      doc.text('In Words:', leftColumnX + 5, 70);
      doc.setTextColor(139, 69, 19);
      doc.text(`${item.customerName}`, leftColumnX + 30, 30);
      doc.text(`${item.shipAdd1}`, leftColumnX + 30, 35);
      doc.text(`${item.billAdd1}`, leftColumnX + 30, 40);
      doc.text(`${item.currencyName}`, leftColumnX + 30, 45);
      doc.text(`${item.payTermDesc}`, leftColumnX + 30, 50);
      doc.text(`${formatDate(item.tranDate)}`, leftColumnX + 30, 55);
      doc.text(`${item.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftColumnX + 30, 60);
      doc.text(`${item.rowPayAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftColumnX + 30, 65);
      doc.text(`${item.inWords}`, leftColumnX + 30, 70);
      doc.setTextColor(139, 69, 19);


      doc.setFontSize(10);
      const compAddressesLines = doc.splitTextToSize(item.compAdd1 + "" + item.compAdd2 + "" + item.compAdd3 + "" + item.compCity, 50);
      doc.text(compAddressesLines, rightColumnX + 30, 35);
      const compContactsLines = doc.splitTextToSize(item.compPhone1 + "" + item.compPhone2 + "" + item.compeMail, 50);
      doc.text(compContactsLines, rightColumnX + 30, 50);
      leftColumnX = 10;
      const headers = [
        { content: 'S.No', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'Product', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'UOM', styles: { halign: 'left', lineColor: [0, 0, 0] } },
        { content: 'Rate', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Quantity', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Discount', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'VAT', styles: { halign: 'right', lineColor: [0, 0, 0] } },
        { content: 'Amount', styles: { halign: 'right', lineColor: [0, 0, 0] } }
      ];
      const data1 = data.map((item: any) => {
        return [
          item.slNo,
          item.productName,
          item.uom,
          item.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          item.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.rowPayAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ];
      });
      const totalRow = [
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fillColor: [169, 169, 169], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold' } },
      ];
      data1.push(totalRow);
      const options = {
        startY: 85,
        headStyles: {
          fillColor: [169, 169, 169],
          textColor: [0, 0, 0],
          fontSize: 10,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          border: [0, 0, 0, 1]
        },
        bodyStyles: { fontSize: 10 },
        theme: 'grid',
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
        }
      };

      (doc as any).autoTable({ head: [headers], body: data1, ...options });
      const noteText = 'This is a system-generated invoice. It does not need any signature.';
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(noteText, 105, (doc as any).autoTable.previous.finalY + 10, { align: 'center' });

    });
    const blob = doc.output('blob');
    const filename = extitle + '.pdf';
    const fileWithFilename = new File([blob], filename, { type: 'application/pdf' });

    if (type.toUpperCase() === "EMAIL" && type != "" && extitle == "GINV") {
      return fileWithFilename;
    }
    else if (extitle != "GINV") {
      // saveAs(blob, extitle + '.pdf');
      this.previewOrPrintPDF(blob, extitle + '.pdf');
      return;
    }
    else {
      return;
    }
  }
  generatePDfReport(res: any, history: string) {
    // if (this.userDataService.userData.defaultCompanyName.includes('Takow')) {
    //   this.logoPath = "assets/img/TKGlogo.jpg";
    // }

    // if (this.userDataService.userData.defaultCompanyName.includes('Sadasa')) {
    //   this.logoPath = "assets/img/sadaslogo.png";
    // }
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    const rightImage = new Image();
    if(this.userService.userData.company.toUpperCase() === 'SADASA'){
      rightImage.src = "assets/img/sadaslogo.png";
    }
    else{

      rightImage.src = "assets/img/TKGlogo.jpg";
    }
    const rightImageWidth = 30;
    const rightImageHeight = 20;
    pdf.addImage(rightImage, 'PNG', pdf.internal.pageSize.width - rightImageWidth - 10, 10, rightImageWidth, rightImageHeight)
    pdf.setTextColor(165, 42, 42);
    pdf.setFont('Helvetica', 'bold');
    pdf.text(history, 85, 10);
    const fontSize = 10;
    const lineHeight = 1;
    function formatDate(inputDate: string): string {
      const date = new Date(inputDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    function drawUnderlinedText(label: string, value: string, x: number, y: number, textColor: [number, number, number]) {
      const labelWidth = pdf.getStringUnitWidth(label) * fontSize / pdf.internal.scaleFactor;
      const valueWidth = pdf.getStringUnitWidth(value) * fontSize / pdf.internal.scaleFactor;
      pdf.text(label, x, y);
      pdf.setTextColor(...textColor);
      if (value !== '') {
        pdf.text(value, x + labelWidth, y);
        pdf.line(x + labelWidth, y + lineHeight, x + labelWidth + valueWidth, y + lineHeight);
      } else {
        pdf.text(value, x + labelWidth, y);
      }
      pdf.setTextColor(0);
    }

    pdf.setFontSize(9);
    pdf.setTextColor(0);
    pdf.setFont("helvetica", "normal");
    drawUnderlinedText('Property: ', res.data[0].propName || res.data[0].propertyName, 20, 35, [165, 42, 42]);
    drawUnderlinedText('Unit: ', res.data[0].unitName, 140, 35, [165, 42, 42]);


    // drawUnderlinedText( 170, 35, [165, 42, 42]);
    // drawUnderlinedText('Occupied Months: ', res.data[0].occupiedMonthCnt, 175, 35, [165, 42, 42]);
    // drawUnderlinedText('Vacant Months: ', res.data[0].vacantMonthCnt, 180, 35, [165, 42, 42]);

    if (history === "Flat History") {
      pdf.setTextColor(0, 0, 255);
      pdf.text('Total Months: ' + res.data[0].totalMonthsCnt, 20, 45);

      pdf.setTextColor(0, 128, 0);
      pdf.text('Occupied Months: ' + res.data[0].occupiedMonthCnt, 80, 45);

      pdf.setTextColor(255, 0, 0);
      pdf.text('Vacant Months: ' + res.data[0].vacantMonthCnt, 140, 45);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setTextColor(0);
      pdf.setFont("helvetica", "normal");
      var headers = ['S.No', 'Landlord', 'Tenant', 'Joined On', 'Vacated On', 'Status'];
      var tableData = res.data.map(function (item: any, index: any) {
        const vacatedDate = item.vacatedDate === "0001-01-01T00:00:00" ? "" : formatDate(item.vacatedDate);
        return [
          index + 1,
          item.landlord,
          item.tenant,
          formatDate(item.joinDate),
          vacatedDate,
          item.unitStatus,
          // item.notes
        ];
      });

      var columnWidths = [8, 35, 62, 17, 20, 20, 35];
      var x = 15;
      var y = 50;
      for (var i = 0; i < headers.length; i++) {
        pdf.rect(x, y, columnWidths[i], 5);
        pdf.text(headers[i], x + 1, y + 4);
        x += columnWidths[i];
      }
      x = 15;
      y += 5;
      pdf.setFontSize(8);
      for (var j = 0; j < tableData.length; j++) {
        for (var k = 0; k < tableData[j].length; k++) {
          pdf.rect(x, y, columnWidths[k], 5);
          pdf.text(String(tableData[j][k]), x + 1, y + 4);
          x += columnWidths[k];
        }
        x = 15;
        y += 5;
      }
      // pdf.save('history.pdf');
      const pdfBlob = pdf.output('blob');

      this.previewOrPrintPDF(pdfBlob, 'history.pdf');
    }
    else if (history === "Grievances History") {
      var headers = ['S.No', 'Tenant', 'Complaint', 'Raised On', 'Allocated On', 'Closed On', 'Time Taken', 'Cost To Mgmt', 'Cost To Llrd', 'Cost To Tnt'];
      var tableData = res.data.map(function (item: any, index: any) {
        const raisedDate = item.raisedDate === "0001-01-01T00:00:00" ? "" : formatDate(item.raisedDate);
        const allocatDate = item.allocatedDate === "0001-01-01T00:00:00" ? "" : formatDate(item.allocatedDate);
        const closedDate = item.closedDate === "0001-01-01T00:00:00" ? "" : formatDate(item.closedDate);
        return [
          index + 1,
          item.tenant,
          item.complaintType,
          raisedDate,
          allocatDate,
          closedDate,
          item.ttDays + 'D, ' + item.ttHours + 'H, ' + item.ttMins + "M",
          item.costToMgmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.costToLandlord.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          item.costToTenant.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
      });

      var columnWidths = [8, 32, 25, 17, 20, 18, 18, 22, 19, 21];
      var x = 5;
      var y = 40;
      pdf.setFillColor(211, 211, 211);
      for (var i = 0; i < headers.length; i++) {
        pdf.rect(x, y, columnWidths[i], 5);
        pdf.text(headers[i], x + 1, y + 4);
        x += columnWidths[i];
      }
      x = 5;
      y += 5;
      pdf.setFontSize(7);
      for (var j = 0; j < tableData.length; j++) {
        for (var k = 0; k < tableData[j].length; k++) {
          pdf.rect(x, y, columnWidths[k], 5);
          if (k >= 7) {
            pdf.text(String(tableData[j][k]), x + columnWidths[k] - pdf.getStringUnitWidth(String(tableData[j][k])), y + 4, 'right' as any);
          } else {
            pdf.text(String(tableData[j][k]), x + 1, y + 4);
          }
          x += columnWidths[k];
        }
        x = 5;
        y += 5;
      }
      // pdf.save('GrievancesHistory.pdf');
      const pdfBlob = pdf.output('blob');

      this.previewOrPrintPDF(pdfBlob, 'GrievancesHistory.pdf');
    }

  }
}
