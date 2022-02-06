import { Injectable } from '@angular/core';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';

/**
 * In the frontend of the application, we represent all user data as javascript classes.
 * This is the easiest format to work in the frontend but we cannot store objects in this 
 * format in our database. Firebase does not allow javascript classes or javascript date 
 * objects. to get around this, we use this class to convert everything in our database into 
 * a JSON. We do this because we can shrink the property names of the JSON's to reduce the 
 * size of the objects we store. Then we convert those objects into strings which can be stored 
 * as  single document which saves us from making extra reads to our database.
 * 
 * This service also contains a few helper functions for making deep copies of objects.
 * 
 * Last edited by: Ryan Lefebvre 7/07/2020
 */
@Injectable({
  providedIn: 'root'
})
export class ObjectStorageService {

  /**
   * Key for the key value pair that is stored as a stringified object in our firestore database for nutrition logs.
   */
  NUTR_LOG_STORAGE_KEY: string = "l";

  /**
  * Key for the key value pair that is stored as a stringified object in our firestore database for day entry lists.
  */
  DAY_ENTRY_LIST_STORAGE_KEY: string = "e";

  /**
   * Key used for shrinking the date field of a day entry.
   */
  ENTRY_DATE: string = "d";

  /**
   * Key used for shrinking the weight field of a day entry.
   */
  ENTRY_WEIGHT: string = "w";

  /**
  * Key used for shrinking the id field of a day entry.
  */
  ENTRY_ID: string = "i";

  /**
  * Key used for shrinking the kcal field of a day entry.
  */
  ENTRY_KCAL: string = "c";

  /**
  * Key used for shrinking the TDEE field of a day entry.
  */
  ENTRY_TDEE: string = "t";

  /**
  * Key used for shrinking the goal intake field of a day entry.
  */
  ENTRY_GOAL_INTAKE: string = "g";

  /**
   * @ignore
   */
  constructor() { }

  /**
   * Converts a NutritionLog object into a format that can be stored in firebase.
   * 
   * @param logToConvert Log to to convert to firebase storage format.
   */
  convertLogSummaryToFireStorageFormat(logToConvert: NutritionLog): {} {
    const storageObject =
    {
      title: logToConvert.title,
      id: logToConvert.id,
      goal: logToConvert.goal,
      lastEdit: logToConvert.lastEdit,
      startTDEE: logToConvert.startTDEE
    };
    const objectInStorageFormat = Object.assign({}, storageObject);
    const storageJSON = { [this.NUTR_LOG_STORAGE_KEY]: JSON.stringify(objectInStorageFormat) };
    return storageJSON;
  }

  /**
   * Converts a JSON representation of a Nutrition Log into a javascript class.
   * 
   * @param logInStorageFormat Log to to convert to firebase storage format.
   */
  convertLogSummaryFromFireStorageFormat(logInStorageFormat: any): NutritionLog {
    const deconstructedLog = JSON.parse(logInStorageFormat[this.NUTR_LOG_STORAGE_KEY]);
    let newModelLog: NutritionLog = new NutritionLog();
    newModelLog.title = deconstructedLog.title;
    newModelLog.lastEdit = deconstructedLog.lastEdit;
    newModelLog.id = deconstructedLog.id;
    newModelLog.goal = deconstructedLog.goal;
    newModelLog.startTDEE = deconstructedLog.startTDEE;
    return newModelLog;
  }

  /**
   * Creates a deep copy of a nutrition log object. If the log passed in is null
   * then null is returned.
   * 
   * @param logToCopy log to be deep copied.
   */
  deepCopyNutrLog(logToCopy: NutritionLog): NutritionLog {
    if (!logToCopy) {
      return logToCopy;
    }
    let newModelLog: NutritionLog = new NutritionLog;
    newModelLog.title = logToCopy.title;
    newModelLog.lastEdit = logToCopy.lastEdit;
    newModelLog.id = logToCopy.id;
    newModelLog.goal = logToCopy.goal;
    newModelLog.dayEntries = logToCopy.dayEntries;
    newModelLog.startTDEE = logToCopy.startTDEE;
    return newModelLog;
  }

  /**
   * Converts a NutritionLog object into a format that can be stored in firebase.
   * 
   * @param dayEntries listOfEntries to convert to firebase storage format.
   */
  convertDayEntryListToFireStorageFormat(dayEntries: DayEntry[]): {} {
    let context = this;
    const mappedEntries: {}[] = dayEntries.map((entry: DayEntry) => context.convertEntryToFireStorageFormat(entry));
    const storageJSON: {} = { [this.DAY_ENTRY_LIST_STORAGE_KEY]: JSON.stringify(mappedEntries) };
    return storageJSON;
  }

  /**
   * Converts a JSON representation of a list of Day Entries into a list of javascript class objects.
   * If dayEntries is null because the document has not yet been created, then an empty DayEntry list 
   * is returned.
   * 
    * @param dayEntries listOfEntries to convert from firebase storage format.
   */
  convertDayEntryListFromStorageFormat(dayEntries: any): DayEntry[] {
    let dayEntrylist: DayEntry[] = [];
    if (dayEntries) {
      const deconstructedEntries = JSON.parse(dayEntries[this.DAY_ENTRY_LIST_STORAGE_KEY]);
      dayEntrylist = deconstructedEntries.map((entry: any) => this.convertEntryFromFireStorageFormat(entry));
    }
    return dayEntrylist;
  }

  /**
   * Converts a Day Entry object into a format that can be stored in firebase.
   * Property names are reduced because lists of Day Entries are stored together 
   * in Firebase and this is a way to increase the amount of entries that we can 
   * store in one Firebase Firestore document. 
   * 
   * @param entryToConvert Day Entry to convert to firebase storage format.
   */
  convertEntryToFireStorageFormat(entryToConvert: DayEntry): {} {
    const storageObject = {
      [this.ENTRY_DATE]: entryToConvert.date.getTime(),
      [this.ENTRY_WEIGHT]: entryToConvert.weight,
      [this.ENTRY_ID]: entryToConvert.id,
      [this.ENTRY_KCAL]: entryToConvert.calories,
      [this.ENTRY_TDEE]: entryToConvert.creationEstimatedTDEE,
      [this.ENTRY_GOAL_INTAKE]: entryToConvert.goalIntakeBoundaries
    };
    return Object.assign({}, storageObject)
  }

  /**
   * Converts a Day Entry object from a format that can be stored in firebase into a Day Entry object.
   * 
   * @param entryToConvert Day Entry to convert from firebase storage format.
   */
  convertEntryFromFireStorageFormat(entryToConvert): DayEntry {
    let newEntryModel = new DayEntry();
    newEntryModel.date = new Date(entryToConvert[this.ENTRY_DATE]);
    newEntryModel.weight = entryToConvert[this.ENTRY_WEIGHT];
    newEntryModel.id = newEntryModel.date.getTime();
    newEntryModel.calories = entryToConvert[this.ENTRY_KCAL];
    newEntryModel.goalIntakeBoundaries = entryToConvert[this.ENTRY_GOAL_INTAKE];
    newEntryModel.creationEstimatedTDEE = entryToConvert[this.ENTRY_TDEE];
    return newEntryModel;
  }

}
