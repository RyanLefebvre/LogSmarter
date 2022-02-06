
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as profile from './profile';
import * as converter from '../services/converter';
import * as calc from '../services/algorithm/logStatCalculator';
import * as constants from '../constants/energyConstants';
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as functionWrappers from './cloudfunction';
import { parseAsync } from 'json2csv';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile } from '../classes/user-profile';
import * as payments from './payments';
import { NutritionLog } from '../classes/nutrition-log';
import { DayEntry } from '../classes/day-entry';
import * as environment from '../services/environment';
import * as platforms from '../constants/platforms';
import * as tiers from './tiers';

/**
 * Key used for NutritionLog collection in our firestore database where entries and logs are stored.
 */
export const NUTR_COL: string = "NutritionLogs";

/**
* Key used for LogSummary collection stored under our parent NutritionLog collection.
*/
export const LOG_SUM_COL: string = "logs";

/**
 * Storage key used for nutrition log summaries.
 */
export const LOG_SUM_KEY: string = "l";

/**
* Key used for DayEntry collection stored under our parent NutritionLog collection.
*/
export const DAY_ENTRIES_COL: string = "entries";

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
* Key used for shrinking the TDEE field of a day entry.
*/
export const ENTRY_TDEE: string = "t";

/**
* Key used for shrinking the goal intake field of a day entry.
*/
export const ENTRY_GOAL_INTAKE: string = "g";

/**
 * Cron job syntax for 12:00 millitary time on sunday. Used for 
 * sending email reprots 
 */
export const NOON_SUNDAY: string = "0 12 * * 0";

/**
 * Cron job syntax for every minute doing something.
 * Used for testing so we dont have to wait forever.
 */
export const EVERY_MINUTE: string = "every 1 minutes";

/**
 * Any functions or logic that is for internal use and should not be exposed to end users will be stored 
 * here. An example of this includes creating automated export jobs of our DB that will dump all of our 
 * user's profile information into a CSV which we can run analyses on.
 *
 * Last edited by: Ryan Lefebvre 1/4/21
 */

/**
 * This function is triggered manually and will export all of our user's information to a CSV file which 
 * we can use to run analyses on. This is intended for internal use only and will not be exposed to 
 * end users. The results of the analyses run on exported data may or may not be available to end users.
 * When this function is triggered, its output is written to our firestore storage bucket.
 * 
 * Easiest way to trigger this is by going to google cloud platform. Going to the pub sub page and 
 * pressing the send message button, then sending a blank message for the pub sub topic. This will result
 * in the CSV being generated and put in the Log-Smarter default storage bucket which can be accessed from 
 * the firebase firestore console.
 * 
 * Inspired by: https://medium.com/@shangyilim/exporting-firestore-collection-csv-into-cloud-storage-on-demand-the-easy-way-4a4a08c664ab
 */
export const exportAllUsers = functions.pubsub.topic("read-all-users").onPublish(async message => {
    const allUsersSnapshot = await admin.firestore().collection("Users").get();
    const allUsers: UserProfile[] = allUsersSnapshot.docs.map(userSnap => profile.convertUserProfileFromSnapshot(userSnap));
    await exportUserInfo(allUsers);
    await exportUserDemoStats(allUsers);
});

/**
 * Calculates and exports a collection of statistics that can provide insight on our 
 * customer base. The statistics calculated are proportions of each gender and activity 
 * level. Min, max and average of age, height, weight, tdee by population and by gender.
 * The number of premium customers and number of free customers. This function is 
 * extremely long and gross looking. There are definitely more compact ways to 
 * calculate these stats but I (Ryan), could not come up with a shorter and as easily 
 * maintainable way to calculate the stats. There seemed to be a clear trade off in the 
 * amount of development time that would be required and the complexity of maintaining the 
 * code that made the longer and grosser ( but simpler and easier to maintain) function being 
 * the best choice for this.
 * 
 * @param allUsers collection of all LogSmarter users 
 */
