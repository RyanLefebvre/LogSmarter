import { Injectable } from '@angular/core';
import { ObjectStorageService } from '../general/object-storage.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConversionService } from '../general/conversion.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { TierPermissionsService } from '../general/tier-permissions.service';
import { Router } from '@angular/router';
import { StateManagerService } from '../general/state-manager.service';
import { AuthenticationService } from './authentication.service';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TimeService } from '../general/time-constant.service';
import { map } from 'rxjs/operators';
import { FirebaseGeneralService } from './firebase-general.service';
import { PayloadService } from './payload.service';
import { NutritionConstanstsService } from '../nutrition-log/nutrition-constansts.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { CallableWrapperService } from './callable-wrapper.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { EnvironmentService } from '../general/environment.service';
import { MobileHealthSyncService } from '../general/mobile-health-sync.service';

/**
 * Responsible for all CRUD operations related to Nutrition logs and Day Entries. The only
 * firebase related operations for nutrition information that does not go through this service is 
 * creating a subscription for log data and stats. That logic is stored in the 
 * nutrition-log-subscription-creator.service
 * 
 * Last edited by: Ryan Lefebvre 7/15/2020
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseNutritionService {

  /**
  * Reference to the route path used to access the nutrition log in depth page.
  */
  NUTR_LOG_IN_DEPTH_PAGE: string = "/nutrition-logs/InDepth";

  /**
   * Constant used as second paramter for splice when deleting an entry to make it more clear what splice does.
   */
  DEL_ONE_ENTRY: number = 1;

  /**
   * Key used for NutritionLog collection in our firestore database where entries and logs are stored.
   */
  NUTR_COL: string = "NutritionLogs";

  /**
  * Key used for LogSummary collection stored under our parent NutritionLog collection.
  */
  LOG_SUM_COL: string = "logs";

  /**
  * Key used for DayEntry collection stored under our parent NutritionLog collection.
  */
  DAY_ENTRIES_COL: string = "entries";

  /**
  * Message displayed when a nutrition log is created successfully.
  */
  NUTR_LOG_CRE_SUCCESS: string = "Nutrition log created successfully";

  /**
  * Message displayed when a nutrition log cant be created.
  */
  NUTR_LOG_CRE_FAILURE: string = "Failed to create nutrition log";

  /**
   * Message displayed when a nutrition log is deleted successfully.
   */
  NUTR_LOG_DEL_SUCCESS: string = "Nutrition log deleted successfully";

  /**
  * Message displayed when a nutrition log fails to be deleted.
  */
  NUTR_LOG_DEL_FAILURE: string = "Failed to delete nutrition log";

  /**
   * Message displayed when a nutrition log is updated successfully.
   */
  NUTR_LOG_UPD_SUCCESS: string = "Nutrition log updated successfully";

  /**
  * Message displayed when a nutrition log is updated unsuccessfully.
  */
  NUTR_LOG_UPD_FAILURE: string = "Failed to update nutrition log";

  /**
  * Message displayed when a Day Entry is created successfully.
  */
  DAY_ENTRY_CRE_SUCCESS: string = "Day entry created successfully";

  /**
  * Message displayed when a Day Entry is not created successfully.
  */
  DAY_ENTRY_CRE_FAILURE: string = "Failed to create day entry";

  /**
  * Message displayed when a Day Entry is updated successfully.
  */
  DAY_ENTRY_UPD_SUCCESS: string = "Day entry updated successfully";

  /**
  * Message displayed when a Day Entry is not updated successfully.
  */
  DAY_ENTRY_UPD_FAILURE: string = "Failed to update day entry";

  /**
  * Message displayed when a Day Entry is deleted successfully.
  */
  DAY_ENTRY_DEL_SUCCESS: string = "Day entry deleted successfully";

  /**
  * Message displayed when a Day Entry is deleted successfully.
  */
  DAY_ENTRY_DEL_FAILURE: string = "Failed to delete day entry";

  /**
   * Error code returned when the service is unavailable.
   */
  ERROR_CODE_UNAVAILABLE: string = "unavailable";

  /**
   * Message displayed when no connection exists.
   */
  MESSAGE_UNAVAILABLE: string = "Can't Connect";

  /**
   * Name of the function that is used to sync health data.
   */
  SYNC_DATA_FROM_HEALTH_NAME: string = "syncDataFromHealth";

  /**
   * @ignore
   */
  constructor(
    public db: AngularFirestore,
    public auth: AuthenticationService,
    public time: TimeService,
    public stateManager: StateManagerService,
    public objectManager: ObjectStorageService,
    public snackBarManager: SnackBarService,
    public conversionManager: ConversionService,
    public tierPermissionsService: TierPermissionsService,
    public firebaseGeneralService: FirebaseGeneralService,
    public payload: PayloadService,
    public router: Router,
    public afAuth: AngularFireAuth,
    public constants: NutritionConstanstsService,
    public wrapper: CallableWrapperService,
    public mobileHealthService: MobileHealthSyncService,
    public environmentSrvice: EnvironmentService) { }

  /**
   * This helper function is used to determine if an angular firestore document is 
   * offline. If it is, then a warning message is displayed to the user and allows 
   * the error code to execute preventing a spinner wheel from being displayed forever
   * while the user waits for an operation that cannot complete.
   */
  async checkIfDocumentOffline(someDocument: AngularFirestoreDocument): Promise<boolean> {
    let isOffline = false;
    try {
      const thisWillFailOrBeFromCacheIfYourOffline: firebase.firestore.DocumentSnapshot = await someDocument.get({ source: 'server' }).toPromise();
      const isFromCache: boolean = thisWillFailOrBeFromCacheIfYourOffline['_fromCache'];
      isOffline = isFromCache;
    }
    catch (error) {
      isOffline = true;
    }
    if (isOffline) {
      this.snackBarManager.showWarningMessage(this.MESSAGE_UNAVAILABLE);
    }
    return isOffline;
  }

  /**
  * Helper function for displaying the text in the auto prompt dialog.
  * If the log is being observed is empty or null, then the current 
  * date is returned. Otherwise, one day after the latest entry in the log 
  * is returned.
  */
  getAutoPromptDate(observedLog: NutritionLog, currentPayload: EnergyPayload): Date {
    const logIsNull: boolean = !(observedLog);
    const logIsEmpty: boolean = (!(logIsNull) && (observedLog.dayEntries.length <= 0));
    const payloadIsNull: boolean = !(currentPayload)
    const logisNullOrEmpty: boolean = (logIsNull || logIsEmpty);
    let promptDate: Date = null;
    if (logisNullOrEmpty || payloadIsNull) {
      promptDate = new Date();
    }
    else {
      const latestDate: Date = new Date(currentPayload.latestDate);
      const oneDayAfterLatest: Date = this.time.getOneDayLater(latestDate);
      promptDate = oneDayAfterLatest;
    }
    return promptDate;
  }

  /**
   * Opens the in depth log page with the log passed in as a parameter as the log being observed. This function
   * assumes that the user that is currently authenticated has permissions to access the log being requested.
   * 
   * @param inDepthLogModel log to open the inDepthLogModel page.
   */
  openInDepthNutritionLog(inDepthLogModel: NutritionLog): Promise<boolean> {
    return this.router.navigate([this.NUTR_LOG_IN_DEPTH_PAGE, { lid: inDepthLogModel.id, uid: this.auth.getUserID() }]);
  }

  /**
   * Returns a reference to the firebase document where the summary for a nutrition log
   * is stored. All properties in a nutrition log are stored as one document so only 
   * one document reference is needed. This function assumes that the log summary 
   * being requested is owned by the currently authenticated user.
   * 
   * @param logId id of the log with the day entries to retrieve.
   */
  getLogSummaryDocument(logId: number): AngularFirestoreDocument {
    const summaryDoc: AngularFirestoreDocument = this.db.collection(this.NUTR_COL).doc(this.auth.getUserID()).collection(this.LOG_SUM_COL).doc(logId.toString());
    return summaryDoc;
  }

  /**
   * Returns a reference to the firebase document where the day entries for a nutrition log
   * are stored. All entries in a log are stored as one document, so only one reference is 
   * needed to get all of the entries for a log. This function assumes that the day entries 
   * being requested are owned by the currently authenticated user.
   * 
   * @param logId id of the log with the day entries to retrieve.
   */
  getDayEntriesDocument(logId: number): AngularFirestoreDocument {
    const entriesDoc: AngularFirestoreDocument = this.db.collection(this.NUTR_COL).doc(this.auth.getUserID()).collection(this.DAY_ENTRIES_COL).doc(logId.toString());
    return entriesDoc;
  }

  /**
   * Deletes a nutrition log from the current user. Does this by extracting the logId from the log passed in 
   * as a parameter and getting the path to that log in the database. An additional check is done if the log being delted 
   * is the user's main log. If so, we will want to remove the main log using the logic defined in the firebase general 
   * service, this way, the User's TDEE will not somehow get outof sync. The log summary is deleted first on purpose to ensure, that we do not get into a situation where the logs summary 
   * exists but its day entries do not.
   * 
   * @param logToBeDeleted Log to use id from to get path in database
   */
  async deleteLogFromCurrentUser(logToBeDeleted: NutritionLog): Promise<void> {
    try {
      const logId: number = logToBeDeleted.id;
      const logSummary: AngularFirestoreDocument = this.getLogSummaryDocument(logId);
      const logOnline: boolean = !(await this.checkIfDocumentOffline(logSummary));
      const logEntries: AngularFirestoreDocument = this.getDayEntriesDocument(logId);
      const entriesOnline: boolean = !(await this.checkIfDocumentOffline(logEntries));
      if (logOnline && entriesOnline) {
        const isMainLog: boolean = logToBeDeleted.id == this.stateManager.getCurrentUser().mainNutrLogId;
        if (isMainLog) {
          const tdee = this.stateManager.getCurrentUser().estimatedTDEE;
          this.firebaseGeneralService.removeUserMainNutrLog(this.stateManager.getCurrentUser(), tdee, this.stateManager);
        }
        logSummary.delete();
        logEntries.delete();
        this.snackBarManager.showSuccessMessage(this.NUTR_LOG_DEL_SUCCESS);
      }
    } catch (error) {
      this.snackBarManager.showFailureMessage(this.NUTR_LOG_DEL_FAILURE);
    }
  }

  /**
   * Adds a new nutrition log to the current user. This function assumes that the 
   * user does not already have a nutrition log with the same id as the log passed
   * in as a parameter. If the user does have a log with the same id, it will be 
   * overwritten. This function only edits the log's summary, this is because new 
   * logs are empty to start and do not have entries associated them.
   * 
   * @param newLog Nutrition log to be added to the current user's list of logs.
   */
  async addNutritionalLogToCurrentUser(newLog: NutritionLog): Promise<void> {
    try {
      const logId: number = newLog.id;
      const logInStorageFormat: {} = this.objectManager.convertLogSummaryToFireStorageFormat(newLog);
      const newLogSummaryDoc: AngularFirestoreDocument = this.getLogSummaryDocument(logId);
      const isOnline: boolean = !(await this.checkIfDocumentOffline(newLogSummaryDoc));
      if (isOnline) {
        newLogSummaryDoc.set(logInStorageFormat);
        this.snackBarManager.showSuccessMessage(this.NUTR_LOG_CRE_SUCCESS);
      }
    } catch (error) {
      if (error.code == this.ERROR_CODE_UNAVAILABLE) {
        this.snackBarManager.showWarningMessage(this.MESSAGE_UNAVAILABLE)
      }
      else {
        this.snackBarManager.showFailureMessage(this.NUTR_LOG_CRE_FAILURE);
      }
    }
  }

  /**
   * Updates the nutrition log that has the same id as logToBeUpdated with the 
   * data that is stored in the log that is passed in as a parameter in our firestore 
   * database. This function only updates the log summary and not the logs entries. To save 
   * on writes, this function will also update the time stamp of the nutrition log being 
   * edited's lastEdit property instead of calling the markAsUpdated function which would 
   * require another asynchronous operation and 2 writes to our firestore db.
   * 
   * @param newLog Nutrition log to be added to the current user's list of logs.
   */
  async updateExistingLogForCurrentUser(logToBeUpdated: NutritionLog): Promise<void> {
    try {
      const logId: number = logToBeUpdated.id;
      logToBeUpdated.lastEdit = this.time.getTimeStamp();
      const logInStorageFormat: {} = this.objectManager.convertLogSummaryToFireStorageFormat(logToBeUpdated);
      const updatedLogSummaryDoc: AngularFirestoreDocument = this.getLogSummaryDocument(logId);
      const isOnline: boolean = !(await this.checkIfDocumentOffline(updatedLogSummaryDoc));
      if (isOnline) {
        updatedLogSummaryDoc.update(logInStorageFormat);
        this.snackBarManager.showSuccessMessage(this.NUTR_LOG_UPD_SUCCESS);
      }
    } catch (error) {
      this.snackBarManager.showFailureMessage(this.NUTR_LOG_UPD_FAILURE);
    }
  }

  /**
   * Deletes an entry from a nutrition logs day entry list. Then overwrites the document 
   * in our firestore database that contains that logs day entries with the new state of 
   * the day entry list after the entry has been deleted.
   * 
   * @param entryToDelete entry to delete from the logs list of day entries
   * @param logToDeleteFrom log that contains the day entry list.
   */
  async deleteEntryFromLog(entryToDelete: DayEntry, logToDeleteFrom: NutritionLog) {
    try {
      const logId: number = logToDeleteFrom.id;
      const entryDoc: AngularFirestoreDocument = this.getDayEntriesDocument(logId);
      const entryDocOnline: boolean = !(await this.checkIfDocumentOffline(entryDoc))
      if (entryDocOnline) {
        const entryIndex: number = logToDeleteFrom.dayEntries.indexOf(entryToDelete)
        logToDeleteFrom.dayEntries.splice(entryIndex, this.DEL_ONE_ENTRY);
        const entriesInStorageFormat: {} = this.objectManager.convertDayEntryListToFireStorageFormat(logToDeleteFrom.dayEntries);
        entryDoc.set(entriesInStorageFormat);
        await this.markLogAsUpdated(logToDeleteFrom);
        this.snackBarManager.showSuccessMessage(this.DAY_ENTRY_DEL_SUCCESS);
      }
    } catch (error) {
      this.snackBarManager.showFailureMessage(this.DAY_ENTRY_DEL_FAILURE);
    }
  }



  /**
   * Adds an entry to nutrition logs day entry list. Then overwrites the document 
   * in our firestore database that contains that logs day entries with the new state of 
   * the day entry list after the entry has been added. A check is done to make sure that 
   * the entry date is unique. If the entry date is not unique then the entry with the same 
   * date is overwritten with the new entries data. This function is used whenever a day entry is 
   * being updated or created so it will dynamically change the success and failure messages displayed 
   * based upon which of those cases is happening.
   * 
   * @param entryToDelete entry to delete from the logs list of day entries
   * @param logToDeleteFrom log that contains the day entry list.
   */
  async addEntryToLog(entryToAdd: DayEntry, logToAddTo: NutritionLog, hideMessages?: boolean): Promise<boolean> {
    let addedEntry: boolean = false;
    let successMessage: string = this.DAY_ENTRY_CRE_SUCCESS;
    let failureMessage: string = this.DAY_ENTRY_CRE_FAILURE;
    try {
      const logId: number = logToAddTo.id;
      const entryDoc: AngularFirestoreDocument = this.getDayEntriesDocument(logId);
      const entryOnline: boolean = !(await this.checkIfDocumentOffline(entryDoc));
      if (entryOnline) {
        const entryWithSameId: DayEntry = logToAddTo.dayEntries.find(entry => entry.id == entryToAdd.id);
        const indexOfEntryToAdd: number = logToAddTo.dayEntries.indexOf(entryWithSameId);
        const updatingExistingEntry: boolean = (indexOfEntryToAdd != -1);
        if (updatingExistingEntry) {
          logToAddTo.dayEntries.splice(indexOfEntryToAdd, this.DEL_ONE_ENTRY);
          successMessage = this.DAY_ENTRY_UPD_SUCCESS;
          failureMessage = this.DAY_ENTRY_UPD_FAILURE;
        }
        logToAddTo.dayEntries.push(entryToAdd);
        const entriesInStorageFormat: {} = this.objectManager.convertDayEntryListToFireStorageFormat(logToAddTo.dayEntries);
        entryDoc.set(entriesInStorageFormat);
        this.markLogAsUpdated(logToAddTo);
        if (!hideMessages) {
          this.snackBarManager.showSuccessMessage(successMessage);
        }
        addedEntry = true;
        if (this.environmentSrvice.isMobile) {
          await (this.mobileHealthService.writeToHealthAppIfAuthorized(entryToAdd));
        }
      }
    }
    catch (error) {
      addedEntry = false;
      this.snackBarManager.showFailureMessage(failureMessage);
    }
    return addedEntry;
  }

  /**
   * Nutrition logs on the log management page are sorted by the date they were last edited by default. 
   * This function edits the 'lastEdit' field of a nutrition log summary and updates the log's summary 
   * state in firebase. This is done silently with no notifications sent to the user. Log's are considered
   * to be edited anytime their summary is edited or a day entry is created, deleted or upated. If an error
   * were to occur during this operation, it would be caught and nothing would happen. This is unlikely to 
   * happen and not a crucial piece of functionality.
   * 
   * @param logToMarkAsEdited The log to mark as edited.
   */
  async markLogAsUpdated(logToMarkAsEdited: NutritionLog): Promise<void> {
    try {
      logToMarkAsEdited.lastEdit = this.time.getTimeStamp();
      const logId: number = logToMarkAsEdited.id;
      const logInStorageFormat: {} = this.objectManager.convertLogSummaryToFireStorageFormat(logToMarkAsEdited);
      const updatedLogSummaryDoc: AngularFirestoreDocument = this.getLogSummaryDocument(logId);
      updatedLogSummaryDoc.update(logInStorageFormat);
    } catch (error) {
    }
  }

  /**
  * Returns an observable that emits state changes any time that any one of the user's nutrition log 
  * summaries is updated. The value of this observable is a list of nutrition logs with no entries, this 
  * saves on reads because entries are only needed when opening the log in depth.
  * 
  * The syntax here is confusing because we need to map the observable which contains a list of nutrition logs
  * in their storage format into a list of logs in Nutrition Log object format. The first map allows us to alter 
  * the value emitted by the observable and the second map is a high order function on the collection of logs in 
  * their storage format to convert them into Nutrition Log objects.
  */
  getAllNutrLogsSubscription(): Observable<NutritionLog[]> {
    const allLogsCollection: AngularFirestoreCollection = this.db.collection(this.NUTR_COL).doc(this.auth.getUserID()).collection(this.LOG_SUM_COL);
    return allLogsCollection.valueChanges().pipe(map(listOfLogs => listOfLogs.map(log => this.objectManager.convertLogSummaryFromFireStorageFormat(log))));
  }

  /**
  * Returns an observable that emits state changes whenever the day entries for the 
  * log with an id that is the same as the logId passed in has its entry list's 
  * state changed.
  * 
  * @param logId Id of the log to create an observable for its day entries. 
  */
  getNutrLogEntriesSubscription(logId: number): Observable<unknown> {
    const dayEntriesDoc = this.getDayEntriesDocument(logId);
    return dayEntriesDoc.valueChanges().pipe(map(dayEntryList => {
      try {
        return this.objectManager.convertDayEntryListFromStorageFormat(dayEntryList)
      }
      catch (error) {
        return this.constants.INSUFFICIENT_DATA;
      }
    }))
  }

  /**
   * Returns an observable that emits state changes whenever the summary for the 
   * log with an id that is the same as the logId passed in has its summary
   * state changed.
   * 
   * @param logId Id of the log to create an observable for its summary. 
   */
  getNutrLogSummarySubscription(logId: number): Observable<unknown> {
    const logSummaryDocument: AngularFirestoreDocument = this.getLogSummaryDocument(logId);
    return logSummaryDocument.valueChanges().pipe(map(logSummary => {
      try {
        return this.objectManager.convertLogSummaryFromFireStorageFormat(logSummary);
      }
      catch (error) {
        return this.constants.INSUFFICIENT_DATA;
      }
    }));
  }

  /**
   * Called by the mobile client to mark entries with a start TDEE and goal intake boundaries after a sync with
   * the devices respective health app. This function will simulate the user adding the entries manually and then
   * mark them with a TDEE and a goal intake appropriately based on the results of repeatedly getting the energy payload.
   */
  async syncDataFromHealth(mainLog: NutritionLog, userProfile: UserProfile, mergedEntries: DayEntry[]) {
    const syncParams = { mainLog: mainLog, userProfile: userProfile, mergedEntries: mergedEntries };
    return await this.wrapper.firebaseCloudFunction(this.SYNC_DATA_FROM_HEALTH_NAME, syncParams);
  }

}
