import * as energy from '../../../../constants/energyConstants';
import * as converter from '../../../converter'
import * as logCalc from '../../logStatCalculator';
import { Feedback } from '../../../../classes/feedback';
import { UserProfile } from '../../../../classes/user-profile';
import { LogStats } from '../../../../classes/log-stats';

/**
 * Step 3 of the LogSmarter™ intake suggestion algorithm calculates ABE for a user based upon 
 * the data they are tracking in LogSmarter™. An interesting statistic to display to the user that shows how 
 * much work step 3 of the algorithm is doing beyond the initial estimate produced by the LogSmarter™ 
 * RFR model is the percent change from BE to ABE. This is calculated as the absolute value of the 
 * difference between BE and ABE divided by BE. 
 * 
 * To make the feedback more interesting to the user who likely does not know the inner workings 
 * of the LogSmarter™ intake suggestion algorithm, the feedback title is TDEE adaptation and the 
 * feedback contains a message similar to “We initially estimated your TDEE was X kcal, based upon your 
 * physical characteristics, change in body weight and calorie intake, we estimate your actual TDEE is Y 
 * kcal”. This feedback is only delivered once MDET is exceeded otherwise ABE is not calculated.
 * 
 * @param user The UserProfile object of the user that owns the nurition log.
 * @param estimatedTDEE The estimated TDEE output by the TDEE estimation algorithm for the user.
 * @param logStats A collection of various statistics calculated in advance for the log.
 * 
 * Last edited by: Ryan Lefebvre 7/21/2020
 */
export function baselineAdjustmentAnalysis(user: UserProfile, estimatedTDEE: number, logStats: LogStats): Feedback {
    try {
        let baselineTdee: number = user.estimatedTDEE
        const noBaselineTDEE = (baselineTdee == energy.INSUFFICIENT_DATA);
        if (noBaselineTDEE) {
            baselineTdee = logStats.avgKcalIntake;
        }
        const noEstimatedTDEE = estimatedTDEE == energy.INSUFFICIENT_DATA;
        const logDoesNotMeetMDET: boolean = !(logStats.meetsMDET);
        const estimatedAndAverageAreEqual: boolean = logCalc.estimatedAndAverageEquality(baselineTdee, estimatedTDEE);
        const cannotPerformAnalysis = (noBaselineTDEE || logDoesNotMeetMDET || estimatedAndAverageAreEqual || noEstimatedTDEE);
        if (cannotPerformAnalysis) {
            return energy.INSUFFICIENT_DATA;
        }
        else {
            const adjustmentFactor: number = converter.roundNumberToOneDecimalPlace(((Math.abs(baselineTdee - estimatedTDEE) / baselineTdee) * 100));
            let baselineAnalysis: string = "At the beginning of this log, our algorithm estimated that your TDEE was ";
            baselineAnalysis += baselineTdee + " kcal. ";
            baselineAnalysis += "Based on your physical characteristics and your body's response to your calorie intake, ";
            baselineAnalysis += "our algorithm has adjusted your initial TDEE estimate by " + adjustmentFactor + "%."
            baselineAnalysis += " We now estimate that your TDEE is " + estimatedTDEE + " kcal."
            let baselineAdjustmentFeedback: Feedback = new Feedback();
            baselineAdjustmentFeedback.title = TITLE;
            baselineAdjustmentFeedback.message = baselineAnalysis;
            return baselineAdjustmentFeedback;
        }
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Title for baseline adjustment feedback.
 */
const TITLE: string = "TDEE adaptation";
