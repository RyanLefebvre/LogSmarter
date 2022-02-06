import * as estimator from '../src/services/algorithm/rfrModel'
import * as TestHelpers from './TestHelpers';
import * as Energy from '../src/constants/energyConstants';
import { assert } from 'console';


describe('FirebaseFunctions/Services/EstimationModelTDEE', () => {

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it("should not estimate the user's TDEE if their height is null  ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = Energy.INSUFFICIENT_DATA;
        user.weight_lbs = 180;
        user.activityLevel = Energy.ACTIVITY_LEVEL_ACTIVE;
        user.age = 21;
        user.isMale = true;
        let TDEE = await estimator.getEstimatedTDEE(user);
        assert(TDEE == Energy.INSUFFICIENT_DATA);
    });

    it("should not estimate the user's TDEE if their weight is null  ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        user.weight_lbs = Energy.INSUFFICIENT_DATA;
        user.activityLevel = Energy.ACTIVITY_LEVEL_ACTIVE;
        user.age = 21;
        user.isMale = true;
        let TDEE = await estimator.getEstimatedTDEE(user);
        assert(TDEE == Energy.INSUFFICIENT_DATA);
    });

    it("should not estimate the user's TDEE if their activityLevel is null  ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        user.weight_lbs = 190;
        user.activityLevel = Energy.INSUFFICIENT_DATA;
        user.age = 21;
        user.isMale = true;
        let TDEE = await estimator.getEstimatedTDEE(user);
        assert(TDEE == Energy.INSUFFICIENT_DATA);
    });

    it("should not estimate the user's TDEE if their age is null  ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        user.weight_lbs = 189;
        user.activityLevel = Energy.ACTIVITY_LEVEL_ACTIVE;
        user.age = Energy.INSUFFICIENT_DATA;
        user.isMale = true;
        let TDEE = await estimator.getEstimatedTDEE(user);
        assert(TDEE == Energy.INSUFFICIENT_DATA);
    });

    it("should not estimate the user's TDEE if their gender is null  ", async () => {
        const user = TestHelpers.getRandomUserProfile();
        user.height_inches = 69;
        user.weight_lbs = 189;
        user.activityLevel = Energy.ACTIVITY_LEVEL_ACTIVE;
        user.age = 93;
        user.isMale = Energy.INSUFFICIENT_DATA;
        let TDEE = await estimator.getEstimatedTDEE(user);
        assert(TDEE == Energy.INSUFFICIENT_DATA);
    });

});
