import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DayEntry } from 'functions/src/classes/day-entry';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { EnergyPayload } from 'src/app/model-classes/nutrition-log/energy-payload';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { MobileHealthSyncService } from 'src/app/services/general/mobile-health-sync.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

/**
 * This dialog is opened by pressing the sync with main log button on the dashboard.
 * When opened, it allows the user to pick a range of time to pull data in from their 
 * mobile devices health app to their main log.
 * 
 * Last edited by: Ryan Lefebvre 1/24/21
 */
@Component({
  selector: 'app-mobile-health-sync',
  templateUrl: './mobile-health-sync.component.html',
  styleUrls: ['./mobile-health-sync.component.css']
})
export class MobileHealthSyncComponent implements OnInit {

  /**
   * Reference to the user's main log.
   */
  mainLog: NutritionLog;

  /**
   * Reference to the user's main log payload
   */
  payload: EnergyPayload;

  /**
   * Value used as the form control name for the range of data to sync health kit with.
   */
  SYNC_FORM_RANGE_NAME: string = "syncFormRange";

  /**
   * Value used for an answer of just today to the range of data to sync form.
   */
  SYNC_FORM_RANGE_TODAY: string = "justToday";

  /**
  * Value used for an answer of no for whether or not to override data.
  */
  SYNC_FORM_RANGE_WHOLE_LOG: string = "wholeLog";

  /**
   * Value used for an answer of custom to the range of data to sync form.
   */
  SYNC_FORM_RANGE_CUSTOM: string = "customRange";

  /**
   * Value used as the form control name for whether or not to override existing data.
   */
  SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME: string = "overrideExisting";
  /**
   * Value used for an answer of yes for whether or not to override data.
   */
  OVERRIDE_YES: string = "yesToOverride";

  /**
  * Value used for an answer of no for whether or not to override data.
  */
  OVERRIDE_NO: string = "noToOverride";

  /**
   * True if the spinner hsould be shown. False otherwise.
   */
  showSpinner: boolean = false;

  /**
   * Form control for the from field of a date range.
   */
  FORM_CONTROL_NAME_FROM: string = "From"

  /**
   * Form control for the to field of a date range.
   */
  FORM_CONTROL_NAME_TO: string = "To"

  /**
   * Message displayed underneath the loading spinner on iOS.
   */
  iosSpinnerMessage: string = "Loading data from Apple Health. This may take a second."

  /**
   * Message displayed underneath the loading spinner on android.
   */
  androidSpinnerMessage: string = "Loading data from Google Fit. This may take a second."


  /**
   * Reference to the sync form.
   */
  SYNC_FORM: FormGroup = this.fb.group({
    [this.SYNC_FORM_RANGE_NAME]: this.SYNC_FORM_RANGE_TODAY,
    [this.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: this.OVERRIDE_NO,
    [this.FORM_CONTROL_NAME_TO]: null,
    [this.FORM_CONTROL_NAME_FROM]: null
  });

  /**
   * @ignore
   */
  constructor(
    public timeService: TimeService,
    @Inject(MAT_DIALOG_DATA) public data,
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<MobileHealthSyncComponent>,
    public firebaseNutr: FirebaseNutritionService,
    public tierPermissions: TierPermissionsService,
    public snackBar: SnackBarService,
    public health: MobileHealthSyncService,
    public stateManager: StateManagerService,
    public environmentService: EnvironmentService) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.setMainLogAnddPayload();
  }

  /**
   * Sets this components reference to the 
   * user's main log and payload based on the
   * data that was passed into the component.
   */
  setMainLogAnddPayload() {
    this.mainLog = this.data.log;
    this.payload = this.data.payload;
  }

  /**
   * Returns true if the from should display a beginning and end control
   * for an inclusive range that allows the user to choose exactly which 
   * days their data is synced for.
   */
  shouldShowRangeControls(): boolean {
    return (this.SYNC_FORM.controls[this.SYNC_FORM_RANGE_NAME].value == this.SYNC_FORM_RANGE_CUSTOM);
  }

