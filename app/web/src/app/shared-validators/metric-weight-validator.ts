import { AbstractControl } from '@angular/forms';

/**
 * Form control that validates metric weights. This value must 
 * be null or a number between 0 and 4538.0123. This 
 * seemingly random value was chosen as the max value for the 
 * weight in kilograms because it is close to 1000lbs and will 
 * always round down, which prevents ever putting the profile 
 * edit form in an invalid state when changing the number system.
 * Weights can be entered with any number of decimals but are always
 * rounded to one decimal place.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateMetricWeight(control: AbstractControl): {} {

    const metricWeightInvalid: {} = { INVALID_WEIGHT: true };
    const metricWeightValid: null = null;
    const MAX_VALUE: number = 4538.0123;
    const MIN_VALUE: number = 0;
    const metricWeight: number = control.value;

    if (metricWeight == null) {
        return metricWeightValid;
    } else {
        const isNumber: boolean = (typeof metricWeight == 'number');
        if (!isNumber) {
            return metricWeightInvalid;
        } else {
            const weightWithinValidRange = (MIN_VALUE <= metricWeight && metricWeight <= MAX_VALUE);
            if (weightWithinValidRange) {
                return metricWeightValid;
            } else {
                return metricWeightInvalid;
            }
        }
    }
}