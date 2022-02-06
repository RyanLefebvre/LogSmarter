import { AbstractControl } from '@angular/forms';

/**
 * Form control that validates imperial heights. This value must 
 * be null or a number between 0 and 9. This validator only handles
 * values entered for feet and not for inches. The number can be 
 * entered with any number of decimals but should always be rounded 
 * to a whole number.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateFootHeight(control: AbstractControl): {} {
    const heightFeetInvalid: {} = { INVALID_HEIGHT: true };
    const heightFeetValid: null = null;
    const MAX_VALUE: number = 9;
    const MIN_VALUE: number = 0;
    const heightFeet: number = control.value;

    if (heightFeet == null) {
        return heightFeetValid;
    } else {
        const isNumber: boolean = (typeof heightFeet == 'number');
        if (!isNumber) {
            return heightFeetInvalid;
        } else {
            const heightWithinValidRange = (MIN_VALUE <= heightFeet && heightFeet <= MAX_VALUE);
            if (heightWithinValidRange) {
                return heightFeetValid;
            } else {
                return heightFeetInvalid;
            }
        }
    }
}