  /**
   * Assumes that the user's input to the form is not missing or malformed.
   * Constructs a list of entries from the cordova health plugin that match the 
   * range specified by the user. If their range selection was just today, then
   * the start and end of the range are the same value (today's date). If their
   * selection was their entire log, then the start and latest date of the logs payload
   * are used. This means that if the log is empty, then it will just be the same as sync 
   * for entire log and if the custom range is selected then the user input for the 
   * beginning and end form controls are used to construct the entry list.
   */
  async getEntriesFromHealth(): Promise<DayEntry[]> {
    const rangeControlBeginValue = (this.SYNC_FORM.controls[this.FORM_CONTROL_NAME_FROM].value);
    const rangeControlEndValue = (this.SYNC_FORM.controls[this.FORM_CONTROL_NAME_TO].value);
    const syncRangeValue: string = (this.SYNC_FORM.controls[this.SYNC_FORM_RANGE_NAME].value);
    let startOfRangeOfEntriesToSyncWith: Date = new Date();
    let endOfRangeOfEntriesToSyncWith: Date = new Date();
    if (syncRangeValue == this.SYNC_FORM_RANGE_WHOLE_LOG) {
      startOfRangeOfEntriesToSyncWith = new Date(this.payload.startDate);
      endOfRangeOfEntriesToSyncWith = new Date(this.payload.latestDate);
    }
    else if (syncRangeValue == this.SYNC_FORM_RANGE_CUSTOM) {
      startOfRangeOfEntriesToSyncWith = new Date(rangeControlBeginValue.replaceAll("-", "/"));
      endOfRangeOfEntriesToSyncWith = new Date(rangeControlEndValue.replaceAll("-", "/"));
    }

    const entriesFromHealth = await this.health.getEntriesFromHealthQuery(startOfRangeOfEntriesToSyncWith, endOfRangeOfEntriesToSyncWith);
    return entriesFromHealth;
  }

  /**
   * Builds a combined list of entries from the entries that are returned from
   * converting the user's form submission into a healthkit query and the entries
   * that were passed in by the main log to this component.
   */
  async buildCombinedEntryList(): Promise<DayEntry[]> {
    const overrideExistingValue: string = (this.SYNC_FORM.controls[this.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME].value);
    const shouldOverrideExisting: boolean = (overrideExistingValue == this.OVERRIDE_YES);
    const resultingEntryList: DayEntry[] = [];
    const mainLogEntries = this.mainLog.dayEntries;
    const entriesFromHealth = await this.getEntriesFromHealth();
    for (let existingEntry of mainLogEntries) {
      resultingEntryList.push(existingEntry)
    }
    for (let entryFromHealth of entriesFromHealth) {
      const existingEntryWithSameDate: DayEntry = resultingEntryList.find(existingEntry => this.timeService.datesAreOnSameDay(existingEntry.date, entryFromHealth.date));
      const noEntrySoAddOneFromHealth: boolean = (!existingEntryWithSameDate);
      if (noEntrySoAddOneFromHealth) {
        resultingEntryList.push(entryFromHealth);
      }
      else {
        const existingEntryWeightIsNullOrZero: boolean = (existingEntryWithSameDate.weight == 0 || existingEntryWithSameDate.weight == null);
        const healthKitEntryHasNoWeight: boolean = (entryFromHealth.weight == 0 || entryFromHealth.weight == null);
        const canEditWeight: boolean = (shouldOverrideExisting || existingEntryWeightIsNullOrZero) && !(healthKitEntryHasNoWeight);
        const existingEntryKcalIsNullOrZero: boolean = (existingEntryWithSameDate.calories == 0 || existingEntryWithSameDate.calories == null);
        const healthKitEntryHasNoKcal: boolean = (entryFromHealth.calories == 0 || entryFromHealth.calories == null);
        const canEditKcal: boolean = (shouldOverrideExisting || existingEntryKcalIsNullOrZero) && !(healthKitEntryHasNoKcal);
        if (canEditWeight) {
          existingEntryWithSameDate.weight = entryFromHealth.weight;
        }
        if (canEditKcal) {
          existingEntryWithSameDate.calories = entryFromHealth.calories;
        }
      }
    }
    return resultingEntryList;
  }

