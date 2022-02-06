

/**
 * To reduce as much repeat code as possible. Shared functions needed between the feeback algorithms
 * are shown below These functions are used to build statements that instruct the user what do based
 * on their log goal.
 * 
 * Last edited by: Ryan Lefebvre 7/21/2020
 */

/**
 * Used as punctuation end statements.
 */
const PERIOD: string = "."

/**
 * List of statements that essentially mean, keep doing what you are doing.
 */
export const keepItUpSatements = [
    "keep doing what you are doing",
    "keep it up",
    "stick with what you're doing",
    "keep your current protocol"
];

/**
 * List of positive sentence starters for creating feedback messages.
 */
export const positiveExclamations = [
    "Awesome",
    "Fantastic",
    "Way to go",
    "Great job",
    "Good job",
    "Nice",
    "Amazing"
];

/**
 * List of negative sentence startes for creating feedback messages.
 */
export const negativeExclamations = [
    "Oh no",
    "Oops",
    "Uh oh",
    "Lets fix this",
    "We can do better",
    "That's not right"
];

/**
 * List of transitions into a statemnt of what the user should do to reach their goal.
 */
export const actionStatements = [
    "you should",
    "try to",
    "we suggest you",
    "it's a good idea to",
    "we recommend that you",
    "based on the information available, you will want to",
    "going forward"
];

/**
 * Reutrns a message that essentially means 'keep doing what you are doing'. This is much easier to generalize 
 * than a response for negative feedback that has specific suggestions of what to do to improve.
 */
export function keepItUpSatement(): string {
    return getRandomFrom(keepItUpSatements);
}

/**
 * Returns a transition into an action suggestion for what the user should do.
 */
export function getActionStatement(): string {
    return getRandomFrom(actionStatements);
}

/**
 * Returns a positive war to start a statement.
 */
export function getPositiveExclamation(): string {
    return getRandomFrom(positiveExclamations);
}

/**
 * Returns a negative way to start a statement.
 */
export function getNegativeExclamation(): string {
    return getRandomFrom(negativeExclamations);
}

/**
 * Returns a value at a random index in an array. This function is used to 
 * randomize the feedback that is returned from the different helper functions
 * above. If the array is null or of length 0, then an aempy string is returned.
 * 
 * @param arr Array to return a random string from.
 */
export function getRandomFrom(arr: string[]): string {
    if (arr && arr.length) {
        return arr[Math.floor(Math.random() * arr.length)];
    } else {
        return "";
    }
}

/**
 * Returns the input string with the first character capitalized. If any error occurs,
 * then the input string is returned. 
 * 
 * @param string string to capitalize the first character of.
 */
export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Takes a statement as an input and ends the statement by 
 * appending a period to the statement and returning the 
 * modified statement.
 * 
 * @param statement Statement to add punctuation to. 
 */
export function endStatement(statement: string): string {
    const statementWithPunctuation: string = statement + PERIOD;
    return statementWithPunctuation;
}