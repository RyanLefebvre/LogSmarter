
/**
 * This service contains functions that convert measurements from one unit or
 * measurement system to another measurement system or augment the value in 
 * some way.
 * 
 * Last edited by: Ryan Lefebvre 7/22/2020
 */

/**
 * Rounds a number to a specified number of decimal places, if any error occurs, then
 * the original number passed in is returned as is.
 * 
 * @param num Number to be rounded. 
 * @param dec What decimal place to round the number to.
 */
export function roundNumberToSpecifiedDecimalPlace(num: number, dec: number): number {
    try {
        const multiplier = Math.pow(10, dec || 0);
        const result = Math.round(num * multiplier) / multiplier;
        if (isNaN(result)) {
            return num;
        } else {
            return result;
        }
    } catch (error) {
        return num;
    }
}

/**
 * Rounds a number to one decimal place, if any error occurs, then
 * the original number passed in is returned as is.
 * 
 * @param num Number to be rounded. 
 * @param dec What decimal place to round the number to.
 */
export function roundNumberToOneDecimalPlace(num: number): number {
    return roundNumberToSpecifiedDecimalPlace(num, 1);
}

/**
 * Returns the number of weeks between two dates rounded up. This function
 * is used to calculate the number of weeks between entries in a log, so we 
 * round up to start at week 1 and not week 0. This function should only be used 
 * in the context of a nutrition log or else it may have unexpected behavior since
 * it does not literally return the number of weeks between dates.
 * 
 * @param date1 first date to be compared.
 * @param date2 second date to be compared.
 */
export function getNumWeeksBetweenDatesInLogContext(date1: Date, date2: Date): number {
    const numWeeks: number = getNumWeeksNoRounding(date1, date2);
    return Math.floor(numWeeks) + 1;
}

/**
 * Performs the math to get the decimal version of the number of weeks 
 * between two dates. No rounding or offset is applied. In the context 
 * of log statistics, this function should not be used on its own.
 * 
 * @param date1 first date to be compared.
 * @param date2 second date to be compared.
 */
export function getNumWeeksNoRounding(date1: Date, date2: Date): number {
    let numOfWeeks = date1.getTime() - date2.getTime();
    numOfWeeks = Math.abs(numOfWeeks);
    return (numOfWeeks / 7 / 24 / 60 / 60 / 1000);
}


/**
 * Converts a weight in lbs to the equivalent amount of weight in kg and
 * rounds to one decimal place.
 * 
 * @param weight_lbs weight to convert from lbs to kg.
 */
export function convertLbsToKg(weight_lbs: number): number {
    return roundNumberToOneDecimalPlace(weight_lbs * 0.45359237);
}

/**
* Key used for number system preference value when set to metric.
*/
export const NUMBER_SYSTEM_METRIC: boolean = false;

/**
* Key used for number system preference value when set to imperial.
*/
export const NUMBER_SYSTEM_IMPERIAL: boolean = true;

/**
* Units used for weight when the number system is metric.
*/
export const WEIGHT_UNITS_METRIC: string = "kg";

/**
 * Units used for weight when the number system is imperial.
 */
export const WEIGHT_UNITS_IMPERIAL: string = "lb";

/**
 * Returns the correct units for weight as a string based on the number system passed 
 * in as a paramter. If an invalid number system is passed in, i.e. a value
 * that is not imperial or metric, then an empty string is returned.
 * 
 * @param numberSystem number system that correct units are being requested for.
 */
export function getWeightUnits(numberSystem: boolean): string {
    if (numberSystem == NUMBER_SYSTEM_METRIC) {
        return WEIGHT_UNITS_METRIC;
    }
    else if (numberSystem == NUMBER_SYSTEM_IMPERIAL) {
        return WEIGHT_UNITS_IMPERIAL;
    }
    else {
        const noUnits: string = "";
        return noUnits;
    }
}

/**
 * Converts a heinght in IN to the equivalent amount of height in meters and
 * rounds to one decimal place.
 * 
 * @param height_inches height to be converted from IN to cm.
 */
export function convertInchesToMeters(inches: number): number {
    return roundNumberToOneDecimalPlace(convertInchesToCentimeters(inches) / 100);
}

/**
 * Converts a heinght in IN to the equivalent amount of height in cm and rounds to one decimal place.
 * 
 * @param height_inches height to be converted from IN to cm.
 */
export function convertInchesToCentimeters(height_inches: number): number {
    return roundNumberToOneDecimalPlace(height_inches * 2.54);
}
