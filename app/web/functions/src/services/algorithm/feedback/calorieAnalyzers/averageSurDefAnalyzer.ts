import * as energy from '../../../../constants/energyConstants';
import * as feedbackBuilder from '../general/fedbackHelper';
import * as goalCalc from '../../logGoalCalculator';
import * as logStatCalc from '../../logStatCalculator';
import { Feedback } from '../../../../classes/feedback';
import { UserProfile } from '../../../../classes/user-profile';
import { NutritionLog } from '../../../../classes/nutrition-log';
import { LogStats } from '../../../../classes/log-stats';

/**
 * LogSmarter™ provides preference settings for different cutting and bulking methodologies.
 * These preferences influence the goal intake range that is suggested by the LogSmarter™ intake
 * suggestion algorithm. This allows for an analysis of whether or not the user's mean surplus or deficit
 * aligns with their surplus and deficit preferences. This is calculated by taking the mean of the absolute
 * value of the difference between actual calorie intake and estimated TDEE. If the mean deficit or surplus
 * fits within the set range for the user selected preference then the feedback returns what the mean
 * surplus or deficit is and that the user is within the optimal range for their chosen preference. If
 * they are outside of the range, then their mean surplus or deficit is returned along with a suggestion
 * to try to fit within the optimal range. This analysis is the inverse of the mean calorie intake analysis
 * but is still a useful method of calculating the mean deficit or surplus for the LogSmarter™ user which
 * is not a statistic displayed anywhere else in the nutrition tracking user interface. It also accounts
 * for situations where the LogSmarter™ user may decide not to eat within their goal intak range every day.
 * For example an athlete may be in a cutting phase but have competitions during that phase. The athlete
 * may eat over their goal intake on competition day to improve their performance and under their goal
 * intake on another day to compensate. Some users may find it reassuring to see that their mean surplus
 * or deficit is still within their preferred range with a calorie cycling approach. This feedback is
 * provided as long as the user has enough data in a log to calculate a mean calorie intake and a goal
 * intake range. It is not provided if the users goal is to maintain because having a notable surplus
 * or deficit in a maintenance phase would not be optimal and if that is the case, the mean calorie
 * intake analysis will return the necessary feedback. Lastly, this feedback is also not returned
 * if the calculated mean surplus or deficit after the rate of weight change adjustment is negative.
 * 
 * @param log the nutrition log that the feedback algorithm is being run on.
 * @param user The UserProfile object of the user that owns the nurition log.
 * @param estimatedTDEE The estimated TDEE output by the TDEE estimation algorithm for the user.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * 
 * Last edited by: Ryan Lefebvre 7/21/2020
 */
export function averageSurplusDeficitAnalysis(log: NutritionLog, user: UserProfile, estimatedTDEE: number, logStats: LogStats): Feedback {
    try {
        const noAvgIntake: boolean = (logStats.avgKcalIntake == energy.INSUFFICIENT_DATA);
        const noTDEE: boolean = (estimatedTDEE == energy.INSUFFICIENT_DATA);
        const goalIsMaintenance: boolean = (log.goal == energy.GOAL_MAINTAIN);
        const goalIntake: string = goalCalc.getGoalIntake(estimatedTDEE, log.goal, user);
        const noGoalIntake: boolean = (goalIntake == energy.INSUFFICIENT_DATA);
        const cantPerformAnalysis: boolean = (noAvgIntake || noTDEE || goalIsMaintenance || noGoalIntake);
        if (cantPerformAnalysis) {
            return energy.INSUFFICIENT_DATA;
        } else {
            const difAvgEst: number = logStatCalc.getAvgSurDef(estimatedTDEE, log);
            const negativeDifAvgEst: boolean = (difAvgEst < 0);
            if (negativeDifAvgEst) {
                return energy.INSUFFICIENT_DATA;
            } else {
                const goalIntakeConstants: number[] = goalCalc.getGoalIntakeConstants(log.goal, estimatedTDEE, user);
                const withinGoalRange: boolean = (goalIntakeConstants[0] <= difAvgEst && difAvgEst <= goalIntakeConstants[1])
                let avgSurDefAnalysis: string = "";
                if (withinGoalRange) {
                    avgSurDefAnalysis += feedbackBuilder.getPositiveExclamation();
                }
                else {
                    avgSurDefAnalysis += feedbackBuilder.getNegativeExclamation();
                }
                avgSurDefAnalysis += ", your average ";
                if (log.goal == energy.GOAL_MUSCLE_GAIN) {
                    avgSurDefAnalysis += SURPLUS;
                }
                else if (log.goal == energy.GOAL_FAT_LOSS) {
                    avgSurDefAnalysis += DEFICIT;
                }
                avgSurDefAnalysis += " of " + difAvgEst + " kcal is";
                if (!withinGoalRange) {
                    avgSurDefAnalysis += " not";
                }
                avgSurDefAnalysis += " within your preferred "
                if (log.goal == energy.GOAL_MUSCLE_GAIN) {
                    avgSurDefAnalysis += SURPLUS;
                }
                else if (log.goal == energy.GOAL_FAT_LOSS) {
                    avgSurDefAnalysis += DEFICIT;
                }
                avgSurDefAnalysis += (" range of [" + goalIntakeConstants[0] + " - " +
                    goalIntakeConstants[1] + "] kcal. " + feedbackBuilder.capitalizeFirstLetter(
                        feedbackBuilder.getActionStatement()) + " ");
                if (withinGoalRange) {
                    avgSurDefAnalysis += feedbackBuilder.keepItUpSatement() + "."
                }
                else if (!withinGoalRange) {
                    avgSurDefAnalysis += " consistently keep your calorie intake within your goal intake range.  "
                }
                let avgSurDefFeedback = new Feedback();
                avgSurDefFeedback.title = TITLE;
                if (log.goal == energy.GOAL_MUSCLE_GAIN) {
                    avgSurDefFeedback.title += SURPLUS;
                }
                else if (log.goal == energy.GOAL_FAT_LOSS) {
                    avgSurDefFeedback.title += DEFICIT;
                }
                avgSurDefFeedback.message = avgSurDefAnalysis;
                return avgSurDefFeedback;
            }
        }
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Constant value used to refer to a calorie surplus.
 */
const SURPLUS: string = "surplus";

/**
 * Constant value used to refer to a calorie deficit.
 */
const DEFICIT: string = "deficit";

/**
 * Title prefix that is appended to to build the feedback title.
 */
const TITLE: string = "Average ";