  /**
   * Handles submission of the sync form. First extracts the user's responses to the fields on the form,
   * creates a list of entries in the main log that was passed into this component and then gets  a list of 
   * the entries from healthkit.
   * 
   * Then calls helper functions to construct a combined list and checks if there exists an entry in the 
   * list of health kit entries with the same date as the existing main log entries. If an entry on the same date 
   * exists, then the function checks if the entry in healthkit has a weight and kcal. For each variable, if
   * health kit has a value and the entry in the list does not, then it is overridden. If the entry has a value
   * for the variable and health kit does not, then it will not be overriden regardless of override status.
   * If the entry in healthkit has a value for the variable and the entry from the log has a value for the variable,
   * then it will only be overriden if shouldOverride is true.
   * 
   * Next a check is done to see if there is an entry for today, if not, an entry for today is created and pushed 
   * onto the list of existing entries. Then the helper lambda is called on the entry for today to fill it with data
   * from healthkit if applicable. 
   * 
   * A final check is done to see if the user has chosen to sync the entire log or just today. If they chose just
   * today, then nothing is done. Otherwise, the helper lambda is called on each entry in the log to pull in 
   * data from healthkit if applicable.
   * 
   * Once done, the user's log is updated in firebase and an algorithm feedback dialog is opened. If any error occurs,
   * during this entire process, a snacbar message is displayed and the dialog is closed. An additional check was added
   * to see if the user has permissions before trying to grab entries from healthkit to cover the rare scenario where
   * they change their permissions immediately after opening this dialog.
   */
  async handleSubmit() {
    this.showSpinner = true;
    let successfulSubmission: boolean = false;
    const originalEntriesRef: DayEntry[] = this.mainLog.dayEntries;
    try {
      const rangeControlBeginValue = (this.SYNC_FORM.controls[this.FORM_CONTROL_NAME_FROM].value);
      const rangeControlEndValue = (this.SYNC_FORM.controls[this.FORM_CONTROL_NAME_TO].value);
      if (this.shouldShowRangeControls()) {
        const atLeastOneRangeBoundaryIsInvalid: boolean = (!rangeControlBeginValue || !rangeControlEndValue);
        if (atLeastOneRangeBoundaryIsInvalid) {
          this.snackBar.showFailureMessage("Must provide a valid range!");
          this.showSpinner = false;
          return;
        }
      }
      const resultingEntryList: DayEntry[] = await this.buildCombinedEntryList();
      const exceededMaxEntries: boolean = (resultingEntryList.length > (this.tierPermissions.getUserTier())[this.tierPermissions.MAX_DAY_ENTRIES_KEY]);
      const hadNoDataToSync: boolean = (resultingEntryList.length == 0);
      if (exceededMaxEntries) {
        this.snackBar.showFailureMessage("Failed to sync, because range requested exceed maximun entry limit!")
        successfulSubmission = false;
      }
      else if (hadNoDataToSync) {
        this.snackBar.showFailureMessage("Failed to sync, because there was no data to sync!")
        successfulSubmission = false;
      }
      else {
        this.mainLog.dayEntries = resultingEntryList;
        const HIDE_MESSAGE: boolean = true;
        const mergedEntries: any = await this.firebaseNutr.syncDataFromHealth(this.mainLog, this.stateManager.getCurrentUser(), this.mainLog.dayEntries);
        if (mergedEntries && mergedEntries.syncedData) {
          this.mainLog.dayEntries = mergedEntries.syncedData.map(entry => {
            entry.date = new Date(entry.id);
            return entry;
          });
        }
        successfulSubmission = await this.firebaseNutr.addEntryToLog(resultingEntryList[0], this.mainLog, HIDE_MESSAGE);
      }
    }
    catch (error) {
      successfulSubmission = false;
    }
    if (!successfulSubmission) {
      this.mainLog.dayEntries = originalEntriesRef;
    }
    this.showSpinner = false;
    this.dialogRef.close(successfulSubmission);
  }
}
