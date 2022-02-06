import * as Tiers from '../src/services/tiers';
import * as Energy from '../src/constants/energyConstants';
import * as feedbackHelper from '../src/services/algorithm/feedback/general/fedbackHelper'
import { NutritionLog } from '../src/classes/nutrition-log';
import { DayEntry } from '../src/classes/day-entry';
import { UserProfile } from '../src/classes/user-profile';
import { Feedback } from '../src/classes/feedback';
import { FeedbackCategory } from '../src/classes/feedback-category';
import { EnergyPayload } from '../src/classes/energy-payload';

export const accountTiers = [
    {
        "name": "LS_FREE",
        "displayName": "Free",
        "showPrefs": false,
        "pricePerMonth": 0,
        "maxNumNutrLogs": 1,
        "maxEntriesPerLog": 14,
        "inDepthStats": false,
        "showResources": false
    },
    {
        "name": "PREMIUM",
        "displayName": "Premium",
        "showPrefs": true,
        "pricePerMonth": 4.99,
        "maxNumNutrLogs": 25,
        "maxEntriesPerLog": 365,
        "inDepthStats": true,
        "showResources": false
    },
    {
        "name": "GOLD",
        "displayName": "Gold",
        "showPrefs": true,
        "pricePerMonth": 0,
        "maxNumNutrLogs": 25,
        "maxEntriesPerLog": 365,
        "inDepthStats": true,
        "showResources": true
    }
];

/**
 * Returns a list of 25 randomly generated nutrition logs.
 */
export function getRandomListOfLogs(): NutritionLog[] {
    return getRandomListOfLogsOfLength(25);
}

/**
 * Creates a list of nutrition nutrition logs that contain
 * random data.
 * 
 * @param listLength Length of the list of logs returned.
 */
export function getRandomListOfLogsOfLength(listLength: number): NutritionLog[] {
    const logList: NutritionLog[] = [];
    for (let i = 0; i < listLength; i++) {
        logList.push(getRandomNutritionLog());
    }
    return logList;
}

/**
 * Creates a nutrition log initialized with random data.
 */
export function getRandomNutritionLog(): NutritionLog {
    const randLog: NutritionLog = new NutritionLog();
    randLog.dayEntries = getRandomEntryList();
    randLog.id = getRandomDate().getTime();
    randLog.title = "Log" + randLog.id;
    randLog.lastEdit = getRandomDate().getTime();
    randLog.goal = getRandomStringFrom(["muscleGain", "fatLoss", "maintain"]);
    return randLog;
}

/**
 * Returns a list of 100 random entries.
 */
export function getRandomEntryList(): DayEntry[] {
    return getRandomEntryListOfLength(100);
}

/**
 * Returns a list of random entries with random dates, random calories and 
 * random weights. List contains same number of entries specified as param.
 * 
 * @param listLength length of the list to get entries for.
 */
export function getRandomEntryListOfLength(listLength: number): DayEntry[] {
    const entries: DayEntry[] = [];
    for (let i = 0; i < listLength; i++) {
        entries[i] = getRandomEntry();
    }
    entries.sort((entry1: DayEntry, entry2: DayEntry) => {  //Force in chronological order 
        return entry1.id - entry2.id
    });
    return entries;
}

/**
 * Returns a single entry with random date, weight and calories.
 */
export function getRandomEntry(): DayEntry {
    const randEntry: DayEntry = new DayEntry();
    randEntry.date = getRandomDate();
    randEntry.id = randEntry.date.getTime();
    randEntry.calories = getRandomCalories();
    randEntry.weight = getRandomWeight();
    return randEntry;
}

/**
 * Returns a random value within the range of 
 * accpeted calorie intake values for a day entry.
 * Higher and lower values than this are acceptable for 
 * calorie intakes but we are trying to simulate what are considered 
 * relatively normal intakes with this function.
 */
export function getRandomCalories(): number {
    return getRandomWithinArbitraryRange(1750, 4500);
}

/**
 * Returns a random value within the range of 
 * accpeted body weight values for day entry or profile.
 */
