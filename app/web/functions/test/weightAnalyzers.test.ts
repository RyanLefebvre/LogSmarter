import * as TestHelpers from './TestHelpers';
import * as algorithm from '../src/services/algorithm/energyAlgorithm';
import * as Energy from '../src/constants/energyConstants';
import { assert } from 'console';


describe('FirebaseFunctions/Services/WeightAnalyzers', () => {

    const OVER_ALL_WEIGHT_CHANGE_TITLE = "Overall weight change";
    const WEEKLY_WEIGHT_CHANGE_TITLE = "Weekly weight change";
    const TOTAL_WEIGHT_CHANGE_TITLE = "Total weight change";

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it("should not return any weight feedback  if the user's log does not meed MDET", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        const forceNotMeedMDET = Energy.INSUFFICIENT_DATA;
        log.dayEntries.forEach(entry => {
            entry.weight = forceNotMeedMDET;
        });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        assert(weightFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should return overall weight change feedback if the log meets MDET ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(overallWeightChangeFeedback != Energy.INSUFFICIENT_DATA);
        assert(overallWeightChangeFeedback.title == OVER_ALL_WEIGHT_CHANGE_TITLE);
    });

    it("should respond positively if the user is on track for their goal of maintaining and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.MAINTAINED_WEIGHT;
        const forceMaintain = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceMaintain; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isPositiveFeedback(overallWeightChangeFeedback));
    });

    it("should respond positively if the user is on track for their goal of gaining muscle and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGaining = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGaining; forceGaining++; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isPositiveFeedback(overallWeightChangeFeedback));
    });

    it("should respond positively if the user is on track for their goal of losing fat and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosing = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLosing; forceLosing--; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isPositiveFeedback(overallWeightChangeFeedback));
    });

    it("should respond negatively if the user is gaining weight and their goal is losing fat and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceGaining = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGaining; forceGaining++; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isNegativeFeedback(overallWeightChangeFeedback));
    });

    it("should respond negatively if the user is maintaining and their goal is losing fat and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        const forceMaintain = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceMaintain; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isNegativeFeedback(overallWeightChangeFeedback));
    });

    it("should respond negatively if the user is losing weight and their goal is gaining muscle and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceLoss = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLoss; forceLoss--; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isNegativeFeedback(overallWeightChangeFeedback));
    });

    it("should respond negatively if the user is maintaining and their goal is gaining muscle and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        const forceMaintain = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceMaintain; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isNegativeFeedback(overallWeightChangeFeedback));
    });

    it("should respond negatively if the user is gaining weight and their goal is maintaining and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MAINTAIN;
        let forceGain = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGain; forceGain++; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isNegativeFeedback(overallWeightChangeFeedback));
    });

    it("should respond negatively if the user is losing weight and their goal is maintaining and overall weight change feedback is returned ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MAINTAIN;
        let forceLoss = 167;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLoss; forceLoss--; return entry; });
        const payload: any = await algorithm.getEnergyPayload(log, user);
        const weightFeedback = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const overallWeightChangeFeedback = TestHelpers.getSpecificFeedback(weightFeedback, OVER_ALL_WEIGHT_CHANGE_TITLE);
        assert(TestHelpers.isNegativeFeedback(overallWeightChangeFeedback));
    });

    it("should return total weight change feedback if the log meets MDET, the user's goal is not to maintain " +
        " their weight change is on track for their goal, the user profile has a height and weight and " +
        "their BMI is not normal or and the user has a clinically significant change in body weight", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = 69;
            user.weight_lbs = 192;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_MUSCLE_GAIN;
            let forceGainingSoOnTrackForGoal = 192;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal++; return entry; })
            assert(user.height_inches != Energy.INSUFFICIENT_DATA);
            assert(user.weight_lbs != Energy.INSUFFICIENT_DATA);
            assert(log.goal != Energy.GOAL_MAINTAIN);
            const payload = await algorithm.getEnergyPayload(log, user);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback != Energy.INSUFFICIENT_DATA);
        });

    it("should return total weight change feedback if the log meets MDET, the user's goal is not to maintain " +
        " their weight change is on track for their goal, the user profile has a height and weight and " +
        "their BMI is NOT normal but there is no clinically significant change in body weight", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = 69;
            user.weight_lbs = 200;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_MUSCLE_GAIN;
            let forceGainingSoOnTrackForGoal = 200;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal += 0.1; return entry; })
            assert(user.height_inches != Energy.INSUFFICIENT_DATA);
            assert(user.weight_lbs != Energy.INSUFFICIENT_DATA);
            assert(log.goal != Energy.GOAL_MAINTAIN);
            const payload = await algorithm.getEnergyPayload(log, user);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback != Energy.INSUFFICIENT_DATA);
        });

    it("should return total weight change feedback if the log meets MDET, the user's goal is not to maintain " +
        " their weight change is on track for their goal, the user profile has a height and weight and " +
        "their BMI is normal but there is a clinically significant change in body weight", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = 69;
            user.weight_lbs = 190;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_FAT_LOSS;
            let forceLosingSoOnTrackForGoal = 190;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLosingSoOnTrackForGoal; forceLosingSoOnTrackForGoal -= 0.35; return entry; })
            assert(user.height_inches != Energy.INSUFFICIENT_DATA);
            assert(user.weight_lbs != Energy.INSUFFICIENT_DATA);
            assert(log.goal != Energy.GOAL_MAINTAIN);
            const payload = await algorithm.getEnergyPayload(log, user);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback != Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return total weight change feedback for a complete log with a non normal current BMI and clinically " +
        "signifcant weight change if there is no user height", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = Energy.INSUFFICIENT_DATA;
            assert(user.height_inches == Energy.INSUFFICIENT_DATA);
            user.weight_lbs = 192;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_MUSCLE_GAIN;
            let forceGainingSoOnTrackForGoal = 192;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal++; return entry; })
            assert(user.weight_lbs != Energy.INSUFFICIENT_DATA);
            assert(log.goal != Energy.GOAL_MAINTAIN);
            const payload = await algorithm.getEnergyPayload(log, user);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback == Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return total weight change feedback for a complete log with a non normal current BMI and clinically " +
        "signifcant weight change if there is no user body weight", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = 69;
            user.weight_lbs = Energy.INSUFFICIENT_DATA;
            assert(user.weight_lbs == Energy.INSUFFICIENT_DATA);
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_MUSCLE_GAIN;
            let forceGainingSoOnTrackForGoal = 192;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal++; return entry; })
            assert(user.height_inches != Energy.INSUFFICIENT_DATA);
            assert(log.goal != Energy.GOAL_MAINTAIN);
            const payload = await algorithm.getEnergyPayload(log, user);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback == Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return total weight change feedback for a complete log with a non normal current BMI and clinically " +
        "signifcant weight change if the logs goal is to maintain", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = 69;
            user.weight_lbs = 190;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_MAINTAIN
            assert(log.goal == Energy.GOAL_MAINTAIN);
            let forceGainingSoOnTrackForGoal = 192;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal++; return entry; })
            assert(user.height_inches != Energy.INSUFFICIENT_DATA);
            assert(user.weight_lbs != Energy.INSUFFICIENT_DATA);
            const payload = await algorithm.getEnergyPayload(log, user);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback == Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return total weight change feedback for a complete log with a non normal current BMI and clinically " +
        "signifcant weight change if the logs overall weight change is not on track for their goal", async () => {
            const user = TestHelpers.getRandomUserProfile();
            user.height_inches = 69;
            user.weight_lbs = 190;
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_FAT_LOSS;
            assert(log.goal != Energy.GOAL_MAINTAIN);
            let forceGainingSoNotOnTrackForGoal = 192;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoNotOnTrackForGoal; forceGainingSoNotOnTrackForGoal++; return entry; })
            assert(user.height_inches != Energy.INSUFFICIENT_DATA);
            assert(user.weight_lbs != Energy.INSUFFICIENT_DATA);
            const payload = await algorithm.getEnergyPayload(log, user);
            assert(payload.currentWeight > payload.startWeight);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
            assert(totalWeightFeedback == Energy.INSUFFICIENT_DATA);
        });

    it("should calculate the user's BMI correctly using their current weight in the total weight feedback (Obese)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingSoOnTrackForGoal = 195;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal++; return entry; })
        const payload = await (algorithm.getEnergyPayload(log, user));
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
        const tokenizedMessage = totalWeightFeedback.message.split(" ");
        const BMI = parseFloat(tokenizedMessage[3]);
        assert(Math.round(BMI) == 43)
    });

    it("should calculate the user's BMI correctly using their current weight in the total weight feedback (Underweight)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosingSoOnTrackForGoal = 140;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLosingSoOnTrackForGoal; forceLosingSoOnTrackForGoal--; return entry; })
        const payload = await (algorithm.getEnergyPayload(log, user));
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
        const tokenizedMessage = totalWeightFeedback.message.split(" ");
        const BMI = parseFloat(tokenizedMessage[3]);
        assert(Math.round(BMI) == 6)
    });

    it("should identify the user's BMI correctly using their current weight in the total weight feedback if it is not normal (Obese)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingSoOnTrackForGoal = 195;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGoal; forceGainingSoOnTrackForGoal++; return entry; })
        const payload = await (algorithm.getEnergyPayload(log, user));
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
        const tokenizedMessage = totalWeightFeedback.message.split(" ");
        const BMI_CATEGORY = tokenizedMessage[8];
        assert(Energy.BMI_OBESE == BMI_CATEGORY);
    });

    it("should identify the user's BMI correctly using their current weight in the total weight feedback if it is not normal (Underweight)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosingSoOnTrackForGoal = 140;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLosingSoOnTrackForGoal; forceLosingSoOnTrackForGoal--; return entry; })
        const payload = await (algorithm.getEnergyPayload(log, user));
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
        const tokenizedMessage = totalWeightFeedback.message.split(" ");
        const BMI_CATEGORY = tokenizedMessage[8];
        assert(Energy.BMI_UNDERWEIGHT == BMI_CATEGORY);
    });

    it("should calculate the total percentage change in bodyweight correctly if the change is clinically significant (LOSING)", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosingSoOnTrackForGoal = 140;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceLosingSoOnTrackForGoal; forceLosingSoOnTrackForGoal--; return entry; })
        const payload = await (algorithm.getEnergyPayload(log, user));
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
        const tokenizedMessage = totalWeightFeedback.message.split(" ");
        const percentChange = parseInt(tokenizedMessage[16]);
        assert(percentChange == 70);
    });

    it("should calculate the total percentage change in bodyweight correctly if the change is clinically significant (GAINING) ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN
        let forceGainingSoOnTrackForGOal = 190;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingSoOnTrackForGOal; forceGainingSoOnTrackForGOal++; return entry; })
        const payload = await (algorithm.getEnergyPayload(log, user));
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const totalWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, TOTAL_WEIGHT_CHANGE_TITLE);
        const tokenizedMessage = totalWeightFeedback.message.split(" ");
        const percentChange = parseInt(tokenizedMessage[16]);
        assert(percentChange == 50);
    });

    it("should return weekly weight change feedback if the logs goal is NOT to maintain, the log  " +
        " has a start and current weight, the log is on track for its goal and meets MDET", async () => {
            const user = TestHelpers.getRandomUserProfile();
            const log = TestHelpers.getRandomNutritionLog();
            log.goal = Energy.GOAL_MUSCLE_GAIN;
            let forceGainingWeightSoOnTrackForGoal = 160;
            log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingWeightSoOnTrackForGoal; forceGainingWeightSoOnTrackForGoal++; return entry; });
            assert(log.goal != Energy.GOAL_MAINTAIN);
            const payload = await algorithm.getEnergyPayload(log, user);
            assert(payload.startWeight);
            assert(payload.currentWeight);
            const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
            const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
            assert(weeklyWeightFeedback != Energy.INSUFFICIENT_DATA);
        });

    it("should NOT return weekly weight change feedback if there is no start weight ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingWeightSoOnTrackForGoal = 160;
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) > 6) {
                entry.weight = forceGainingWeightSoOnTrackForGoal;
                forceGainingWeightSoOnTrackForGoal++;
            } else {
                entry.weight = Energy.INSUFFICIENT_DATA;
            }
            return entry;
        });
        assert(log.goal != Energy.GOAL_MAINTAIN);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startWeight == Energy.INSUFFICIENT_DATA);
        assert(payload.currentWeight);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should not return weekly weight change feedback if there is no current weight ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingWeightSoOnTrackForGoal = 160;
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) < log.dayEntries.length - 7) {
                entry.weight = forceGainingWeightSoOnTrackForGoal;
                forceGainingWeightSoOnTrackForGoal++;
            } else {
                entry.weight = Energy.INSUFFICIENT_DATA;
            }
            return entry;
        });
        assert(log.goal != Energy.GOAL_MAINTAIN);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startWeight);
        assert(payload.currentWeight == Energy.INSUFFICIENT_DATA);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should not return weekly weight change feedback if the log is not on track for its goal ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceGainingWeightSoNotOnTrackForGoal = 160;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceGainingWeightSoNotOnTrackForGoal; forceGainingWeightSoNotOnTrackForGoal++; return entry; });
        assert(log.goal != Energy.GOAL_MAINTAIN);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startWeight);
        assert(payload.currentWeight);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should not return weekly weight change feedback if the logs goal is to maintain ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MAINTAIN;
        let forceMaintainWeightSoOnTrackForGoal = 160;
        log.dayEntries = log.dayEntries.map(entry => { entry.weight = forceMaintainWeightSoOnTrackForGoal; return entry; });
        assert(log.goal == Energy.GOAL_MAINTAIN);
        const payload = await algorithm.getEnergyPayload(log, user);
        assert(payload.startWeight);
        assert(payload.currentWeight);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback == Energy.INSUFFICIENT_DATA);
    });

    it("should state that rate of gain is fast for weekly weight change feedback if the rate of gain is fast ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingWeightSoOnTrackForGoal = 160;
        let averageWeeklyRateOfChange = Energy.MAX_BULK_RATE + .03;
        let startDate = new Date();
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                forceGainingWeightSoOnTrackForGoal += (forceGainingWeightSoOnTrackForGoal * averageWeeklyRateOfChange);
            }
            entry.weight = forceGainingWeightSoOnTrackForGoal;
            startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis());
            entry.date = startDate;
            entry.id = entry.date.getTime()
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback.message.includes("Your weekly change in percentage of total body weight is considered fast"));
    });

    it("should state the rate of gain is slow for weekly weight change feedback if the rate of gain is slow ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingWeightSoOnTrackForGoal = 200;
        let startDate = new Date();
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                forceGainingWeightSoOnTrackForGoal += .1;
            }
            entry.weight = forceGainingWeightSoOnTrackForGoal;
            startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis());
            entry.date = startDate;
            entry.id = entry.date.getTime()
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback.message.includes("Your weekly change in percentage of total body weight is considered slow"));
    });

    it("should say rate of weight change is optimal for weekly weight change feedback if the rate of gain is optimal ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_MUSCLE_GAIN;
        let forceGainingWeightSoOnTrackForGoal = 160;
        let startDate = new Date();
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                forceGainingWeightSoOnTrackForGoal += 0.3;
            }
            entry.weight = forceGainingWeightSoOnTrackForGoal;
            startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis());
            entry.date = startDate;
            entry.id = entry.date.getTime()
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback.message.includes("Your weekly change in percentage of total body weight is considered optimal"));
    });

    it("should state the rate of weight change is fast for weekly weight change feedback if the rate of loss is fast ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosingWeightSoOnTrackForGoal = 160;
        const averageWeeklyRateOfChange = .02
        let startDate = new Date();
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                forceLosingWeightSoOnTrackForGoal -= (forceLosingWeightSoOnTrackForGoal * averageWeeklyRateOfChange);
            }
            entry.weight = forceLosingWeightSoOnTrackForGoal;
            startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis());
            entry.date = startDate;
            entry.id = entry.date.getTime()
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback.message.includes("Your weekly change in percentage of total body weight is considered fast"));
    });

    it("should state the rate of weight change is slow for weekly weight change feedback if the rate of loss is slow ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosingWeightSoOnTrackForGoal = 160;
        let averageWeeklyRateOfChange = .0045;
        let startDate = new Date();
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                forceLosingWeightSoOnTrackForGoal -= (forceLosingWeightSoOnTrackForGoal * averageWeeklyRateOfChange);
            }
            entry.weight = forceLosingWeightSoOnTrackForGoal;
            startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis());
            entry.date = startDate;
            entry.id = entry.date.getTime()
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback.message.includes("Your weekly change in percentage of total body weight is considered slow"));
    });

    it("should state the rate of weight change is optimal for weekly weight change feedback if the rate of loss is optimal", async () => {
        const user = TestHelpers.getRandomUserProfile();
        const log = TestHelpers.getRandomNutritionLog();
        log.goal = Energy.GOAL_FAT_LOSS;
        let forceLosingWeightSoOnTrackForGoal = 160;
        let averageWeeklyRateOfChange = .01;
        let startDate = new Date();
        log.dayEntries = log.dayEntries.map(entry => {
            if (log.dayEntries.indexOf(entry) % 7 == 0) {
                forceLosingWeightSoOnTrackForGoal -= (forceLosingWeightSoOnTrackForGoal * averageWeeklyRateOfChange);
            }
            entry.weight = forceLosingWeightSoOnTrackForGoal;
            startDate = new Date(startDate.getTime() + TestHelpers.getDayInMillis());
            entry.date = startDate;
            entry.id = entry.date.getTime()
            return entry;
        });
        const payload = await algorithm.getEnergyPayload(log, user);
        const weightFeedbackCat = TestHelpers.getFeedbackCategory(payload, algorithm.FEEDBACK_CAT_WEIGHT);
        const weeklyWeightFeedback = TestHelpers.getSpecificFeedback(weightFeedbackCat, WEEKLY_WEIGHT_CHANGE_TITLE);
        assert(weeklyWeightFeedback.message.includes("Your weekly change in percentage of total body weight is considered optimal"));
    });

});
