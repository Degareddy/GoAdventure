import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumberFormat]'
})
export class NumberFormatDirective {

  constructor(private el: ElementRef) { }

  @HostListener('blur', ['$event']) onInput(event: any) {
    const input = event.target.value.replace(/[^0-9.]/g, ''); // Remove non-numeric characters
    event.target.value = input.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add comma separators
  }

}
