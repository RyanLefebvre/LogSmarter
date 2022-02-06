import * as converter from '../../../converter';
import * as energy from '../../../../constants/energyConstants';
import { Feedback } from '../../../../classes/feedback';
import { NutritionLog } from '../../../../classes/nutrition-log';
import { UserProfile } from '../../../../classes/user-profile';
import { LogStats } from '../../../../classes/log-stats';

/**
 * We recommend staying within 15% of your starting weight when bulking or cutting. There is no
 * specific research to support this exact number, but in weight loss studies it is considered clinically
 * significant if you lose more than 5% of your starting body weight. There is no evidence-based 
 * percentage of body weight increase for bulking that is considered significant. An indirect marker could 
 * be body mass index (BMI) where you do not want to bulk until you fall into the obese category or 
 * cut until you fall into the underweight category for long-term health purposes. 
 * This yields an ideal BMI range of [18.5,30]. 
 * 
 * Some users may begin a nutritional phase with a BMI outside the ideal range. In this case, 
 * BMI feedback is only displayed if their BMI calculated with their starting weight and BMI calculated
 * with current weight are both outside the ideal range but they are in different BMI categories. 
 * For example, someone might have a fat loss goal and be obese with a BMI well over 30. It may be a
 * good idea for that user to take multiple nutritional phases to work their way into the ideal BMI range.
 * We want to make sure we are not constantly providing feedback that the user needs to start a new
 * nutritional phase when that may not actually be the case.
 * 
 * Some necessary constraints for this analysis include that the user must have entered records of
 * their height and weight for their profile which is necessary to calculate BMI, the log’s goal is not
 * maintenance, the log meets MDET and the user’s overall weight change aligns with their log goal. As
 * long as these constraints are met and the user’s total weight change over a log is clinically 
 * significant or their BMI falls outside the ideal BMI range, the feedback suggests they may want to
 * transition into a new nutritional phase and start a new log for that phase.
 * 
 * @param user The UserProfile object of the user that owns the nurition log.
 * @param log the nutrition log that the feedback algorithm is being run on.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * 
 * Last edited by: Ryan Lefebvre 7/22/2020
 */
export function totalWeightChangeAnalysis(log: NutritionLog, user: UserProfile, logStats: LogStats): Feedback {
    try {
        const invalidHeightOrWeight: boolean = (
            isNaN(user.height_inches) ||
            isNaN(user.weight_lbs) ||
            user.height_inches == energy.INSUFFICIENT_DATA ||
            user.weight_lbs == energy.INSUFFICIENT_DATA);
        const goalIsMaintenance: boolean = (log.goal == energy.GOAL_MAINTAIN);
        const weightChangeNotOnTrack: boolean = !(logStats.weightChangeOnTrackForGoal);
        const doesNotMeetMDET = !(logStats.meetsMDET);
        const cannotPerformAnalysis: boolean = (invalidHeightOrWeight || goalIsMaintenance || weightChangeNotOnTrack || doesNotMeetMDET);
        if (cannotPerformAnalysis) {
            return energy.INSUFFICIENT_DATA;
        }
        else {
            const startBMI: number = getBMI(logStats.startWeight, user.height_inches);
            const currentBMI: number = getBMI(logStats.currentWeight, user.height_inches);
            const startBmiIsNormal: boolean = hasNormalBMI(startBMI);
            const currentBmiIsNormal: boolean = hasNormalBMI(currentBMI);
            const bmiIsNormal: boolean = ((!startBmiIsNormal && !currentBmiIsNormal) || currentBmiIsNormal);
            const clinicallySignificant: boolean = isClinicallySignificant(logStats.totalPercentWeightChange);
            const bmiIsNormalAndNoSignificantChange: boolean = (bmiIsNormal && !clinicallySignificant);
            if (bmiIsNormalAndNoSignificantChange) {
                return energy.INSUFFICIENT_DATA;
            }
            else {
                let totalWeightAnalysis = "";
                if (!bmiIsNormal) {
                    totalWeightAnalysis += "Your BMI is " + currentBMI + ", this is considered an ";
                    totalWeightAnalysis += getBMICategory(currentBMI) + " BMI. ";
                }
                if (clinicallySignificant) {
                    if (!bmiIsNormal) {
                        totalWeightAnalysis += "Also, your";
                    } else {
                        totalWeightAnalysis += "Your";
                    }
                    totalWeightAnalysis += " weight has changed by " + (logStats.totalPercentWeightChange * 100) + "%";
                    totalWeightAnalysis += " over the course of this log. Any change of more than 15% is";
                    totalWeightAnalysis += " considered clinically significant. It may be a good idea to ";
                    totalWeightAnalysis += " start a new nutritional phase and a new log.";
                }
                const totalWeightChangeFeedback: Feedback = new Feedback();
                totalWeightChangeFeedback.title = TITLE;
                totalWeightChangeFeedback.message = totalWeightAnalysis;
                return totalWeightChangeFeedback;
            }
        }
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Title used for feedback object.
 */
const TITLE: string = "Total weight change";

/**
 * Returns a string associated with a BMI category based upon a numeric BMI. If the BMI does not 
 * fall into one of the categories, then 'unknown bmi' is returned. This should never happen, 
 * because if the param is a number, one of the if statement conditionals will be triggered.
 * 
 * @param bmi BMI to get a category for.
 */
export function getBMICategory(bmi: number): string {
    if (bmi < 18.5) {
        return energy.BMI_UNDERWEIGHT;
    }
    else if (18.5 <= bmi && bmi <= 24.9) {
        return energy.BMI_NORMAL_WEIGHT;
    }
    else if (25 <= bmi && bmi <= 29.9) {
        return energy.BMI_OVERWEIGHT;
    }
    else if (bmi >= 30) {
        return energy.BMI_OBESE;
    } {
        return "unknown bmi";
    }
}

/**
 * Within the context of the analysis, we consider a 'normal' BMI to be
 * a BMI contained in the normal range and the overwight range. If the 
 * BMI passed in as a parameter is 'normal' within the context of this 
 * analysis, then true is returned, false otherwise.
 * 
 * @param bmi BMI to check for being normal.
 */
export function hasNormalBMI(bmi: number): boolean {
    return [energy.BMI_NORMAL_WEIGHT, energy.BMI_OVERWEIGHT].includes(getBMICategory(bmi));
}

/**
 * Returns a bmi rounded to one decimal place. Expects the input to be 
 * weight in kg and height in meters squared.
 * 
 * @param weight Weight in kg.
 * @param heightSquared Height in meters^2.
 */
export function getBMI(weight: number, height_inches: number): number {
    return converter.roundNumberToOneDecimalPlace((weight / (height_inches * height_inches)) * 703);
}

/**
 * Returns true if the total % of weight change is considered 
 * clinically significant. This is when the prcent change of starting 
 * body weight is greater than or equal to 15%. The parameter is 
 * expected to be a decimal. Returns false otherwise.
 * 
 * @param totalChange Total percent change of starting body weight.
 */
export function isClinicallySignificant(totalChange: number): boolean {
    const isSignificant: boolean = (totalChange > .15);
    return isSignificant;
}