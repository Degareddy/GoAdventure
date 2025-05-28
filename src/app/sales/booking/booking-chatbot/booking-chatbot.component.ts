import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

interface ParsedBookingData {
  bookingId?: string;
  quotationId?: string;
  clientName?: string;
  clientAge?: string;
  contact?: string;
  adharNumber?: string;
  email?: string;
  noOfPax?: number;
  totalAmount?: number;
  tokenAmount?: number;
  balanceAmount?: number;
  departureDate?: string;
  typeOfTrip?: string;
  tripName?: string;
  region?: string;
  salesOwner?: string;
  modeOfPayment?: string;
  leadSource?: string;
  remarks?: string;
  note?: string;
  departureType?: string;
}

@Component({
  selector: 'app-booking-chatbot',
  templateUrl: './booking-chatbot.component.html',
  styleUrls: ['./booking-chatbot.component.css']
})

export class BookingChatbotComponent implements OnInit {
@Input() bookingForm!: FormGroup;
  @Output() formUpdated = new EventEmitter<ParsedBookingData>();

  isExpanded = false;
  userInput = '';
  messages: Array<{type: 'user' | 'bot', text: string}> = [];
  constructor() { }

  ngOnInit(): void {
  }
toggleChatbot() {
    this.isExpanded = !this.isExpanded;
  }

