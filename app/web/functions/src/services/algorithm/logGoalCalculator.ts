import * as logCalc from './logStatCalculator'
import * as energy from '../../constants/energyConstants'
import { UserProfile } from '../../classes/user-profile'

/**
 * This service handles any calculations related to log goal calculation 
 * or calculations related to surplus and deficit calorie amounts. All primitive 
 * values used are expected to be stored in the energyConstants barrel file.
 * 
 * Last edited by: Ryan Lefebvre 7/23/2020
 */

/**
 * Returns true if the user is bulking and they are gaining weight. the user is cutting
 * and they are losing weight or the user is maintaining and they are within the maintenance
 * threshold. Returns false otherwise.
 *  
 * @param goal Goal of the log. Musle gain, fat loss or weight maintenance. 
 * @param weightChangeCategory Over the course of a log, a user can either gain, lose or maintain weight.
 */
export function weightChangeOnTrackForGoal(goal: string, weightChangeCategory: string): boolean {
    const successfulMaintenance: boolean = (weightChangeCategory == energy.MAINTAINED_WEIGHT) && (goal == energy.GOAL_MAINTAIN);
    const succesfulBulk: boolean = (weightChangeCategory == energy.GAINED_WEIGHT) && (goal == energy.GOAL_MUSCLE_GAIN);
    const successfulCut: boolean = (weightChangeCategory == energy.LOST_WEIGHT) && (goal == energy.GOAL_FAT_LOSS);
    const isOnTrack: boolean = (successfulMaintenance || successfulCut || succesfulBulk);
    return isOnTrack;
}

/**
 * Returns the upper and lower boundary for a user's goal intake based 
 * on the user's selected log goal and nutrition surplus and deficit 
 * preferences. this function expects that goal will be a valid goal and
 * that user's will have a valid surplus and deficit prefence. If these 
 * constraints are not met, then the maintenance constants are returned.
 * 
 * @param goal Goal of the log. Musle gain, fat loss or weight maintenance.  
 * @param user UserProfile that is expected to contain valid nutrition preferences.
 */
export function getGoalIntakeConstants(goal: string, estimatedTDEE: number, user: UserProfile): number[] {
    if (!estimatedTDEE) {
        return energy.INSUFFICIENT_DATA;
    }
    else if (goal == energy.GOAL_MUSCLE_GAIN) {
        return getSurplusConstants(user.userPreferences.nutrition.surplus);
    } if (goal == energy.GOAL_FAT_LOSS) {
        return getDeficitConstants(estimatedTDEE, user);
    }
    else {
        return [energy.ESTIMATED_AVERAGE_THRESHOLD, energy.ESTIMATED_AVERAGE_THRESHOLD];
    }
}

/**
 * Returns a string that can be displayed in the UI or as a message to the 
 * user that represents the user's goal calorie intake. Calculated based 
 * upon the user's estimated TDEE, their log goal and their surplus/deficit 
 * preferences. this function expects all of the parameters to be valid values.
 * If the log goal is invalid, then a goal of maintenance is assumed.
 * 
 * @param estimatedTDEE Estimated TDEE for the user from step 3 of the algorithm.
 * @param goal Goal for the user's log. Gain muscle, lose fat or maintain weight.
 * @param userProfile UserProfile object used to get surplus and deficit preferences.
 */
export function getGoalIntake(estimatedTDEE: number, goal: string, userProfile: UserProfile): string {
    if (goal == energy.GOAL_MUSCLE_GAIN) {
        return getSurplusRange(estimatedTDEE, userProfile);
    }
    else if (goal == energy.GOAL_FAT_LOSS) {
        return getDeficitRange(estimatedTDEE, userProfile);
    }
    else {
        return getMaintainanceRange(estimatedTDEE);
    }
}

/**
 * Returns a string that can be displayed in the UI or as a message to the 
 * user that represents the maintenance for calorie intake for a user. If the 
 * user's TDEE is invalid, then insufficient data is returned.
 * 
 * @param tdee Estimated TDEE from step 3 of the algorithm.
 */
export function getMaintainanceRange(tdee: number): string {
    const tdeeIsNotValid: boolean = !(logCalc.isValidTDEE(tdee));
    if (tdeeIsNotValid) {
        return energy.INSUFFICIENT_DATA;
    } else {
        const startOfRange: number = tdee - energy.ESTIMATED_AVERAGE_THRESHOLD;
        const endOfRange: number = tdee + energy.ESTIMATED_AVERAGE_THRESHOLD;
        return formatCalorieRangeString(startOfRange, endOfRange);
    }
}

/**
 * Returns a string that can be displayed in the UI or as a message to the 
 * user that represents the surplus range for calorie intake for a user. If the 
 * user's TDEE is invalid, then insufficient data is returned.
 * 
 * @param tdee Estimated TDEE from step 3 of the algorithm.
 * @param userProfile UserProfile object used to get surplus preference.
 */
