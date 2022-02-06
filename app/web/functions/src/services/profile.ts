
import Profile = require('firebase-admin');
import * as admin from 'firebase-admin';
import * as algo from '../services/algorithm/energyAlgorithm';
import * as functions from 'firebase-functions';
import * as functionWrappers from '../services/cloudfunction'
import * as rfrModel from '../services/algorithm/rfrModel'
import * as tierManager from './tiers';
import * as payments from './payments';
import * as energy from '../constants/energyConstants';
import * as helper from '../services/admin'
import { UserProfile } from '../classes/user-profile';
import { NutritionLog } from '../classes/nutrition-log';
import { EnergyPayload } from '../classes/energy-payload';

/**
 * Functions within this file are responsible for various operations related to 
 * user profile CRUD and authentication status. Any edits to a user profile object 
 * should go through a function in this file. Functions within this file are almost a 
 * backend for the firebase general service in the frontend which uses these callable 
 * functions for UserProfile CRUD.
 * 
 * Last edited by: Ryan Lefebvre 8/23/2020
 */

/**
 * Key used in the firebase storage form of the UserProfile.
 */
export const USER_PROF_STORAGE_KEY: string = "u";

/**
 * Key used in firebase storage to retrieve a list of entries.
 */
export const ENTRY_LIST_STORAGE_KEY: string = "e";

/**
 * Key used in firebase storage to retrieve an entries date field.
 */
export const ENTRY_DATE_KEY: string = "d";

/**
 * Key used in firebase storage to retrieve an entries weight field.
 */
export const ENTRY_WEIGHT_KEY: string = "w";

/**
 * Key used in firebase storage to retrieve an entries calorie field.
 */
export const ENTRY_KCAL_KEY: string = "c";

/**
 * Key used in firebase storage to retrieve an entries id field.
 */
export const ENTRY_ID_KEY: string = "i";

/**
 * Name of the table in the database that contains the AutoGold email document.
 */
export const AUTO_GOLD_COLLECTION: string = "AutoGold";

/**
 * Name of the table in the database that contains the PromoCode --> UID documents.
 */
export const PROMO_CODE_COLLECTION: string = "PromoCodes";

/**
 * Name of the table in the database that contains a list of uids associated with 
 * users who have opted in to receive email feedback.
 */
export const EMAIL_FEEDBACK_COLLECTION: string = "EmailFeedback";

/**
 * Name of the document in the database that contains the list of auto gold emails.
 */
export const GOLD_EMAIL_DOC: string = "Emails";

/**
 * Key used as the property name of the key/value pair stored in the database 
 * at AUTO_GOLD_COLLECTION/GOLD_EMAIL_DOC that contains the stringified array of 
 * user emails.
 */
export const GOLD_EMAIL_KEY: string = "ge";


/**
 * This code is triggered anytime that any data for a log is modified in our database. In that case,
 * the user's current weight will change in the context of that log. If the log modified is the user's
 * main log, then the user's profile weight should be updated to match the current weight of the log that
 * was modified. It is also important to note that the needToUpdateTDEE flag is purposely not flipped to 
 * avoid recalculating a new baseline TDEE which would invalidate how the algorithm works.
 */