  handleEnter(event: any) {
    if (event.ctrlKey || event.shiftKey) {
      return; // Allow new line with Ctrl+Enter or Shift+Enter
    }
    event.preventDefault();
    this.processBookingText();
  }
 parseBookingText(text: string): ParsedBookingData {
    const data: ParsedBookingData = {};

    // Extract patterns using regex - Fixed patterns
    const patterns = {
      quotationId: /Quotation\s*ID\s*[:\-]?\s*([^\n,]+)/i,
      clientName: /Client\s*Name\s*[:\-]?\s*([^\n,]+)/i,
      contact: /Client\s*Contact\s*[:\-]?\s*([0-9\s,]+)/i,
      email: /Email\s*[:\-]?\s*([^\n\s,]+@[^\n\s,]+)/i,
      noOfPax: /No\s*of\s*Pax\s*[:\-]?\s*([0-9]+)/i,
      totalAmount: /Total\s*Amount\s*[:\-]?\s*([0-9,]+)/i,
      tokenAmount: /Token\s*Amount\s*[:\-]?\s*([0-9,]+)/i,
      balanceAmount: /Balance\s*Amount\s*[:\-]?\s*([0-9,]+)/i,
      departureDate: /Departure\s*Date\s*[:\-]?\s*([^\n,]+)/i,
      typeOfTrip: /Type\s*of\s*Trip\s*[:\-]?\s*([^\n,]+)/i,
      tripName: /Trip\s*Name\s*[:\-]?\s*([^\n,]+)/i,
      region: /Region\s*[:\-]?\s*([^\n,]+)/i,
      salesOwner: /Sales\s*Owner\s*[:\-]?\s*([^\n,]+)/i,
      modeOfPayment: /Mode\s*of\s*Payment\s*[:\-]?\s*([^\n,]+)/i,
      leadSource: /Lead\s*Source\s*[:\-]?\s*([^\n,]+)/i,
      remarks: /Remarks\s*[:\-]?\s*([^\n]+)/i,
      note: /Note\s*[:\-]?\s*([^\n]+)/i
    };

    // Extract data using patterns
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim();
        
        // Special handling for client name to extract first name only
        if (key === 'clientName') {
          value = this.extractFirstName(value);
        }
        
        if (key.includes('Amount') || key === 'noOfPax') {
          data[key as keyof ParsedBookingData] = parseInt(value.replace(/[,\/-]/g, '')) as any;
        } else {
          data[key as keyof ParsedBookingData] = value as any;
        }
      }
    });

    return data;
  }
  processBookingText() {
  if (!this.userInput.trim()) return;

  // Add user message
  this.messages.push({
    type: 'user',
    text: this.userInput
  });

  // Parse the booking data
  const parsedData = this.parseBookingText(this.userInput);
  
  // Check if at least one field was found
  const filledFields = Object.keys(parsedData).filter(key => 
    parsedData[key as keyof ParsedBookingData] !== undefined && 
    parsedData[key as keyof ParsedBookingData] !== ''
  );

  if (filledFields.length === 0) {
    // Show error message if no fields found
    this.messages.push({
      type: 'bot',
      text: `🤔 <strong>Oops! I didn't find any recognizable booking information.</strong><br><br>
             Please make sure your text includes fields like:<br>
             • Client Name: John Doe<br>
             • Contact: 9876543210<br>
             • Email: john@example.com<br>
             • No of Pax: 2<br>
             • Total Amount: 15000<br>
             • Trip Name: Goa Package<br>
             • Departure Date: May 16th<br><br>
             Try again with properly formatted booking details! 😊`
    });
  } else {
    // Fill the form only if fields were found
    this.fillBookingForm(parsedData);

    // Show success message
    this.messages.push({
      type: 'bot',
      text: `✅ <strong>Great! Found and filled ${filledFields.length} field${filledFields.length > 1 ? 's' : ''}:</strong><br><br>
             📋 <strong>Filled fields:</strong><br>
             ${filledFields.map(field => `• ${this.formatFieldName(field)}`).join('<br>')}<br><br>
             Please review and complete any missing fields in the form. 👍`
    });
  }

  this.userInput = '';
  this.scrollToBottom();
}

  fillBookingForm(data: ParsedBookingData) {
    this.bookingForm.get('mode')?.patchValue('Add');
  // Fixed form mapping with correct keys
  const formMapping = {
    clientName: 'clientName',
    contact: 'contact',
    email: 'email',
    noOfPax: 'adults',
    totalAmount: 'regularAmount',
    // tripName: 'packageName',
    remarks: 'remarks',
    leadSource: 'leadSource',        // Fixed: was 'leadsource'
    typeOfTrip: 'departuretype',     // Fixed: map typeOfTrip to departuretype form field
    region: 'region',
    salesOwner: 'salesOwner',
    modeOfPayment: 'modeOfPayment',
    tokenAmount: 'tokenAmount',
    balanceAmount: 'balanceAmount',
    note: 'note'
  };

  Object.entries(formMapping).forEach(([dataKey, formKey]) => {
    const value = data[dataKey as keyof ParsedBookingData];
    if (value && this.bookingForm.get(formKey)) {
      this.bookingForm.get(formKey)?.setValue(value);
    }
  });

  // Handle special cases
  if (data.departureDate) {
    // Try to parse and set departure date
    const date = this.parseDate(data.departureDate);
    if (date && this.bookingForm.get('tranDate')) {
      this.bookingForm.get('tranDate')?.setValue(date);
    }
  }

  // Only fill booking ID if it was actually found in the text
  if (data.bookingId && this.bookingForm.get('batchNo')) {
    this.bookingForm.get('batchNo')?.setValue(data.bookingId);
  }

  // Emit the parsed data
  this.formUpdated.emit(data);
}

  extractFirstName(fullName: string): string {
    // Remove any leading numbers or special characters
    const cleanName = fullName.replace(/^[\d,.\s]+/, '').trim();
    
    // Split by pattern that indicates multiple people (number followed by comma)
    // This will split "1,NAME1 2,NAME2" into separate entries
    const firstPersonMatch = cleanName.match(/^([^0-9]*?)(?=\s*\d+,|$)/);
    
    if (firstPersonMatch && firstPersonMatch[1]) {
      return firstPersonMatch[1].trim();
    }
    
    // Fallback: return the cleaned name
    return cleanName;
  }

  parseDate(dateString: string): Date | null {
    // Handle various date formats
    const cleanDate = dateString.replace(/[^\w\s]/g, ' ').trim();
    
    // Try to parse common formats
    const formats = [
      /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i, // "May 16th"
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i, // "16/05/2024"
    ];

    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        try {
          if (match.length === 3 && isNaN(Number(match[1]))) {
            // Month name format
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                               'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const monthIndex = monthNames.findIndex(m => 
              match[1].toLowerCase().startsWith(m));
            if (monthIndex !== -1) {
              const year = new Date().getFullYear();
              return new Date(year, monthIndex, parseInt(match[2]));
            }
          }
        } catch (e) {
          console.warn('Date parsing failed:', e);
        }
      }
    }
    return null;
  }

  formatFieldName(field: string): string {
    return field.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.chatbot-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}