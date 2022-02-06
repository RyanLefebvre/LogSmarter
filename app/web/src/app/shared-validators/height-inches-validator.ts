import { AbstractControl } from '@angular/forms';

/**
 * Form control that validates imperial heights. This value must 
 * be null or a number between 0 and 11. This validator only handles
 * values entered for inches and not for feet. The number can be 
 * entered with any number of decimals but should always be rounded 
 * to a whole number by the form implementing this validator.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateInchesHeight(control: AbstractControl): {} {
    const heightInchesInvalid: {} = { INVALID_HEIGHT: true };
    const heightInchesValid: null = null;
    const MAX_VALUE: number = 11;
    const MIN_VALUE: number = 0;
    const heightInches: number = control.value;

    if (heightInches == null) {
        return heightInchesValid;
    } else {
        const isNumber: boolean = (typeof heightInches == 'number');
        if (!isNumber) {
            return heightInchesInvalid;
        } else {
            const heightWithinValidRange = (MIN_VALUE <= heightInches && heightInches <= MAX_VALUE);
            if (heightWithinValidRange) {
                return heightInchesValid;
            } else {
                return heightInchesInvalid;
            }
        }
    }
}