export const nutritionLogEditedTriggerBody = async (snap: any, context: any) => {
    const uid: string = context.params.userID;
    const logEditedID: number = context.params.nutrLogID;
    const userThatOwnsLog: UserProfile = await getUserProfileFromUID(uid);
    const userMainlogId = userThatOwnsLog.mainNutrLogId;
    const logEditedIsMainLog: boolean = (userMainlogId == logEditedID);
    if (logEditedIsMainLog) {
        const mainLog: NutritionLog = await (helper.getNutrLogFromLogId(uid, (logEditedID + "")))
        const payLoad: EnergyPayload = await algo.getEnergyPayload(mainLog, userThatOwnsLog);
        const currentWeightForLogEdited: number = payLoad.currentWeight;
        const currentWeightIsOutOfSync: boolean = (userThatOwnsLog.weight_lbs != currentWeightForLogEdited);
        const currentWeightIsNotNull: boolean = (currentWeightForLogEdited != energy.INSUFFICIENT_DATA);
        const shouldUpdateUsersWeight = (currentWeightIsOutOfSync && currentWeightIsNotNull);
        const shouldUpdateUsersTDEE: boolean = (payLoad.estimatedTDEE != userThatOwnsLog.estimatedTDEE);
        if (shouldUpdateUsersWeight) {
            userThatOwnsLog.weight_lbs = currentWeightForLogEdited;
        }
        if (shouldUpdateUsersTDEE) {
            userThatOwnsLog.estimatedTDEE = payLoad.estimatedTDEE;
        }
        const needToUpdateUser: boolean = (shouldUpdateUsersTDEE || shouldUpdateUsersWeight);
        if (needToUpdateUser) {
            await updateUserInDB(userThatOwnsLog, uid);
        }
    }
};
export const nutritionLogEditedTrigger = functions
    .runWith(functionWrappers.increaseRuntimeOpts)
    .firestore.document('NutritionLogs/{userID}/entries/{nutrLogID}')
    .onWrite(nutritionLogEditedTriggerBody);

/**
 * This code is triggered anytime that any UserProfile in our database is updated. In that event, the state of the 
 * user profile is read from the database. If the user profile is marked as needing to estimate their TDEE, then 
 * a request is made to our ML model to estimate their TDEE. The flag for needing to re-estimate is then marked as
 * false to prevent an infinite loop of TDEE estimation. Another check is done based upon the tierName and status 
 * properties of the user profile. Based upon those two properties, the correct tier permissions information is 
 * constructed and compared to the tier permissions of the UserProfile object in the database. If they are different
 * then the constructed permissions are written to the database. If nothing is different, then no writes are performed.
 */
export const userUpdatedTriggerBody = async (snap: any, context: any) => {
    const UID = context.params.userID;
    const userProfile: UserProfile = await getUserProfileFromUID(UID);
    const needsToUpdateTDEE: boolean = (userProfile.needToUpdateTDEE == true);
    if (needsToUpdateTDEE) {
        const newUserTDEE = await rfrModel.getEstimatedTDEE(userProfile);
        userProfile.estimatedTDEE = newUserTDEE;
        userProfile.needToUpdateTDEE = false;
    }
    const expectedPermissions: any = tierManager.getUserTier(userProfile.subscriptionTier, userProfile.subscriptionStatus);
    const actualPermissions: any = userProfile.tierPermissions;
    const needsNewPermissions: boolean = (expectedPermissions != actualPermissions);
    if (needsNewPermissions) {
        userProfile.tierPermissions = expectedPermissions;
    }
    await payments.keepSubscriptionDataInSync(userProfile);
    await updateEmailFeedbackCollection(userProfile, UID);
    const needToUpdateProfileInDB: boolean = (needsToUpdateTDEE || needsNewPermissions);
    if (needToUpdateProfileInDB) {
        await updateUserInDB(userProfile, UID);
    }
};
export const userUpdatedTrigger = functions
    .runWith(functionWrappers.increaseRuntimeOpts)
    .firestore.document('Users/{userID}')
    .onWrite(userUpdatedTriggerBody);

/**
 * This code is triggered anytime that a user's account is created and is responsible for setting the 
 * permissions and TDEE of the new UserProfile object that is stored in the database. Initially the 
 * permissions are always the free tier permissions unless the user's email is an autogold email. 
 * If the user's email is an autogold email, then they are assigned gold tier permissions and their
 * subscription tier name is set to the Gold tier.
 */
