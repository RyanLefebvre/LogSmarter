import * as energy from '../../../../constants/energyConstants';
import * as feedbackBuilder from '../general/fedbackHelper';
import * as goalCalc from '../../logGoalCalculator';
import * as logStatCalc from '../../logStatCalculator';
import { Feedback } from '../../../../classes/feedback';
import { NutritionLog } from '../../../../classes/nutrition-log';
import { UserProfile } from '../../../../classes/user-profile';
import { LogStats } from '../../../../classes/log-stats';

/**
 * Checks whether a users average calorie intake falls within their goal range
 * if it does the user is told they are doing a good job. If not, the user is 
 * given general advice on how to change their intake so the average intake will 
 * fall within the goal intake range. This analysis should not be performed if the 
 * user's average intake, goal intake or tdee could not be calculated. This serves
 * as a gentle reminder to the LogSmarter™ user that consistency with their calorie 
 * intake is a key factor in any body composition change intervention. This feedback
 * is provided as long as the user has enough data in a log to find a mean calorie 
 * intake and a goal intake range.
 * 
 * @param log the nutrition log that the feedback algorithm is being run on.
 * @param user The UserProfile object of the user that owns the nurition log.
 * @param estimatedTDEE The estimated TDEE output by the TDEE estimation algorithm for the user.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * 
 * Last edited by: Ryan Lefebvre 7/21/2020
 */
export function averageIntakeAnalysis(log: NutritionLog, user: UserProfile, estimatedTDEE: number, logStats: LogStats): Feedback {
    try {
        const goalIntake: string = goalCalc.getGoalIntake(estimatedTDEE, log.goal, user);
        const noAvgIntake: boolean = (logStats.avgKcalIntake == energy.INSUFFICIENT_DATA);
        const noGoalIntake: boolean = (goalIntake == energy.INSUFFICIENT_DATA);
        const noTDEE: boolean = (estimatedTDEE == energy.INSUFFICIENT_DATA);
        const cannotPerformAnalysis: boolean = (noAvgIntake || noGoalIntake || noTDEE);
        if (cannotPerformAnalysis) {
            return energy.INSUFFICIENT_DATA;
        } else {
            const avgDifferenceFromEstimatedTDEE = logStatCalc.getAvgSurDef(estimatedTDEE, log);
            const avgWithinGoalRange: boolean = averageDifferenceFromEstimateWithinGoalRange(estimatedTDEE, avgDifferenceFromEstimatedTDEE, log.goal, user);
            let avgIntakeAnalysis: string = "";
            if (avgWithinGoalRange) {
                avgIntakeAnalysis += feedbackBuilder.getPositiveExclamation();
            }
            else {
                avgIntakeAnalysis += feedbackBuilder.getNegativeExclamation();
            }
            avgIntakeAnalysis = appendGoalRangeStatement(avgIntakeAnalysis, avgWithinGoalRange, logStats, goalIntake);
            if (avgWithinGoalRange) {
                avgIntakeAnalysis += feedbackBuilder.keepItUpSatement();
            }
            else {
                avgIntakeAnalysis += IMPORVEMENT_SUGGESTION;
            }
            avgIntakeAnalysis = feedbackBuilder.endStatement(avgIntakeAnalysis);
            let avgIntakeFeedback: Feedback = new Feedback()
            avgIntakeFeedback.title = AVERAGE_INTAKE_TITLE;
            avgIntakeFeedback.message = avgIntakeAnalysis
            return avgIntakeFeedback;
        }
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Title attached to the feedback object returned from the avergae intake analysis.
 */
const AVERAGE_INTAKE_TITLE: string = "Diet Adherence";

/**
 * A suggestion to the user about what they should do if their average intake does not fall within their goal intake range. 
 */
const IMPORVEMENT_SUGGESTION: string = "try to make sure that your daily intake falls within your goal intake range. That way, over time your average intake will fall within your goal intake range";

/**
 * Appends a statement relating to the user's goal range and their average calorie intake to the current
 * avgIntakeAnalysis. The value returned is the parameter with the statement appended. This statement simply informs
 * the user if they are or are not within their goal range and does not add any comments or analysis.
 * 
 * @param avgIntakeAnalysis The current message for the feedback to be returned from the analysis.
 * @param avgWithinGoalRange true if the user's average intake is within their goal range, false otherwise.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * @param goalIntake A string that represents the user's goal intake range for their log.
 */
export function appendGoalRangeStatement(avgIntakeAnalysis: string, avgWithinGoalRange: boolean, logStats: any, goalIntake: string): string {
    avgIntakeAnalysis += ", your average calorie intake is ";
    if (!avgWithinGoalRange) {
        avgIntakeAnalysis += " not ";
    }
    avgIntakeAnalysis += " consistently within your goal intake range. ";
    avgIntakeAnalysis += feedbackBuilder.capitalizeFirstLetter(feedbackBuilder.getActionStatement()) + " ";
    return avgIntakeAnalysis;
}

/**
 * Returns true if the average calorie intake of a user over the course of a log 
 * falls within their goal intake range calculated using their log goal and TDEE.
 * This is an inclusive range. The function returns false if the user's intake is
 * outside this range.
 * 
 * @param avgDifferenceFromEstimatedTDEE user's average calorie intake for their log.
 * @param logGoal user's log goal, muscle gain, fat loss or to maintain.
 * @param estimatedTDEE user's estimated TDEE from step 3 of algorithm. 
 * @param userProfile UserProfile object that log belongs to.
 */
export function averageDifferenceFromEstimateWithinGoalRange(estimatedTDEE: number, avgDifferenceFromEstimatedTDEE: number, logGoal: string, userProfile: UserProfile): boolean {
    let rangeConstants: number[] = goalCalc.getGoalIntakeConstants(logGoal, estimatedTDEE, userProfile);
    let isWithin: boolean = false;
    if (logGoal == energy.GOAL_FAT_LOSS || logGoal == energy.GOAL_MUSCLE_GAIN) {
        const isBiggerThanLowerBoundary: boolean = (rangeConstants[goalCalc.IDX_OF_SMALLER_CONST] <= avgDifferenceFromEstimatedTDEE);
        const isSmallerThanUpperBoundary: boolean = (rangeConstants[goalCalc.IDX_OF_LARGER_CONST] >= avgDifferenceFromEstimatedTDEE);
        isWithin = (isBiggerThanLowerBoundary && isSmallerThanUpperBoundary);
    }
    else if (logGoal == energy.MAINTAINED_WEIGHT) {
        return Math.abs(avgDifferenceFromEstimatedTDEE) <= rangeConstants[0];
    }
    return isWithin;
}
