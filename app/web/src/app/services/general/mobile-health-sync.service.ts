import { Injectable } from '@angular/core';
import { DayEntry } from 'functions/src/classes/day-entry';
import { error } from 'selenium-webdriver';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConversionService } from './conversion.service';
import { EnvironmentService } from './environment.service';
import { TestHelpers } from './testHelpers';
import { TimeService } from './time-constant.service';

/**
 * This service is used for all functionality related to syncing with apple 
 * health. It is a wrapper around the following cordova plugin and will likely
 * be extended in the future to read/write more data types to apple health.
 * 
 * https://github.com/dariosalvi78/cordova-plugin-health
 * 
 * Last edited by: Ryan Lefebvre 1/27/2021
 */
@Injectable({
  providedIn: 'root'
})
export class MobileHealthSyncService {

  /**
   * Reference to the dataType name for weight.
   */
  DATA_TYPE_WEIGHT: string = "weight";

  /**
   * Reference to the dataType name for calorie intakes.
   */
  DATA_TYPE_CALORIES: string = "nutrition.calories";

  /**
   * A reference to the data types that we want to
   * query for and what it is that we want to do with them.
   * Our app does no writing to health, just reading.
   */
  READ_DATA_DEFINITION: any = [this.DATA_TYPE_CALORIES, this.DATA_TYPE_WEIGHT];

  /**
   * Wrapper around the cordova plugin health object 
   * to avoid excessive ts-ignore comments or IDE errors
   */
  HEALTH: any = null;

  /**
   *@ignore
   */
  constructor(
    public testHelpers: TestHelpers,
    public time: TimeService,
    public converter: ConversionService,
    public snackBarManager: SnackBarService,
    public environmentService: EnvironmentService) { }

  /**
   * This function is called by the setUpForMobile function and waits 
   * for the device ready event to fire. Once that event fires, cordova
   * plugins will be available and the HEALTH global object
   * is assigned to the cordova plugin for managing health data.
   */
  setUpHealthSync() {
    const context: MobileHealthSyncService = this;
    document.addEventListener('deviceready', async () => {
      if (!context.HEALTH) {
        // @ts-ignore 
        context.HEALTH = navigator.health;
      }
    });
  }

  /**
   * This function will write the weight data contained in an entry to the device's
   * respective health app if the entry contains the data and if write permissions
   * are authorized. If write permissions are not authorized, then this function 
   * will fail silently. If write permission are authorized, then the weight in
   * an entry is written to the app as long as it is not null. We do not write calories
   * because we only have total calories available and our algorithm for filling 
   * entries with calories from health will loop through meals in a day and sum the 
   * calories which would cause an infinite loop of calories unless we manually exclude
   * the LS calories going forward. Even then it still does not make sense in the format that the
   * health apps currently store calories. This function will fail silently if weight is null or 
   * another type of error occurs.
   * 
   * @param entry the day entry to write to the device's health app
   */
  async writeToHealthAppIfAuthorized(entry: DayEntry): Promise<void> {
    const entryStartDate: Date = new Date((entry.date).getFullYear(), (entry.date).getMonth(), (entry.date).getDate());
    const entryEndDate: Date = new Date((entry.date).getFullYear(), (entry.date).getMonth(), (entry.date).getDate(), 23, 59);
    try {
      const entryHasWeight = (entry.weight != null && entry.weight != 0);
      const entryHasCalories = (entry.calories != null && entry.calories != 0);
      if (entryHasWeight || entryHasCalories) {
        const serviceIsAvailable: boolean = await this.healthIsAvailable();
        if (serviceIsAvailable) {
          const dataIsAvailable = await this.healthDataAvailable();
          if (dataIsAvailable) {
            const dataAlreadyInHealthApp: DayEntry[] = await this.getEntriesFromHealthQuery(entryStartDate, entryEndDate);
            const entryWithSameDate: DayEntry = dataAlreadyInHealthApp.find(entryInHealthApp => this.time.datesAreOnSameDay(entryInHealthApp.date, entry.date));
            const canWriteKcal: boolean = (!entryWithSameDate || (entryWithSameDate.calories == null || entryWithSameDate.calories == 0));
            const canWriteWeight: boolean = (!entryWithSameDate || (entryWithSameDate.weight == null || entryWithSameDate.weight == 0))
            const context = this;
            if (canWriteWeight && entryHasWeight) {
              const weightStoragePromise = new Promise<void>((resolve, reject) => {
                const weightStorageObject = {
                  startDate: entryStartDate,
                  endDate: entryEndDate,
                  value: this.converter.roundNumberToOneDecimalPlace(context.converter.convertLbsToKg(entry.weight)),
                  dataType: context.DATA_TYPE_WEIGHT,
                };
                const storageCallback = (val) => resolve();
                context.HEALTH.store(weightStorageObject, storageCallback, (error) => { resolve() });
              });
              await weightStoragePromise;
            }
            if (canWriteKcal && entryHasCalories) {
              const calorieStoragePromise = new Promise<void>((resolve, reject) => {
                const calorieStorageObject = {
                  startDate: entryStartDate,
                  endDate: entryEndDate,
                  value: Math.round(entry.calories),
                  dataType: context.DATA_TYPE_CALORIES,
                };
                const storageCallback = (val) => resolve();
                context.HEALTH.store(calorieStorageObject, storageCallback, (error) => { resolve() });
              });
              await calorieStoragePromise;
            }
          }
        }
      }
    }
    catch (error) { }
    return;
  }