export const userCreatedTriggerBody = async (snap: any, context: any) => {
    const UID = context.params.userID;
    const userProfile: UserProfile = await getUserProfileFromUID(UID);
    const newUserTDEE = await rfrModel.getEstimatedTDEE(userProfile);
    userProfile.estimatedTDEE = newUserTDEE;
    userProfile.tierPermissions = tierManager.freeTierPermissions();
    userProfile.needToUpdateTDEE = false;
    const userDoesNotHaveEmailProperty: boolean = (userProfile.emailAddr == null);
    if (userDoesNotHaveEmailProperty) {
        userProfile.emailAddr = await getUserEmailFromDB(UID);
    }
    // This was done when moving to OS. We just don't really need people setting 
    // up stripe and Octobat to get this crap running. I left the old code
    // there but commented out in case people are interested.
    const isAutoGold: boolean = true;//await emailIsAutoGold(userProfile.emailAddr);
    if (isAutoGold) {
        userProfile.subscriptionTier = tierManager.GOLD_TIER_NAME;
        userProfile.tierPermissions = tierManager.goldTierPermissions();
        // if (userProfile?.userPreferences?.general?.currentTheme) {
        //     userProfile.userPreferences.general.currentTheme = "#edd768";
        // }

    }
    const promoCodeEnteredAtCreationTime: string = userProfile.referredBy;
    if (promoCodeEnteredAtCreationTime) {
        userProfile.referredBy = await getUIDFromPromoCode(promoCodeEnteredAtCreationTime);
    }
    await updateUserInDB(userProfile, UID);
};
export const userCreatedTrigger = functions
    .runWith(functionWrappers.increaseRuntimeOpts)
    .firestore.document('Users/{userID}')
    .onCreate(userCreatedTriggerBody);

/**
 * Marks a user's profile as deleted when their profile is deleted in the auth table. This 
 * signifies to the client that the user deleted their account on another device and that 
 * they should sign out of their current session if they are still signed into a long lasting 
 * session. This is because even though the user will not have an auth state, they will still 
 * be subscribed to changes to their profile. This is accomplished by adding a property to 
 * the UserProfile object that is used as a key to notify about delete events.
 */
export const userDeletedTriggerBody = async (user: any) => {
    const deletedUserId: string = user.uid;
    const deletedUserProfile: UserProfile = await getUserProfileFromUID(deletedUserId);
    deletedUserProfile.wasDeleted = true;
    if (deletedUserProfile.promoCode)
        await deletePromoCode(deletedUserProfile.promoCode);
    await updateUserInDB(deletedUserProfile, deletedUserId);
};
export const userDeletedTrigger = functions
    .runWith(functionWrappers.increaseRuntimeOpts)
    .auth.user()
    .onDelete(userDeletedTriggerBody);

/**
 * Edits a user profile but only their preferences and demographic information.
 * Sensitive read only information is not updated like the user's stripe variables.
 * Inside the body of the request, it is expected there will be a user profile object. 
 * If the user profile exists, then a request is made to get the user's profiles current
 * state in the database. The information from the database is considered the ultimate 
 * source of state. This is compared to the user profile passed in as a paramter. If there
 * is a difference between the demographic information of the passed in user profile and the 
 * actual user profile then a flag is flipped to trigger a new TDEE calculation.
 * After that, username, height, age, weight, gender and TDEE are copied from the passed 
 * in profile to the actual user profile and the user profile in the database is updated.
 * On success, the function returns the new user profile.
 */
