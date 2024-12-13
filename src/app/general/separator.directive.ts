// import { Directive, ElementRef, HostListener } from "@angular/core";

// @Directive({
//   selector: '[separator]',
// })
// export class SeparatorDirective {

//   constructor(private _inputEl: ElementRef) {}

//   @HostListener('blur', ['$event'])
//   onInput(event: any) {
//     const value = this._inputEl.nativeElement.value.replace(/,/g, '');
//     console.log(value);
//     let toFloat: number = parseFloat(value);
//     if (isNaN(toFloat)) {
//       this._inputEl.nativeElement.value = '0.00';
//       return;
//     }

//     let parts = value.split('.');
//     let wholePart = parts[0];
//     let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : null;

//     let formattedWhole = parseInt(wholePart).toLocaleString('en-US');

//     let finalValue = decimalPart !== null ? `${formattedWhole}.${decimalPart.padEnd(2, '0')}` : `${formattedWhole}.00`;

//     this._inputEl.nativeElement.value = finalValue;
//   }
// }

import { Directive, ElementRef, HostListener } from "@angular/core";

@Directive({
  selector: '[separator]',
})
export class SeparatorDirective {

  constructor(private _inputEl: ElementRef) {}

  @HostListener('blur', ['$event'])
  onInput(event: any) {
    const value = this._inputEl.nativeElement.value.replace(/[^0-9.,]/g, '').replace(/,/g, '');

    let toFloat: number = parseFloat(value);
    if (isNaN(toFloat)) {
      this._inputEl.nativeElement.value = '0.00';
      return;
    }
    let parts = value.split('.');
    let wholePart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : null;
    let formattedWhole = parseInt(wholePart).toLocaleString('en-US');
    let finalValue = decimalPart !== null ? `${formattedWhole}.${decimalPart.padEnd(2, '0')}` : `${formattedWhole}.00`;
    this._inputEl.nativeElement.value = finalValue;
  }
}