export const exportUserDemoStats = async (allUsers: UserProfile[]) => {
    allUsers = allUsers.filter(user => user != null);
    //User Groups
    //  By user type
    const individualUsers: UserProfile[] = allUsers.filter((user: UserProfile) => ((user as any).specialUserType) == null);

    //  By gender
    const maleUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.isMale == true);
    const femaleUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.isMale == false);
    const usersWithUnknownGender: UserProfile[] = individualUsers.filter((user: UserProfile) => user.isMale != false && user.isMale != true);

    // By subscription type 
    const premiumIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.subscriptionID != null);
    const freeIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.subscriptionID == null);
    const malePremiumUsers: UserProfile[] = premiumIndividualUsers.filter((user: UserProfile) => user.isMale == true);
    const femalePremiumUsers: UserProfile[] = premiumIndividualUsers.filter((user: UserProfile) => user.isMale == false);

    //active and inactive users 
    const totalPremiumIosIndividualUsers: UserProfile[] = premiumIndividualUsers.filter((user: UserProfile) => user.subPlatform == platforms.PLATFORM_iOS);
    const totalPremiumAndroidIndividualUsers: UserProfile[] = premiumIndividualUsers.filter((user: UserProfile) => user.subPlatform == platforms.PLATFORM_ANDROID);
    const totalPremiumWebIndividualUsers: UserProfile[] = premiumIndividualUsers.filter((user: UserProfile) => user.subPlatform == platforms.PLATFORM_WEB);

    //active users only
    const totalActivePremiumIndividualUsers: UserProfile[] = premiumIndividualUsers.filter((user: UserProfile) => user.subscriptionStatus == tiers.SUBSCRIPTION_STATUS_ACTIVE);
    const totalActivePremiumIosIndividualUsers: UserProfile[] = totalActivePremiumIndividualUsers.filter((user: UserProfile) => user.subPlatform == platforms.PLATFORM_iOS);
    const totalActivePremiumAndroidIndividualUsers: UserProfile[] = totalActivePremiumIndividualUsers.filter((user: UserProfile) => user.subPlatform == platforms.PLATFORM_ANDROID);
    const totalActivePremiumWebIndividualUsers: UserProfile[] = totalActivePremiumIndividualUsers.filter((user: UserProfile) => user.subPlatform == platforms.PLATFORM_WEB);

    // By activity level 
    const unknownActivityLevelIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.activityLevel == null);
    const sedentaryIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.activityLevel == constants.ACTIVITY_LEVEL_SEDENTARY);
    const lightlyActiveIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.activityLevel == constants.ACTIVITY_LEVEL_LIGHTLY_ACTIVE);
    const activeIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.activityLevel == constants.ACTIVITY_LEVEL_ACTIVE);
    const veryActiveIndividualUsers: UserProfile[] = individualUsers.filter((user: UserProfile) => user.activityLevel == constants.ACTIVITY_LEVEL_VERY_ACTIVE);
    // Mapped to demographic values by total and gender (null vals filtered out )
    //  age
    const userAges: number[] = individualUsers.filter((user: UserProfile) => user.age != null).map((user: UserProfile) => user.age);
    const maleUserAges: number[] = maleUsers.filter((user: UserProfile) => user.age != null).map((user: UserProfile) => user.age);
    const femaleUserAges: number[] = femaleUsers.filter((user: UserProfile) => user.age != null).map((user: UserProfile) => user.age);
    //  height
    const userHeights: number[] = individualUsers.filter((user: UserProfile) => user.height_inches != null).map((user: UserProfile) => user.height_inches);
    const maleUserHeights: number[] = maleUsers.filter((user: UserProfile) => user.height_inches != null).map((user: UserProfile) => user.height_inches);
    const femaleUserHeights: number[] = femaleUsers.filter((user: UserProfile) => user.height_inches != null).map((user: UserProfile) => user.height_inches);
    //  weight
    const userWeights: number[] = individualUsers.filter((user: UserProfile) => user.weight_lbs != null).map((user: UserProfile) => user.weight_lbs);
    const maleUserWeights: number[] = maleUsers.filter((user: UserProfile) => user.weight_lbs != null).map((user: UserProfile) => user.weight_lbs);
    const femaleUserWeights: number[] = femaleUsers.filter((user: UserProfile) => user.weight_lbs != null).map((user: UserProfile) => user.weight_lbs);
    //  TDEE
    const userTDEEs: number[] = individualUsers.filter((user: UserProfile) => user.estimatedTDEE != null).map((user: UserProfile) => user.estimatedTDEE);
    const maleUserTDEEs: number[] = maleUsers.filter((user: UserProfile) => user.estimatedTDEE != null).map((user: UserProfile) => user.estimatedTDEE);
    const femaleUserTDEEs: number[] = femaleUsers.filter((user: UserProfile) => user.estimatedTDEE != null).map((user: UserProfile) => user.estimatedTDEE);

    const userProfileExportHeaders: string[] = [
        'totalFreeIndividualUsers',
        'totalPremiumIndividualUsers',
        'totalActivePremiumIndividualUsers',
        'totalPremiumIndividualWebUsers',
        'totalActivePremiumIndividualWebUsers',
        'totalPremiumIndividualAndroidUsers',
        'totalActivePremiumIndividualAndroidUsers',
        'totalPremiumIndividualIosUsers',
        'totalActivePremiumIndividualIosUsers',
        'totalMales',
        'totalFemales',
        'totalGenderUnknown',
        'percentMalesIndividual',
        'percentFemalesIndividual',
        'percentGenderUnknownIndividual',
        'totalMalePremiumIndividualUsers',
        'totalFemalePremiumIndividualUsers',
        'percentMalePremiumIndividualUsers',
        'percentFemalePremiumIndividualUsers',
        'minAge',
        'maxAge',
        'AvgAge',
        'minMaleAge',
        'maxMaleAge',
        'AvgMaleAge',
        'minFemaleAge',
        'maxFemaleAge',
        'AvgFemaleAge',
        'minWeightPounds',
        'maxWeightPounds',
        'AvgWeightPounds',
        'minMaleWeightPounds',
        'maxMaleWeightPounds',
        'AvgMaleWeightPounds',
        'minFemaleWeightPounds',
        'maxFemaleWeightPounds',
        'AvgFemaleWeightPounds',
        'minHeightInches',
        'maxHeightInches',
        'AvgHeightInches',
        'minMaleHeightInches',
        'maxMaleHeightInches',
        'AvgMaleHeightInches',
        'minFemaleHeightInches',
        'maxFemaleHeightInches',
        'AvgFemaleHeightInches',
        'minTDEE',
        'maxTDEE',
        'AvgTDEE',
        'minMaleTDEE',
        'maxMaleTDEE',
        'AvgMaleTDEE',
        'minFemaleTDEE',
        'maxFemaleTDEE',
        'AvgFemaleTDEE',
        'totalActivityLevelUnknown',
        'totalActivityLevelSedentary',
        'totalActivityLevelLightlyActive',
        'totalActivityLevelActive',
        'totalActivityLevelVeryActive',
        'percentActivityLevelUnknown',
        'percentActivityLevelSedentary',
        'percentActivityLevelLightlyActive',
        'percentActivityLevelActive',
        'percentActivityLevelVeryActive'
    ];
    const demoData: any[] = [{
        'totalFreeIndividualUsers': freeIndividualUsers.length,
        'totalPremiumIndividualUsers': premiumIndividualUsers.length,
        'totalActivePremiumIndividualUsers': totalActivePremiumIndividualUsers.length,
        'totalPremiumIndividualWebUsers': totalPremiumWebIndividualUsers.length,
        'totalActivePremiumIndividualWebUsers': totalActivePremiumWebIndividualUsers.length,
        'totalPremiumIndividualAndroidUsers': totalPremiumAndroidIndividualUsers.length,
        'totalActivePremiumIndividualAndroidUsers': totalActivePremiumAndroidIndividualUsers.length,
        'totalPremiumIndividualIosUsers': totalPremiumIosIndividualUsers.length,
        'totalActivePremiumIndividualIosUsers': totalActivePremiumIosIndividualUsers.length,
        'totalMales': maleUsers.length,
        'totalFemales': femaleUsers.length,
        'totalGenderUnknown': usersWithUnknownGender.length,
        'percentMalesIndividual': getPercent(individualUsers.length, maleUsers.length),
        'percentFemalesIndividual': getPercent(individualUsers.length, femaleUsers.length),
        'percentGenderUnknownIndividual': getPercent(individualUsers.length, usersWithUnknownGender.length),
        'totalMalePremiumIndividualUsers': malePremiumUsers.length,
        'totalFemalePremiumIndividualUsers': femalePremiumUsers.length,
        'percentMalePremiumIndividualUsers': getPercent(premiumIndividualUsers.length, malePremiumUsers.length),
        'percentFemalePremiumIndividualUsers': getPercent(premiumIndividualUsers.length, femalePremiumUsers.length),
        'minAge': calc.getMin(userAges),
        'maxAge': calc.getMax(userAges),
        'AvgAge': converter.roundNumberToOneDecimalPlace(calc.getAvg(userAges)),
        'minMaleAge': calc.getMin(maleUserAges),
        'maxMaleAge': calc.getMax(maleUserAges),
        'AvgMaleAge': converter.roundNumberToOneDecimalPlace(calc.getAvg(maleUserAges)),
        'minFemaleAge': calc.getMin(femaleUserAges),
        'maxFemaleAge': calc.getMax(femaleUserAges),
        'AvgFemaleAge': converter.roundNumberToOneDecimalPlace(calc.getAvg(femaleUserAges)),
        'minWeightPounds': calc.getMin(userWeights),
        'maxWeightPounds': calc.getMax(userWeights),
        'AvgWeightPounds': converter.roundNumberToOneDecimalPlace(calc.getAvg(userWeights)),
        'minMaleWeightPounds': calc.getMin(maleUserWeights),
        'maxMaleWeightPounds': calc.getMax(maleUserWeights),
        'AvgMaleWeightPounds': converter.roundNumberToOneDecimalPlace(calc.getAvg(maleUserWeights)),
        'minFemaleWeightPounds': calc.getMin(femaleUserWeights),
        'maxFemaleWeightPounds': calc.getMax(femaleUserWeights),
        'AvgFemaleWeightPounds': converter.roundNumberToOneDecimalPlace(calc.getAvg(femaleUserWeights)),
        'minHeightInches': calc.getMin(userHeights),
        'maxHeightInches': calc.getMax(userHeights),
        'AvgHeightInches': converter.roundNumberToOneDecimalPlace(calc.getAvg(userHeights)),
        'minMaleHeightInches': calc.getMin(maleUserHeights),
        'maxMaleHeightInches': calc.getMax(maleUserHeights),
        'AvgMaleHeightInches': converter.roundNumberToOneDecimalPlace(calc.getAvg(maleUserHeights)),
        'minFemaleHeightInches': calc.getMin(femaleUserHeights),
        'maxFemaleHeightInches': calc.getMax(femaleUserHeights),
        'AvgFemaleHeightInches': converter.roundNumberToOneDecimalPlace(calc.getAvg(femaleUserHeights)),
        'minTDEE': calc.getMin(userTDEEs),
        'maxTDEE': calc.getMax(userTDEEs),
        'AvgTDEE': converter.roundNumberToOneDecimalPlace(calc.getAvg(userTDEEs)),
        'minMaleTDEE': calc.getMin(maleUserTDEEs),
        'maxMaleTDEE': calc.getMax(maleUserTDEEs),
        'AvgMaleTDEE': converter.roundNumberToOneDecimalPlace(calc.getAvg(maleUserTDEEs)),
        'minFemaleTDEE': calc.getMin(femaleUserTDEEs),
        'maxFemaleTDEE': calc.getMax(femaleUserTDEEs),
        'AvgFemaleTDEE': converter.roundNumberToOneDecimalPlace(calc.getAvg(femaleUserTDEEs)),
        'totalActivityLevelUnknown': unknownActivityLevelIndividualUsers.length,
        'totalActivityLevelSedentary': sedentaryIndividualUsers.length,
        'totalActivityLevelLightlyActive': lightlyActiveIndividualUsers.length,
        'totalActivityLevelActive': activeIndividualUsers.length,
        'totalActivityLevelVeryActive': veryActiveIndividualUsers.length,
        'percentActivityLevelUnknown': getPercent(individualUsers.length, unknownActivityLevelIndividualUsers.length),
        'percentActivityLevelSedentary': getPercent(individualUsers.length, sedentaryIndividualUsers.length),
        'percentActivityLevelLightlyActive': getPercent(individualUsers.length, lightlyActiveIndividualUsers.length),
        'percentActivityLevelActive': getPercent(individualUsers.length, activeIndividualUsers.length),
        'percentActivityLevelVeryActive': getPercent(individualUsers.length, veryActiveIndividualUsers.length),
    }]
    await writeToBucketAsCSV("LogSmarterUserStats", userProfileExportHeaders, demoData);
};