export const editUserProfileBody = (async (params: [functions.https.CallableContext, UserProfile]) => {
    const CONTEXT_IDX = 0;
    const DATA_IDX = 1;
    const context = params[CONTEXT_IDX];
    const data: any = params[DATA_IDX];
    const user: UserProfile = data.user;
    const newTDEE: number = user.estimatedTDEE;
    const uid: string = getUIDFromContext(context);
    const newUserProfile: UserProfile = user;
    const actualUserProfile: UserProfile = await getUserProfile(context);
    const justSettingHasLoggedIn: boolean = data.setHasLoggedInBefore;
    if (!justSettingHasLoggedIn) {
        const demographicInfoHasChanged: boolean = checkIfUserDemographicInfoChanged(newUserProfile, actualUserProfile);
        const userManuallyChangedMaintenanceKcal: boolean = (newTDEE != actualUserProfile.estimatedTDEE && newTDEE != null);
        if (demographicInfoHasChanged && !userManuallyChangedMaintenanceKcal) {
            actualUserProfile.needToUpdateTDEE = true;
        }
        else if (userManuallyChangedMaintenanceKcal) {
            actualUserProfile.estimatedTDEE = newTDEE;
        }
        actualUserProfile.username = newUserProfile.username;
        actualUserProfile.isMale = newUserProfile.isMale;
        actualUserProfile.age = newUserProfile.age;
        actualUserProfile.weight_lbs = newUserProfile.weight_lbs;
        actualUserProfile.height_inches = newUserProfile.height_inches;
        actualUserProfile.activityLevel = newUserProfile.activityLevel;
        actualUserProfile.userPreferences = newUserProfile.userPreferences;
        actualUserProfile.mainNutrLogId = newUserProfile.mainNutrLogId;
        actualUserProfile.emailAddr = await getUserEmailFromDB(uid);
    } else {
        actualUserProfile.hasLoggedInBefore = true;
    }
    actualUserProfile.lastEdit = (new Date()).getTime();
    await updateUserInDB(actualUserProfile, uid);
    return {
        updatedUserProfile: actualUserProfile
    };
});
export const editUserProfile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const editUserParams = [context, data];
    const editedProfile = await functionWrappers.authenticatedCloudFunctionWrapper(context, editUserProfileBody, editUserParams);
    return editedProfile
});

/**
 * Edits a user profile but only their promo code.
 * In the body of the request, it is expected that their will be a user profile object.
 * If the user profile exists, then a request is made to get the user's profiles current state in the database.
 * If user profile had a gold subscription tier, 
 * the new user promo code does not match one associated with their user profile in the database,
 * and the promo code they are trying to set is not already in use,
 * Then we will update the promoCode associated with their uid in the promoCodes table,
 * AND update the promoCode field of the UserProfile object stored in the Users table in the DB.
 * This function returns the a actualUser profile which will have the updated promoCode if successful.
 */
export const editUserPromoCodeBody = (async (params: [functions.https.CallableContext, UserProfile]) => {
    const CONTEXT_IDX = 0;
    const USER_IDX = 1;
    const context = params[CONTEXT_IDX];
    const user: UserProfile = params[USER_IDX];
    const uid: string = getUIDFromContext(context);
    const newUserProfile: UserProfile = user;
    const actualUserProfile: UserProfile = await getUserProfile(context);
    let error = 'Only GOLD can users can set promo codes.';
    if (actualUserProfile.subscriptionTier == tierManager.GOLD_TIER_NAME) {
        error = 'You currently have this promo code.';
        if (newUserProfile.promoCode != actualUserProfile.promoCode) {
            const codeInUse = await promoCodeInUse(newUserProfile.promoCode);
            error = 'This promo code is currently in use.';
            if (!codeInUse) {
                actualUserProfile.promoCode = newUserProfile.promoCode;
                await updatePromoCodeInDB(actualUserProfile.promoCode, uid);
                await updateUserInDB(actualUserProfile, uid);
                return { errMsg: undefined };
            }
        }
    }
    return { errMsg: error };
});
export const editUserPromoCode = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const editUserPromoCodeParams = [context, data.user];
    const editedProfile = await functionWrappers.authenticatedCloudFunctionWrapper(context, editUserPromoCodeBody, editUserPromoCodeParams);
    return editedProfile;
});

/**
 * Helper function for determining if the user profiles demographic information changed.
 * This is true if the user's height, age, weight, gender or activity level has changed.
 * Otherwise this function will return false. This function is used to avoid making 
 * uneccessary calls to our RFR model. This greatly speeds up the reponse time of the 
 * editUserProfile cloud function.
 * 
 * @param newUserProfile the new users state 
 * @param userState   true state of the user profile from the DB
 */
