import * as algorithm from '../src/services/algorithm/energyAlgorithm';
import * as TestHelpers from './TestHelpers';
import * as Energy from '../src/constants/energyConstants';
import * as statCalc from '../src/services/algorithm/logStatCalculator';
import * as converter from '../src/services/converter';
import { assert } from 'console';
import { NutritionLog } from '../src/classes/nutrition-log';
import { EnergyPayload } from '../src/classes/energy-payload';

describe('FirebaseFunctions/Services/EnergyPayloadStats', () => {

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it("should not calculate a start date for a log with no entries  ", async () => {
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const user = TestHelpers.getRandomUserProfile();
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.startDate == Energy.INSUFFICIENT_DATA);
    });

    it("should not calculate a latest date for a log with no entries  ", async () => {
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const user = TestHelpers.getRandomUserProfile();
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.latestDate == Energy.INSUFFICIENT_DATA);
    });

    it("should not calculate a start weight for a log with no entries  ", async () => {
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const user = TestHelpers.getRandomUserProfile();
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.startWeight == Energy.INSUFFICIENT_DATA);
    });

    it("should not calculate a current weight for a log with no entries  ", async () => {
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const user = TestHelpers.getRandomUserProfile();
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.currentWeight == Energy.INSUFFICIENT_DATA);
    });

    it("should not calculate min, max or average calories for a log with no entries  ", async () => {
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const user = TestHelpers.getRandomUserProfile();
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.avgCalories == Energy.INSUFFICIENT_DATA);
        assert(payload.minCalories == Energy.INSUFFICIENT_DATA);
        assert(payload.maxCalories == Energy.INSUFFICIENT_DATA);
    });

    it("should not calculate min, max or average weight for a log with no entries  ", async () => {
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const user = TestHelpers.getRandomUserProfile();
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.avgWeight == Energy.INSUFFICIENT_DATA);
        assert(payload.minWeight == Energy.INSUFFICIENT_DATA);
        assert(payload.maxWeight == Energy.INSUFFICIENT_DATA);
    });

    it("should calculate the start weight as the average of the first 1-7 complete entries", async () => {
        const randomLog = TestHelpers.getRandomNutritionLog();
        const randomUser = TestHelpers.getRandomUserProfile();
        const expectedStartWeight = statCalc.getStartWeightForLog(randomLog);
        const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
        assert(payload.startWeight == expectedStartWeight);
    });

    it("should calculate the current weight as the average of the last 1-7 complete entries", async () => {
        const randomLog = TestHelpers.getRandomNutritionLog();
        const randomUser = TestHelpers.getRandomUserProfile();
        const expectedCurrentWeight = statCalc.getCurrentWeightForLog(randomLog);
        const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
        assert(payload.currentWeight == expectedCurrentWeight);
    });

    it("should still calculate the start weight as the average of the last 1-7 complete entries if there are some incomplete entries", async () => {
        const randomLog = TestHelpers.getRandomNutritionLog();
        const randomUser = TestHelpers.getRandomUserProfile();
        randomLog.dayEntries.forEach(entry => {
            if (randomLog.dayEntries.indexOf(entry) % 2 == 0) {
                entry.weight = Energy.INSUFFICIENT_DATA;
            }
        });
        const expectedStartWeight = statCalc.getStartWeightForLog(randomLog);
        const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
        assert(payload.startWeight == expectedStartWeight);
    });

    it("should still calculate the current weight as the average of the last 1-7 complete entries if there are some incomplete entries", async () => {
        const randomLog = TestHelpers.getRandomNutritionLog();
        const randomUser = TestHelpers.getRandomUserProfile();
        randomLog.dayEntries.forEach(entry => {
            if (randomLog.dayEntries.indexOf(entry) % 2 == 0) {
                entry.weight = Energy.INSUFFICIENT_DATA;
            }
        });
        const expectedCurrentWeight = statCalc.getCurrentWeightForLog(randomLog);
        const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
        assert(payload.currentWeight == expectedCurrentWeight);
    });

    it("should not calculate the start weight if there are no weight records for a non empty log", async () => {
        const randomLog = TestHelpers.getRandomNutritionLog();
        const randomUser = TestHelpers.getRandomUserProfile();
        randomLog.dayEntries.forEach(entry => {
            entry.weight = Energy.INSUFFICIENT_DATA;
        });
        const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
        assert(payload.startWeight == Energy.INSUFFICIENT_DATA);
    });

    it("should not calculate the current weight if there are no weight records for a non empty log", async () => {
        const randomLog = TestHelpers.getRandomNutritionLog();
        const randomUser = TestHelpers.getRandomUserProfile();
        randomLog.dayEntries.forEach(entry => {
            entry.weight = Energy.INSUFFICIENT_DATA;
        });
        const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
        assert(payload.currentWeight == Energy.INSUFFICIENT_DATA);
    });

    it("should calculate the min, max and average weight correctly for a log that meets MDET", async () => {
        for (let i = 0; i < 5; i++) {
            const randomLog = TestHelpers.getRandomNutritionLog();
            const randomUser = TestHelpers.getRandomUserProfile();
            const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
            assert(payload.minWeight == statCalc.getMinWeight(randomLog));
            assert(payload.avgWeight == statCalc.getAvgWeight(randomLog));
            assert(payload.maxWeight == statCalc.getMaxWeight(randomLog));
        }
    });

    it("should calculate the min, max and average calorie intake correctly for a log that meets MDET", async () => {
        for (let i = 0; i < 5; i++) {
            const randomLog = TestHelpers.getRandomNutritionLog();
            const randomUser = TestHelpers.getRandomUserProfile();
            const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
            assert(payload.minCalories == statCalc.getMinKcal(randomLog));
            assert(payload.avgCalories == statCalc.getAvgKcal(randomLog));
            assert(payload.maxCalories == statCalc.getMaxKcal(randomLog));
        }
    });

    it("should round min, max and average calorie intake to 0 decimal places for a log that meets MDET", async () => {
        for (let i = 0; i < 5; i++) {
            const randomLog = TestHelpers.getRandomNutritionLog();
            const randomUser = TestHelpers.getRandomUserProfile();
            const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
            assert(payload.minCalories == Math.round(payload.minCalories))
            assert(payload.avgCalories == Math.round(payload.avgCalories))
            assert(payload.maxCalories == Math.round(payload.maxCalories))
        }
    });

    it("should round min, max and average weight to 1 decimal places for a log that meets MDET", async () => {
        for (let i = 0; i < 5; i++) {
            const randomLog = TestHelpers.getRandomNutritionLog();
            const randomUser = TestHelpers.getRandomUserProfile();
            const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
            assert(payload.minWeight == converter.roundNumberToOneDecimalPlace(payload.minWeight))
            assert(payload.avgWeight == converter.roundNumberToOneDecimalPlace(payload.avgWeight))
            assert(payload.maxWeight == converter.roundNumberToOneDecimalPlace(payload.maxWeight))
        }
    });

    it("should round min, max and average weight to 1 decimal places for a log that meets MDET", async () => {
        for (let i = 0; i < 5; i++) {
            const randomLog = TestHelpers.getRandomNutritionLog();
            const randomUser = TestHelpers.getRandomUserProfile();
            const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
            assert(payload.minWeight == converter.roundNumberToOneDecimalPlace(payload.minWeight))
            assert(payload.avgWeight == converter.roundNumberToOneDecimalPlace(payload.avgWeight))
            assert(payload.maxWeight == converter.roundNumberToOneDecimalPlace(payload.maxWeight))
        }
    });

    it("should round min, max and average weight to 1 decimal places for a log that meets MDET", async () => {
        for (let i = 0; i < 5; i++) {
            const randomLog = TestHelpers.getRandomNutritionLog();
            const randomUser = TestHelpers.getRandomUserProfile();
            const payload = await algorithm.getEnergyPayload(randomLog, randomUser);
            assert(payload.minWeight == converter.roundNumberToOneDecimalPlace(payload.minWeight))
            assert(payload.avgWeight == converter.roundNumberToOneDecimalPlace(payload.avgWeight))
            assert(payload.maxWeight == converter.roundNumberToOneDecimalPlace(payload.maxWeight))
        }
    });


    it("should calculate the average weekly change in body weight correctly in the gain loss rate string (losing 1lb per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 1;
        let thisWeeksWeight = 197;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight -= weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRate = 0.9;
        assert(expectedRate == getAverageWeeklyWeightChange(payload));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string (losing 4lb per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 4;
        let thisWeeksWeight = 197;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight -= weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRate = 3.5;
        assert(expectedRate == getAverageWeeklyWeightChange(payload));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string  (gaining 2lbs per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 2;
        let thisWeeksWeight = 153;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight += weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRate = 1.7;
        assert(expectedRate == getAverageWeeklyWeightChange(payload));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string  (gaining 0.6lbs per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = .6;
        let thisWeeksWeight = 240;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight += weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRate = 0.5;
        assert(expectedRate == getAverageWeeklyWeightChange(payload));
    });

    it("should use lbs as units and not kg in the gain loss string if the number system is imperial", async () => {
        const user = TestHelpers.getRandomUserProfile();
        let log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(100);
        assert(user.userPreferences.general.isImperial == true);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.gainLossRate.includes("lb"));
        assert(!(payload.gainLossRate.includes("kg")))
    });

    it("should use kg as units and not lbs in the gain loss string if the number system is metric", async () => {
        const user = TestHelpers.getRandomUserProfile();
        let log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(100);
        user.userPreferences.general.isImperial = false;
        assert(user.userPreferences.general.isImperial == false);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(!(payload.gainLossRate.includes("lb")));
        assert(payload.gainLossRate.includes("kg"));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string when number system is metric (losing 1lb per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 1;
        user.userPreferences.general.isImperial = false;
        assert(user.userPreferences.general.isImperial == false);
        let thisWeeksWeight = 197;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight -= weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRateInKg = 0.4;
        assert(expectedRateInKg == getAverageWeeklyWeightChange(payload));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string when number system is metric (losing 4lb per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 4;
        user.userPreferences.general.isImperial = false;
        assert(user.userPreferences.general.isImperial == false);
        let thisWeeksWeight = 197;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight -= weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRateInKg = 1.6;
        assert(expectedRateInKg == getAverageWeeklyWeightChange(payload));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string when number system is metric  (gaining 2lbs per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 2;
        user.userPreferences.general.isImperial = false;
        assert(user.userPreferences.general.isImperial == false);
        let thisWeeksWeight = 153;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight += weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRateInKg = 0.8;
        assert(expectedRateInKg == getAverageWeeklyWeightChange(payload));
    });

    it("should calculate the average weekly change in body weight correctly in the gain loss rate string  (gaining 0.25lbs per week after first week)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const weeklyChangeInBodyWeightAfterFirstWeek = 0.6;
        user.userPreferences.general.isImperial = false;
        assert(user.userPreferences.general.isImperial == false);
        let thisWeeksWeight = 253;
        let currentDate = new Date();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(49);
        log.dayEntries.forEach(entry => {
            const idxIfStartingAt1 = log.dayEntries.indexOf(entry) + 1;
            entry.weight = thisWeeksWeight;
            entry.date = currentDate;
            entry.id = currentDate.getTime();
            if (idxIfStartingAt1 % 7 == 0) {
                thisWeeksWeight += weeklyChangeInBodyWeightAfterFirstWeek;
            }
            currentDate = new Date(currentDate.getTime() + TestHelpers.getDayInMillis());
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        const expectedRateInKg = 0.2;
        assert(expectedRateInKg == getAverageWeeklyWeightChange(payload));
    });

    it("should indicate that the user is gaining weight in the gainLossRate string if they are gaining", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        let forceGaining = 167
        log.dayEntries.forEach(entry => {
            entry.weight = forceGaining;
            forceGaining++;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.gainLossRate.includes("+"));
        assert(!payload.gainLossRate.includes("-"));
        assert(!payload.gainLossRate.includes("Maintained"));
    });

    it("should indicate that the user is losing weight in the gainLossRate string if they are losing", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        let forceLosing = 167
        log.dayEntries.forEach(entry => {
            entry.weight = forceLosing;
            forceLosing--;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(!payload.gainLossRate.includes("+"));
        assert(payload.gainLossRate.includes("-"));
        assert(!payload.gainLossRate.includes("Maintained"));
    });

    it("should indicate that the user is losing weight in the gainLossRate string if they are maintaining", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        let forceMaintain = 167
        log.dayEntries.forEach(entry => {
            entry.weight = forceMaintain;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(!payload.gainLossRate.includes("+"));
        assert(!payload.gainLossRate.includes("-"));
        assert(payload.gainLossRate.includes("Maintained"));
    });

    it("should NOT convert min,max and average weight to kg correctly when number system is metric (all set to 150 )", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.general.isImperial = false;
        const log = TestHelpers.getRandomNutritionLog();
        const forceSameMinMaxAndAverageWeight = 150
        log.dayEntries.forEach(entry => entry.weight = forceSameMinMaxAndAverageWeight);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.minWeight == forceSameMinMaxAndAverageWeight);
        assert(payload.avgWeight == forceSameMinMaxAndAverageWeight);
        assert(payload.maxWeight == forceSameMinMaxAndAverageWeight);
    });

    it("should alawys return the timestamp of the earliest entry as the start date ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        let someDate = TestHelpers.getRandomDate();
        const initialStamp = someDate.getTime();
        log.dayEntries.forEach(entry => {
            entry.date = new Date(someDate.getTime());
            entry.id = entry.date.getTime();
            someDate = new Date(someDate.getTime() + TestHelpers.getDayInMillis());
        });
        TestHelpers.shuffleArray(log.dayEntries);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startDate == initialStamp);
    });

    it("should alawys return the timestamp of the newest entry as the latest date ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        let someDate = TestHelpers.getRandomDate();
        const initialStamp = someDate.getTime();
        log.dayEntries.forEach(entry => {
            entry.date = new Date(someDate.getTime());
            entry.id = entry.date.getTime();
            someDate = new Date(someDate.getTime() - TestHelpers.getDayInMillis());
        });
        TestHelpers.shuffleArray(log.dayEntries);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.latestDate == initialStamp);
    });

    it("should NOT convert the start weight to kg when the number system is metric ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.general.isImperial = false;
        const log = TestHelpers.getRandomNutritionLog();
        let weight = 233.3;
        log.dayEntries.forEach(entry => { entry.weight = weight; });
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startWeight == weight);
    });

    it("should NOT convert the current weight to kg when the number system is metric ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.general.isImperial = false;
        const log = TestHelpers.getRandomNutritionLog();
        let weight = 400;
        log.dayEntries.forEach(entry => { entry.weight = weight; });
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startWeight == weight);
    });

});

/**
 * Returns the average change in body weight per week over the course of the log 
 * from the gainLossRate string stored in an energy payload.
 * 
 * @param gianLoss Weight rate display string from a EnergyPayload 
 */
export function getAverageWeeklyWeightChange(payload: EnergyPayload) {
    if (!payload || !payload.gainLossRate) {
        return Energy.INSUFFICIENT_DATA;
    }
    const tokenizedRate = payload.gainLossRate.split(" ");
    const changePerWeek = tokenizedRate[tokenizedRate.length - 3];
    return parseFloat(changePerWeek);
}