/**
 * Checks if an operation would try to divide by zero, if the operation would divide by 
 * zero, then the string 'NO_DATA' is returned, otherwise the passed in numerator is divided
 * by the denominator and multiplied by 100 to calculate a percentage. This function helps 
 * avoid divide by zero errors with a low number of users that would affect the ability to 
 * export statistics.
 */
const getPercent = (denominator: number, numerator: number): any => {
    const CANT_CALC: string = "NO_DATA";
    if (denominator == 0) {
        return CANT_CALC;
    }
    else {
        return converter.roundNumberToOneDecimalPlace((numerator / denominator) * 100);
    }
}

/**
 * Converts the list of all the users in the application into a dataset that can be converted
 * into a csv. Creates the column headers for the dataset and creates a CSV that is written 
 * to the projects default storage bucket. 
 */
export const exportUserInfo = async (allUsers: UserProfile[]) => {
    const allUsersAsRows: any[] = allUsers.map(user => convertUserProfileIntoDatasetRow(user)).filter(user => user != null);
    const userProfileExportHeaders: string[] = [
        'username',
        'emaillAddr',
        'userType',
        'receiveEmails',
        'dateCreated',
        'numberSystemIsImperial',
        'isMale',
        'age',
        'weight_lbs',
        'height_inches',
        'activity_level',
        'estimatedTDEE',
        'subscriptionTier',
        'subscriptionID',
        'subscriptionStatus',
        'subPlatform',
        'promoCode',
        'referredBy',
        'numReferrals',
        'heardAbout'
    ];
    await writeToBucketAsCSV("LogSmarterUserProfiles", userProfileExportHeaders, allUsersAsRows);
}

