import * as logCalc from './logStatCalculator';
import * as energy from '../../constants/energyConstants'
import * as functions from 'firebase-functions';
import * as goalCalc from './logGoalCalculator';
import * as generalFeeback from './feedback/general/generalFeedback';
import * as weeklyWeightChangeAnalyzer from './feedback/weightAnalyzers/weeklyWeightChangeAnalyzer';
import * as overallWeightChangeAnalyzer from './feedback/weightAnalyzers/overallWeightChangeAnalyzer';
import * as totalChangeAnalyzer from './feedback/weightAnalyzers/totalWeightChangeAnalyzer';
import * as averageIntakeAnalyzer from './feedback/calorieAnalyzers/averageIntakeAnalyzer';
import * as averageSurDefAnalyzer from './feedback/calorieAnalyzers/averageSurDefAnalyzer';
import * as baselineAdjustmentAnalyzer from './feedback/calorieAnalyzers/baselineAdjustmentAnalyzer';
import * as functionWrappers from '../../services/cloudfunction';
import { NutritionLog } from '../../classes/nutrition-log';
import { UserProfile } from '../../classes/user-profile';
import { LogStats } from '../../classes/log-stats';
import { FeedbackCategory } from '../../classes/feedback-category';
import { EnergyPayload } from '../../classes/energy-payload';
import { DayEntry } from '../../classes/day-entry';

/**
 * This service is responsible for the TDEE estimation algorithm and the creation 
 * of the energy payload. It uses all the files in the energy algorithm 
 * directory to return an 'energy payload' which contains a user's estimated TDEE 
 * from the algorithm and any other statistics that are displayed in the In-Depth 
 * -Nutrition-Log-Display. It is accessed through an http callable function that 
 * is restricted to only authenticated users.
 * 
 * Last edited by: Ryan Lefebvre 7/24/2020
 */
export const requestEnergyPayload = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context,
        async () => {
            const log: NutritionLog = data.log;
            const user: UserProfile = data.user;
            const energyPayload = await getEnergyPayload(log, user);
            return energyPayload;
        });
});

/**
 * Called by the mobile client to mark entries with a start TDEE and goal intake
 * boundaries after a sync with the devices respective health app. This function
 * will simulate the user adding the entries manually and mark them with a TDEE 
 * and goal intake appropriately based on the results of repeatedly getting the 
 * energy payload.
 */
export const syncDataFromHealthBody = async (mainLog: NutritionLog, userProfile: UserProfile, mergedEntries: DayEntry[]) => {
    let tempEntries: DayEntry[] = [];
    const forceChronologicalOrder = (entry1: DayEntry, entry2: DayEntry) => { return entry1.id - entry2.id };
    mergedEntries.sort(forceChronologicalOrder);
    mainLog.dayEntries = tempEntries;
    for (let entry of mergedEntries) {
        const payloadForTempState: EnergyPayload = await getEnergyPayload(mainLog, userProfile);
        entry.creationEstimatedTDEE = payloadForTempState.estimatedTDEE;
        entry.goalIntakeBoundaries = payloadForTempState.goalIntakeBoundaries;
        mainLog.dayEntries.push(entry);
    }
    return {
        successMessage: "we re-ran the algorithm bro.",
        syncedData: mergedEntries
    }

};
export const syncDataFromHealth = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context,
        async () => {
            const mainLog: NutritionLog = data.mainLog;
            const userProfile: UserProfile = data.userProfile;
            const mergedEntries: DayEntry[] = data.mergedEntries;
            const syncedData = await syncDataFromHealthBody(mainLog, userProfile, mergedEntries);
            return syncedData;
        });
});

/**
 * Builds and defines the JSON that contains the schema of the energy payload.
 * 
 * @param nutritionLog Nutrition log to build payload for.
 * @param userProfile  UserProfile object of the user that the nutrition log belongs to.
 */
