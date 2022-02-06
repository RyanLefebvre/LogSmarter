import * as algorithm from '../src/services/algorithm/energyAlgorithm';
import * as TestHelpers from './TestHelpers';
import * as energy from '../src/constants/energyConstants';
import * as logCalc from '../src/services/algorithm/logStatCalculator';
import * as logGoalCal from '../src/services/algorithm/logGoalCalculator';
import { NutritionLog } from '../src/classes/nutrition-log';
import { assert } from 'console';
import { DayEntry } from '../src/classes/day-entry';
import { UserProfile } from '../src/classes/user-profile';

describe('FirebaseFunctions/Services/EnergyIntakeAlgorithm', () => {

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it(" should use (μDCI -.25(BE-μDCI)) as ABE when BE > μDCI and the algorithm calculates a ΔBW < -1 for logs that meet MDET.  (ABE CASE 1)  ", async () => {
        const case1Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case1Log.dayEntries = case1Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            weight += 0.5
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case1Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case1Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase1ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase1ABE);
        const payload = await algorithm.getEnergyPayload(case1Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case1Log, deltaBodyWeight);
        const meanDailySurplus = (avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7;
        const expectedABE = avgKcalIntake - (.25 * (baselineEstimate - avgKcalIntake));
        const expectedFinalTDEE = Math.round(expectedABE - meanDailySurplus);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use Avg( BE, μDCI )  as ABE when BE > μDCI and the algorithm calculates a ΔBW > 1 for logs that meet MDET.  (ABE CASE 2)  ", async () => {
        const case2Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case2Log.dayEntries = case2Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            weight -= 0.5
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case2Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case2Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase1ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase1ABE);
        const payload = await algorithm.getEnergyPayload(case2Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case2Log, deltaBodyWeight);
        const meanDailyDeficit = (avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7;
        const expectedABE = Math.round((baselineEstimate + avgKcalIntake) / 2);
        const expectedFinalTDEE = Math.round(expectedABE + meanDailyDeficit);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should μDCI as ABE when BE > μDCI and the algorithm calculates a ΔBW ∈ [-1, 1] for logs that meet MDET.  (ABE CASE 3)  ", async () => {
        const case2Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case2Log.dayEntries = case2Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case2Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case2Log);
        const deltaBodyWeightIsMaintenance = deltaBodyWeight <= energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase3ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightIsMaintenance;
        assert(meetsAllConditionsForCase3ABE);
        const payload = await algorithm.getEnergyPayload(case2Log, user);
        const expectedABE = avgKcalIntake;
        const expectedFinalTDEE = Math.round(expectedABE);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use Avg( BE, μDCI )  as ABE when BE < μDCI and the algorithm calculates a ΔBW > 1 for logs that meet MDET.  (ABE CASE 4)  ", async () => {
        const case4Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 2500;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case4Log.dayEntries = case4Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(3000, 3600);
            entry.weight = weight;
            weight += 0.5
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case4Log);
        const averageIsGreaterThanBaseline = avgKcalIntake > baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsGreaterThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case4Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase4ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase4ABE);
        const payload = await algorithm.getEnergyPayload(case4Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case4Log, deltaBodyWeight);
        const meanDailySurplus = ((avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7);
        const expectedABE = Math.round((baselineEstimate + avgKcalIntake) / 2);
        const expectedFinalTDEE = Math.round(expectedABE - meanDailySurplus);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use (μDCI +.25(μDCI-BE)) as ABE when BE < μDCI and the algorithm calculates a ΔBW > 1 for logs that meet MDET.  (ABE CASE 5)  ", async () => {
        const case5Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 2500;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case5Log.dayEntries = case5Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(3000, 3600);
            entry.weight = weight;
            weight -= 0.5
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case5Log);
        const averageIsGreaterThanBaseline = avgKcalIntake > baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsGreaterThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case5Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase5ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase5ABE);
        const payload = await algorithm.getEnergyPayload(case5Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case5Log, deltaBodyWeight);
        const meanDailyDeficit = ((avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7);
        const expectedABE = avgKcalIntake + (.25 * (avgKcalIntake - baselineEstimate));
        const expectedFinalTDEE = Math.round(expectedABE + meanDailyDeficit);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use μDCI as ABE when BE < μDCI and the algorithm calculates a  a ΔBW ∈ [-1, 1] for logs that meet MDET.  (ABE CASE 6)  ", async () => {
        const case6Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 2500;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case6Log.dayEntries = case6Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(3000, 3600);
            entry.weight = weight;
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case6Log);
        const averageIsGreaterThanBaseline = avgKcalIntake > baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsGreaterThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case6Log);
        const deltaBodyWeightIsMaintenance = deltaBodyWeight <= energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase6ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightIsMaintenance;
        assert(meetsAllConditionsForCase6ABE);
        const payload = await algorithm.getEnergyPayload(case6Log, user);
        const expectedABE = avgKcalIntake;
        const expectedFinalTDEE = Math.round(expectedABE);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use Min( BE, μDCI ) as ABE when BE ≈ μDCI and the algorithm calculates a ΔBW < -1 for logs that meet MDET.  (ABE CASE 7)  ", async () => {
        const case7Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 3025;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case7Log.dayEntries = case7Log.dayEntries.map(entry => {
            entry.calories = 3000;
            entry.weight = weight;
            weight += 0.7
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case7Log);
        const avgAndBaselineAreConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) < energy.ESTIMATED_AVERAGE_THRESHOLD;
        const deltaBodyWeight = getDeltaBodyWeight(case7Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase7ABE = avgAndBaselineAreConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase7ABE);
        const payload = await algorithm.getEnergyPayload(case7Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case7Log, deltaBodyWeight);
        const meanDailySurplus = ((avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7);
        const expectedABE = Math.min(baselineEstimate, avgKcalIntake);
        const expectedFinalTDEE = Math.round(expectedABE - meanDailySurplus);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use Max( BE, μDCI ) as ABE when BE ≈ μDCI and the algorithm calculates a ΔBW > 1 for logs that meet MDET.  (ABE CASE 8)  ", async () => {
        const case8Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 3025;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case8Log.dayEntries = case8Log.dayEntries.map(entry => {
            entry.calories = 3000;
            entry.weight = weight;
            weight -= 0.7
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case8Log);
        const avgAndBaselineAreConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) < energy.ESTIMATED_AVERAGE_THRESHOLD;
        const deltaBodyWeight = getDeltaBodyWeight(case8Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase8ABE = avgAndBaselineAreConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase8ABE);
        const payload = await algorithm.getEnergyPayload(case8Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case8Log, deltaBodyWeight);
        const meanDailyDeficit = ((avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7);
        const expectedABE = Math.max(baselineEstimate, avgKcalIntake);
        const expectedFinalTDEE = Math.round(expectedABE + meanDailyDeficit);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it(" should use Avg( BE, μDCI ) as ABE when BE ≈ μDCI and the algorithm calculates a ΔBW ∈ [-1, 1] for logs that meet MDET.  (ABE CASE 8)  ", async () => {
        const case9Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 3025;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case9Log.dayEntries = case9Log.dayEntries.map(entry => {
            entry.calories = 3000;
            entry.weight = weight;
            return entry;
        });
        const avgKcalIntake = logCalc.getAvgKcal(case9Log);
        const avgAndBaselineAreConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) < energy.ESTIMATED_AVERAGE_THRESHOLD;
        const deltaBodyWeight = getDeltaBodyWeight(case9Log);
        const deltaBodyWeightIsMaintenance = deltaBodyWeight <= energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase8ABE = avgAndBaselineAreConsideredEqual && deltaBodyWeightIsMaintenance;
        assert(meetsAllConditionsForCase8ABE);
        const payload = await algorithm.getEnergyPayload(case9Log, user);
        const expectedABE = Math.round(((baselineEstimate + avgKcalIntake) / 2));
        const expectedFinalTDEE = Math.round(expectedABE);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should calculate the conservative bulking range correctly if the user's bulking preference is conservative", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.surplus = energy.SURPLUS_CONSERVATIVE;
        const conservativeBulkLog = TestHelpers.getRandomNutritionLog();
        conservativeBulkLog.goal = energy.GOAL_MUSCLE_GAIN;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        conservativeBulkLog.dayEntries = conservativeBulkLog.dayEntries.map(entry => {
            weight += 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(conservativeBulkLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.CONSERVATIVE_SURPLUS_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, conservativeBulkLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the moderate bulking range correctly if the user's bulking preference is moderate", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.surplus = energy.SURPLUS_MODERATE;
        const moderateBulkLog = TestHelpers.getRandomNutritionLog();
        moderateBulkLog.goal = energy.GOAL_MUSCLE_GAIN;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        moderateBulkLog.dayEntries = moderateBulkLog.dayEntries.map(entry => {
            weight += 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(moderateBulkLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.MODERATE_SURPLUS_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, moderateBulkLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the aggressive bulking range correctly if the user's bulking preference is aggressive", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.surplus = energy.SURPLUS_AGGRESSIVE;
        const aggressiveBulkLog = TestHelpers.getRandomNutritionLog();
        aggressiveBulkLog.goal = energy.GOAL_MUSCLE_GAIN;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        aggressiveBulkLog.dayEntries = aggressiveBulkLog.dayEntries.map(entry => {
            weight += 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(aggressiveBulkLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.AGGRESSIVE_SURPLUS_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, aggressiveBulkLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the conservative deficit range correctly if the user's cutting preference is conservative", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.deficit = energy.DEFICIT_CONSERVATIVE;
        const conservativeCutLog = TestHelpers.getRandomNutritionLog();
        conservativeCutLog.goal = energy.GOAL_FAT_LOSS;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        conservativeCutLog.dayEntries = conservativeCutLog.dayEntries.map(entry => {
            weight -= 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(conservativeCutLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.CONSERVATIVE_DEFICIT_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, conservativeCutLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the moderate deficit range correctly if the user's cutting preference is moderate", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.deficit = energy.DEFICIT_MODERATE;
        const moderateCutLog = TestHelpers.getRandomNutritionLog();
        moderateCutLog.goal = energy.GOAL_FAT_LOSS;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        moderateCutLog.dayEntries = moderateCutLog.dayEntries.map(entry => {
            weight -= 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(moderateCutLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.MODERATE_DEFICIT_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, moderateCutLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the aggressive deficit range correctly if the user's cutting preference is aggressive", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.deficit = energy.DEFICIT_AGGRESSIVE;
        const aggressiveCutLog = TestHelpers.getRandomNutritionLog();
        aggressiveCutLog.goal = energy.GOAL_FAT_LOSS;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        aggressiveCutLog.dayEntries = aggressiveCutLog.dayEntries.map(entry => {
            weight -= 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(aggressiveCutLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.AGGRESSIVE_DEFICIT_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, aggressiveCutLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the very aggressive deficit range correctly if the user's cutting preference is very aggressive", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.userPreferences.nutrition.deficit = energy.DEFICIT_VERY_AGGRESSIVE;
        const veryAggressiveCutLog = TestHelpers.getRandomNutritionLog();
        veryAggressiveCutLog.goal = energy.GOAL_FAT_LOSS;
        const forceNormalishTDEE = 4000;
        user.estimatedTDEE = forceNormalishTDEE;
        let weight = 160;
        veryAggressiveCutLog.dayEntries = veryAggressiveCutLog.dayEntries.map(entry => {
            weight -= 0.25;
            entry.weight = weight;
            return entry
        });
        const payload = await algorithm.getEnergyPayload(veryAggressiveCutLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.VERY_AGGRESSIVE_DEFICIT_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, veryAggressiveCutLog.goal, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should assume a moderate bulking preference if the log's goal is muscle gain and the user has no preferred surplus mode", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceNoBulkPref: any = null;
        user.userPreferences.nutrition.surplus = forceNoBulkPref;
        const someBulkingLog = TestHelpers.getRandomNutritionLog();
        someBulkingLog.goal = energy.GOAL_MUSCLE_GAIN;
        const payload = await algorithm.getEnergyPayload(someBulkingLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.CONSERVATIVE_SURPLUS_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, energy.GOAL_MUSCLE_GAIN, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should assume a moderate cutting preference if the log's goal is fat loss and the user has no preferred deficit mode", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceNoDefPref: any = null;
        user.userPreferences.nutrition.deficit = forceNoDefPref;
        const someCuttingLog = TestHelpers.getRandomNutritionLog();
        someCuttingLog.goal = energy.GOAL_FAT_LOSS;
        const payload = await algorithm.getEnergyPayload(someCuttingLog, user);
        assert(TestHelpers.isEquivalent(payload.goalIntakeBoundaries, energy.CONSERVATIVE_DEFICIT_RANGE));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, energy.GOAL_FAT_LOSS, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should assume a goal of maintenance if the log's goal is unknown", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceNoGoal: any = null;
        const someLog = TestHelpers.getRandomNutritionLog();
        someLog.goal = forceNoGoal;
        const payload = await algorithm.getEnergyPayload(someLog, user);
        const expectedIntakeBoundaries = [energy.ESTIMATED_AVERAGE_THRESHOLD, energy.ESTIMATED_AVERAGE_THRESHOLD];
        assert(TestHelpers.isEquivalent(expectedIntakeBoundaries, payload.goalIntakeBoundaries));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, energy.GOAL_MAINTAIN, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should calculate the maintenance range correctly if the log's goal is weight maintenance", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const maintenanceLog = TestHelpers.getRandomNutritionLog();
        maintenanceLog.goal = energy.GOAL_MAINTAIN;
        const payload = await algorithm.getEnergyPayload(maintenanceLog, user);
        const expectedIntakeBoundaries = [energy.ESTIMATED_AVERAGE_THRESHOLD, energy.ESTIMATED_AVERAGE_THRESHOLD];
        assert(TestHelpers.isEquivalent(expectedIntakeBoundaries, payload.goalIntakeBoundaries));
        const expectedGoalIntake = logGoalCal.getGoalIntake(payload.estimatedTDEE, energy.GOAL_MAINTAIN, user);
        assert(payload.goalIntakeRange == expectedGoalIntake);
    });

    it("should return the user's estimated baseline TDEE if a log has no entries but the user has a valid baseline TDEE", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const validTDEE = Math.round(TestHelpers.getRandomCalories());
        user.estimatedTDEE = validTDEE;
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.estimatedTDEE == user.estimatedTDEE);
    });

    it("should still round the user's estimated baseline TDEE to one decimal place if a log has no entries but the user has a valid baseline TDEE", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceNonWholeNumber = .25;
        const validTDEE = TestHelpers.getRandomCalories() + forceNonWholeNumber;
        user.estimatedTDEE = validTDEE;
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        assert(validTDEE != Math.round(validTDEE))
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.estimatedTDEE == Math.round(user.estimatedTDEE));
    });

    it("should return INSUFFICIENT_DATA if the user's estimated baseline TDEE is null and a log has no entries", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = energy.INSUFFICIENT_DATA;
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        assert(user.estimatedTDEE == energy.INSUFFICIENT_DATA)
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.estimatedTDEE == energy.INSUFFICIENT_DATA);
    });

    it("should not return a rate of gain or loss for an empty log", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const emptyLog = new NutritionLog();
        assert(emptyLog.dayEntries.length == 0);
        const payload = await algorithm.getEnergyPayload(emptyLog, user);
        assert(payload.gainLossRate == energy.INSUFFICIENT_DATA);
    });

    it("should still calculate a goal intake using BE as the ABE when a log is empty and the user has a valid TDEE", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceValidTDEE = TestHelpers.getRandomCalories();
        user.estimatedTDEE = forceValidTDEE;
        const someEmptyLog = new NutritionLog();
        const forceNoGoal: any = null;
        someEmptyLog.goal = forceNoGoal;
        assert(someEmptyLog.dayEntries.length == 0);
        const payload = await algorithm.getEnergyPayload(someEmptyLog, user);
        assert(payload.goalIntakeRange != energy.INSUFFICIENT_DATA);
        const expectedIntakeBoundaries = [energy.ESTIMATED_AVERAGE_THRESHOLD, energy.ESTIMATED_AVERAGE_THRESHOLD]
        assert(TestHelpers.isEquivalent(expectedIntakeBoundaries, payload.goalIntakeBoundaries));
    });

    it("should not produce a TDEE estimate if the user's baseline is null and MDET is not reached because entries do not have weights", async () => {
        for (let numEntries = 0; numEntries < 25; numEntries++) {
            const user = TestHelpers.getRandomUserProfile();
            user.estimatedTDEE = energy.INSUFFICIENT_DATA;
            const log = new NutritionLog();
            log.goal = energy.GOAL_FAT_LOSS;
            log.dayEntries = TestHelpers.getRandomEntryListOfLength(numEntries).map(entry => {
                entry.weight = energy.INSUFFICIENT_DATA; //force incomplete by having no weight 
                return entry
            });
            const payload = await algorithm.getEnergyPayload(log, user);
            assert(payload.estimatedTDEE == energy.INSUFFICIENT_DATA);
        }
    });

    it("should not produce a TDEE estimate if the user's baseline is null and MDET is not reached because entries do not have calories", async () => {
        for (let numEntries = 0; numEntries < 25; numEntries++) {
            const user = TestHelpers.getRandomUserProfile();
            user.estimatedTDEE = energy.INSUFFICIENT_DATA;
            const log = new NutritionLog();
            log.goal = energy.GOAL_FAT_LOSS;
            log.dayEntries = TestHelpers.getRandomEntryListOfLength(numEntries).map(entry => {
                entry.calories = energy.INSUFFICIENT_DATA; //force incomplete by having no weight 
                return entry
            });
            const payload = await algorithm.getEnergyPayload(log, user);
            assert(payload.estimatedTDEE == energy.INSUFFICIENT_DATA);
        }
    });

    it("should not estimate TDEE or goal intake below MDET  if there is no BE, but will use the user's average calorie intake as the ABE when MDET is reached or exceed ", async () => {
        for (let numEntries = 0; numEntries < 25; numEntries++) {
            const user = TestHelpers.getRandomUserProfile();
            user.estimatedTDEE = energy.INSUFFICIENT_DATA;
            const log = new NutritionLog();
            log.goal = energy.GOAL_FAT_LOSS;
            log.dayEntries = TestHelpers.getRandomEntryListOfLength(numEntries);
            const payload = await algorithm.getEnergyPayload(log, user);
            if (numEntries < energy.MINIMUM_DAY_ENTRY_THRESHOLD) {
                assert(payload.estimatedTDEE == energy.INSUFFICIENT_DATA);
                assert(payload.goalIntakeRange == energy.INSUFFICIENT_DATA);
            }
            else {
                assert(payload.estimatedTDEE != energy.INSUFFICIENT_DATA);
                assert(payload.estimatedTDEE == logCalc.getAvgKcal(log));
                assert(payload.goalIntakeRange != null);
            }
        }
    });

    it("should never perform a baseline adjustment and just use BE as ABE if MDET is never exceeded but the user has a valid BE", async () => {
        for (let numEntries = 0; numEntries < 25; numEntries++) {
            const user = TestHelpers.getRandomUserProfile();
            user.estimatedTDEE = Math.round(TestHelpers.getRandomCalories());
            const log = new NutritionLog();
            log.goal = energy.GOAL_FAT_LOSS;
            log.dayEntries = TestHelpers.getRandomEntryListOfLength(numEntries).map(entry => {
                const forceIncompleteEntry = energy.INSUFFICIENT_DATA;
                entry.weight = forceIncompleteEntry;
                return entry;
            });
            const payload = await algorithm.getEnergyPayload(log, user);
            assert(payload.estimatedTDEE == user.estimatedTDEE);
        }
    });

    it("should NOT calculate a goal intake or TDEE for a baseline TDEE that is less than the lower boundary of 750 kcal", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 749;
        const logThatWillUseBaselineAsABE = new NutritionLog();
        const payload = await algorithm.getEnergyPayload(logThatWillUseBaselineAsABE, user);
        assert(payload.estimatedTDEE == energy.INSUFFICIENT_DATA);
        assert(payload.goalIntakeRange == energy.INSUFFICIENT_DATA);
    });


    it("should NOT calculate a goal intake or TDEE for a baseline TDEE that is greater than the upper boundary of 7500 kcal", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 7501;
        const logThatWillUseBaselineAsABE = new NutritionLog();
        const payload = await algorithm.getEnergyPayload(logThatWillUseBaselineAsABE, user);
        assert(payload.estimatedTDEE == energy.INSUFFICIENT_DATA);
        assert(payload.goalIntakeRange == energy.INSUFFICIENT_DATA);
    });

    it("should calculate a goal intake and TDEE for a baseline TDEE that is equal to the lower boundary of 750 kcal", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 750;
        const logThatWillUseBaselineAsABE = new NutritionLog();
        const payload = await algorithm.getEnergyPayload(logThatWillUseBaselineAsABE, user);
        assert(payload.estimatedTDEE != energy.INSUFFICIENT_DATA);
        assert(payload.goalIntakeRange != energy.INSUFFICIENT_DATA);
    });

    it("should calculate a goal intake and TDEE for a baseline TDEE that is equal to the upper boundary of 7500 kcal", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 7500;
        const logThatWillUseBaselineAsABE = new NutritionLog();
        const payload = await algorithm.getEnergyPayload(logThatWillUseBaselineAsABE, user);
        assert(payload.estimatedTDEE != energy.INSUFFICIENT_DATA);
        assert(payload.goalIntakeRange != energy.INSUFFICIENT_DATA);
    });

    it("should use the startTDEE of the log instead of the user's estimated baseline if the log has a start TDEE property ( verified by ABE case 1) ", async () => {
        const case1Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        const forceDifferentValueForTheUser = baselineEstimate - 2500;
        user.estimatedTDEE = forceDifferentValueForTheUser;
        let weight = 190;
        case1Log.dayEntries = case1Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            weight += 0.5
            return entry;
        });
        case1Log.startTDEE = baselineEstimate;
        const avgKcalIntake = logCalc.getAvgKcal(case1Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case1Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase1ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase1ABE);
        const payload = await algorithm.getEnergyPayload(case1Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case1Log, deltaBodyWeight);
        const meanDailySurplus = (avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7;
        const expectedABE = avgKcalIntake - (.25 * (baselineEstimate - avgKcalIntake));
        const expectedFinalTDEE = Math.round(expectedABE - meanDailySurplus);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should use the startTDEE of the log instead of the user's estimated baseline if the log has a start TDEE property ( verified ABE case 2) ", async () => {
        const case2Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        const forceDifferentValueForTheUser = baselineEstimate - 2500;
        user.estimatedTDEE = forceDifferentValueForTheUser;
        let weight = 190;
        case2Log.dayEntries = case2Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            weight -= 0.5
            return entry;
        });
        case2Log.startTDEE = baselineEstimate;
        const avgKcalIntake = logCalc.getAvgKcal(case2Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case2Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase1ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase1ABE);
        const payload = await algorithm.getEnergyPayload(case2Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case2Log, deltaBodyWeight);
        const meanDailyDeficit = (avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7;
        const expectedABE = Math.round((baselineEstimate + avgKcalIntake) / 2);
        const expectedFinalTDEE = Math.round(expectedABE + meanDailyDeficit);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should use the startTDEE of the log instead of the user's estimated baseline if the log has a start TDEE property ( verified by ABE case 3) ", async () => {
        const case3Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        const forceDifferentValueForTheUser = baselineEstimate - 2500;
        user.estimatedTDEE = forceDifferentValueForTheUser;
        let weight = 190;
        case3Log.dayEntries = case3Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            return entry;
        });
        case3Log.startTDEE = baselineEstimate
        const avgKcalIntake = logCalc.getAvgKcal(case3Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case3Log);
        const deltaBodyWeightIsMaintenance = deltaBodyWeight <= energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase3ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightIsMaintenance;
        assert(meetsAllConditionsForCase3ABE);
        const payload = await algorithm.getEnergyPayload(case3Log, user);
        const expectedABE = avgKcalIntake;
        const expectedFinalTDEE = Math.round(expectedABE);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should still calculate log stats correctly if the entries are not passed in in chronological order (verified by ABE case 1)", async () => {
        const case1Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        const forceDifferentValueForTheUser = baselineEstimate - 2500;
        user.estimatedTDEE = forceDifferentValueForTheUser;
        let weight = 190;
        case1Log.dayEntries = case1Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            weight += 0.5
            return entry;
        });
        TestHelpers.shuffleArray(case1Log.dayEntries)
        case1Log.startTDEE = baselineEstimate;
        const avgKcalIntake = logCalc.getAvgKcal(case1Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case1Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase1ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase1ABE);
        const payload = await algorithm.getEnergyPayload(case1Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case1Log, deltaBodyWeight);
        const meanDailySurplus = (avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7;
        const expectedABE = avgKcalIntake - (.25 * (baselineEstimate - avgKcalIntake));
        const expectedFinalTDEE = Math.round(expectedABE - meanDailySurplus);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should still calculate log stats correctly if the entries are not passed in in chronological order (verified by ABE case 2)", async () => {
        const case2Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        const forceDifferentValueForTheUser = baselineEstimate - 2500;
        user.estimatedTDEE = forceDifferentValueForTheUser;
        let weight = 190;
        case2Log.dayEntries = case2Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            weight -= 0.5
            return entry;
        });
        case2Log.startTDEE = baselineEstimate;
        TestHelpers.shuffleArray(case2Log.dayEntries);
        const avgKcalIntake = logCalc.getAvgKcal(case2Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case2Log);
        const deltaBodyWeightNotMaintenance = deltaBodyWeight > energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase1ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightNotMaintenance;
        assert(meetsAllConditionsForCase1ABE);
        const payload = await algorithm.getEnergyPayload(case2Log, user);
        const avgWeeklyChange = logCalc.getWeeklyWeightChange(case2Log, deltaBodyWeight);
        const meanDailyDeficit = (avgWeeklyChange * energy.ONE_POUND_CALORIES) / 7;
        const expectedABE = Math.round((baselineEstimate + avgKcalIntake) / 2);
        const expectedFinalTDEE = Math.round(expectedABE + meanDailyDeficit);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should still calculate log stats correctly if the entries are not passed in in chronological order (verified by ABE case 3)", async () => {
        const case3Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 4000;
        const forceDifferentValueForTheUser = baselineEstimate - 2500;
        user.estimatedTDEE = forceDifferentValueForTheUser;
        let weight = 190;
        case3Log.dayEntries = case3Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(2000, 3000);
            entry.weight = weight;
            return entry;
        });
        case3Log.startTDEE = baselineEstimate
        TestHelpers.shuffleArray(case3Log.dayEntries);
        const avgKcalIntake = logCalc.getAvgKcal(case3Log);
        const averageIsLessThanBaseline = avgKcalIntake < baselineEstimate;
        const avgAndBaselineAreNotConsideredEqual = Math.abs(avgKcalIntake - baselineEstimate) > energy.ESTIMATED_AVERAGE_THRESHOLD;
        const avgLessThanBaselineAndNotConsideredEqual = (averageIsLessThanBaseline && avgAndBaselineAreNotConsideredEqual);
        const deltaBodyWeight = getDeltaBodyWeight(case3Log);
        const deltaBodyWeightIsMaintenance = deltaBodyWeight <= energy.WEIGHT_MAINTENANCE_THRESHOLD;
        const meetsAllConditionsForCase3ABE = avgLessThanBaselineAndNotConsideredEqual && deltaBodyWeightIsMaintenance;
        assert(meetsAllConditionsForCase3ABE);
        const payload = await algorithm.getEnergyPayload(case3Log, user);
        const expectedABE = avgKcalIntake;
        const expectedFinalTDEE = Math.round(expectedABE);
        assert(expectedFinalTDEE == payload.estimatedTDEE);
    });

    it("should return no goal intake if there is no TDEE and a VLCD diet is detected", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceLowTDEE = 750;
        user.estimatedTDEE = forceLowTDEE;
        const someRandomLog = TestHelpers.getRandomNutritionLog();
        someRandomLog.dayEntries = TestHelpers.getRandomEntryListOfLength(100);
        let weight = 180;
        let calories = forceLowTDEE;
        someRandomLog.goal = energy.GOAL_FAT_LOSS;
        someRandomLog.dayEntries.map(entry => {
            calories -= 2;
            entry.calories = calories;
            weight += 0.25;
            entry.weight = weight;
        });
        const payload = await algorithm.getEnergyPayload(someRandomLog, user);
        assert(!payload.estimatedTDEE);
        assert(!payload.goalIntakeBoundaries)
    });

    it("should return 600 - 700 as the goal intake range if the deficit range detected is below that threshold 1", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceLowTDEE = 750;
        user.estimatedTDEE = forceLowTDEE;
        const someRandomLog = TestHelpers.getRandomNutritionLog();
        someRandomLog.dayEntries = TestHelpers.getRandomEntryListOfLength(100);
        let weight = 180;
        let calories = forceLowTDEE;
        someRandomLog.goal = energy.GOAL_FAT_LOSS;
        someRandomLog.dayEntries.map(entry => {
            entry.calories = calories;
            entry.weight = weight;
        });
        const payload = await algorithm.getEnergyPayload(someRandomLog, user);
        assert(payload.goalIntakeRange == "600 kcal - 700 kcal");
    });

    it("should return 600 - 700 as the goal intake range if the deficit range detected is below that threshold 2", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceLowTDEE = 800;
        user.estimatedTDEE = forceLowTDEE;
        const someRandomLog = TestHelpers.getRandomNutritionLog();
        someRandomLog.dayEntries = TestHelpers.getRandomEntryListOfLength(100);
        let weight = 180;
        let calories = forceLowTDEE;
        someRandomLog.goal = energy.GOAL_FAT_LOSS;
        someRandomLog.dayEntries.map(entry => {
            entry.calories = calories;
            entry.weight = weight;
        });
        const payload = await algorithm.getEnergyPayload(someRandomLog, user);
        assert(payload.goalIntakeRange == "600 kcal - 700 kcal");
    });

    it("should return 600 - 700 as the goal intake range if the deficit range detected is below that threshold 3", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const forceLowTDEE = 820;
        user.estimatedTDEE = forceLowTDEE;
        const someRandomLog = TestHelpers.getRandomNutritionLog();
        someRandomLog.dayEntries = TestHelpers.getRandomEntryListOfLength(100);
        let weight = 180;
        let calories = forceLowTDEE;
        someRandomLog.goal = energy.GOAL_FAT_LOSS;
        someRandomLog.dayEntries.map(entry => {
            entry.calories = calories;
            entry.weight = weight;
        });
        const payload = await algorithm.getEnergyPayload(someRandomLog, user);
        assert(payload.goalIntakeRange == "600 kcal - 700 kcal");
    });

    it("should mark all entries with a start TDEE and goal boundaries when syncDataForHealth is called", async () => {
        const profile: UserProfile = TestHelpers.getRandomUserProfile();
        const log: NutritionLog = new NutritionLog();
        const mergedEntries: DayEntry[] = TestHelpers.getRandomEntryListOfLength(100).map(entry => {
            entry.creationEstimatedTDEE = null;
            entry.goalIntakeBoundaries = null;
            return entry;
        });
        mergedEntries.forEach(entry => {
            assert(entry.creationEstimatedTDEE == null);
            assert(entry.goalIntakeBoundaries == null);
            return entry;
        });
        const syncResponse = await algorithm.syncDataFromHealthBody(log, profile, mergedEntries);
        syncResponse.syncedData.forEach(entry => {
            assert(entry.creationEstimatedTDEE != null);
            assert(entry.goalIntakeBoundaries != null);
            return entry;
        });
    });

});

/**
 * Calculates delta bodyweight for a log.
 * 
 * @param log Log to calculate delta body weight for.
 */
function getDeltaBodyWeight(log: NutritionLog): number {
    const startWeight = logCalc.getStartWeightForLog(log);
    const currentWeight = logCalc.getCurrentWeightForLog(log);
    const dbw = Math.abs(logCalc.getWeightDifferenceStartToCurrent(startWeight, currentWeight));
    return dbw;
}