export const checkIfUserDemographicInfoChanged = (newUserProfile: UserProfile, userState: UserProfile): boolean => {
    const ageIsDifferent: boolean = newUserProfile.age != userState.age;
    const heightIsDifferent: boolean = newUserProfile.height_inches != userState.height_inches;
    const weightIsDifferent: boolean = newUserProfile.weight_lbs != userState.weight_lbs;
    const activityIsDifferent: boolean = newUserProfile.activityLevel != userState.activityLevel;
    const genderIsDifferent: boolean = newUserProfile.isMale != userState.isMale;
    const infoChanged: boolean = (ageIsDifferent || heightIsDifferent || weightIsDifferent || activityIsDifferent || genderIsDifferent);
    return infoChanged;
}

/**
 * Returns the email associated with a firebase firestore UID. 
 * 
 * @param uid UID of the user to get the email of.
 */
export const getUserEmailFromDB = async (uid: any): Promise<string> => {
    let userEmail: string;
    await Profile.auth().getUser(uid).then(snap => {
        if (snap.email) {
            userEmail = snap.email;
        }
    });
    return userEmail;
}

/**
 * Returns user id from a firebase.auth.context object. If UID is not found, returns null.
 * 
 * @param context firebase auth context to get UID from.
 */
export const getUIDFromContext = (context: any) => {
    if (context && context.auth && context.auth.uid) {
        return context.auth.uid + "";
    } else {
        return null;
    }
}

/**
 * Returns a reference to the result of a user profile update operation as a promise.
 * This allows other functions wait for the update operation to complete before proceeding,
 * 
 * @param userProfile UserProfile object to replace.
 * @param uid Firebase firestore uid linked to a UserProfile.
 */
export const updateUserInDB = (userProfile: any, uid: any): Promise<FirebaseFirestore.WriteResult> => {
    return Profile.firestore().collection('Users').doc(uid).set({ [USER_PROF_STORAGE_KEY]: JSON.stringify(userProfile) });
}

/**
 * Returns a reference to the result of a promo code update operation as a promise.
 * This allows other functions wait for the update opreration to complete before proceeding.
 * Also removes the previous promo code associated with the given uid.
 * 
 * @param promoCode promoCode document to replace 
 * @param uid Firebase firestore uid linked to the UserProfile that owns this promoCode
 */
export const updatePromoCodeInDB = async (promoCode: any, uid: any): Promise<FirebaseFirestore.WriteResult> => {
    const currentUser = await getUserProfileFromUID(uid);
    if (currentUser.promoCode)
        Profile.firestore().collection('PromoCodes').doc(currentUser.promoCode).delete();
    return Profile.firestore().collection('PromoCodes').doc(promoCode).set({ [ENTRY_ID_KEY]: uid });
}

/**
 * Updates the EmailFeedback collection when a user changes their email feedback preference.
 * If the user has opted in to receive emails and they are a premium user, 
 * they will be added to the collection if they haven't been already.
 * If the user has opted out of receiving emails or they are not a premium user,
 * and they are in the collection, they will be removed.
 * 
 * @param userProfile the updated user profile
 * @param uid the uid associated with the updated user profile
 */
export const updateEmailFeedbackCollection = async (userProfile: any, uid: any): Promise<void> => {
    const uidRef = Profile.firestore().collection(EMAIL_FEEDBACK_COLLECTION).doc(uid);
    const emailNotificationsEnabled = userProfile.userPreferences?.general?.emailNotifications;
    const isPremiumTier = userProfile.subscriptionTier != tierManager.FREE_TIER_NAME;
    await uidRef.get()
        .then((snapshot) => {
            if (snapshot.exists && (!emailNotificationsEnabled || !isPremiumTier)) {
                uidRef.delete();
            } else if (!snapshot.exists && (emailNotificationsEnabled && isPremiumTier)) {
                uidRef.set({ "email": userProfile.emailAddr });
            }
        });
}

/**
 * Returns a UserProfile from a firebase auth context object. 
 * This function can be used to figure out which user is 
 * calling a cloud function.
 * 
 * @param context Firebase firestore auth context from a callable function.
 */
