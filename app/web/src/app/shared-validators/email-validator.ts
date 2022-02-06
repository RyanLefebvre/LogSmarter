import { AbstractControl } from '@angular/forms';
import { hasWhiteSpace } from './general-validator-functions/has-white-space'

/**
 * Most of the validation for emails is done by firebase. However, we do some
 * basic validation to try to prevent user's from accidentally entering an invalid email 
 * address. Our validation checks that the email address is not null, it is a valid string,
 * it is less than 256 characters, it contains an @ symbol and it does not contain whitespace.
 * If none of those constraints are violated, then the email adress is considered validated.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateEmail(control: AbstractControl): {} {
    const emailInvalid: {} = { INVALID_EMAIL: true };
    const emailValid: null = null;
    const MAX_LENGTH: number = 256;
    const MIN_LENGTH: number = 0;

    let email: string = control.value;
    const emailIsNull: boolean = (email == null);

    if (emailIsNull) {
        return emailValid;
    } else {
        const emailIsString: boolean = (typeof email == 'string');
        if (!emailIsString) {
            return emailInvalid;
        } else {

            email = email.trim();
            const emailLength: number = email.length;
            const emailIsValidLength: boolean = (MIN_LENGTH <= emailLength && emailLength <= MAX_LENGTH);
            const emailContainsAt: boolean = email.includes('@');
            const emailHasNoWhiteSpace: boolean = !hasWhiteSpace(email);
            const emailIsValid: boolean = (emailIsValidLength && emailContainsAt && emailHasNoWhiteSpace);

            if (emailIsValid) {
                return emailValid;
            } else {
                return emailInvalid;
            }
        }
    }
}