  /**
   * Returns true if healthkit is available. False otheriwse.
   * Used to check if there was an error in the setup process.
   */
  async healthIsAvailable(): Promise<boolean> {
    let isAvailable: boolean = false;
    const context = this;
    if (!context.HEALTH) {
      return false;
    }
    else {
      const availablePromise: Promise<boolean> = new Promise((resolve, reject) => {
        context.HEALTH.isAvailable((available) => resolve(available));
      });
      isAvailable = await (availablePromise);
    }
    return isAvailable;
  }

  /**
   * Resolves to true if the mobile device's health app 
   * (google fit for android and healthkit for ios) are 
   * available, false otherwise.
   */
  async healthDataAvailable(): Promise<boolean> {
    let isAvailable: boolean = false;
    const context = this;
    const weightPermissionsPromise = new Promise<boolean>((resolve, reject) => {
      context.HEALTH.isAuthorized([{ write: [this.DATA_TYPE_WEIGHT] }], (availability) => { resolve(availability) }, (error) => { resolve(false); });
      //  IF NO RESPONSE IN 10 SECONDS THEN RESOLVE TO FALSE. On android, if user has not requested authorization yet
      //  for the account, then isAuthorized for data types will fail to respond and cause the application to hang.
      setTimeout(() => { resolve(false) }, 3000)
    });
    const caloriesPermissionsPromise = new Promise<boolean>((resolve, reject) => {
      context.HEALTH.isAuthorized([{ write: [this.DATA_TYPE_CALORIES] }], (availability) => { resolve(availability) }, (error) => { resolve(false); });
      // IF NO RESPONSE IN 10 SECONDS THEN RESOLVE TO FALSE
      setTimeout(() => { resolve(false) }, 3000)
    });
    const weightPromiseResult = await weightPermissionsPromise;
    const caloriePromiseResult = await caloriesPermissionsPromise;
    isAvailable = ((weightPromiseResult == true) || (caloriePromiseResult == true));
    return isAvailable;
  }

  /**
   * Resolves to true if the mobile device's health app 
   * (google fit for android and healthkit for ios) are 
   * available, false otherwise.
   */
  async requestAuthorization(): Promise<boolean> {
    let isAvailable: boolean = false;
    const context = this;
    const permissionsPromise = new Promise<boolean>((resolve, reject) => {
      context.HEALTH.requestAuthorization(this.READ_DATA_DEFINITION, (auth) => { resolve(auth) }, (err) => { resolve(false) });
    });
    isAvailable = await permissionsPromise;
    return isAvailable;
  }

