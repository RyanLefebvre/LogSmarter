import { AbstractControl } from '@angular/forms';

/**
 * Form control that validates user profile ages. This value must 
 * be null or a number between 0 and 999. The number can be entered with
 * any number of decimals but should always be rounded to a whole number
 * by any form using this validator.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateAge(control: AbstractControl): {} {
    const ageInvalid: {} = { INVALID_AGE: true };
    const ageValid: null = null;
    const MAX_VALUE: number = 999;
    const MIN_VALUE: number = 0;
    const age: number = control.value;

    if (age == null) {
        return ageValid;
    } else {
        const isNumber: boolean = (typeof age == 'number');
        if (!isNumber) {
            return ageInvalid;
        } else {
            const ageWithinValidRange = (MIN_VALUE <= age && age <= MAX_VALUE);
            if (ageWithinValidRange) {
                return ageValid;
            } else {
                return ageInvalid;
            }
        }
    }
}