/**
 * Converts a user profile object into a JSON that can be parsed and 
 * exported as a row in our dataset that is generated when we run the 
 * batch jobs that export all of our user's information. If any error
 * occurs while converting the user's profile, then null is returned.
 * 
 * Need to make sure that all property names for this object match the 
 * header names for columns in the exportAllUsers function.
 * 
 * @param user UserProfile to convert into exportable format
 */
export const convertUserProfileIntoDatasetRow = (user: UserProfile): any => {
    try {
        let createDate: any = user.dateCreated;
        if (createDate) {
            createDate = new Date(createDate).toDateString();
        }
        let userType: string = ((user as any).specialUserType)
        if (!userType) {
            userType = "individual"
        }
        return {
            'username': user.username,
            'emaillAddr': user.emailAddr,
            'userType': userType,
            'receiveEmails': user.userPreferences.general.emailNotifications,
            'dateCreated': createDate,
            'numberSystemIsImperial': user.userPreferences.general.isImperial,
            'isMale': user.isMale,
            'age': user.age,
            'weight_lbs': user.weight_lbs,
            'height_inches': user.height_inches,
            'activity_level': user.activityLevel,
            'estimatedTDEE': user.activityLevel,
            'subscriptionTier': user.subscriptionTier,
            'subscriptionID': user.subscriptionID,
            'subscriptionStatus': user.subscriptionStatus,
            'subPlatform': user.subPlatform,
            'promoCode': user.promoCode,
            'referredBy': user.referredBy,
            'numReferrals': user.numReferrals,
            'heardAbout': user.heardAboutUs,
        } as any;
    } catch (error) {
        return null;
    }
};

