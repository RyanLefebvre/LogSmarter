import * as energy from '../../constants/energyConstants';
import * as converter from '../converter';
import * as goalCalc from './logGoalCalculator';
import { NutritionLog } from '../../classes/nutrition-log';
import { UserProfile } from '../../classes/user-profile';
import { DayEntry } from '../../classes/day-entry';

/**
 * This service handles any calculations related to log statistic calculation or calculations 
 * related to nutrition log entries.
 * 
 * Last edited by: Ryan Lefebvre 7/23/2020
 */

/**
 * Key used to map day entry list to dates.
 */
const DATE: string = "date";

/**
 * Key used to map day entry list to weights.
 */
const WEIGHT: string = "weight";

/**
 * Key used to map day entry list to calories.
 */
const KCAL: string = "calories";

/**
 * Helper function for calculating log stats in bulk. This function is used to 
 * reduce repeat calculation when the estimation and feedback algorithm are being
 * run to return an energy payload.
 * 
 * @param log Nutrition log object to calculate stats for. 
 */
export function calculateLogStatisitics(log: NutritionLog) {
    const meetsMDET: boolean = meetsMinimumCompleteEntryThreshold(log);
    const startWeight: number = getStartWeightForLog(log);
    const currentWeight: number = getCurrentWeightForLog(log);
    const weightDifferenceStartToCurrent: number = getWeightDifferenceStartToCurrent(startWeight, currentWeight);
    const weightChangeCategory: string = getWeightChangeCategory(weightDifferenceStartToCurrent);
    const weightChangeOnTrackForGoal: boolean = goalCalc.weightChangeOnTrackForGoal(log.goal, weightChangeCategory);
    const weeklyWeightChange: number = getWeeklyWeightChange(log, Math.abs(weightDifferenceStartToCurrent));
    const weeklyPercentChange: number = converter.roundNumberToSpecifiedDecimalPlace(((weeklyWeightChange / startWeight) * 100), 3);
    const avgKcalIntake: number = getAvgKcal(log);
    const totalPercentWeightChange: number = converter.roundNumberToOneDecimalPlace(Math.abs(weightDifferenceStartToCurrent) / startWeight);
    return {
        meetsMDET: meetsMDET,
        startWeight: startWeight,
        currentWeight: currentWeight,
        weightDifferenceStartToCurrent: weightDifferenceStartToCurrent,
        weightChangeCategory: weightChangeCategory,
        weightChangeOnTrackForGoal: weightChangeOnTrackForGoal,
        weeklyWeightChange: weeklyWeightChange,
        weeklyPercentChange: weeklyPercentChange,
        avgKcalIntake: avgKcalIntake,
        totalPercentWeightChange: totalPercentWeightChange
    };
}

/**
 * Returns true if the latest entry in a nutrition log is incomplete. False otherwise.
 * Will return false if the log is empty.
 */
export function latestEntryIsIncomplete(log: NutritionLog) {
    let latestEntry: DayEntry = getLatestEntry(log);
    if (!latestEntry) {
        return false;
    }
    else {
        return dayEntryIsIncomplete(latestEntry);
    }
}

/**
 * Returns the latest entry from a nutrition log. Null if one does not exist.
 */
export function getLatestEntry(log: NutritionLog): DayEntry {
    let latestEntry: DayEntry = null;
    log.dayEntries.forEach((entry: DayEntry) => {
        if (!latestEntry) {
            latestEntry = entry;
        } else {
            if (entry.id > latestEntry.id) {
                latestEntry = entry;
            }
        }
    });
    return latestEntry;
}

/**
 * Returns true if the day entry is incomplete false otherwise.
 */
export function dayEntryIsIncomplete(dayEntry: DayEntry): boolean {
    const weightIsZero: boolean = (dayEntry.weight == 0);
    const hasNoWeight: boolean = (!dayEntry.weight && !weightIsZero);
    const kcalIsZero: boolean = (dayEntry.calories == 0);
    const hasNoKcal: boolean = (!dayEntry.calories && !kcalIsZero);
    return (hasNoWeight || hasNoKcal);
}

