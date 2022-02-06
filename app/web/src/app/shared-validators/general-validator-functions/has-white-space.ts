/**
 * Returns true if a string contains white space.
 * This function assumes the string is trimmed beforehand,
 * otherwise whitespace at the edges of a string will return 
 * true. 
 * 
 * @param string string to be checked for whitespace.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020
 */
export function hasWhiteSpace(string: string): boolean {
    const SPACE = " ";
    const stringContainsWhiteSpace: boolean = (string.indexOf(SPACE) >= 0);
    if (stringContainsWhiteSpace) {
        return true;
    }
    else {
        return false;
    }
}