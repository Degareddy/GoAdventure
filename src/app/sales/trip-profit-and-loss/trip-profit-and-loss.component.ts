
// trip-pl-report.component.ts
import { Component, OnInit } from '@angular/core';

interface BookingItem {
  booking: string;
  count: number;
  amount: number;
  share: number;
}

interface CostItem {
  expenseHead: string;
  amount: number;
  share: number;
}

interface TripInfo {
  tripName: string;
  fromDate: Date;
  toDate: Date;
}

interface RevenueData {
  bookings: BookingItem[];
  gstPercent: number;
}

interface ReportData {
  tripInfo: TripInfo;
  revenue: RevenueData;
  costs: CostItem[];
}

@Component({
  selector: 'app-trip-profit-and-loss',
  templateUrl: './trip-profit-and-loss.component.html',
  styleUrls: ['./trip-profit-and-loss.component.css']
})
export class TripProfitAndLossComponent implements OnInit {

  reportData: ReportData = {
    tripInfo: {
      tripName: 'Goa Adventure Trip 2025',
      fromDate: new Date('2025-01-15'),
      toDate: new Date('2025-01-20')
    },
    revenue: {
      bookings: [
        { booking: 'Hotel Bookings', count: 25, amount: 125000, share: 50.0 },
        { booking: 'Transportation', count: 25, amount: 75000, share: 30.0 },
        { booking: 'Activities', count: 25, amount: 50000, share: 20.0 }
      ],
      gstPercent: 18
    },
    costs: [
      { expenseHead: 'Hotel Costs', amount: 90000, share: 50.0 },
      { expenseHead: 'Transportation Costs', amount: 54000, share: 30.0 },
      { expenseHead: 'Activity Costs', amount: 36000, share: 20.0 }
    ]
  };

  // Calculated properties
  get totalCount(): number {
    return this.reportData.revenue.bookings.reduce((sum, booking) => sum + booking.count, 0);
  }

  get totalRevenue(): number {
    return this.reportData.revenue.bookings.reduce((sum, booking) => sum + booking.amount, 0);
  }

  get netRevenue(): number {
    const gstAmount = (this.totalRevenue * this.reportData.revenue.gstPercent) / 100;
    return this.totalRevenue - gstAmount;
  }

  get totalOutgo(): number {
    return this.reportData.costs.reduce((sum, cost) => sum + cost.amount, 0);
  }

  get gstOnOutgo(): number {
    return (this.totalOutgo * this.reportData.revenue.gstPercent) / 100;
  }

  get totalCostIncGst(): number {
    return this.totalOutgo + this.gstOnOutgo;
  }

  get netProfit(): number {
    return this.totalRevenue - this.totalCostIncGst;
  }

  get perHeadRevenue(): number {
    return this.totalCount > 0 ? this.totalRevenue / this.totalCount : 0;
  }

  get profitMargin(): number {
    return this.totalRevenue > 0 ? (this.netProfit / this.totalRevenue) * 100 : 0;
  }

  constructor() { }

  ngOnInit(): void {
    // Component initialization logic here
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  printReport(): void {
    window.print();
  }

  exportToPDF(): void {
    
    window.print(); 
  }

  exportToExcel(): void {
    // Implementation for Excel export
    // You can use libraries like xlsx or exceljs
    console.log('Export to Excel functionality to be implemented');
  }
}