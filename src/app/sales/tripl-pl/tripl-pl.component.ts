import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface TripIncome {
  source: string;
  amount: number;
  description?: string;
}

interface TripExpense {
  category: string;
  amount: number;
  description?: string;
  date?: string;
}

interface TripData {
  name: string;
  date: string;
  participants: number;
  incomes: TripIncome[];
  expenses: TripExpense[];
}

@Component({
  selector: 'app-trip-pl',
  templateUrl: './tripl-pl.component.html',
  styleUrls: ['./tripl-pl.component.css']
})
export class TripPLComponent implements OnInit {
  
  tripData: TripData = {
    name: 'Sample Trip',
    date: '2024-01-15',
    participants: 4,
    incomes: [
      { source: 'Booking Id 1', amount: 2000, description: 'Initial payment from all participants' },
      { source: 'Booking Id 2', amount: 500, description: 'Local business sponsorship' }
    ],
    expenses: [
      { category: 'Accommodation', amount: 800, description: 'Hotel booking', date: '2024-01-15' },
      { category: 'Transportation', amount: 600, description: 'Bus rental', date: '2024-01-16' },
      { category: 'Food & Beverages', amount: 400, description: 'Meals and drinks', date: '2024-01-17' },
      { category: 'Activities', amount: 300, description: 'Tour activities', date: '2024-01-18' }
    ]
  };

  isGenerating = false;

  constructor() { }

  ngOnInit(): void {
  }

  get totalIncome(): number {
    return this.tripData.incomes.reduce((sum, income) => sum + income.amount, 0);
  }

  get totalExpenses(): number {
    return this.tripData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  get netProfit(): number {
    return this.totalIncome - this.totalExpenses;
  }

  get profitMargin(): number {
    return this.totalIncome > 0 ? (this.netProfit / this.totalIncome) * 100 : 0;
  }

  downloadPDF() {
    const element = document.getElementById('trip-pl-report');
    const buttons = document.querySelectorAll('.no-print') as NodeListOf<HTMLElement>;
    
    // Hide all buttons with no-print class before capture
    buttons.forEach(button => {
      if (button) button.style.display = 'none';
    });

    if (!element) {
      console.error('Trip P&L report element not found');
      // Show buttons again if element not found
      buttons.forEach(button => {
        if (button) button.style.display = 'block';
      });
      return;
    }

    this.isGenerating = true;

    setTimeout(() => {
      html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Handle multi-page PDF if content is too long
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${this.tripData.name}_PL_Report.pdf`);
        
        // Show all buttons again after PDF generation
        buttons.forEach(button => {
          if (button) button.style.display = 'block';
        });
        
        this.isGenerating = false;
      }).catch((error) => {
        console.error('Error generating PDF:', error);
        
        // Show buttons again even if there's an error
        buttons.forEach(button => {
          if (button) button.style.display = 'block';
        });
        
        this.isGenerating = false;
      });
    }, 100); // Small delay to ensure DOM is repainted
  }

  async generateExcel() {
    this.isGenerating = true;
    const buttons = document.querySelectorAll('.no-print') as NodeListOf<HTMLElement>;
    
    // Hide all buttons with no-print class during Excel generation
    buttons.forEach(button => {
      if (button) button.style.display = 'none';
    });
    
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Trip Info Sheet
      const tripInfoData = [
        ['Trip Profit & Loss Report'],
        [''],
        ['Trip Name', this.tripData.name],
        ['Date', this.tripData.date],
        ['Participants', this.tripData.participants],
        [''],
        ['Summary'],
        ['Total Income', this.totalIncome],
        ['Total Expenses', this.totalExpenses],
        ['Net Profit/Loss', this.netProfit],
        ['Profit Margin %', this.profitMargin.toFixed(2) + '%'],
        ['Per Participant', (this.netProfit / this.tripData.participants).toFixed(2)]
      ];
      
      const tripInfoWS = XLSX.utils.aoa_to_sheet(tripInfoData);
      
      // Style the header
      if (!tripInfoWS['!merges']) tripInfoWS['!merges'] = [];
      tripInfoWS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
      
      XLSX.utils.book_append_sheet(wb, tripInfoWS, 'Summary');

      // Income Sheet
      const incomeData = [
        ['Income Details'],
        [''],
        ['Source', 'Amount', 'Description']
      ];
      
      this.tripData.incomes.forEach(income => {
        incomeData.push([income.source, income.amount.toString(), income.description || '']);
      });
      
      incomeData.push(['', '', '']);
      incomeData.push(['Total Income', this.totalIncome.toString(), '']);
      
      const incomeWS = XLSX.utils.aoa_to_sheet(incomeData);
      XLSX.utils.book_append_sheet(wb, incomeWS, 'Income');

      // Expenses Sheet
      const expenseData = [
        ['Expense Details'],
        [''],
        ['Category', 'Amount', 'Description', 'Date']
      ];
      
      this.tripData.expenses.forEach(expense => {
        expenseData.push([
          expense.category, 
          expense.amount.toString(), 
          expense.description || '', 
          expense.date || ''
        ]);
      });
      
      expenseData.push(['', '', '', '']);
      expenseData.push(['Total Expenses', this.totalExpenses.toString(), '', '']);
      
      const expenseWS = XLSX.utils.aoa_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, expenseWS, 'Expenses');

      // Detailed Analysis Sheet
      const analysisData = [
        ['Detailed Analysis'],
        [''],
        ['Expense Category', 'Amount', 'Percentage of Total', 'Per Participant'],
        ['']
      ];

      this.tripData.expenses.forEach(expense => {
        const percentage = ((expense.amount / this.totalExpenses) * 100).toFixed(1);
        const perParticipant = (expense.amount / this.tripData.participants).toFixed(2);
        analysisData.push([
          expense.category,
          expense.amount.toString(),
          percentage + '%',
          perParticipant
        ]);
      });

      analysisData.push(['']);
      analysisData.push(['Income Breakdown']);
      analysisData.push(['Source', 'Amount', 'Percentage of Total', 'Per Participant']);
      analysisData.push(['']);

      this.tripData.incomes.forEach(income => {
        const percentage = ((income.amount / this.totalIncome) * 100).toFixed(1);
        const perParticipant = (income.amount / this.tripData.participants).toFixed(2);
        analysisData.push([
          income.source,
          income.amount.toString(),
          percentage + '%',
          perParticipant
        ]);
      });

      const analysisWS = XLSX.utils.aoa_to_sheet(analysisData);
      XLSX.utils.book_append_sheet(wb, analysisWS, 'Analysis');

      // Save Excel file
      XLSX.writeFile(wb, `${this.tripData.name}_PL_Report.xlsx`);
      
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      // Show all buttons again after Excel generation (success or error)
      buttons.forEach(button => {
        if (button) button.style.display = 'block';
      });
      this.isGenerating = false;
    }
  }

  async generateBoth() {
    this.downloadPDF();
    setTimeout(() => {
      this.generateExcel();
    }, 2000); // Increased delay to ensure PDF generation completes
  }

}