/**
 * Helper function creating and writing a CSV to our storage bucket. Will create a csv that 
 * has the properties specified by the params passed into this function in the projects 
 * default storage bucket.
 * 
 * @param csvName The name of the CSV.
 * @param csvColumnHeaders The names of the columns for the dataset.
 * @param csvData The data that makes up the dataset, aka the rows in the csv.
 */
export const writeToBucketAsCSV = async (csvName: string, csvColumnHeaders: string[], csvData: any[]): Promise<any> => {
    const options: any = { csvColumnHeaders };
    const csvOutput = await parseAsync(csvData, options);
    const filename = csvName + `_` + (new Date()).toDateString() + `.csv`;
    const tempLocalFile = path.join(os.tmpdir(), filename);
    return new Promise((resolve, reject) => {
        fs.writeFile(tempLocalFile, csvOutput, error => {
            if (error) {
                reject(error);
                return;
            }
            const bucket = admin.storage().bucket();
            bucket.upload(tempLocalFile, {
                // Workaround: firebase console not generating token for files
                // uploaded via Firebase Admin SDK
                // https://github.com/firebase/firebase-admin-node/issues/694
                metadata: {
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4(),
                    }
                },
            })
                .then(() => resolve())
                .catch(error => {
                    reject(error)
                });
        });
    });
}