export function getSurplusRange(tdee: number, userProfile: UserProfile) {
    const tdeeIsNotValid: boolean = !(logCalc.isValidTDEE(tdee));
    if (tdeeIsNotValid) {
        return energy.INSUFFICIENT_DATA;
    }
    else {
        const surplusConstants = getSurplusConstants(userProfile.userPreferences.nutrition.surplus);
        const startOfRange = tdee + surplusConstants[IDX_OF_SMALLER_CONST];
        const endOfRange = tdee + surplusConstants[IDX_OF_LARGER_CONST];
        return formatCalorieRangeString(startOfRange, endOfRange);
    }
}

/**
 * Returns a string that can be displayed in the UI or as a message to the 
 * user that represents the deficit range for calorie intake for a user. If the 
 * user's TDEE is invalid, then insufficient data is returned.
 * 
 * @param tdee Estimated TDEE from step 3 of the algorithm.
 * @param userProfile UserProfile object used to get surplus preference.
 */
export function getDeficitRange(tdee: number, userProfile: UserProfile) {
    const tdeeIsNotValid: boolean = !(logCalc.isValidTDEE(tdee));
    if (tdeeIsNotValid) {
        return energy.INSUFFICIENT_DATA;
    }
    else {
        const deficitConstants = getDeficitConstants(tdee, userProfile);
        const startOfRange = tdee - deficitConstants[IDX_OF_LARGER_CONST];
        const endOfRange = tdee - deficitConstants[IDX_OF_SMALLER_CONST];
        return formatCalorieRangeString(
            Math.max(startOfRange, 600),
            Math.max(endOfRange, 700)
        );
    }
}

/**
 * Returns a string representing a range of calories in a readable format.
 * 
 * @param startOfRange start of calorie range.
 * @param endOfRange end of calorie range.
 */
export function formatCalorieRangeString(startOfRange: number, endOfRange: number): string {
    const calorieRange: string = (Math.round(startOfRange) + " " + energy.KCAL_UNITS + " - " + Math.round(endOfRange) + " " + energy.KCAL_UNITS);
    return calorieRange;
}

/**
 * Index of the top end of the surplus or deficit range constant.
 */
export const IDX_OF_LARGER_CONST: number = 1;

/**
 * Index of the bottom end of the surplus or deficit range constant.
 */
export const IDX_OF_SMALLER_CONST: number = 0;

/**
 * Returns a tuple where the first element of the tuple  is the constant to subtract
 * from TDEE to get the start of the deficit range and the second value is the constant
 * to subtract from TDEE to get the end of the deficit range. If for some reason, the 
 * preference is not valid, then the default goal range is returned.
 * 
 * @param deficitPreference Deficit preference from a UserProfile object.
 */
export function getDeficitConstants(estimatedTDEE: number, user: UserProfile): number[] {
    const deficitPreference: string = user.userPreferences.nutrition.deficit;
    let deficitConstants: number[] = null;
    if (deficitPreference == energy.DEFICIT_CONSERVATIVE) {
        deficitConstants = energy.CONSERVATIVE_DEFICIT_RANGE;
    }
    else if (deficitPreference == energy.DEFICIT_MODERATE) {
        deficitConstants = energy.MODERATE_DEFICIT_RANGE;
    }
    else if (deficitPreference == energy.DEFICIT_AGGRESSIVE) {
        deficitConstants = energy.AGGRESSIVE_DEFICIT_RANGE;
    }
    else if (deficitPreference == energy.DEFICIT_VERY_AGGRESSIVE) {
        deficitConstants = energy.VERY_AGGRESSIVE_DEFICIT_RANGE;
    }
    else {
        deficitConstants = energy.CONSERVATIVE_DEFICIT_RANGE;
    }
    const startOfRange: number = estimatedTDEE - deficitConstants[IDX_OF_LARGER_CONST];
    const isVLCD: boolean = (startOfRange < energy.MIN_VALID_DEFICIT_START);
    if (isVLCD) {
        const adjustedConstants: number[] = [0, 0];
        adjustedConstants[IDX_OF_SMALLER_CONST] = Math.abs(estimatedTDEE - energy.MIN_VALID_DEFICIT_END);
        adjustedConstants[IDX_OF_LARGER_CONST] = Math.abs(estimatedTDEE - energy.MIN_VALID_DEFICIT_START);
        return adjustedConstants;
    }
    return deficitConstants;
}

/**
 * Returns a tuple where the first element of the tuple  is the constant to add to
 * TDEE to get the start of the surplus range and the second value is the constant
 * to add to TDEE to get the end of the surplus range. If for some reason, the 
 * preference is not valid, then the default goal range is returned.
 * 
 * @param surplusPreference Surplus preference from a UserProfile object.
 */
export function getSurplusConstants(surplusPreference: string): number[] {
    if (surplusPreference == energy.SURPLUS_CONSERVATIVE) {
        return energy.CONSERVATIVE_SURPLUS_RANGE;
    }
    else if (surplusPreference == energy.SURPLUS_MODERATE) {
        return energy.MODERATE_SURPLUS_RANGE;
    }
    else if (surplusPreference == energy.SURPLUS_AGGRESSIVE) {
        return energy.AGGRESSIVE_SURPLUS_RANGE;
    }
    else {
        return energy.CONSERVATIVE_SURPLUS_RANGE;
    }
}