export async function getEnergyPayload(nutritionLog: NutritionLog, userProfile: UserProfile): Promise<EnergyPayload> {
    const startDate: number = logCalc.getStartDateForLogAsTimestamp(nutritionLog);
    const latestDate: number = logCalc.getLatestDateForLogAsTimestamp(nutritionLog);
    const latestIncomplete: boolean = logCalc.latestEntryIsIncomplete(nutritionLog);
    if (latestIncomplete) {
        const latestEntry: DayEntry = logCalc.getLatestEntry(nutritionLog);
        nutritionLog.dayEntries = nutritionLog.dayEntries.filter(entry => entry != latestEntry);
    }
    let baselineTDEE: number = nutritionLog.startTDEE;
    const noBaseline = (baselineTDEE == energy.INSUFFICIENT_DATA);
    if (noBaseline) {
        baselineTDEE = userProfile.estimatedTDEE;
    }
    const logStats: LogStats = logCalc.calculateLogStatisitics(nutritionLog);
    const completeEstimatedTDEE: number = getEstimatedTDEEFromIntakeAlgorithm(nutritionLog, baselineTDEE, logStats);
    const payLoad: EnergyPayload = {
        startWeight: logCalc.getStartWeightForLog(nutritionLog),
        currentWeight: logStats.currentWeight,
        estimatedTDEE: completeEstimatedTDEE,
        gainLossRate: logCalc.getWeightRateDisplayString(nutritionLog, userProfile, logStats.weeklyWeightChange, logStats.weightDifferenceStartToCurrent, logStats.weightChangeCategory),
        goalIntakeRange: goalCalc.getGoalIntake(completeEstimatedTDEE, nutritionLog.goal, userProfile),
        analysis: getLogAnalysis(nutritionLog, userProfile, completeEstimatedTDEE, logStats),
        goalIntakeBoundaries: goalCalc.getGoalIntakeConstants(nutritionLog.goal, completeEstimatedTDEE, userProfile),
        startDate: startDate,
        latestDate: latestDate,
        minCalories: logCalc.getMinKcal(nutritionLog),
        avgCalories: logCalc.getAvgKcal(nutritionLog),
        maxCalories: logCalc.getMaxKcal(nutritionLog),
        minWeight: logCalc.getMinWeight(nutritionLog),
        avgWeight: logCalc.getAvgWeight(nutritionLog),
        maxWeight: logCalc.getMaxWeight(nutritionLog)
    };
    return payLoad;
}

/**
 * Key used to refer to weight feedback category.
 */
export const FEEDBACK_CAT_WEIGHT: string = "Weight";

/**
 * Key used to refer to calories feedback category.
 */
export const FEEDBACK_CAT_KCAL: string = "Calories";

/**
 * Key used to refer to general feedback category.
 */
export const FEEDBACK_CAT_GENERAL: string = "General";

/**
 * Returns an array of JSONs that contain feedback. Each json has a category property that
 * corresponds to the specific category  the feedback is about and a list of feedback objects.
 * Each feedback object has a title explaining the point of the feedback and a message that explains
 * the feedback. This feedback is intended to help individuals structure their nutrition in a way that
 * aligns with their goal. If any of the analyzers return null then they are removed from their 
 * categories. If any of the feedback categories are empty then they are removed. If all feedback 
 * categories are removed, then a general statement is returned.
 * 
 * @param log Nutrition log to run analyzers on.
 * @param user UserProfile object that the Nutrition log belongs to.
 * @param estimatedTDEE Estimated TDEE from the algorithm.
 * @param logStats Pre calculated log statistics to reduce repeat calculations.
 */
function getLogAnalysis(log: NutritionLog, user: UserProfile, estimatedTDEE: number, logStats: LogStats): FeedbackCategory[] {
    const allFeedback: FeedbackCategory[] = [
        {
            category: FEEDBACK_CAT_KCAL,
            feedbackList: [
                averageIntakeAnalyzer.averageIntakeAnalysis(log, user, estimatedTDEE, logStats),
                averageSurDefAnalyzer.averageSurplusDeficitAnalysis(log, user, estimatedTDEE, logStats),
                baselineAdjustmentAnalyzer.baselineAdjustmentAnalysis(user, estimatedTDEE, logStats)
            ]
        },
        {
            category: FEEDBACK_CAT_WEIGHT,
            feedbackList: [
                overallWeightChangeAnalyzer.overallWeightChangeAnalysis(log, logStats),
                weeklyWeightChangeAnalyzer.weeklyWeightChangeAnalysis(log, logStats),
                totalChangeAnalyzer.totalWeightChangeAnalysis(log, user, logStats)]
        },
    ];
    allFeedback.forEach(feedbackCategory => {
        feedbackCategory.feedbackList = feedbackCategory.feedbackList.filter((feedback: any) => {
            return feedback != energy.INSUFFICIENT_DATA;
        })
    });
    const filteredFeedback = allFeedback.filter((feedBackCategory: any) => {
        return (feedBackCategory.feedbackList.length > 0)
    });
    const noFeedbackToDeliver: boolean = (filteredFeedback.length <= 0);
    if (noFeedbackToDeliver) {
        return [{
            category: FEEDBACK_CAT_GENERAL,
            feedbackList: [generalFeeback.getGeneralFeeback()]
        }];
    }
    else {
        return filteredFeedback;
    }
}