export const getUserProfile = async (context: any): Promise<UserProfile> => {
    const uid = getUIDFromContext(context);
    let userProfile: any = await getUserProfileFromUID(uid);
    return userProfile;
}

/**
 * Returns the UserProfile object associated with a firebase firestore uid.
 * 
 * @param uid UID associated with a UserProfile object.
 */
export const getUserProfileFromUID = async (uid: any): Promise<UserProfile> => {
    let userProfile: any = null;
    await Profile.firestore().collection('Users').doc(uid).get().then(snapshot => {
        userProfile = convertUserProfileFromSnapshot(snapshot);
    });
    return userProfile;
}

/**
 * Returns the uid associated with a promoCode in the PromoCodes collection in firestore.
 * 
 * @param promoCode promoCode associated with a UID
 */
export const getUIDFromPromoCode = async (promoCode: any): Promise<string> => {
    let uid: string;
    await Profile.firestore().collection('PromoCodes').doc(promoCode).get().then(snapshot => {
        uid = convertUIDFromSnapshot(snapshot);
    });
    return uid;
};

/**
 * Converts a snapshot of a document in our database that is a user profile
 * in storage format into a user profile object. 
 * 
 * @param userSnap Snapshot of user profile in storage format
 */
export const convertUserProfileFromSnapshot = (userSnap: any): UserProfile => {
    try {
        let user: any = userSnap.data();
        user = user[USER_PROF_STORAGE_KEY];
        user = JSON.parse(user);
        return user;
    } catch (error) {
        return null;
    }
}

/**
 * Converts a snapshot of a document in our database that is a uid
 * in storage format into a user profile object.
 * 
 * @param uidSnap Snapshot of the uid in storage format
 */
export const convertUIDFromSnapshot = (uidSnap: any): string => {
    try {
        let uid: any = uidSnap.data();
        uid = uid[ENTRY_ID_KEY];
        return uid;
    } catch (error) {
        return null;
    }
}

/**
 * Returns the UserProfile object associated with the passed in email addres.
 * If the user cannot be found by their email address, then null is returned.
 */
export const getUIDFromEmail = async (userEmail: string): Promise<any> => {
    try {
        return (await (admin.auth().getUserByEmail(userEmail))).uid;
    } catch (error) {
        return null;
    }
}

/**
 * Returns true if the user's email is contained in the list of AutoGold
 * emails, false otherwise. The AutoGold emails are contained in a table in
 * database that must be edited by a developer. This function will be called
 * at account creation time and if the function returns true, then the user's
 * account tier name should be set equal to gold. That way their profiles
 * permissions will be set equal to the gold tier permissions.
 */
export const emailIsAutoGold = async (userEmail: string): Promise<boolean> => {
    let isAutoGold: boolean = false;
    try {
        const emailDocSnapshot = await Profile.firestore().collection(AUTO_GOLD_COLLECTION).doc(GOLD_EMAIL_DOC).get();
        const emailList: string[] = JSON.parse(emailDocSnapshot.data()[GOLD_EMAIL_KEY]);
        const lowerCaseEmail = userEmail.toLowerCase();
        const lowerCaseEmailList = emailList.map(email => email.toLowerCase());
        isAutoGold = lowerCaseEmailList.includes(lowerCaseEmail);
    } catch (error) {
        isAutoGold = false;
    }
    return isAutoGold;

}

/**
 * Returns false if the given promoCode does not exist in the PromoCodes collection in firestore, true otherwise.
 * 
 * @param promoCode string name of a promo code document
 */
export const promoCodeInUse = async (promoCode: string): Promise<boolean> => {
    const doc = await Profile.firestore().collection(PROMO_CODE_COLLECTION).doc(promoCode).get();
    return doc.exists;
}

/**
 * Removes the given promo code document associated with given promo code from the promo codes collection.
 * 
 * @param promoCode string name of a promo code document
 */
export const deletePromoCode = async (promoCode: string): Promise<void> => {
    await Profile.firestore().collection(PROMO_CODE_COLLECTION).doc(promoCode).delete();
}