export function getRandomWeight(): number {
    return getRandomWithinArbitraryRange(150, 300);
}

/**
 * Returns a random value within the range of 
 * accpeted age values for user profile.
 */
export function getRandomAge(): number {
    return getRandomWithinArbitraryRange(0, 999);
}

/**
 * Returns a random gender, true == male, false == female
 */
export function getRandomGender(): boolean {
    return getRandomFrom([true, false]);
}

/**
 * Returns a random username value.
 */
export function getRandomUsername(): string {
    return getRandomStringFrom(["Ryanlefeb33", "MatthewL49", "TjE44", "BenK4e6969420", "bRob4000", "BernieSanders", "Darth Vader", "Tom Brady", "Ash Ketchum"]);
}

/**
 * Returns a random email value.
 */
export function getRandomEmail(): string {
    return getRandomStringFrom(["legendaryBulker@gmail.com", "bigWinner@logsmarter.net", "ryan.lefebvre@yahoo.com", "BenFranklin@unh.edu", "BerniSanders@freeCollege.com", "SelenaGomez@disney.org"]);
}

/**
 * Returns a random activity level value.
 */
export function getRandomActivityLevel(): string {
    return getRandomStringFrom([
        Energy.ACTIVITY_LEVEL_ACTIVE,
        Energy.ACTIVITY_LEVEL_LIGHTLY_ACTIVE,
        Energy.ACTIVITY_LEVEL_SEDENTARY,
        Energy.ACTIVITY_LEVEL_VERY_ACTIVE
    ]);
}


/**
 * Returns a random account tier, one of : Free, Gold or Premium.
 */
export function getRandomAccountTier(): string {
    return getRandomStringFrom([Tiers.FREE_TIER_NAME, Tiers.GOLD_TIER_NAME, Tiers.PREMIUM_TIER_NAME]);
}

/**
 * Reutrns a random tier permissions object. Be careful when calling if 
 * you have already assigned a tier name to the user profile.
 */
export function getRandomTierPermissions(): any {
    return getRandomFrom([Tiers.freeTierPermissions(), Tiers.goldTierPermissions(), Tiers.premiumTierPermissions()]);
}

/**
* Returns a random number between min (inclusive) and max (exclusive)
* 
* @param min minimum value in range.
* @param max maximum value in range.
*/
export function getRandomWithinArbitraryRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Reutrns a random IP address as a string. 
 */
export function getRandomIP(): string {
    return getRandomStringFrom([
        "80.193.87.94",
        "49.198.41.149",
        "68.157.140.43",
        "47.124.179.147",
        "211.90.80.57",
        "41.239.183.34",
        "210.125.137.77",
        "245.38.104.255",
        "15.230.101.41",
        "127.11.164.50",
    ]);
}

/**
 * Returns a random height within the valid range of user heights 
 */
export function getRandomHeight(): number {
    return getRandomWithinArbitraryRange(0, ((9 * 12) + 11))
}

/**
 * Helper function generating random dates. Cannot just use Math.random()
 * because the number eturned is too small and will always be interpreted 
 * as the same date.
 */
export function getRandomDate(): Date {
    return new Date(Math.random() * 100000000000);
}

/**
* Returns a string value at a random index in an array. This function is used to 
* randomize the feedback that is returned from the different helper functions
* above. If the array is null or of length 0, then an aempy string is returned.
* 
* @param arr Array to return a random string from.
*/
export function getRandomStringFrom(arr: string[]): string {
    const random = getRandomFrom(arr);
    if (!random) {
        return "";
    } else {
        return random;
    }
}

/**
 * Returns a user profile with a bunch of randomly loaded demographic information.
 */
