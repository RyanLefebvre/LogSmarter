import * as TestHelpers from './TestHelpers';
import * as algorithm from '../src/services/algorithm/energyAlgorithm';
import * as Energy from '../src/constants/energyConstants';
import { NutritionLog } from '../src/classes/nutrition-log';
import { assert } from 'console';

describe('FirebaseFunctions/Services/CalorieAnalyzers', () => {

    const AVG_INTAKE_TITLE = "Diet Adherence";
    const AVG_SURPLUS_TITLE = "Average surplus";
    const AVG_DEFICIT_TITLE = "Average deficit";
    const BASELINE_ADJUSTMENT_TITLE = "TDEE adaptation";

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it("should not return any calorie analysis for an empty log", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = new NutritionLog();
        assert(log.dayEntries.length == 0);
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should return an average intake analysis for a log with a " +
        " goal intake, an average intake and a TDEE estimate", async () => {
            const user = TestHelpers.getRandomUserProfile();
            const log = TestHelpers.getRandomNutritionLog();
            const payload = await algorithm.getEnergyPayload(log, user);
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            assert(calorieFeedbackCat != Energy.INSUFFICIENT_DATA);
            const averageIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
            assert(averageIntakeFeedback != Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return an average intake analysis if the log has no average intake", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries.forEach(entry => {
            entry.calories = Energy.INSUFFICIENT_DATA;
            return entry;
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return an average intake analysis if the log has no goal intake", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries.forEach(entry => {
            entry.calories = Energy.INSUFFICIENT_DATA;
            return entry;
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return an average intake analysis if the payload has no TDEE", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = Energy.INSUFFICIENT_DATA;
        assert(!user.estimatedTDEE)
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries = TestHelpers.getRandomEntryListOfLength(13);
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should repsond negatively in the average intake analysis if the average intake is not within the goal range (gaining)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        const forceAbsurdIntakeForTDEE = 5000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 2;
            }
            entry.weight = weight;
            entry.calories = forceAbsurdIntakeForTDEE;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isNegativeFeedback(avgIntakeFeedback));
    });

    it("should repsond negatively in the average intake analysis if the average intake is not within the goal range (losing)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        const forceAbsurdIntakeForTDEE = 5000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += 2;
            }
            entry.weight = weight;
            entry.calories = forceAbsurdIntakeForTDEE;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isNegativeFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (gaining conservative)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        user.userPreferences.nutrition.surplus = Energy.SURPLUS_CONSERVATIVE;
        const forceInsideGoalRange = user.estimatedTDEE + 200;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += .4;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (gaining moderate)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2300;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        user.userPreferences.nutrition.surplus = Energy.SURPLUS_MODERATE;
        const forceInsideGoalRange = user.estimatedTDEE + 600;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += .5;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (gaining aggressive)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        user.userPreferences.nutrition.surplus = Energy.SURPLUS_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE + 1000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += .4;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (losing conservative)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 3000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_CONSERVATIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 400;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (losing moderate)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_MODERATE;
        const forceInsideGoalRange = user.estimatedTDEE - 700;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (losing aggressive)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 1000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should respond positively in the average intake analysis if the average intake is in the goal intake range (losing very aggressive)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 4000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_VERY_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 1400;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgIntakeFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_INTAKE_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgIntakeFeedback));
    });

    it("should NOT return a surplus or deficit analysis analysis if the log has no average intake", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries.forEach(entry => {
            entry.calories = Energy.INSUFFICIENT_DATA;
            return entry;
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(!payload.avgCalories);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });


    it("should return an average surplus or deficit analysis analysis for a log with a " +
        " goal intake, an average intake, a goal besides to maintain and a TDEE estimate", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.estimatedTDEE = 2000;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_FAT_LOSS;
            assert(log.goal != Energy.GOAL_MAINTAIN)
            user.userPreferences.nutrition.deficit = Energy.DEFICIT_VERY_AGGRESSIVE;
            const forceInsideGoalRange = user.estimatedTDEE - 850;
            let weight = 167;
            log.dayEntries.forEach(entry => {
                if (log.dayEntries.indexOf(entry) % 7 == 0) {
                    weight -= 1;
                }
                entry.weight = weight;
                entry.calories = forceInsideGoalRange;
                return entry;
            });
            const payload = await algorithm.getEnergyPayload(log, user);
            assert(payload.goalIntakeRange);
            assert(payload.avgCalories);
            assert(payload.estimatedTDEE)
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
            assert(avgSurDefFeedback != Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return a surplus or deficit analysis analysis if the logs goal is maintenance", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MAINTAIN;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_VERY_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 850;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(avgSurDefFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return an average surplus or deficit analysis if the log has no goal intake", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = Energy.INSUFFICIENT_DATA;
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries.forEach(entry => {
            entry.calories = Energy.INSUFFICIENT_DATA;
            return entry;
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(!payload.goalIntakeRange);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return an average surplus or deficit analysis if the payload has no estimatedTDEE", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = Energy.INSUFFICIENT_DATA;
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries.forEach(entry => {
            entry.calories = Energy.INSUFFICIENT_DATA;
            return entry;
        })
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(!payload.estimatedTDEE);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return average surplus or deficit feedback if the average surplus or deficit is negative (gaining)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        const forceAbsurdIntakeForTDEE = 5000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 2;
            }
            entry.weight = weight;
            entry.calories = forceAbsurdIntakeForTDEE;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(avgSurDefFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should repsond negatively in the average surplus or deficit analysis if the average intake is not within the goal range (gaining)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        const forceAbsurdIntakeForTDEE = 5000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += 0.01;
            }
            entry.weight = weight;
            entry.calories = forceAbsurdIntakeForTDEE;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isNegativeFeedback(avgSurDefFeedback));
    });

    it("should repsond negatively in the average surplus or deficit analysis if the average intake is not within the goal range (losing)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        const forceAbsurdIntakeForTDEE = 5000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 0.01;
            }
            entry.weight = weight;
            entry.calories = forceAbsurdIntakeForTDEE;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isNegativeFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis if the average intake is in the goal intake range (gaining conservative)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        user.userPreferences.nutrition.surplus = Energy.SURPLUS_CONSERVATIVE;
        const forceInsideGoalRange = user.estimatedTDEE + 200;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += .4;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis if the average intake is in the goal intake range (gaining moderate)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        user.userPreferences.nutrition.surplus = Energy.SURPLUS_MODERATE;
        const forceInsideGoalRange = user.estimatedTDEE + 600;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += .4;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis if the average intake is in the goal intake range (gaining aggressive)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        user.userPreferences.nutrition.surplus = Energy.SURPLUS_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE + 1000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight += .4;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis if the average intake is in the goal intake range (losing conservative)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_CONSERVATIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 450;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis  if the average intake is in the goal intake range (losing moderate)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_MODERATE;
        const forceInsideGoalRange = user.estimatedTDEE - 700;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis if the average intake is in the goal intake range (losing aggressive)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 2000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 1000;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should respond positively in the average surplus or deficit analysis if the average intake is in the goal intake range (losing very aggressive)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 4000;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        user.userPreferences.nutrition.deficit = Energy.DEFICIT_VERY_AGGRESSIVE;
        const forceInsideGoalRange = user.estimatedTDEE - 1700;
        let weight = 167;
        log.dayEntries.forEach(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                weight -= 1;
            }
            entry.weight = weight;
            entry.calories = forceInsideGoalRange;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const avgSurDefFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_SURPLUS_TITLE) || TestHelpers.getSpecificFeedback(calorieFeedbackCat, AVG_DEFICIT_TITLE);
        assert(TestHelpers.isPositiveFeedback(avgSurDefFeedback));
    });

    it("should NOT return a baseline adjustment analysis if the payload has no TDEE", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        user.estimatedTDEE = Energy.INSUFFICIENT_DATA;
        log.dayEntries.forEach(entry => { entry.calories = null; return entry })
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.estimatedTDEE == Energy.INSUFFICIENT_DATA);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return a baseline adjustment analysis if the the user has a log that does not meet MDET", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        user.estimatedTDEE = Energy.INSUFFICIENT_DATA;
        log.dayEntries.forEach(entry => { entry.calories = null; entry.weight = null; return entry })
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.estimatedTDEE == Energy.INSUFFICIENT_DATA);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return a baseline adjustment analysis if the the user has a log that produces a case where BE is equivalent to μDCI", async () => {
        const case6Log = TestHelpers.getRandomNutritionLog();
        const user = TestHelpers.getRandomUserProfile();
        const baselineEstimate = 3050;
        user.estimatedTDEE = baselineEstimate;
        let weight = 190;
        case6Log.dayEntries = case6Log.dayEntries.map(entry => {
            entry.calories = TestHelpers.getRandomWithinArbitraryRange(3000, 3100);
            entry.weight = weight;
            weight += 0.2;
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(case6Log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const baselineAdjustmentFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, BASELINE_ADJUSTMENT_TITLE);
        assert(baselineAdjustmentFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should return a baseline estimate for a log that has a TDEE, meets MDET and does not produce a case where estimated and average are equal", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.estimatedTDEE = 4500;
        const log = TestHelpers.getRandomNutritionLog();
        log.dayEntries.forEach(entry => {
            entry.calories = 3000;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
        const baselineAdjustmentFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, BASELINE_ADJUSTMENT_TITLE);
        assert(baselineAdjustmentFeedback != Energy.INSUFFICIENT_DATA);
    });

    it("should NOT return baseline adjustment feedbaack for a log that has a TDEE, meets MDET and does not " +
        " produces a case where there is no estimated TDEE", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.weight_lbs = 187;
            user.estimatedTDEE = 2500;
            const log = TestHelpers.getRandomNutritionLog();
            let startCal = 2900;
            let startWeight = 187;
            let startDate = new Date();
            log.dayEntries = log.dayEntries.map(entry => {
                entry.calories = startCal;
                entry.weight = startWeight;
                entry.date = startDate;
                entry.id = startDate.getTime();
                startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis())
                startWeight++;
                startCal += 5;
                return entry;
            })
            const payload = await algorithm.getEnergyPayload(log, user);
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            assert(calorieFeedbackCat == Energy.INSUFFICIENT_DATA);
        });

    it("should calculate the baseline adjustment factor correctly for a log that has a TDEE, meets MDET and does not " +
        " produce a case where estimated and average are equal (gaining 1)", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.weight_lbs = 187;
            user.estimatedTDEE = 2500;
            const log = TestHelpers.getRandomNutritionLog();
            let startCal = 2900;
            let startWeight = 187;
            let startDate = new Date();
            log.dayEntries = log.dayEntries.map(entry => {
                entry.calories = startCal;
                entry.weight = startWeight;
                entry.date = startDate;
                entry.id = startDate.getTime();
                startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis())
                startWeight += 0.13;
                startCal += 5;
                return entry;
            })
            const payload = await algorithm.getEnergyPayload(log, user);
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            const baselineAdjustmentFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, BASELINE_ADJUSTMENT_TITLE);
            assert(baselineAdjustmentFeedback != Energy.INSUFFICIENT_DATA);
            const tokenized = baselineAdjustmentFeedback.message.split(" ");
            const adjusmentFactor = parseFloat(tokenized[tokenized.length - 10]);
            assert(adjusmentFactor == 5);
        });

    it("should calculate the baseline adjustment factor correctly for a log that has a TDEE, meets MDET and does not " +
        " produce a case where estimated and average are equal (gaining 2)", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.weight_lbs = 187;
            user.estimatedTDEE = 2500;
            const log = TestHelpers.getRandomNutritionLog();
            let startCal = 2900;
            let startWeight = 187;
            let startDate = new Date();
            log.dayEntries = log.dayEntries.map(entry => {
                entry.calories = startCal;
                entry.weight = startWeight;
                entry.date = startDate;
                entry.id = startDate.getTime();
                startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis())
                startWeight += 0.2;
                startCal += 5;
                return entry;
            })
            const payload = await algorithm.getEnergyPayload(log, user);
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            const baselineAdjustmentFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, BASELINE_ADJUSTMENT_TITLE);
            assert(baselineAdjustmentFeedback != Energy.INSUFFICIENT_DATA);
            const tokenized = baselineAdjustmentFeedback.message.split(" ");
            const adjusmentFactor = parseFloat(tokenized[tokenized.length - 10]);
            assert(adjusmentFactor == 13);
        });

    it("should calculate the baseline adjustment factor correctly for a log that has a TDEE, meets MDET and does not " +
        " produce a case where estimated and average are equal (losing 1)", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.weight_lbs = 187;
            user.estimatedTDEE = 2500;
            const log = TestHelpers.getRandomNutritionLog();
            let startCal = 2900;
            let startWeight = 187;
            let startDate = new Date();
            log.dayEntries = log.dayEntries.map(entry => {
                entry.calories = startCal;
                entry.weight = startWeight;
                entry.date = startDate;
                entry.id = startDate.getTime();
                startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis())
                startWeight -= 0.2;
                startCal += 5;
                return entry;
            })
            const payload = await algorithm.getEnergyPayload(log, user);
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            const baselineAdjustmentFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, BASELINE_ADJUSTMENT_TITLE);
            assert(baselineAdjustmentFeedback != Energy.INSUFFICIENT_DATA);
            const tokenized = baselineAdjustmentFeedback.message.split(" ");
            const adjusmentFactor = parseFloat(tokenized[tokenized.length - 10]);
            assert(adjusmentFactor == 58.4);
        });

    it("should calculate the baseline adjustment factor correctly for a log that has a TDEE, meets MDET and does not " +
        " produce a case where estimated and average are equal (losing 2)", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.weight_lbs = 187;
            user.estimatedTDEE = 2500;
            const log = TestHelpers.getRandomNutritionLog();
            let startCal = 2900;
            let startWeight = 187;
            let startDate = new Date();
            log.dayEntries = log.dayEntries.map(entry => {
                entry.calories = startCal;
                entry.weight = startWeight;
                entry.date = startDate;
                entry.id = startDate.getTime();
                startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis())
                startWeight -= 0.1;
                startCal += 5;
                return entry;
            })
            const payload = await algorithm.getEnergyPayload(log, user);
            const calorieFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_KCAL);
            const baselineAdjustmentFeedback = TestHelpers.getSpecificFeedback(calorieFeedbackCat, BASELINE_ADJUSTMENT_TITLE);
            assert(baselineAdjustmentFeedback != Energy.INSUFFICIENT_DATA);
            const tokenized = baselineAdjustmentFeedback.message.split(" ");
            const adjusmentFactor = parseFloat(tokenized[tokenized.length - 10]);
            assert(adjusmentFactor == 46.4);
        });

});
