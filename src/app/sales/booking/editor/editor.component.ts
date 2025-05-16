import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
email:string="mail@goadventure.in"
  invoiceData = {
    customerName: 'Rajuldev Sai Kiran',
    customerAddress: 'Hyderabad, Telangana',
    tripName: 'Shimla Manali Ex: Delhi',
    travelDate: 'May 25th',
    bookingId: '2025-00750',
    date: '30-April-2025',
    quantity: 2,
    unitPrice: '17,000 + 5% GST',
    subtotal: 34000,
    tax: 1700,
    total: 35700,
    totalInWords: 'Thirty-five thousand seven hundred Rupees only',
    deposit: '8,000'
  };

  downloadPDF() {
  const button = document.querySelector('.no-print') as HTMLElement;
  const element = document.getElementById('invoice');

  if (!element) return;

  // Hide button before capture
  if (button) button.style.display = 'none';

  setTimeout(() => {
    html2canvas(element, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('invoice.pdf');

      // Show button again
      if (button) button.style.display = 'block';
    });
  }, 100); // Optional delay to ensure the DOM is repainted
}

}