export function getRandomUserProfile(): UserProfile {
    const randTierName = getRandomAccountTier();
    return {
        needToUpdateTDEE: false,
        username: getRandomUsername(),
        isMale: getRandomGender(),
        age: getRandomAge(),
        weight_lbs: getRandomWeight(),
        height_inches: getRandomHeight(),
        activityLevel: getRandomActivityLevel(),
        mainNutrLogId: null,
        estimatedTDEE: getRandomCalories(),
        dateCreated: getRandomDate().getTime(),
        subscriptionTier: randTierName,
        subscriptionID: null,
        subscriptionStatus: "",
        userPreferences: {
            "general": {
                "isImperial": true,
                "currentTheme": "#43dbbd",
                "decimalPrecision": "1"
            },
            "nutrition": {
                "sortMode": "day",
                "orderMode": "descending",
                "graphMode": "line"
            }
        },
        tierPermissions: accountTiers.find(tier => { return tier.name == randTierName }),
        emailAddr: getRandomEmail(),
        wasDeleted: null,
    } as UserProfile
}

/**
* Returns a value at a random index in an array. This function is used to 
* randomize the feedback that is returned from the different helper functions
* above. If the array is null or of length 0, then null is returned.
* 
* @param arr Array to return a random value from.
*/
export function getRandomFrom(arr: any[]): any {
    if (arr && arr.length) {
        return arr[Math.floor(Math.random() * arr.length)];
    } else {
        return null;
    }
}

/**
 * Reutrns a deep copy of the object passed into the function.
 * 
 * @param objectToCopy The object to create a deep copy of.
 */
export function deepCopy(objectToCopy: any) {
    return JSON.parse(JSON.stringify(objectToCopy));
}

/**
 * Returns true if objects a and b are essentially the same. 
 * i.e., the two objects have the exact same key and value 
 * pairs for their contents.
 * 
 * @param object1 The first object to check for equivalence.
 * @param object2 The second object to check for equivalence.
 */
export function isEquivalent(object1: any, object2: any) {
    var aProps = Object.getOwnPropertyNames(object1);
    var bProps = Object.getOwnPropertyNames(object2);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (object1[propName] !== object2[propName]) {
            return false;
        }
    }
    return true;
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray(array: any[]) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/**
 * Converts a NutritionLog object into a format that can be stored in firebase.
 * 
 * @param dayEntries listOfEntries to convert to firebase storage format.
 */
export function convertDayEntryListToFireStorageFormat(dayEntries: DayEntry[]): {} {
    const ENTRY_LIST_STORAGE_KEY: string = "e";
    const mappedEntries: {}[] = dayEntries.map((entry: DayEntry) => convertEntryToFireStorageFormat(entry));
    const storageJSON: {} = { [ENTRY_LIST_STORAGE_KEY]: JSON.stringify(mappedEntries) };
    return storageJSON;
}

/**
  * Converts a Day Entry object into a format that can be stored in firebase.
  * Property names are reduced because lists of Day Entries are stored together 
  * in Firebase and this is a way to increase the amount of entries that we can 
  * store in one Firebase Firestore document. 
  * 
  * @param entryToConvert Day Entry to convert to firebase storage format.
  */
export function convertEntryToFireStorageFormat(entryToConvert: DayEntry): {} {
    const ENTRY_DATE_KEY: string = "d";
    const ENTRY_WEIGHT_KEY: string = "w";
    const ENTRY_KCAL_KEY: string = "c";
    const ENTRY_ID_KEY: string = "i";
    const storageObject = {
        [ENTRY_DATE_KEY]: entryToConvert.date.getTime(),
        [ENTRY_WEIGHT_KEY]: entryToConvert.weight,
        [ENTRY_ID_KEY]: entryToConvert.id,
        [ENTRY_KCAL_KEY]: entryToConvert.calories
    };
    return Object.assign({}, storageObject)
}

/**
 * Returns the number of msec in a day.
 */
export function getDayInMillis(): number {
    return (24 * 60 * 60 * 1000);
}

/**
 * Returns true if the message from a feedback object is 
 * considered positive. Returns false otherwise.
 */
export function isPositiveFeedback(feedback: Feedback): boolean {
    const message = feedback.message;
    let containsAtLeastOnePositiveExclamation = false;
    let containsAtLeastOneNegativeExclamation = false;
    feedbackHelper.positiveExclamations.forEach(posExc => {
        if (message.includes(posExc)) {
            containsAtLeastOnePositiveExclamation = true;
        }
    });
    feedbackHelper.negativeExclamations.forEach(negExc => {
        if (message.includes(negExc)) {
            containsAtLeastOneNegativeExclamation = true;
        }
    });
    const isPositive = (
        containsAtLeastOnePositiveExclamation &&
        !containsAtLeastOneNegativeExclamation);
    return isPositive;
}

