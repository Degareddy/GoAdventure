import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

interface TripInfo {
  tripName: string;
  fromDate: string;
  toDate: string;
}

interface RevenueBooking {
  booking: string;
  count: number;
  amount: number;
  share: number;
}

interface Revenue {
  bookings: RevenueBooking[];
  gstPercent: number;
}

interface Cost {
  expenseHead: string;
  amount: number;
  share: number;
}

interface ReportData {
  tripInfo: TripInfo;
  revenue: Revenue;
  costs: Cost[];
}
@Component({
  selector: 'app-trip-profit-and-loss',
  templateUrl: './trip-profit-and-loss.component.html',
  styleUrls: ['./trip-profit-and-loss.component.css']
})
export class TripProfitAndLossComponent implements OnInit {

 reportData: ReportData = {
    tripInfo: {
      tripName: "Goa Adventure Trip 2024",
      fromDate: "2024-03-15",
      toDate: "2024-03-20"
    },
    revenue: {
      bookings: [
        { booking: "Group A - Family Package", count: 25, amount: 125000, share: 40 },
        { booking: "Group B - Couple Package", count: 15, amount: 75000, share: 24 },
        { booking: "Group C - Solo Travelers", count: 20, amount: 80000, share: 26 },
        { booking: "Add-on Activities", count: 60, amount: 30000, share: 10 }
      ],
      gstPercent: 18
    },
    costs: [
      { expenseHead: "Accommodation", amount: 80000, share: 35 },
      { expenseHead: "Transportation", amount: 60000, share: 26 },
      { expenseHead: "Food & Beverages", amount: 45000, share: 20 },
      { expenseHead: "Activities & Entry Fees", amount: 25000, share: 11 },
      { expenseHead: "Guide & Staff", amount: 18000, share: 8 }
    ]
  };

  totalRevenue = 0;
  totalCount = 0;
  netRevenue = 0;
  totalOutgo = 0;
  gstOnOutgo = 0;
  totalCostIncGst = 0;
  netProfit = 0;
  perHeadRevenue = 0;
  profitMargin = 0;

  ngOnInit(): void {
    this.calculateTotals();
  }

  calculateTotals(): void {
    // Calculate revenue totals
    this.totalRevenue = this.reportData.revenue.bookings.reduce((sum, booking) => sum + booking.amount, 0);
    this.totalCount = this.reportData.revenue.bookings.reduce((sum, booking) => sum + booking.count, 0);
    const gstAmount = this.totalRevenue * this.reportData.revenue.gstPercent / 100;
    this.netRevenue = this.totalRevenue + gstAmount;

    // Calculate cost totals
    this.totalOutgo = this.reportData.costs.reduce((sum, cost) => sum + cost.amount, 0);
    this.gstOnOutgo = this.totalOutgo * this.reportData.revenue.gstPercent / 100;
    this.totalCostIncGst = this.totalOutgo + this.gstOnOutgo;

    // Calculate summary
    this.netProfit = this.netRevenue - this.totalCostIncGst;
    this.perHeadRevenue = this.totalCount > 0 ? this.netRevenue / this.totalCount : 0;
    this.profitMargin = this.netRevenue > 0 ? (this.netProfit / this.netRevenue * 100) : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  exportToPDF(): void {
    window.print();
  }

  printReport(): void {
    window.print();
  }

  exportToExcel(): void {
    const wb = XLSX.utils.book_new();

    // Trip Info Sheet
    const tripInfoData = [
      ['Trip Information'],
      ['Trip Name', this.reportData.tripInfo.tripName],
      ['From Date', this.formatDate(this.reportData.tripInfo.fromDate)],
      ['To Date', this.formatDate(this.reportData.tripInfo.toDate)]
    ];
    const tripInfoWs = XLSX.utils.aoa_to_sheet(tripInfoData);
    XLSX.utils.book_append_sheet(wb, tripInfoWs, 'Trip Info');

    // Revenue Sheet
    const revenueHeaders = ['S.No', 'Booking', 'Count', 'Amount (₹)', 'Share (%)'];
    const revenueData = [
      revenueHeaders,
      ...this.reportData.revenue.bookings.map((booking, index) => [
        index + 1,
        booking.booking,
        booking.count,
        booking.amount,
        booking.share
      ]),
      ['', 'TOTAL', this.totalCount, this.totalRevenue, 100],
      [],
      ['Revenue Summary'],
      ['Total Revenue', this.totalRevenue],
      ['GST (%)', this.reportData.revenue.gstPercent],
      ['Net Revenue', this.netRevenue]
    ];
    const revenueWs = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, revenueWs, 'Revenue');

    // Cost Sheet
    const costHeaders = ['S.No', 'Key Expense Head', 'Amount (₹)', '% Share'];
    const costData = [
      costHeaders,
      ...this.reportData.costs.map((cost, index) => [
        index + 1,
        cost.expenseHead,
        cost.amount,
        cost.share
      ]),
      ['', 'TOTAL OUTGO', this.totalOutgo, 100],
      [],
      ['Cost Summary'],
      ['Total Outgo', this.totalOutgo],
      ['GST on Outgo', this.gstOnOutgo],
      ['Total Cost (Inc. GST)', this.totalCostIncGst]
    ];
    const costWs = XLSX.utils.aoa_to_sheet(costData);
    XLSX.utils.book_append_sheet(wb, costWs, 'Costs');

    // Summary Sheet
    const summaryData = [
      ['Financial Summary'],
      ['Net Profit', this.netProfit],
      ['Per Head Revenue', this.perHeadRevenue],
      ['Profit Margin (%)', this.profitMargin.toFixed(1)]
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Save the file
    const fileName = `Trip_PL_Report_${this.reportData.tripInfo.tripName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Method to update report data from external source
  updateReportData(newData: ReportData): void {
    this.reportData = newData;
    this.calculateTotals();
  }

}
