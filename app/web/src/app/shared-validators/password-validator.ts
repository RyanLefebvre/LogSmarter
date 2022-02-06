import { AbstractControl } from '@angular/forms';
import { hasNumber } from './general-validator-functions/has-number'

/**
 * Function used to validated a user's password. The password 
 * must meet the following restrictions. It cannot be null or 
 * an empty string. The password must be greater than 7 characters
 * in length and less than 256 characters in length. The password 
 * cannot contain whitespace and it must contain one number.
 * If these constraints are met, then the password is considered valid.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidatePassword(control: AbstractControl) {
    const password: string = control.value;
    const invalidPassword: {} = { invalidPassword: true };
    const validPassword: null = null;
    if (!password) {
        return invalidPassword;
    }
    else if (password.trim() == "") {
        return invalidPassword;
    }
    else if (password.length < 7 || password.length > 256) {
        return invalidPassword;
    }
    else if (password.includes(" ")) {
        return invalidPassword;
    }
    else if (!hasNumber(password)) {
        return invalidPassword;
    }
    else {
        return validPassword;
    }
}