/**
 * Returns true if the message from a feedback object is 
 * considered negative. Returns false otherwise.
 */
export function isNegativeFeedback(feedback: Feedback): boolean {
    const message = feedback.message;
    let containsAtLeastOnePositiveExclamation = false;
    let containsAtLeastOneNegativeExclamation = false;
    feedbackHelper.positiveExclamations.forEach(posExc => {
        if (message.includes(posExc)) {
            containsAtLeastOnePositiveExclamation = true;
        }
    });
    feedbackHelper.negativeExclamations.forEach(negExc => {
        if (message.includes(negExc)) {
            containsAtLeastOneNegativeExclamation = true;
        }
    });
    const isNegative = (
        !containsAtLeastOnePositiveExclamation &&
        containsAtLeastOneNegativeExclamation);
    return isNegative;
}

/**
 * Returns a specific piece of feedback with a title that matches feedback title
 * from the feedback category. This function assumes that the feedback category is
 * not null. If feedback does not exist with a  title that matches feedbackTitle then
 * null is returned.
 * 
 * @param feedbackCategory Feedback category object to get feedback from.
 * @param feedbackTitle  Title fo the specific piece of feedback to retrieve.
 */
export function getSpecificFeedback(feedbackCategory: FeedbackCategory, feedbackTitle: string): Feedback {
    return (feedbackCategory.feedbackList.find((feedback: Feedback) => feedback.title == feedbackTitle));
}

/**
 * Given an energy payload, will return the specifided feedback category object 
 * from the payloads analysis array.
 * 
 * @param payload Payload to get the feedback from.
 * @param feedbackCateogryTitle Feedback category to get from the payload.
 */
export function getFeedbackCategory(payload: EnergyPayload, feedbackCateogryTitle: string): FeedbackCategory {
    const analysis = payload.analysis;
    return analysis.find((feedbackCat: FeedbackCategory) => { return feedbackCat.category == feedbackCateogryTitle });
}




/////////////////////////////////////////// FAKE TESTING FRAMEWORK ///////////////////////////////////////

/**
 * Holds the list of functions that are currently being spied on and a 
 * reference to their original value. this lets us reassign the original 
 * value of the functions back to themselves after we are done testing.
 */
let currentSpies: any[] = [];

/**
 * 
 * This function should only ever be used if we need to spy on a function or property
 * that is individually exported from outsided the angular project. The only place this 
 * occurs is in our backend firebase functions environment. Outside of the firebase functions
 * tests, do not use this function!
 * 
 * Make sure that if you are using this function, you call resetAllSpies before moving on
 * to avoid bugs in other files that would be extremely hard to track down!
 * 
 * @param individualExportOwner Filepath or alias of the file that the individual export is from.
 * @param propertyName Name of the member of the file to be mocked.
 * @param mockedValue New value of exported function/variable.
 */
export function spyOnIndividualExport(individualExportOwner: any, propertyName: string, mockedValue: any): void {
    const isAlreadySpiedOn = false;
    if (!isAlreadySpiedOn) {
        currentSpies.push(
            {
                individualExportOwner: individualExportOwner,
                propertyName: propertyName,
                originalValue: individualExportOwner[propertyName]
            }
        );
        (individualExportOwner as any)[propertyName] = mockedValue;
    }
    else {
        console.log("WATCH OUT " + propertyName + " HAS ALREADY BEEN SPIED ON! ");
    }
}

/**
 * This function is a cleanup function and must be called after all tests whenever
 * the spyOnIndividualExport function is used. If it is not, then the testing suite
 * is at risk of having stubbed functions persisiting throughout multiple test files.
 */
export function resetAllSpies() {
    currentSpies.forEach(spy => {
        (spy.individualExportOwner as any)[spy.propertyName] = spy.originalValue;
    })
}