/**
 * This pubsub iterates through the collection of IAP subscription owners and 
 * checks the status of their subscription, then updates their profiles 
 * subscription status if a subscription state change is necessary. This only happens
 * once per day.
 */
export const checkAllIAP = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
    console.log("Checking All Of The IAP Subscriptions");
    const allIAPSnapshots = await admin.firestore().collection("IAP").get();
    allIAPSnapshots.docs.forEach(async (iapDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
        try {
            const subId = iapDoc.id;
            const ownerUid: string = iapDoc.data()[payments.IAP_OWNER_KEY];
            const userProfile = await profile.getUserProfileFromUID(ownerUid);
            const usersCurrentSubIsThisSub: boolean = (userProfile.subscriptionID == subId);
            if (usersCurrentSubIsThisSub) {
                const iapData = {} as any;
                const iapContext = {
                    auth: {
                        uid: ownerUid
                    }
                } as any;
                await payments.checkSubStatusForIAPBody([iapContext, iapData]);
            }
        } catch (error) { }
    });
    console.log("Done checking IAP sub status bro");
});

/**
 * This function gathers all of the uids from the names of all of the documents in the EmailFeedback
 * collection and returns a list of the uids as strings. If the collection is empty this function will return an 
 * empty array/list. 
 */
export const getUIDsInFeedbackMailingList = async (): Promise<string[]> => {
    const allFeedbackUIDSnapshots = await admin.firestore().collection('EmailFeedback').get();
    return allFeedbackUIDSnapshots.docs.map(doc => doc.id) || [];
}

/**
 * Given a log ID and user ID, returns the complete log, i.e. the summary and entries 
 * combined from the database. If an error occurs, whatever portion of the 
 * log is available is returned.
 */
