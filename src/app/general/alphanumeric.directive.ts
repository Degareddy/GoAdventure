import { Directive, forwardRef } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';

@Directive({
  selector: '[appAlphanumeric][ngModel],[appAlphanumeric][formControl],[appAlphanumeric][formControlName]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AlphanumericDirective),
      multi: true
    }
  ]
})
export class AlphanumericDirective implements Validator {
  validate(control: AbstractControl): { [key: string]: any } | null {
    if (control.value) {
      const value = control.value;
      const uppercaseValue = value.toUpperCase();

      if (value !== uppercaseValue) {
        control.patchValue(uppercaseValue, { emitEvent: false });
      }
      const valid = /^[A-Z0-9]+$/.test(uppercaseValue);

      return valid ? null : { invalidAlphanumeric: true };
    }
    return null;
  }
}
