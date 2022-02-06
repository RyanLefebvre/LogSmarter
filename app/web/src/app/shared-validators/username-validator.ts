import { AbstractControl } from '@angular/forms';

/**
 * Form control used to validate username for profile edit and register page.
 * Constraints are that the username must be a valid string less than or equal
 * to 25 characters or be null. If username is invalid, then an error is returned,
 * otherwise null is returned indicating a valid username.
 * 
 * @param control control value to check.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function ValidateUsername(control: AbstractControl) {
    const usernameInvalid: {} = { INVALID_USERNAME: true };
    const usernameValid: null = null;
    const MAX_LENGTH: number = 25;
    const MIN_LENGTH: number = 0;

    const username: string = control.value;
    const usernameIsNull: boolean = (username == null);

    if (usernameIsNull) {
        return usernameValid;
    } else {
        const usernameIsString: boolean = (typeof username == 'string');
        if (!usernameIsString) {
            return usernameInvalid;
        } else {
            const usernameLength: number = username.length;
            const usernameIsValidLength: boolean = (MIN_LENGTH <= usernameLength && usernameLength <= MAX_LENGTH);
            if (usernameIsValidLength) {
                return usernameValid;
            } else {
                return usernameInvalid;
            }
        }
    }
}