export const getNutrLogFromLogId = async (userId: string, logId: string): Promise<NutritionLog> => {
    const log: NutritionLog = new NutritionLog();
    try {
        await admin.firestore().collection(NUTR_COL).doc(userId).collection(LOG_SUM_COL).doc(logId).get().then(summarySnapshot => {
            const summaryData: any = summarySnapshot.data();
            const summaryObject: any = JSON.parse(summaryData[LOG_SUM_KEY]);
            if (summaryObject) {
                log.title = summaryObject.title;
                log.id = summaryObject.id;
                log.goal = summaryObject.goal;
                log.lastEdit = summaryObject.lastEdit;
                log.startTDEE = summaryObject.startTDEE;
            }
        });
    } catch (error) { console.log(error) }
    try {
        await admin.firestore().collection(NUTR_COL).doc(userId).collection(DAY_ENTRIES_COL).doc(logId).get().then(entriesSnapshot => {
            const entryData: any = entriesSnapshot.data();
            const entryObject: any = JSON.parse(entryData[ENTRY_LIST_STORAGE_KEY]);
            if (entryObject) {
                const entryList: DayEntry[] = entryObject.map((entryInStorageFormat: any) => {
                    const entrytoReturn = new DayEntry();
                    entrytoReturn.weight = entryInStorageFormat[ENTRY_WEIGHT_KEY];
                    entrytoReturn.calories = entryInStorageFormat[ENTRY_KCAL_KEY];
                    entrytoReturn.date = new Date(entryInStorageFormat[ENTRY_DATE_KEY]);
                    entrytoReturn.id = entryInStorageFormat[ENTRY_ID_KEY];
                    entrytoReturn.creationEstimatedTDEE = entryInStorageFormat[ENTRY_TDEE];
                    entrytoReturn.goalIntakeBoundaries = entryInStorageFormat[ENTRY_GOAL_INTAKE]
                    return entrytoReturn;
                });
                log.dayEntries = entryList;
            }
        });
    } catch (error) { console.log(error) }
    return log;
}

/**
 * Given the UID of a user, sends a weekly report email to the user if the user has 
 * a main log. This function assumes any UID passed in, should be receiving a report
 * email and does not check permissions.
 */
export const sendReportToUID = async (emailFeedbackUID: string): Promise<any> => {
    try {
        const userProfile: UserProfile = await profile.getUserProfileFromUID(emailFeedbackUID);
        const mainLogID: number = userProfile.mainNutrLogId;
        const userHasMainLogID: boolean = (mainLogID != null);
        if (userHasMainLogID) {
            const mainLog: NutritionLog = await getNutrLogFromLogId(emailFeedbackUID, mainLogID + "")
            const mainLogHasSomeEntries: boolean = (mainLog.dayEntries.length > 0);
            if (mainLogHasSomeEntries) {
                const emailReportEndpoint: string = environment.getUrlLsAPI() + "/email";
                const emailReportBody = {
                    userProfile: userProfile,
                    nutritionLog: mainLog
                };
                const emailReportOptions = {
                    headers: {
                        "X-LS-ApiKey": environment.getKeyLsAPI()
                    },
                    url: emailReportEndpoint,
                    method: 'POST',
                    body: emailReportBody,
                    json: true,
                };
                const retVal = await functionWrappers.httpRequest(emailReportOptions);
                return { body: emailReportBody, apiReturn: retVal, opts: emailReportOptions };
            }
        }
    }
    catch {
        return "something bad happened";
    }
};

/**
 * This pubsub iterates through the collection of users that have email reports enabled
 * and makes a request to the LogSmarter API to send them their weekly progress report.
 * The function assumes that all UIDS in the list of emails belong in the collection.
 * This is because the user updated trigger will keep that collection in sync whenever a 
 * user has their subscription tier upgraded or downgraded. This will prevent their profile
 * from sitting in the collection even wehn their account has lost premium permissions
 */
export const sendWeeklyReportsBody = async () => {
    console.log("Sending all of the email reports - schedule for SUNDAY 3pm est");
    const allEmailFeedbackUIDs: string[] = await getUIDsInFeedbackMailingList();
    allEmailFeedbackUIDs.forEach(async (emailFeedbackUID: string) => {
        try {
            await sendReportToUID(emailFeedbackUID);
        }
        catch (error) {
            // Catch any errors to prevent one error from preventing emails 
            // being sent to users following the user that caused the error
        }
    });
    console.log("Done Sending all of the email reports bro");
}
export const sendWeeklyReports = functions.pubsub.schedule(NOON_SUNDAY).onRun(async (context) => {
    await sendWeeklyReportsBody();
});


