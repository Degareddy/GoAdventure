import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appExchange]'
})
export class ExchangeDirective {


  constructor(private _inputEl: ElementRef) {}

  @HostListener('blur', ['$event'])
  onInput(event: any) {
    const value = this._inputEl.nativeElement.value.replace(/,/g, '');
    let toFloat: number = parseFloat(value);
    if (isNaN(toFloat)) {
      this._inputEl.nativeElement.value = '0';
      return;
    }

    // Split the input into whole numbers and decimal parts
    let parts = value.split('.');
    let wholePart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : null;

    // Convert the whole number part to a locale string with commas
    let formattedWhole = parseInt(wholePart).toLocaleString('en-US');

    // Construct the final value with two decimal places
    let finalValue = decimalPart !== null ? `${formattedWhole}.${decimalPart.padEnd(4, '0')}` : `${formattedWhole}.0000`;

    this._inputEl.nativeElement.value = finalValue;
  }

}
