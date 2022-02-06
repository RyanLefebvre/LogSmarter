/**
 * This file is a collection of constant values that need to be used in the LogSmarter TDEE estimation 
 * and feedback algorithm across multiple files. Reduces chances for error with primitive values in code.
 * 
 * Last edited by: Ryan Lefebvre 7/23/2020
 */

/**
 * Value returned any time that a computation fails or there is not enough data to calculate a statistic.
 */
export const INSUFFICIENT_DATA: null = null;

/**
 * Threshold of calories where estimated and avg are considered equal.
 */
export const ESTIMATED_AVERAGE_THRESHOLD: number = 75;

/**
 * Weight change category that represents when a user maintains their weight over a log.
 */
export const MAINTAINED_WEIGHT: string = "maintain";

/**
 * Weight change category that represents when a user gains weight over a log.
 */
export const GAINED_WEIGHT: string = "gained";

/**
 * Weight change category that represents when a user loses weight over a log.
 */
export const LOST_WEIGHT: string = "lost";

/**
 * Number of lbs, that when the user's change in body weight is below or equal to, 
 * they will be considered to have maintained their weight.
 */
export const WEIGHT_MAINTENANCE_THRESHOLD: number = 1;

/**
 * Minimum number of complete day entries to adjust baseline TDEE estimate.
 */
export const MINIMUM_DAY_ENTRY_THRESHOLD: number = 14;

/**
 * Constant that represents a log goal of losing fat.
 */
export const GOAL_FAT_LOSS: string = "fatLoss";

/**
 * Constant that represents a log goal of gaining muscle.
 */
export const GOAL_MUSCLE_GAIN: string = "muscleGain";

/**
 * Constant that represents a log goal of maintaining weight.
 */
export const GOAL_MAINTAIN: string = "maintain";

/**
 * Rate of weight change per week in % of total starting body weight represents an inclusive
 * [min,max] range where weekly change in % body weight is optimal. Shpuld Divide by 100 if
 * using in calculations to get as a %. This is the maximum rate that is still considered
 * optimal for bulking.
 */
export const MAX_BULK_RATE: number = 0.5;

/**
 * This is the minimum rate of weight change per week in % of total starting body weight
 * that is still considered optimal for bulking.
 */
export const MIN_BULK_RATE: number = 0.06;

/**
 * This is the maximum rate of weight change per week in % of total starting body weight
 * that is still considered optimal for cutting.
 */
export const MAX_CUT_RATE: number = 1.5;

/**
 * This is the minimum rate of weight change per week in % of total starting body weight
 * that is still considered optimal for cutting.
 */
export const MIN_CUT_RATE: number = 0.5;

/**
 * Bottom of the inclusive range of calories that are considered a valid estimate for TDEE.
 */
export const MIN_VALID_TDEE: number = 750;

/**
 * Bottom of the inclusive range of calories that are considered a valid value for deficit start range
 */
export const MIN_VALID_DEFICIT_START: number = 600;

/**
 * Bottom of the inclusive range of calories that are considered a valid deficit max intake
 */
export const MIN_VALID_DEFICIT_END: number = 700;

/**
 * Top of the inclusive range of calories that are considered a valid estimate for TDEE.
 */
export const MAX_VALID_TDEE: number = 7500;

/**
 * BMI category of underweight. (BMI < 18.5) is in this category.
 */
export const BMI_UNDERWEIGHT: string = 'underweight';

/**
 * BMI category of normal weight. (18.5 <= BMI <= 24.9) is in this category.
 */
export const BMI_NORMAL_WEIGHT: string = "normal weight";

/**
 * BMI category of overweight. (24.9 <= BMI <= 29.9) is in this category.
 */
export const BMI_OVERWEIGHT: string = 'overweight';

/**
 * BMI category of obese. (30 <= BMI) is in this category.
 */
export const BMI_OBESE: string = 'obese';

/**
 * Default value for converting a number of lbs into an equivalent amount of calories.
 */
export const ONE_POUND_CALORIES: number = 3500;

/**
 * Key used to refer to user activity level when sedentary.
 */
export const ACTIVITY_LEVEL_SEDENTARY: string = "sedentary";

/**
* Key used to refer to user activity level when lightly active.
*/
export const ACTIVITY_LEVEL_LIGHTLY_ACTIVE: string = "lightlyActive";

/**
* Key used to refer to user activity level when  active.
*/
export const ACTIVITY_LEVEL_ACTIVE: string = "active";

/**
* Key used to refer to user activity level when very active.
*/
export const ACTIVITY_LEVEL_VERY_ACTIVE: string = "veryActive";

/**
 * Constant used to refer to units of measure for an amount of calories.
 */
export const KCAL_UNITS: string = "kcal";

/**
* Key used for surplus preference value when set to conservative (100-250 kcal).
*/
export const SURPLUS_CONSERVATIVE: string = "conservative";

/**
 * Inclusive range to augment TDEE by to calculate a conservative surplus.
 */
export const CONSERVATIVE_SURPLUS_RANGE: number[] = [100, 250];

/**
* Key used for surplus preference value when set to moderate (250-500 kcal).
*/
export const SURPLUS_MODERATE: string = "moderate";

/**
 * Inclusive range to augment TDEE by to calculate a moderate surplus.
 */
export const MODERATE_SURPLUS_RANGE: number[] = [250, 500];

/**
* Key used for surplus preference value when set to aggressive (500-750 kcal).
*/
export const SURPLUS_AGGRESSIVE: string = "aggressive";

/**
 * Inclusive range to augment TDEE by to calculate an aggressive surplus.
 */
export const AGGRESSIVE_SURPLUS_RANGE: number[] = [500, 750];

/**
* Key used for deficit preference value when set to conservative (200-300 kcal).
*/
export const DEFICIT_CONSERVATIVE: string = "conservative";

/**
 * Inclusive range to augment TDEE by to calculate a conservative deficit.
 */
export const CONSERVATIVE_DEFICIT_RANGE: number[] = [200, 300];

/**
* Key used for deficit preference value when set to moderate (300-500 kcal).
*/
export const DEFICIT_MODERATE: string = "moderate";

/**
 * Inclusive range to augment TDEE by to calculate a moderate deficit.
 */
export const MODERATE_DEFICIT_RANGE: number[] = [300, 500];

/**
* Key used for deficit preference value when set to aggressive (500-750 kcal).
*/
export const DEFICIT_AGGRESSIVE: string = "aggressive";

/**
 * Inclusive range to augment TDEE by to calculate an aggressive deficit.
 */
export const AGGRESSIVE_DEFICIT_RANGE: number[] = [500, 750];

/**
 * Key used for deficit preference value when set to very aggressive (750-1000 kcal).
 */
export const DEFICIT_VERY_AGGRESSIVE: string = "veryAggressive";

/**
 * Inclusive range to augment TDEE by to calculate an aggressive deficit.
 */
export const VERY_AGGRESSIVE_DEFICIT_RANGE: number[] = [750, 1000];