/**
 * Returns the average surplus or deficit of a user's entries over the course of 
 * a log. This  This function returns the average surplus or deficit to whatever the best
 * estimate of the user's TDEE was at the time the entry was created. If the entry does not
 * have a creationTDEE field, then the current estimatedTDEE is used.
 * 
 * @param estimatedTDEE Estimated TDEE for the user from step 3 of the LS algorithm.
 * @param log  The log that the analysis is being conducted for.
 * @param logStats A logStats object calculated using log.  
 */
export function getAvgSurDef(estimatedTDEE: number, log: NutritionLog): number {
    let totalDifKcalIntakeAndEstimatedTDEE = 0;
    let numEntriesWithKcalRecords = 0;
    log.dayEntries.forEach((entry: DayEntry) => {
        if (entry.calories) {
            let curEstimatedTDEE = estimatedTDEE;
            if (entry.creationEstimatedTDEE) {
                curEstimatedTDEE = entry.creationEstimatedTDEE;
            }
            if (log.goal == energy.GOAL_MUSCLE_GAIN) {
                totalDifKcalIntakeAndEstimatedTDEE += (entry.calories - curEstimatedTDEE);
            }
            else if (log.goal == energy.GOAL_FAT_LOSS) {
                totalDifKcalIntakeAndEstimatedTDEE += (curEstimatedTDEE - entry.calories);
            }
            else if (log.goal == energy.GOAL_MAINTAIN) {
                totalDifKcalIntakeAndEstimatedTDEE += Math.abs(curEstimatedTDEE - entry.calories);
            }
            numEntriesWithKcalRecords++;
        }
    });
    let avgDifKcalIntakeAndEstimatedTDEE: number = null;
    if (numEntriesWithKcalRecords > 0) {
        avgDifKcalIntakeAndEstimatedTDEE = Math.round(totalDifKcalIntakeAndEstimatedTDEE / numEntriesWithKcalRecords);
    }
    return avgDifKcalIntakeAndEstimatedTDEE;
}

/**
 * Returns true if a tdee is within the valid range of TDEE's.
 * We have defined the valid range as anywhere from [750,7500] based 
 * upon Dr. Roberts guidance.
 * 
 * @param tdee tdee to check for validity
 */
export function isValidTDEE(tdee: number | null): boolean {
    if (!tdee) {
        return false;
    }
    else {
        const isValidTDEE: boolean = (energy.MIN_VALID_TDEE <= tdee && tdee <= energy.MAX_VALID_TDEE);
        return isValidTDEE;
    }
}

/**
 * Returns a string that displays how much weight the user has lost on average in lbs
 * per week over the length of the log. If the log is empty, the weekly change
 * in weight is not a number or there is an error then insufficient data is 
 * returned.
 * 
 * @param log Nutrition log that data is coming from 
 * @param userProfile UserProfile object of the user that the data belongs to.
 * @param weeklyWeightChange Average weekly change in body weight per week in lbs.
 * @param weightDifferenceStartToCurrent The difference in lbs of bodyweight from start weight to current weight.
 * @param weightChangeCategory Actual weight change over course of log. Either gained, lost or maintained weight.
 */
