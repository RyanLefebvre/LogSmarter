import { AbstractControl } from '@angular/forms';

/**
 * Form control that validates metric heights. This value must 
 * be null or a number between 0 and 302.3. This 
 * seemingly random value was chosen as the max value for the 
 * height in centimeters because it is close to 120 inches and will 
 * always round down, which prevents ever putting the profile 
 * edit form in an invalid state when changing the number system.
 * Heights can be entered with any number of decimals but are always
 * rounded to a whole number.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateMetricHeight(control: AbstractControl): {} {
    const metricHeightInvalid: {} = { INVALID_HEIGHTt: true };
    const metricHeightValid: null = null;
    const MAX_VALUE: number = 302.3;
    const MIN_VALUE: number = 0;
    const metricHeight: number = control.value;

    if (metricHeight == null) {
        return metricHeightValid;
    } else {
        const isNumber: boolean = (typeof metricHeight == 'number');
        if (!isNumber) {
            return metricHeightInvalid;
        } else {
            const heightWithinValidRange = (MIN_VALUE <= metricHeight && metricHeight <= MAX_VALUE);
            if (heightWithinValidRange) {
                return metricHeightValid;
            } else {
                return metricHeightInvalid;
            }
        }
    }
}