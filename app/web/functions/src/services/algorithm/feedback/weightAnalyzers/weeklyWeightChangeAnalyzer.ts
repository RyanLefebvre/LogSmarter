import * as energy from '../../../../constants/energyConstants';
import * as feedbackBuilder from '../../feedback/general/fedbackHelper';
import { Feedback } from '../../../../classes/feedback';
import { NutritionLog } from '../../../../classes/nutrition-log';
import { LogStats } from '../../../../classes/log-stats';

/**
 * Analyzing whether the mean change in body weight per week is appropriate for a nutritional 
 * phase is more insightful using percentages of total body weight rather than the actual amount of weight 
 * change. This is because the percentage is relative to the user's total weight and aiming for a fixed 
 * amount of weight change may not be appropriate given the size of the user. 
 * 
 * When a user's goal is fat loss, calorie intake should be set to a level that results in body weight 
 * losses of approximately 0.5% to 1.5% per week, depending on the amount of weight someone needs to 
 * lose. As a user gets leaner, they will need to reduce the rate to maximize muscle retention. When the 
 * goal is weight gain, recommendations range from 0.25% to 1.5% weight gain per month depending on 
 * the user’s training status which equates to 0.0625% to 0.375% weight gain per week. If a user's goal is 
 * to lose fat and they are losing at a rate of 0.5% to 1.5% of their starting body weight per week, the 
 * feedback tells the user they are doing a good job. If the user’s goal is to gain muscle and they are gaining 
 * weight at a rate of 0.063% to 0.38% per week, the feedback tells the user they are within an optimal 
 * range. The lower and upper end of the ranges for optimal gains in lean mass were rounded to the nearest 
 * whole number because the percent weight change per week is truncated to two decimal places. As an 
 * example, some of the most accurate bathroom scales on the market boast a margin of error of about 0.22 
 * lbs, this means even with the best equipment available to the average person, measuring body weight to 
 * multiple decimal places is likely to be imprecise. 
 * 
 * If the user's rate of weight gain or loss does not fall within the optimal ranges stated above, the 
 * feedback informs the user whether their rate of weight change is considered fast or slow and lists what 
 * the optimal range is. This feedback is not displayed if the user’s overall change in body weight does not 
 * align with their goal or their goal is to maintain. This prevents feedback similar to the body weight 
 * change analysis which already tells the user if their change in body weight does not align with their goal.
 * 
 * @param log the nutrition log that the feedback algorithm is being run on.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * 
 * Last edited by: Ryan Lefebvre 7/22/2020
 */