export function getWeightRateDisplayString(log: NutritionLog, userProfile: UserProfile, weeklyWeightChange: number, weightDifferenceStartToCurrent: number, weightChangeCategory: string) {
    try {
        const logIsEmpty: boolean = (log.dayEntries.length == 0);
        if (logIsEmpty) {
            return energy.INSUFFICIENT_DATA;
        } else {
            weightDifferenceStartToCurrent = Math.abs(weightDifferenceStartToCurrent)
            const cannotGetWeightRate: boolean = (isNaN(weeklyWeightChange) || isNaN(weightDifferenceStartToCurrent));
            if (cannotGetWeightRate) {
                return energy.INSUFFICIENT_DATA;
            } else {
                let displayString: string = "";
                if (weightChangeCategory == energy.LOST_WEIGHT) {
                    displayString += "- ";
                }
                else if (weightChangeCategory == energy.GAINED_WEIGHT) {
                    displayString += "+ ";
                }
                else {
                    return "Maintained Weight ";
                }
                const systemIsMetric: boolean = !(userProfile.userPreferences.general.isImperial);
                if (systemIsMetric) {
                    weightDifferenceStartToCurrent = converter.convertLbsToKg(weightDifferenceStartToCurrent);
                    weeklyWeightChange = converter.convertLbsToKg(weeklyWeightChange);
                }
                const units = converter.getWeightUnits(userProfile.userPreferences.general.isImperial);
                displayString += (weightDifferenceStartToCurrent + units + " @ " + weeklyWeightChange + units + " per week");
                return displayString;
            }
        }
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Helper method for grabbing the average weight of the first week of entries 
 * or the average weight of the last week of entries, the entries added to the accumulator 
 * to take the average are only used if their weight field is not null and they are a week 
 * or less away from the entry at index 0, if there are no entries within one week of the first 
 * or last entry with a non null weight field then insufficient data is returned. The value 
 * returned will always be rounded to 1 decimal place.
 * 
 * @param logBeingObserved log to find the average of the first or last weeks worth of entries for.
 * @param isFirstWeek true if the function should find first week average. False for last week average.
 */
export function getAverageweightOfFirstOrLastWeek(logBeingObserved: NutritionLog, isFirstWeek: boolean): number {
    const cannotCalc: boolean = (logBeingObserved == null || logBeingObserved.dayEntries.length == 0);
    if (cannotCalc) {
        return energy.INSUFFICIENT_DATA;
    } else {
        logBeingObserved.dayEntries.sort(function (entry1: any, entry2: any) {
            if (isFirstWeek == false) {
                return new Date(entry2.id).getTime() - new Date(entry1.id).getTime();
            }
            else {
                return new Date(entry1.id).getTime() - new Date(entry2.id).getTime();
            }
        });
        let totalWeight: number = 0;
        let numEntriesWithWeight: number = 0;
        let loopLength = Math.min(logBeingObserved.dayEntries.length, 7);
        for (let index: number = 0; index < loopLength; index++) {
            const firstEntryDate: Date = new Date(logBeingObserved.dayEntries[0].id);
            const currentEntryDate: Date = new Date(logBeingObserved.dayEntries[index].id);
            const numWeeksBetween: number = converter.getNumWeeksBetweenDatesInLogContext(firstEntryDate, currentEntryDate);
            const oneWeekOrLessBetween = numWeeksBetween <= 1;
            if (oneWeekOrLessBetween) {
                const entryHasWeight: boolean = (logBeingObserved.dayEntries[index].weight != null);
                if (entryHasWeight) {
                    totalWeight += logBeingObserved.dayEntries[index].weight;
                    numEntriesWithWeight++;
                }
            }
            else {
                index = loopLength;
            }
        }
        const noEntriesWithWeight: boolean = (numEntriesWithWeight == 0);
        if (noEntriesWithWeight) {
            return energy.INSUFFICIENT_DATA;
        }
        else {
            const averageOfWeek: number = (totalWeight / numEntriesWithWeight);
            return converter.roundNumberToOneDecimalPlace(averageOfWeek);
        }
    }


}

/**
 * Returns true if the number of complete entries in a log exceeds the 
 * minimum threshold for complete entries. An entry is considered 
 * complete if has a record of both weight and calories. Returns 
 * false otherwise.
 * 
 * @param log Log to check for meeting MDET.
 */
export function meetsMinimumCompleteEntryThreshold(log: NutritionLog) {
    let numCompleteEntries: number = 0;
    let meetsThreshold: boolean = false;
    log.dayEntries.forEach((entry: any) => {
        if (entry.weight && entry.calories) {
            numCompleteEntries++
            if (numCompleteEntries >= energy.MINIMUM_DAY_ENTRY_THRESHOLD) {
                meetsThreshold = true;
            }
        }
    });
    return meetsThreshold;
}

/**
 * Returns the average weekly change in lbs in users body weight over the length of the log. 
 * the log length returned from get log length will always be >= 1 so this function can skip
 * checking for a division by 0 error.
 * 
 * @param log Nutrition log to get the weekly weight change of.
 * @param weightDifStartCurrent Difference in start weight and current weight for a user.
 */
export function getWeeklyWeightChange(log: NutritionLog, weightDifStartCurrent: number): number {
    return converter.roundNumberToSpecifiedDecimalPlace(weightDifStartCurrent / getLogLengthInWeeksForStatistics(log), 1);
}

/**
 * Returns the difference in weight between start weight in lbs rounded to one decimal place.
 * 
 * @param startWeight Starting weight for a user's log.
 * @param currentWeight Current weight for a user's log.
 */
export function getWeightDifferenceStartToCurrent(startWeight: number, currentWeight: number): number {
    const weightDif: number = converter.roundNumberToOneDecimalPlace(startWeight - currentWeight);
    return weightDif;
}

/**
 * Returns the actual change in a user's weight over a log. One of gained, lost or maintained weight. 
 * 
 * @param weightDifferenceStartToCurrent The difference in a users weight from the start of a log to their current state. 
 */
export function getWeightChangeCategory(weightDifferenceStartToCurrent: number): string {
    if (Math.abs(weightDifferenceStartToCurrent) <= energy.WEIGHT_MAINTENANCE_THRESHOLD) {
        return energy.MAINTAINED_WEIGHT;
    }
    if (weightDifferenceStartToCurrent < 0) {
        return energy.GAINED_WEIGHT;
    }
    else {
        return energy.LOST_WEIGHT;
    }
}

/**
 * Returns the number of weeks in the log as a number, the value returned 
 * will be rounded up so 0 weeks will be considered one week. If any error 
 * occurs, then Insufficient data is returned. THIS FUNCTION IS ONLY USED FOR 
 * THE WEIGHT RATE DISPLAY STRING. IT IS NOT USED FOR THE WEEKLY RATE VALUE.
 * This can create a deiscrepancy where the user's average weekly rate of weight 
 * change will be slightly different than if they consider the amount of weeks in their 
 * log to be equal to the number of weeks in the weight rate display string.
 * 
 * @param log Nutrition Log to get the length of.
 */
export function getLogLengthInWeeksForDisplayString(log: NutritionLog): number {
    try {
        let numOfWeeks: number = converter.getNumWeeksBetweenDatesInLogContext(getStartDateForLog(log), getLatestDateForLog(log));
        return numOfWeeks;
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * This function is only used for the actual calculation of the user's average weekly change 
 * in percentage of total starting body weight. It will calculate the number of weeks in the 
 * log as a decimal rounded to one decimal place. This prevents the user from seeing wild 
 * fluctuations in average rate of weight change when the number of weeks in their log increases 
 * by one. It also prevents cases where the user's rate of weight change didn't actually change
 * but the big jump in denominator will drastically change the average amount of weight lost or gained
 * per week.
 */
export function getLogLengthInWeeksForStatistics(log: NutritionLog): number {
    try {
        let numOfWeeks: number = converter.getNumWeeksNoRounding(getStartDateForLog(log), getLatestDateForLog(log));
        if (numOfWeeks <= 1) {
            numOfWeeks = 1;
        } else {
            numOfWeeks = converter.roundNumberToOneDecimalPlace(numOfWeeks);
        }
        return numOfWeeks;
    }
    catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Returns the start date for a log as a timestamp. If there is no start 
 * date, then null is returned.
 * 
 * @param log Log to find latest date for.
 */
export function getStartDateForLogAsTimestamp(log: NutritionLog): number {
    const startDate = getStartDateForLog(log);
    const noStartDate: boolean = !(startDate);
    if (noStartDate) {
        return energy.INSUFFICIENT_DATA;
    } else {
        return startDate.getTime();
    }
}

/**
 * Returns the latest start date for a log. This function assumes a log
 * will always have entries when it is called. Otherwise, the 
 * insufficient data constant will be returned.
 * 
 * @param log Log to find latest date for.
 */
export function getStartDateForLog(log: NutritionLog): Date {
    let minDate: any = energy.INSUFFICIENT_DATA;
    log.dayEntries.forEach((entry: DayEntry) => {
        if (minDate == energy.INSUFFICIENT_DATA || entry.id < minDate) {
            minDate = entry.id;
        }
    });
    if (minDate != energy.INSUFFICIENT_DATA) {
        return new Date(minDate);
    } else {
        return minDate;
    }
}

/**
 * Returns the latest date for a log as a timestamp. If there is no latestr 
 * date, then null is returned.
 * 
 * @param log Log to find latest date for.
 */
export function getLatestDateForLogAsTimestamp(log: NutritionLog): number {
    const latestDate = getLatestDateForLog(log);
    const noLatestDate: boolean = !(latestDate);
    if (noLatestDate) {
        return energy.INSUFFICIENT_DATA;
    } else {
        return latestDate.getTime();
    }
}

/**
 * Returns the latest date for a log. This function assumes a log
 * will always have entries when it is called. Otherwise, the 
 * insufficient data constant will be returned.
 * 
 * @param log Log to find latest date for.
 */
export function getLatestDateForLog(log: NutritionLog): Date {
    let maxDate: any = energy.INSUFFICIENT_DATA;
    log.dayEntries.forEach((entry: DayEntry) => {
        if (maxDate == energy.INSUFFICIENT_DATA || entry.id > maxDate) {
            maxDate = entry.id;
        }
    });
    if (maxDate != energy.INSUFFICIENT_DATA) {
        return new Date(maxDate);
    } else {
        return maxDate;
    }
}

/**
 * Returns the current weight of a user calculated using 
 * constraints described in the algorithm documentation.
 * 
 * @param log Log to find starting weight for.
 */
export function getStartWeightForLog(log: NutritionLog): number {
    return getAverageweightOfFirstOrLastWeek(log, true);
}

/**
 * Returns the current weight of a user calculated using 
 * constraints described in the algorithm documentation.
 * 
 * @param log Log to find current weight for.
 */
export function getCurrentWeightForLog(log: NutritionLog): number {
    return getAverageweightOfFirstOrLastWeek(log, false);
}

/**
 * Returns true if the estimated TDEE and average TDEE are within 75 calories 
 * of each other. Within this threshold, calorie intakes are considered equal.
 * 
 * @param estimated Estimated TDEE from model
 * @param actual Actual TDEE from output of algorithm.
 */
export function estimatedAndAverageEquality(estimated: number, actual: number) {
    if (Math.abs(estimated - actual) <= energy.ESTIMATED_AVERAGE_THRESHOLD)
        return true;
    return false;
}

/**
 * Reutrns the min of a collection. If the min cannot be found then null is returned.
 * 
 * @param collection Collection to find the minimum of.
 */
export function getMin(collection: number[]): number {
    try {
        let min: number = energy.INSUFFICIENT_DATA;
        collection.forEach((element: number) => {
            if (min == energy.INSUFFICIENT_DATA || element < min)
                min = element;
        });
        return min;
    } catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Reutrns the max of a collection. If the max cannot be found then null is returned.
 * 
 * @param collection Collection to find the maximum of.
 */
export function getMax(collection: number[]): number {
    try {
        let max: number = energy.INSUFFICIENT_DATA;
        collection.forEach((element: number) => {
            if (max == energy.INSUFFICIENT_DATA || element > max)
                max = element;
        });
        return max;
    } catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Returns the max of a collection. If the max cannot be found then null is returned.
 * 
 * @param collection Collection to find the average of.
 */
export function getAvg(collection: number[]): number {
    try {
        const colLength: number = collection.length;
        let avg: number = energy.INSUFFICIENT_DATA
        collection.forEach((element: number) => {
            if (avg == energy.INSUFFICIENT_DATA) {
                avg = 0;
            }
            avg += element;
        });
        if (avg != energy.INSUFFICIENT_DATA) {
            avg = avg / colLength;
        }
        return avg;
    } catch (error) {
        return energy.INSUFFICIENT_DATA;
    }
}

/**
 * Returns the start date of the nutrition log being observed. this function 
 * follows the logic described in the LogSmarter algorithm documentation to 
 * calculate start date.
 * 
 * @param logBeingObserved log to find the stat date for.
 */
export function getStartDate(logBeingObserved: NutritionLog): Date {
    let startDate: number = getMin(getFilteredLog(logBeingObserved, DATE))
    if (startDate == energy.INSUFFICIENT_DATA) {
        return new Date();
    }
    else {
        return new Date(startDate);
    }
}

/**
 * Returns the latest entry date of the nutrition log being observed. this function 
 * follows the logic described in the LogSmarter algorithm documentation to 
 * calculate latest date.
 * 
 * @param logBeingObserved log to find the latest date for.
 */
export function getLatestDate(logBeingObserved: NutritionLog): Date {
    let currentDate = getMax(getFilteredLog(logBeingObserved, DATE))
    if (currentDate == null) {
        return new Date();
    }
    else {
        return new Date(currentDate);
    }
}

/**
 * Returns the maximum number of kcals for an entry of the nutrition log being observed.
 * 
 * @param logBeingObserved log to find the max number of kcals for.
 */
export function getMaxKcal(logBeingObserved: NutritionLog): number {
    const max = getMax(getFilteredLog(logBeingObserved, KCAL));
    if (!max) {
        return max;
    } else {
        return Math.round(max);
    }
}

/**
 * Returns the muinimum number of kcals for an entry of the nutrition log being observed.
 * 
 * @param logBeingObserved log to find the max number of kcals for.
 */
export function getMinKcal(logBeingObserved: NutritionLog): number {
    const min = getMin(getFilteredLog(logBeingObserved, KCAL));
    if (!min) {
        return min;
    } else {
        return Math.round(min);
    }
}

/**
 * Returns the average number of kcals for an entry of the nutrition log being observed.
 * 
 * @param logBeingObserved log to find the max number of kcals for.
 */
export function getAvgKcal(logBeingObserved: NutritionLog): number {
    const avg = getAvg(getFilteredLog(logBeingObserved, KCAL))
    if (!avg) {
        return avg;
    } else {
        return Math.round(avg);
    }
}

/**
 * Returns the min weight for an entry of the nutrition log being observed.
 * 
 * @param logBeingObserved log to find min weight for.
 */
export function getMinWeight(logBeingObserved: NutritionLog): number {
    const min = getMin(getFilteredLog(logBeingObserved, WEIGHT));
    if (!min) {
        return min;
    } else {
        return converter.roundNumberToOneDecimalPlace(min);
    }
}

/**
 * Returns the max weight for an entry of the nutrition log being observed.
 * 
 * @param logBeingObserved log to find max weight for.
 */
export function getMaxWeight(logBeingObserved: NutritionLog): number {
    const max = getMax(getFilteredLog(logBeingObserved, WEIGHT))
    if (!max) {
        return max;
    } else {
        return converter.roundNumberToOneDecimalPlace(max);
    }
}

/**
 * Returns the average weight for an entry of the nutrition log being observed.
 * 
 * @param logBeingObserved log to find min weight for.
 */
export function getAvgWeight(logBeingObserved: NutritionLog): number {
    const avg = getAvg(getFilteredLog(logBeingObserved, WEIGHT))
    if (!avg) {
        return avg;
    } else {
        return converter.roundNumberToOneDecimalPlace(avg);
    }
}

/**
 * This function will essentially map a list of entries into a list of the values 
 * of an entries property. For example, if the logVariableIdentifier is DATE, then 
 * all entries in the logBeingObserved day entry list are mapped to a list of
 * numbers of the timestamps of the entries date. Any entries that do not have a value 
 * for the property that is being passed in to filter will be excluded from the return list. 
 * This is not a concern for date, because all entries are forced to have a date.
 * 
 * @param logBeingObserved The log to map the list of entries for.
 * @param logVariableIdentifier The property to filter the log by.
 */
function getFilteredLog(logBeingObserved: NutritionLog, logVariableIdentifier: any): number[] {
    let filteredLog: number[] = [];
    if (logVariableIdentifier == WEIGHT) {
        filteredLog = logBeingObserved.dayEntries.filter((entry: DayEntry) => entry.weight != null).map((entry: DayEntry) => entry.weight);
    }
    else if (logVariableIdentifier == KCAL) {
        filteredLog = logBeingObserved.dayEntries.filter((entry: DayEntry) => entry.calories != null).map((entry: DayEntry) => entry.calories);
    }
    else if (logVariableIdentifier == DATE) {
        filteredLog = logBeingObserved.dayEntries.map((entry: DayEntry) => entry.date.getTime());
    }
    return filteredLog;
}