  /**
   * Given raw data for a query to the health data store.
   * Will convert the query into a list of day entries
   * that have cleaned all the calroie and weight data.
   * 
   * @param rawWeightData   raw weight data from healthkit
   * @param rawCalorieDate  raw calorie data from healthkit
   */
  async convertRawDataToEntryList(rawWeightData, rawCalorieData) {
    const entries: DayEntry[] = [];
    for (let rawWeight of rawWeightData) {
      let entryWithSameDate = entries.find(entry => this.time.datesAreOnSameDay(entry.date, rawWeight.startDate));
      if (!entryWithSameDate && rawWeight.startDate) {
        const newEntry: DayEntry = new DayEntry();
        newEntry.date = rawWeight.startDate;
        newEntry.id = newEntry.date.getTime();
        newEntry.weight = this.converter.convertKgToLbs(rawWeight.value)
        entries.push(newEntry);
      }
    }
    for (let rawCalories of rawCalorieData) {
      let entryWithSameDate = entries.find(entry => this.time.datesAreOnSameDay(entry.date, rawCalories.startDate));
      if (!entryWithSameDate && rawCalories.startDate) {
        const newEntry: DayEntry = new DayEntry();
        newEntry.date = rawCalories.startDate;
        newEntry.id = newEntry.date.getTime();
        newEntry.calories = Math.round(rawCalories.value);
        entries.push(newEntry);
      }
      else if (rawCalories.value) {
        entryWithSameDate.calories += Math.round(rawCalories.value);
      }
    }
    return entries;
  }

  /**
   * Returns a list of entries between a start date and end date that 
   * are retrieved by querying the healthkit cordova plugin. For whatever reason, 
   * the google fit app does not correctly pull in data when specifiyng a specific date 
   * range. No matter what range is selected, all of the data is returned. So we have 
   * added a manual filter at the end of this function when on android.
   * 
   * @param startDate the starting date of the range to query healthkit for data for.
   * @param endDate   the ending date of the range to query healthkit for data for.
   */
  async getEntriesFromHealthQuery(startDate: Date, endDate: Date): Promise<DayEntry[]> {
    const startDateRoundedDown = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateRoundedUp = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59);
    const rawWeightData = await this.query(this.DATA_TYPE_WEIGHT, startDateRoundedDown, endDateRoundedUp);
    const rawCalorieData = await this.query(this.DATA_TYPE_CALORIES, startDateRoundedDown, endDateRoundedUp);
    let entries: DayEntry[] = await this.convertRawDataToEntryList(rawWeightData, rawCalorieData);
    const halfDayInMillis: number = (this.time.getDayInMillis() / 2);
    const extendedStart: number = (startDate.getTime() - halfDayInMillis);
    const extendedEnd: number = (endDate.getTime() + halfDayInMillis);
    if (this.environmentService.isAndroid) {
      entries = entries.filter((entry: DayEntry) => {
        const entryTime: number = entry.date.getTime();
        const entryIsWithinDateRange: boolean = (entryTime >= extendedStart && entryTime <= extendedEnd);
        return entryIsWithinDateRange;
      });
    }
    return entries;
  }

  /**
   * Resolves to a promise that contains the results of a query 
   * to the device's respsective health app.
   * 
   * @param dataType the data type to query healthkit for
   * @param startDate the starting date of the range to query healthkit for data for.
   * @param endDate   the ending date of the range to query healthkit for data for.
   */
  async query(dataType: string, startDate: Date, endDate: Date): Promise<any[]> {
    let data = [];
    const queryParams = {
      startDate: startDate,
      endDate: endDate,
      dataType: dataType
    }
    const context = this;
    const queryPromise = new Promise<any[]>((resolve, reject) => {
      context.HEALTH.query(queryParams, (dataFromHealthApp) => { resolve(dataFromHealthApp); }, (error) => { resolve(data); });
    });
    data = await queryPromise;
    return data;
  }

  /**
   * Prompts the user to install the health app if it is not installed. This should only
   * be called on Android since it is not defined for iOS.
   */
  async promptInstall(): Promise<boolean> {
    const notOnAndroid: boolean = !(this.environmentService.isAndroid);
    const CANT_INSTALL_GOOGLE_FIT: boolean = true;
    if (notOnAndroid) {
      return CANT_INSTALL_GOOGLE_FIT;
    }
    else {
      let isInstalled: boolean = false;
      const context = this;
      const installPromise = new Promise<boolean>((resolve, reject) => {
        context.HEALTH.promptInstallFit((installed) => { resolve(installed) }, (err) => { resolve(false) });
      });
      isInstalled = await installPromise;
      return isInstalled;
    }
  }

}