export function weeklyWeightChangeAnalysis(log: NutritionLog, logStats: LogStats): Feedback {
    try {
        //Only return this if user is on track for goal and their goal is not to maintain their weight 
        const noStartWeight: boolean = (logStats.startWeight == energy.INSUFFICIENT_DATA);
        const noCurrentWeight = (logStats.currentWeight == energy.INSUFFICIENT_DATA);
        const notOnTrack: boolean = (!logStats.weightChangeOnTrackForGoal);
        const goalIsToMaintain: boolean = (log.goal == energy.GOAL_MAINTAIN);
        const doesNotMeetMDET = !(logStats.meetsMDET);
        const cantPerformAnalysis: boolean = (noStartWeight || noCurrentWeight || notOnTrack || goalIsToMaintain || doesNotMeetMDET);
        if (cantPerformAnalysis) {
            return energy.INSUFFICIENT_DATA;
        }
        else {
            const isOptimal: boolean = weeklyChangeIsOptimal(logStats.weeklyPercentChange, log.goal);
            let weeklyChangeAnalysis: string = "Your weekly change in percentage of total body weight is considered ";
            if (isOptimal) {
                weeklyChangeAnalysis += ("optimal for your goal. " + feedbackBuilder.capitalizeFirstLetter(feedbackBuilder.getActionStatement()) +
                    " " + feedbackBuilder.keepItUpSatement() + " to match your current rate of weight change");
            }
            else if (!isOptimal) {
                const isFast = changePerWeekIsFast(logStats.weeklyPercentChange, log.goal);
                if (isFast) {
                    weeklyChangeAnalysis += "fast";
                }
                else if (!isFast) {
                    weeklyChangeAnalysis += "slow";
                }
                weeklyChangeAnalysis += " for your goal. We have adjusted your TDEE estimate and goal intake "
                const gainingFast: boolean = (isFast && log.goal == energy.GOAL_MUSCLE_GAIN);
                const losingSlow: boolean = (!isFast && log.goal == energy.GOAL_FAT_LOSS);
                const gainingSlow: boolean = (!isFast && log.goal == energy.GOAL_MUSCLE_GAIN);
                const losingFast: boolean = (isFast && log.goal == energy.GOAL_FAT_LOSS);
                if (gainingFast || losingSlow) {
                    weeklyChangeAnalysis += "downwards";
                }
                else if (gainingSlow || losingFast) {
                    weeklyChangeAnalysis += "upwards";
                }
                weeklyChangeAnalysis += "  relative to their previous values to optimize your weekly rate of weight change";
            }
            weeklyChangeAnalysis += ".";
            const weightChangeFeedback: Feedback = new Feedback();
            weightChangeFeedback.title = TITLE;
            weightChangeFeedback.message = weeklyChangeAnalysis;
            return weightChangeFeedback;
        }
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Title used for feedback object returned from analysis.
 */
const TITLE: string = "Weekly weight change";

/**
 * Index of top of range of optimal percentage of weekly weight change.
 */
const TOP_RANGE_IDX: number = 1;

/**
 * Index of bottom of range of optimal percentage of weekly weight change.
 */
const BOTTOM_RANGE_IDX: number = 0;

/**
 * Returns true if the weekly % change is considered fast 
 * false otherwise. If false can assume that change is slow. 
 * This function is not intended to be called if the change 
 * per week is with  the optimal range 
 * 
 * @param changePerWeek weekly percent change of starting body weight.
 * @param goal Goal for log. Expected not to be to maintain weight.
 */
export function changePerWeekIsFast(changePerWeek: number, goal: string): boolean {
    const range = getOptimalRange(goal);
    const isFast: boolean = changePerWeek > range[TOP_RANGE_IDX];
    return isFast;
}

/**
 * Returns the optimal range of percent weekly gain or loss as a string. 
 * 
 * @param logGoal  goal for the log.
 */
export function getOptimalRangeDisplay(logGoal: string): string {
    const range: number[] = getOptimalRange(logGoal);
    const topOfRange: number = range[TOP_RANGE_IDX];
    const bottomOfRange: number = range[BOTTOM_RANGE_IDX];
    return "[" + bottomOfRange + " - " + topOfRange + "]";
}

/**
 * Returns true if the percent change per week is optimal based on the users 
 * selected log goal. This function assumes the user is on track for their goal
 * meaning their overall weight change reflects their goal. Also makes the assumption
 * that the users goal is not to maintain. 
 * 
 * @param weeklyPercentChange Percentage of weekly weight change relative to starting body weight.
 * @param goal Goal of the log, assumed not to be to maintain weight.
 */
export function weeklyChangeIsOptimal(weeklyPercentChange: number, goal: string): boolean {
    const range = getOptimalRange(goal);
    const topOfRange: number = range[TOP_RANGE_IDX];
    const bottomOfRange: number = range[BOTTOM_RANGE_IDX];
    const isOptimal: boolean = ((bottomOfRange <= weeklyPercentChange) && (weeklyPercentChange <= topOfRange));
    return isOptimal;
}

/**
 * Returns an array with two elements where the first element is the bottom of the 
 * range of weekly weight change that is considered optimal and the second element
 * is the top of the range that is considered optimal. THis function assumes the 
 * goal of the user is to gain muscle or lose fat. If their goal is not one 
 * of these two, then an optimal range of [0,0] is returned.
 * 
 * @param goal User's goal for the log, assumed to be muscle gain or fat loss. 
 */
export function getOptimalRange(goal: string) {
    let topOfRange = 0;
    let bottomOfRange = 0;
    if (goal == energy.GOAL_MUSCLE_GAIN) {
        topOfRange = energy.MAX_BULK_RATE;
        bottomOfRange = energy.MIN_BULK_RATE;
    }
    else if (goal == energy.GOAL_FAT_LOSS) {
        topOfRange = energy.MAX_CUT_RATE;
        bottomOfRange = energy.MIN_CUT_RATE;
    }
    return [bottomOfRange, topOfRange];
}