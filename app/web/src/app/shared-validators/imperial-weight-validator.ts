import { AbstractControl } from '@angular/forms';

/**
 * Form control that validates imperial weights. This value must 
 * be null or a number between 0 and 99997.3. This 
 * seemingly random value was chosen as the max value for the 
 * weight in lbs because it is close to 1000 lbs and will 
 * always round down, which prevents ever putting the profile 
 * edit form in an invalid state when changing the number system.
 * Weights can be entered with any number of decimals but should always
 * rounded to one decimal place.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateImperialWeight(control: AbstractControl): {} {
    const imperialWeightInvalid: {} = { INVALID_WEIGHT: true };
    const imperialWeightValid: null = null;
    const MAX_VALUE: number = 99997.3;
    const MIN_VALUE: number = 0;
    const imperialWeight: number = control.value;

    if (imperialWeight == null) {
        return imperialWeightValid;
    } else {
        const isNumber: boolean = (typeof imperialWeight == 'number');
        if (!isNumber) {
            return imperialWeightInvalid;
        } else {
            const weightWithinValidRange = (MIN_VALUE <= imperialWeight && imperialWeight <= MAX_VALUE);
            if (weightWithinValidRange) {
                return imperialWeightValid;
            } else {
                return imperialWeightInvalid;
            }
        }
    }
}