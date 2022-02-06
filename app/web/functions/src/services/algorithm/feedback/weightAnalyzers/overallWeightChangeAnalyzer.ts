import * as energy from '../../../../constants/energyConstants';
import * as feedbackBuilder from '../general/fedbackHelper';
import { Feedback } from '../../../../classes/feedback';
import { NutritionLog } from '../../../../classes/nutrition-log';
import { LogStats } from '../../../../classes/log-stats';

/**
 * If a user wants to gain muscle, they should be gaining weight to optimize their results, if a user
 * wants to lose fat, they should be losing weight to optimize their results and if a user wants to maintain
 * their current body composition, then their weight should remain roughly the same. 
 * 
 * This feedback is intended to make sure that the overall change in an user's body weight aligns
 * with their goal. To check this, the LogSmarter™ intake suggestion algorithm calculates if a user is
 * gaining, losing, or maintaining weight by looking at the difference between start and current weight. The
 * feedback tells the user that they are doing a good job if their goal is to gain muscle and they are gaining
 * weight, their goal is to lose fat and they are losing weight or if their goal is to maintain and they have
 * maintained their weight. Otherwise the feedback lets the user know that their current change in body
 * weight is not considered optimal based upon their goal and suggests what would be optimal.
 * Body weight change feedback is only provided if the log meets MDET. This is because of how 
 * start weight and current weight are calculated. At the beginning of a log, the two values will be very 
 * similar and the results of the analysis are very likely to tell the user they have maintained their weight 
 * even if it is too early to tell whether or not that is truly whats happening. Once MDET is reached and 
 * exceeded, the feedback from this analysis is more useful.
 * 
 * @param log the nutrition log that the feedback algorithm is being run on.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * 
 * Last edited by: Ryan Lefebvre 7/21/2020
 */
export function overallWeightChangeAnalysis(log: NutritionLog, logStats: LogStats): Feedback {
    try {
        const logDoesNotMeedMDET: boolean = !(logStats.meetsMDET);
        if (logDoesNotMeedMDET) {
            return energy.INSUFFICIENT_DATA;
        } else {
            let bwcAnalysis: string = "";
            if (logStats.weightChangeOnTrackForGoal) {
                bwcAnalysis += feedbackBuilder.getPositiveExclamation();
            }
            else {
                bwcAnalysis += feedbackBuilder.getNegativeExclamation();
            }
            bwcAnalysis += ", your goal is to " + getDisplayGoal(log.goal) + " and ";
            bwcAnalysis += " you have " + getDisplayWeightChangeCategory(logStats.weightChangeCategory);
            bwcAnalysis += (". " + feedbackBuilder.capitalizeFirstLetter(feedbackBuilder.getActionStatement()) + " " + getRecommendationToReachGoal(logStats.weightChangeOnTrackForGoal, log.goal));
            let bodyWeightFeedback = new Feedback();
            bodyWeightFeedback.title = TITLE;
            bodyWeightFeedback.message = bwcAnalysis;
            return bodyWeightFeedback;
        }
    } catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Title used for Overall weight change analysis.
 */
const TITLE: string = "Overall weight change";

/**
 * Returns a reccomendation to the user about what change they should see in their 
 * overall body weight to reach their goal. If they are on track for their goal,
 * then they are just told to keep it up. If none of the conditions are met, then
 * insufficient data is returned.
 * 
 * @param onTrackForGoal true if the user's overall change in bodyweight is optimal for their goal.
 * @param goal The user's log goal, expected to be muscle gain, weight loss or to maintain.
 */
export function getRecommendationToReachGoal(onTrackForGoal: boolean, goal: string): string {
    if (onTrackForGoal) {
        return "keep your body weight moving in this direction because it is considered optimal for your goal!";
    }
    else if (goal == energy.GOAL_FAT_LOSS) {
        return "follow your goal intake to make sure you are losing weight.";
    }
    else if (goal == energy.GOAL_MUSCLE_GAIN) {
        return "follow your goal intake to make sure you are gaining weight.";
    }
    else if (goal == energy.GOAL_MAINTAIN) {
        return "follow your goal intake to make sure you are maintaining weight.";
    }
    else {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Converts a weight change catagory that classifies the true overall
 * change in weight for a user's bodyweight over a log into either 
 * gained weight, lost weight or maintained weight. If the category passed
 * in is not one fo the three catagories, then insufficient data is returned.
 * 
 * @param category weight change category to convert into a display string.
 */
export function getDisplayWeightChangeCategory(category: string): string {
    if (category == energy.MAINTAINED_WEIGHT) {
        return "maintained your weight";
    }
    else if (category == energy.GAINED_WEIGHT) {
        return "been gaining weight";
    }
    else if (category == energy.LOST_WEIGHT) {
        return "been losing weight";
    }
    else {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Converts a log goal into a string that presents the goal in a readable format.
 *  
 * @param goal goal to be converted into a display string. 
 */
export function getDisplayGoal(goal: string): string {
    if (goal == energy.GOAL_FAT_LOSS) {
        return "lose fat";
    }
    else if (goal == energy.GOAL_MUSCLE_GAIN) {
        return "gain muscle";
    }
    else if (goal == energy.GOAL_MAINTAIN) {
        return "maintain weight";
    }
    else {
        return energy.INSUFFICIENT_DATA;
    }
}

