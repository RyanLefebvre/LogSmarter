import { AbstractControl } from '@angular/forms';

/**
 * Function used to validate if an amount of calories is valid or not.
 * This is used for any form where the user has to enter their daily calorie
 * intake. This value must be a whole number and must be greater than or equal 
 * to 0 and less than or equal to 10,000. It is expected that any form implementing 
 * this validator will take care of rounding the number of caloires to a whole number 
 * if a decimal is entered.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateCalories(control: AbstractControl): {} {
    const caloriesInvalid: {} = { INVALID_AGE: true };
    const caloriesValid: null = null;
    const MAX_VALUE: number = 10000;
    const MIN_VALUE: number = 0;
    const calories: number = control.value;

    if (calories == null) {
        return caloriesValid;
    } else {
        const isNumber: boolean = (typeof calories == 'number');
        if (!isNumber) {
            return caloriesInvalid;
        } else {
            const ageWithinValidRange = (MIN_VALUE <= calories && calories <= MAX_VALUE);
            if (ageWithinValidRange) {
                return caloriesValid;
            } else {
                return caloriesInvalid;
            }
        }
    }
}