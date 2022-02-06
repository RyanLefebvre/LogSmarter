
import { UserProfile } from './../../model-classes/general/user-profile';
import { Injectable, OnDestroy, OnInit } from '@angular/core'
import { DayEntry } from 'functions/src/classes/day-entry';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { Subscription } from 'rxjs';
import * as timeHelper from "../general/time-constant.service";
import * as energyConstants from "functions/src/constants/energyConstants"
import * as logGoalCalc from 'functions/src/services/algorithm/logGoalCalculator';
/**
 * Collection of functions that are helpful when writing frontend unit tests. Not 
 * intended to be injected into an actual frontend code.
 * 
 * Last edited by: Ryan Lefebvre 8/08/2020
 */
@Injectable({
    providedIn: 'root'
})
export class TestHelpers {

    /**
     * Jasmine and the material dialog reference do not play nicely together
     * this function returns an object that can be expanded to meet the needs
     * of dialogs for unit testing
     */
    getDialogMock(): any {
        // @ts-ignore
        const jasmineSpy = jasmine.createSpy();
        return {
            disableClose: false,
            close: jasmineSpy
        };
    }

    /**
     * Account Tiers 
     */
    accountTiers = [
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
    getRandomListOfLogs(): NutritionLog[] {
        return this.getRandomListOfLogsOfLength(25);
    }

    /**
     * Creates a list of nutrition nutrition logs that contain
     * random data.
     * 
     * @param listLength Length of the list of logs returned.
     */
    getRandomListOfLogsOfLength(listLength: number): NutritionLog[] {
        const logList: NutritionLog[] = [];
        for (let i = 0; i < listLength; i++) {
            logList.push(this.getRandomNutritionLog());
        }
        return logList;
    }

    /**
     * Creates a nutrition log initialized with random data.
     */
    getRandomNutritionLog(): NutritionLog {
        const randLog: NutritionLog = new NutritionLog();
        randLog.dayEntries = this.getRandomEntryList();
        randLog.id = this.getRandomDate().getTime();
        randLog.title = "Log" + randLog.id;
        randLog.lastEdit = this.getRandomDate().getTime();
        randLog.goal = this.getRandomFrom(["muscleGain", "fatLoss", "maintain"]);
        return randLog;
    }

    /**
     * Returns a list of 100 random entries.
     */
    getRandomEntryList(): DayEntry[] {
        return this.getRandomEntryListOfLength(100);
    }

    /**
     * Returns a list of random entries with random dates, random calories and 
     * random weights. List contains same number of entries specified as param.
     * 
     * @param listLength length of the list to get entries for.
     */
    getRandomEntryListOfLength(listLength: number): DayEntry[] {
        const entries: DayEntry[] = [];
        for (let i = 0; i < listLength; i++) {
            entries[i] = this.getRandomEntry();
        }
        return entries;
    }

    /**
     * Returns a single entry with random date, weight and calories.
     */
    getRandomEntry(): DayEntry {
        const randEntry: DayEntry = new DayEntry();
        randEntry.date = this.getRandomDate();
        randEntry.id = randEntry.date.getTime();
        randEntry.calories = this.getRandomCalories();
        randEntry.weight = this.getRandomWeight();
        return randEntry;
    }

    /**
     * Returns a random value within the range of 
     * accpeted calorie intake values for a day entry.
     */
    getRandomCalories(): number {
        return this.getRandomWithinArbitraryRange(0, 10000);
    }

    /**
     * Returns a random value within the range of 
     * accpeted body weight values for day entry or profile.
     */
    getRandomWeight(): number {
        return this.getRandomWithinArbitraryRange(0, 99997);
    }

    /**
    * Returns a random number between min (inclusive) and max (exclusive)
    * 
    * @param min minimum value in range.
    * @param max maximum value in range.
    */
    getRandomWithinArbitraryRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Helper function generating random dates. Cannot just use Math.random()
     * because the number eturned is too small and will always be interpreted 
     * as the same date.
     */
    getRandomDate(): Date {
        return new Date(Math.random() * 100000000000);
    }

    /**
    * Returns a value at a random index in an array. This function is used to 
    * randomize the feedback that is returned from the different helper functions
    * above. If the array is null or of length 0, then an aempy string is returned.
    * 
    * @param arr Array to return a random string from.
    */
    getRandomFrom(arr: string[]): string {
        if (arr && arr.length) {
            return arr[Math.floor(Math.random() * arr.length)];
        } else {
            return "";
        }
    }

    /**
     * Checks whether a component crashes during instantiation
     * @param component component with an ngOnInit implementation
     */
    testOnInit(component: OnInit): boolean {
        let crashed = false;
        try {
            component.ngOnInit();
        } catch (e) {
            crashed = true;
        }
        return crashed;
    }

    /**
     * Checks whether a component crashes when its destroyed
     * @param component component with an ngOnDestroy implementation
     */
    testOnDestroy(component: OnDestroy): boolean {
        let crashed = false;
        try {
            component.ngOnDestroy();
        } catch (e) {
            crashed = true;
        }
        return crashed;
    }

    /**
     * Checks whether a subscrition has been unsubsribed
     * @param subscription subscription
     */
    isUnsubscribed(subscription: Subscription): boolean {
        return subscription.closed;
    }

    /**
     * Creates a fake user profile with example values rather than the class defaults which are not useful
     * during testing
     */
    createFreeUserProfile(): UserProfile {
        return {
            username: "username",
            isMale: true,
            age: 19,
            weight_lbs: 240,
            height_inches: 72,
            activityLevel: energyConstants.ACTIVITY_LEVEL_SEDENTARY,
            mainNutrLogId: null,
            estimatedTDEE: null,
            dateCreated: (new Date()).getTime(),
            subscriptionTier: "LS_FREE",
            subscriptionID: null,
            subscriptionStatus: "",
            userPreferences: {
                "general": {
                    "isImperial": "true",
                    "currentTheme": "#43dbbd",
                    "decimalPrecision": "1"
                },
                "nutrition": {
                    "sortMode": "day",
                    "orderMode": "descending",
                    "graphMode": "line",
                    "templates": [

                    ]
                },
                "training": {

                }
            },
            tierPermissions: this.accountTiers[0],
            emailAddr: 'email@gmail.com',
            wasDeleted: null
        } as UserProfile
    }

    /**
     * Creates a premium user profile
     */
    createPremiumUserProfile(): UserProfile {
        const userProfile: UserProfile = this.createFreeUserProfile();
        userProfile.subscriptionTier = "PREMIUM";
        userProfile.subscriptionStatus = "active";
        userProfile.tierPermissions = this.accountTiers[1];
        return userProfile;
    }

    /**
     * Creates a gold user profile
     */
    createGoldUserProfile(): UserProfile {
        const userProfile: UserProfile = this.createFreeUserProfile();
        userProfile.subscriptionTier = "GOLD";
        userProfile.subscriptionStatus = "active";
        userProfile.tierPermissions = this.accountTiers[2];
        return userProfile;
    }

    /**
     * Mocks the allowPreferneceEditing in the PreferencesComponent
     * @param user userprofile
     */
    mockPreferencesAllowPreferenceEditing(user: UserProfile): boolean {
        switch (user.subscriptionTier) {
            case "PREMIUM":
            case "GOLD":
                return true;
            case "LS_FREE":
            default:
                return false;
        }
    }

    /**
     * Mocks the getUserTier function provided by TierPermissionsService
     * @param user user
     */
    mockTierPermissionServiceGetUserTier(user: UserProfile) {
        let tier = null;
        this.accountTiers.forEach((accountTier) => {
            if (user.subscriptionTier == accountTier.name) {
                tier = accountTier;
            }
        })
        return tier;
    }



}