/**
 * Helper function for performing step 3 of the LogSMarter TDEE estimation algorithm.
 * Refer to section 5 of the algorithm documentation for more information.
 * 
 * @param log Nutrition log to get TDEE for.
 * @param baselineTdee Baseline TDEE estimate from RFR model
 * @param logStats Precalculated statistics for the log.
 */
function getEstimatedTDEEFromIntakeAlgorithm(log: NutritionLog, baselineTdee: number, logStats: LogStats): number {
    let adjustedBaseline = baselineTdee;
    if (logStats.meetsMDET) {
        adjustedBaseline = adjustBaseline(baselineTdee, logStats);
    }
    if (adjustBaseline) {
        adjustedBaseline = Math.round(adjustedBaseline);
    }
    const isNotAValidTDEE: boolean = !(logCalc.isValidTDEE(adjustedBaseline))
    if (isNotAValidTDEE) {
        return energy.INSUFFICIENT_DATA;
    }
    else {
        return adjustedBaseline;
    }
}


/**
 * Performs the baseline adjustment as described in section 5.1 of the algorithm 
 * documentation. There are 9 cases for the relationship between μDCI, BE and ΔBW. 
 * Based upon which of thesecases the user falls into we use a different initial value for ABE.
 * This function is essentially table 4 from section 5.1. The return value of this function 
 * will be the adjusted baseline.
 * 
 * @param baselineEstimate Baseline TDEE estimate from RFR model
 * @param logStats Precalculated statistics for the log.
 */
function adjustBaseline(baselineEstimate: number, logStats: LogStats) {
    let adjustedBaseline: number = logStats.avgKcalIntake;
    if (baselineEstimate == energy.INSUFFICIENT_DATA) {
        return adjustedBaseline;
    }
    const estAvgEqual: boolean = logCalc.estimatedAndAverageEquality(baselineEstimate, logStats.avgKcalIntake);
    const avgOfBEandMuDCI = Math.round((baselineEstimate + logStats.avgKcalIntake) / 2);
    if (logStats.weightChangeCategory == energy.MAINTAINED_WEIGHT) {
        if (estAvgEqual) {
            adjustedBaseline = avgOfBEandMuDCI;
        }
        else if (baselineEstimate > logStats.avgKcalIntake) {
            adjustedBaseline = logStats.avgKcalIntake;
        }
        else if (baselineEstimate < logStats.avgKcalIntake) {
            adjustedBaseline = logStats.avgKcalIntake;
        }
    }
    else if (logStats.weightChangeCategory == energy.LOST_WEIGHT) {
        if (estAvgEqual) {
            adjustedBaseline = Math.max(baselineEstimate, logStats.avgKcalIntake);
        }
        else if (baselineEstimate > logStats.avgKcalIntake) {
            adjustedBaseline = avgOfBEandMuDCI;
        }
        else if (baselineEstimate < logStats.avgKcalIntake) {
            adjustedBaseline = (logStats.avgKcalIntake + ((0.25) * (logStats.avgKcalIntake - baselineEstimate)));
        }
    }
    else if (logStats.weightChangeCategory == energy.GAINED_WEIGHT) {
        if (estAvgEqual) {
            adjustedBaseline = Math.min(baselineEstimate, logStats.avgKcalIntake);
        }
        else if (baselineEstimate > logStats.avgKcalIntake) {
            adjustedBaseline = (logStats.avgKcalIntake - ((0.25) * (baselineEstimate - logStats.avgKcalIntake)));
        }
        else if (baselineEstimate < logStats.avgKcalIntake) {
            adjustedBaseline = avgOfBEandMuDCI;
        }
    }
    const rateOfWeightChangeInCalories: number = ((energy.ONE_POUND_CALORIES * logStats.weeklyWeightChange) / 7);
    if (logStats.weightChangeCategory == energy.LOST_WEIGHT) {
        adjustedBaseline += rateOfWeightChangeInCalories;
    }
    else if (logStats.weightChangeCategory == energy.GAINED_WEIGHT) {
        adjustedBaseline -= rateOfWeightChangeInCalories;
    }
    return adjustedBaseline;
}






