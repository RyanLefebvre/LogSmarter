/**
 * Returns true if the string parameter contains a number.
 * 
 * @param myString string to be checked for a number. 
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function hasNumber(myString: string): boolean {
    return /\d/.test(myString);
}