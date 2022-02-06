import * as energy from '../../constants/energyConstants';
import * as environment from '../environment';
import * as functionWrappers from '../cloudfunction';
import { UserProfile } from '../../classes/user-profile';
import { convertInchesToCentimeters, convertLbsToKg } from '../converter';

/**
 * Makes a request to LS API for a TDEE estimate. If the request fails 
 * for whatever reason (server down etc.), then we fall back onto 
 * the harris benedict equation to make the user's TDEE estimate.
 * 
 * This way, we don't end up in a situation where the user does 
 * not have a TDEE because of some failed request.
 * 
 * @param userProfile UserProfile object to calculate TDEE for.
 * 
 * Last edited by: Ryan Lefebvre 7/26/2021
 */
export async function getEstimatedTDEE(userProfile: UserProfile): Promise<any> {
    let estimatedTDEE: number = energy.INSUFFICIENT_DATA;
    let wasError: boolean = false;
    try {
        const canCalculate: boolean = canCalculateTDEE(userProfile);
        if (canCalculate) {
            // this crap will fail for anyone setting this project up
            // since they don't have our API
            const tdeeEndpoint: string = environment.getUrlLsAPI() + "/tdee";
            const tdeeBody = formatPredictionRequest(userProfile);
            const tdeeOptions = {
                headers: {
                    "X-LS-ApiKey": environment.getKeyLsAPI()
                },
                url: tdeeEndpoint,
                method: 'POST',
                body: tdeeBody,
                json: true,
            };
            estimatedTDEE = (await functionWrappers.httpRequest(tdeeOptions)).tdee;
            estimatedTDEE = Math.round(estimatedTDEE);
        }
    }
    catch (error) {
        wasError = true;
    }
    const firstEstimationAttemptDidntWork: boolean = (wasError || isNaN(estimatedTDEE));
    if (firstEstimationAttemptDidntWork) {
        estimatedTDEE = getMifflin(userProfile);
    }
    return estimatedTDEE;
}

/**
 * If the request for a TDEE estimate to the LogSmarter API fails, 
 * the plan is to have an equation to fall back on. 
 * 
 * https://github.com/LogSmarter-LLC/TDEE-AARR#L200
 */
export function getMifflin(user: UserProfile): number {
    let TDEE: number = energy.INSUFFICIENT_DATA;
    try {
        let sex = 0;
        if (user.isMale == true) {
            sex = 1;
        }
        const RMR = ((9.99 * convertLbsToKg(user.weight_lbs)) + (6.25 * convertInchesToCentimeters(user.height_inches)) - (4.92 * user.age) + (166 * sex) - 161);
        const activityFactor: number = getActivityLevelMultiplier(user);
        TDEE = Math.round(RMR * activityFactor);
    } catch (error) {
        TDEE = energy.INSUFFICIENT_DATA;
    }
    return TDEE;
}

/**
 * Converts a UserProfile object into an array that can be used 
 * as input to our RFR model which expects an array as input where the 
 * elements correspond to demographic information about the individual.
 * This function assumes that the user profile being passed in has 
 * met the necessary constraints to build input to our model. This 
 * means that the profile has the required properties.
 * 
 * @param userProfile Contains demographic information used as input. 
 */
function formatPredictionRequest(userProfile: UserProfile): any {
    const genderVal: number = getGenderValue(userProfile);
    const palMULT: number = getActivityLevelMultiplier(userProfile);
    const weightPounds: number = userProfile.weight_lbs;
    const height_inches: number = userProfile.height_inches;
    const age: number = userProfile.age;
    return {
        "heightInches": height_inches,
        "weightPounds": weightPounds,
        "ageYears": age,
        "isMale": genderVal,
        "palMult": palMULT
    }
}

/**
 * Returns true if a UserProfile object has the required 
 * properties to calculate TDEE. This is true if 
 * their height, age, weight, gender and activity level
 * are present.
 * 
 * @param userProfile Contains demographic information to check.
 */
function canCalculateTDEE(userProfile: UserProfile): boolean {
    const noProfile: boolean = !userProfile;
    if (noProfile) {
        return false;
    } else {
        const userHasGender: boolean = (userProfile.isMale != null);
        const userHasAge: boolean = (userProfile.age != null);
        const userHasWeight: boolean = (userProfile.weight_lbs != null);
        const userHasHeight: boolean = (userProfile.height_inches != null);
        const userHasActivityLevel: boolean = (userProfile.activityLevel != null);
        const userHasRequiedProperties = (userHasGender && userHasAge && userHasWeight && userHasHeight && userHasActivityLevel);
        return userHasRequiedProperties;
    }
}

/**
 * helper for estimating TDEE, RFR model expects a numeric value  
 * for gender, if male then value == 1 , female value == 0 
 * assumes isMale is not NULL. All catagorical values must be 
 * transformed into numeric values before being passed as input 
 * to our RFR model.
 * 
 * @param userProfile UserProfile object to get gender value for.
 */
function getGenderValue(userProfile: UserProfile): number {
    const isMale: boolean = userProfile.isMale;
    const MALE_VAL: number = 1;
    const FEMALE_VAL: number = 0;
    if (isMale) {
        return MALE_VAL;
    }
    else {
        return FEMALE_VAL;
    }
}

/**
 * Returns a numeric value associated with activity levels.
 * These multipliers are the numeric values associated with 
 * the common discretized model of activity levels seen in the
 * literature. If the user profile passed in does not have one
 * of the standard activity levels, then 1 is returned. This 
 * is never expected to happen but implemented as a fail safe.
 * 
 * @param userProfile 
 */
function getActivityLevelMultiplier(userProfile: UserProfile): number {
    const activityLevel = userProfile.activityLevel;
    if (activityLevel == energy.ACTIVITY_LEVEL_SEDENTARY) {
        return 1.2;
    }
    else if (activityLevel == energy.ACTIVITY_LEVEL_LIGHTLY_ACTIVE) {
        return 1.375;
    }
    else if (activityLevel == energy.ACTIVITY_LEVEL_ACTIVE) {
        return 1.55;
    }
    else if (activityLevel == energy.ACTIVITY_LEVEL_VERY_ACTIVE) {
        return 1.725;
    }
    else {
        return 1;
    }
}

