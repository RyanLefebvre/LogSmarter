import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { ValidateImperialWeight } from '../../../../../shared-validators/imperial-weight-validator'
import { ValidateCalories } from '../../../../../shared-validators/calorie-validator'
import { ValidateMetricWeight } from 'src/app/shared-validators/metric-weight-validator';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { Router } from '@angular/router';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { Subscription } from 'rxjs';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * Allows the user to edit a day entry. Currently the only properties a day entry has are date
 * weight and calories. This dialog is given a date and a nutrition log as paramters. If there
 * exists an entry in the nutrition log with the same date as the date that is passed in, then 
 * the dialog is in edit mode. If no entry exists at the date passed in then the dialog is in 
 * create mode. 
 * 
 * The dialog contains a form and a button group. The form contains three controls, a datepicker
 * a weight input and a calorie input. The button group contains three buttons, a confirm button,
 * a delete button and a cancel button. 
 * 
 * The datepicker controls what entry is being viewed and whether or not the dialog is in edit mode
 * or create mode. If the datepicker is changed, the entry displayed in the dialog will be changed 
 * as well. For example, if the dialog is in create mode because the intial date in the datepicker 
 * does not have a corresponding entry, but the datepicker is changed to the date of an existing entry,
 * the dialog will fill the form with that entries data.
 * 
 * The weight input has the same validation as a user's profile weight, it must be a valid number and 
 * is not required. The calorie input has similar validation and is also not required.
 * 
 * If the confirm button is pressed, then whatever values in the form are added to the existing entry
 * at the date of the date picker or a new entry at the date of the date picker depending on the dialog 
 * mode and added to the logs list of entries. Once the confirm button is pressed, a spinner is displayed
 * along with a spinner message. When the request to edit the entry returns, regardless of success or failure, 
 * the dialog is closed. This button is disabled if the user has reached the maximum number of entries they 
 * are allowed for their log based on their tier permissions if in create mode and disabled in either mode
 * if they have the day entry edit form in an invalid state.
 * 
 * The close button will just close the dialog with no updates or edits to the logs day entry list.
 * 
 * Last edited by: Ryan Lefebvre 7/31/2020
 */
@Component({
  selector: 'app-entry-modify',
  templateUrl: './entry-modify.component.html',
  styleUrls: ['./entry-modify.component.css']
})
export class EntryModifyComponent implements OnInit, OnDestroy {

  /**
   * Key used to get weight form control for day entry form.
   */
  FORM_CONTROL_WEIGHT: string = "weight";

  /**
   * Key used to get calorie form control for day entry form.
   */
  FORM_CONTROL_CALORIES: string = "calories";

  /**
   * Key used to get date form control for day entry form.
   */
  FORM_CONTROL_DATE: string = "date";

  /**
   * Holds the value of the date of the entry currently being modeled by the log.
   */
  dateBeingModeled: Date = null;

  /**
   * Value passed as return value to close dialog function to indicate a delete operation.
   */
  CLOSE_DELETE: string = "delete";

  /**
   * Value passed as return value to close dialog function to indicate an edit operation.
   */
  CLOSE_EDIT: string = "edit";

  /**
   * Value passed as return value to close dialog function to indicate a create operation.
   */
  CLOSE_CREATE: string = "edit";

  /**
   * Value passed as return value to close dialog function to indicate a delete operation.
   */
  JUST_CLOSE: string = "close";

  /**
   * True if the spinner should be shown. False otherwise.
   */
  showSpinner: boolean = false;

  /**
   * Holds the actual value of the message displayed by the spinner. 
   */
  spinnerMessage: string = "";

  /**
   * Reference to any events that happen on the date picker. Used to identify 
   * when the date is changed so the form can be filled with an entries data.
   */
  dateChangeSubscription: Subscription = null;

  /**
   * Formgroup for date, weight and calories form controls.
   */
  dayEntryForm: FormGroup = null;

  /**
   * Spinner message displayed when creating a new entry.
   */
  SPINNER_MESSAGE_CREATE: string = "Creating day entry";

  /**
   * Spinner message displayed when creating a new entry.
   */
  SPINNER_MESSAGE_DELETE: string = "Deleting day entry";

  /**
   * Spinner message displayed when editing an existing day entry.
   */
  SPINNER_MESSAGE_EDIT: string = "Updating day entry";

  /**
   * Message displayed by the snackbar if a general error occurs.
   */
  GENERAL_ERROR_MESSAGE: string = "An error occured";

  /**
   * Most current state of the payload associated with the log that 
   * this entry belongs to 
   */
  parentLogPayload: EnergyPayload = null;

  /**
   * The log that the entry is from 
   */
  parentLog: NutritionLog = null;

  /**
   * Contains the value of the spinner header that should be displayed.
   */
  spinnerHeaderValue: string;

  /**
   * Value used for a spinner header delete operation.
   */
  SPINNER_HEADER_DELETE: string = "spinnerDelete";

  /**
 * Value used for a spinner header create operation.
 */
  SPINNER_HEADER_CREATE: string = "spinnerCreate";

  /**
   * Value used for a spinner header update operation.
   */
  SPINNER_HEADER_UPDATE: string = "spinnerUpdate";

  /**
   * @ignore
   */
  constructor(
    public dialogRef: MatDialogRef<EntryModifyComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    public fb: FormBuilder,
    public conversion: ConversionService,
    public stateManager: StateManagerService,
    public preference: PreferenceService,
    public firebaseNutrition: FirebaseNutritionService,
    public tierPermission: TierPermissionsService,
    public snackBar: SnackBarService,
    public constants: ConstantsService,
    public payloadService: PayloadService,
    public router: Router,
    public environmentService: EnvironmentService,) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.setFormControlsForEntryAtDate(this.data.date);
    this.getParentLogPayload();
  }

  /**
   * Gets the payload from the paramaters passed into this dialog.
   */
  getParentLogPayload(): void {
    this.parentLogPayload = this.data.payload;
    this.parentLog = this.data.log;
  }

  /**
   * Handles logic associated with any date changes from the datepicker form control.
   * Resets day entry form to contain controls that are prefilled with the data in the 
   * entry at the date changed to.
   * 
   * @param dateOfEntry 
   */
  subscribeToDatePickerChanges(): void {
    this.dateChangeSubscription = this.dayEntryForm.get(this.FORM_CONTROL_DATE).valueChanges.subscribe((dateChangedTo: Date) => {
      this.setFormControlsForEntryAtDate(dateChangedTo);
    });
  }

  /**
   * Is passed one of the crud values that this dialog is capable of and returns 
   * true if the spinner is showing and the crud value is the same value as 
   * the global spinner header variable value.
   */
  shouldShowSpinnerHeader(spinnerAction: string): boolean {
    if (spinnerAction == this.spinnerHeaderValue) {
      return true;
    }
    else {
      return false;
    }
  }

  /**
   * Sets the day entry forms controls to the values stored in the entry at the given date.
   * If the form is not initialized, then it will create the form, otherwise it will update the 
   * form controls of the existing form. It also takes care of unsubscribing from the previous 
   * date form controls VALUEChange event and subscribing to the new FormGroup instances valueChange
   * event.
   * 
   * @param dateOfEntry The date of the entry to prefill the form controls with. 
   */
  setFormControlsForEntryAtDate(dateOfEntry: Date): void {
    this.dayEntryForm = this.getDayEntryForm(dateOfEntry);
    if (this.dateChangeSubscription) {
      this.dateChangeSubscription.unsubscribe();
    }
    this.subscribeToDatePickerChanges();
  }

  /**
   * Returns a formgroup to be assigned to the day entry form that is prefilled with the data from a given entry 
   * from the users log. It also correctly sets the control valiators based upon the user's number system preferences.
   * The weight validators are different based upon whether the user's preferred number system is metric or imperial.
   * If there is no entry in the log passed into this dialog at the dat passed into this function, then the values 
   * of the form controls are filled with null as a placeholder value.
   * 
   * @param dateOfEntry Date of the entry in the log this dialog is opened for to fill the form controls with.
   */
  getDayEntryForm(dateOfEntry: Date): FormGroup {
    let logEntryIsFrom: NutritionLog = this.data.log;
    let entry: DayEntry = null;
    const isFromValidLog: boolean = (logEntryIsFrom != null);
    const currentUser: UserProfile = this.stateManager.getCurrentUser();
    if (isFromValidLog) {
      entry = logEntryIsFrom.getEntryAtDate(dateOfEntry);
    }
    const entryExists: boolean = (entry != null);
    const useImperialValidators: boolean = currentUser.userPreferences[this.preference.GENERAL_PREFS][this.preference.NUMBER_SYSTEM];
    let weightValidator: Function = null;
    let weightValue: number = null;
    let calorieValue: number = null;
    if (entryExists) {
      weightValue = entry.weight;
      calorieValue = entry.calories;
    }
    if (useImperialValidators) {
      weightValidator = ValidateImperialWeight;
    }
    else {
      weightValidator = ValidateMetricWeight;
      const entryHasWeight: boolean = (weightValue != null);
      if (entryHasWeight) {
        weightValue = this.conversion.convertLbsToKg(weightValue);
      }
    }
    const dayEntryFormGroup: FormGroup = this.fb.group({
      [this.FORM_CONTROL_WEIGHT]: [weightValue, weightValidator],
      [this.FORM_CONTROL_CALORIES]: [calorieValue, ValidateCalories],
      [this.FORM_CONTROL_DATE]: [{ value: dateOfEntry, disabled: true, }, Validators.required],
    });
    return dayEntryFormGroup;
  }

  /**
  * @ignore Kill subscriptions.
  */
  ngOnDestroy() {
    if (this.dateChangeSubscription) {
      this.dateChangeSubscription.unsubscribe();
    }
  }

  /**
   * Returns true if the dialog is in create mode. False otherwise.
   * The dialog is in create mode if there is no entry in the log 
   * passed into this dialogs entry list at the date that is the current
   * value of the datepicker form control.
   */
  isInCreateMode(): boolean {
    const dayEntryFormDoesNotExist = !(this.dayEntryForm);
    const dayEntryFormDoesNotHaveDateControl = (dayEntryFormDoesNotExist || !(this.dayEntryForm.controls[this.FORM_CONTROL_DATE]))
    if (dayEntryFormDoesNotHaveDateControl) {
      return false;
    }
    else {
      const currentDatePickerValue: Date = this.dayEntryForm.controls[this.FORM_CONTROL_DATE].value;
      const parentLog: NutritionLog = this.data.log;
      const entryAtDate: DayEntry = parentLog.getEntryAtDate(currentDatePickerValue);
      const noEntryAtDate: boolean = (entryAtDate == null);
      return noEntryAtDate;
    }
  }

  /**
   * Returns true if the dialog is in edit mode. False otherwise.
   * The dialog is in edit mode if an entry exists in the log 
   * passed into this dialogs entry list at the date that is the current
   * value of the datepicker form control.
   */
  isInEditMode(): boolean {
    const dayEntryFormDoesNotExist = !(this.dayEntryForm);
    const dayEntryFormDoesNotHaveDateControl = (dayEntryFormDoesNotExist || !(this.dayEntryForm.controls[this.FORM_CONTROL_DATE]))
    if (dayEntryFormDoesNotHaveDateControl) {
      return false;
    }
    else {
      const currentDatePickerValue: Date = this.dayEntryForm.controls[this.FORM_CONTROL_DATE].value;
      const parentLog: NutritionLog = this.data.log;
      const entryAtDate: DayEntry = parentLog.getEntryAtDate(currentDatePickerValue);
      const entryExistsAtDate: boolean = (entryAtDate != null);
      return entryExistsAtDate;
    }

  }

  /**
   * Click handler for the confirm button. Extracts the values from the 
   * day entry form and creates a new entry if the dialog is in create mode 
   * or edits an existing entry if the dialog is in edit mode. Regardless of 
   * the operation, a spinner is shown indicating what operation is taking 
   * place while the request for the operation is being waited upon. When 
   * the request for the operation returns, regardless of success or failure,
   * the dialog is closed.
   */
  async confirm(): Promise<DayEntry> {
    let deepCopy: DayEntry = null;
    let entryToSendToFB: DayEntry;
    try {
      const isInCreateMode: boolean = this.isInCreateMode();
      const isInEditMode: boolean = this.isInEditMode();
      if (isInCreateMode || isInEditMode) {
        let closeValue: string = this.JUST_CLOSE;
        if (isInCreateMode) {
          this.spinnerHeaderValue = this.SPINNER_HEADER_CREATE;
          this.spinnerMessage = this.SPINNER_MESSAGE_CREATE;
          closeValue = this.CLOSE_CREATE;
        }
        else {
          this.spinnerHeaderValue = this.SPINNER_HEADER_UPDATE;
          this.spinnerMessage = this.SPINNER_MESSAGE_EDIT;
          closeValue = this.CLOSE_EDIT;
        }
        this.dialogRef.disableClose = true;
        this.showSpinner = true;
        const parentLog: NutritionLog = this.data.log;
        const currentDate: Date = this.dayEntryForm.controls[this.FORM_CONTROL_DATE].value;
        entryToSendToFB = parentLog.getEntryAtDate(currentDate);
        const entryAtDateDoesNotExist: boolean = (entryToSendToFB == null);
        if (entryAtDateDoesNotExist) {
          entryToSendToFB = new DayEntry();
          entryToSendToFB.date = currentDate;
          entryToSendToFB.id = currentDate.getTime();
        } else {
          deepCopy = JSON.parse(JSON.stringify(entryToSendToFB));
          deepCopy.date = new Date(entryToSendToFB.id);
          entryToSendToFB = deepCopy;
        }
        let weightValue: number = this.dayEntryForm.controls[this.FORM_CONTROL_WEIGHT].value;
        if (weightValue) {
          const isMetric: boolean = !(this.currentNumberSystemIsImperial());
          if (isMetric) {
            weightValue = this.conversion.convertKgToLbs(weightValue);
          }
          weightValue = this.conversion.roundNumberToOneDecimalPlace(weightValue);
        }
        entryToSendToFB.weight = weightValue;
        let calorieValue: number = this.dayEntryForm.controls[this.FORM_CONTROL_CALORIES].value;
        if (calorieValue) {
          calorieValue = Math.round(calorieValue);
        }
        entryToSendToFB.calories = calorieValue;
        if (isInCreateMode) {
          entryToSendToFB.creationEstimatedTDEE = this.parentLogPayload.estimatedTDEE;
          entryToSendToFB.goalIntakeBoundaries = this.parentLogPayload.goalIntakeBoundaries;
        }
        else {
          const parentLog: NutritionLog = this.data.log;
          const entryAtDate: DayEntry = parentLog.getEntryAtDate(entryToSendToFB.date);
          entryToSendToFB.creationEstimatedTDEE = entryAtDate.creationEstimatedTDEE;
          entryToSendToFB.goalIntakeBoundaries = entryAtDate.goalIntakeBoundaries;
        }
        const addedEntry: boolean = await this.firebaseNutrition.addEntryToLog(entryToSendToFB, parentLog);
        const dayEntryIsIncomplete: boolean = this.payloadService.dayEntryIsIncomplete(entryToSendToFB);
        if (dayEntryIsIncomplete || !addedEntry) {
          closeValue = this.JUST_CLOSE;
        }
        setTimeout(() => { this.closeDialog(closeValue); }, this.constants.SPINNER_TIMEOUT);
      }
      else {
        this.closeDialog(this.JUST_CLOSE);
      }
    }
    catch (error) {
      this.snackBar.showFailureMessage(this.GENERAL_ERROR_MESSAGE);
      this.closeDialog(this.JUST_CLOSE);
    }
    return entryToSendToFB;
  }

  /**
   * Click handler for the delete button. Turns on the spinner, 
   * disables closing and sets the spinner message to the delete message.
   * Makes a request to delete the entry at the date of the current date 
   * picker value if it exists in the log. It is expected this function 
   * wont be called if an entry does not exist at the date that is displayed
   * in the datepicker. If an entry does not exist, then the dialog will just
   * be closed.
   */
  async deleteEntry(): Promise<void> {
    try {
      const parentLog: NutritionLog = this.data.log;
      const currentDate = this.dayEntryForm.controls[this.FORM_CONTROL_DATE].value;
      const entryToDelete: DayEntry = parentLog.getEntryAtDate(currentDate);
      const hasEntryToDelete: boolean = (entryToDelete != null);
      if (hasEntryToDelete) {
        this.dialogRef.disableClose = true;
        this.spinnerHeaderValue = this.SPINNER_HEADER_DELETE;
        this.spinnerMessage = this.SPINNER_MESSAGE_DELETE;
        this.showSpinner = true;
        await this.firebaseNutrition.deleteEntryFromLog(entryToDelete, parentLog);
        setTimeout(() => { this.closeDialog(this.CLOSE_DELETE); }, this.constants.SPINNER_TIMEOUT);
      }
      else {
        this.closeDialog(this.JUST_CLOSE);
      }
    }
    catch (error) {
      this.snackBar.showFailureMessage(this.GENERAL_ERROR_MESSAGE);
      this.closeDialog(this.JUST_CLOSE);
    }
  }

  /**
   * Returns true if the delete entry button should be disabled. This is true if the 
   * dialog is in create mode, this would indicate that there is no entry to delete.
   */
  disableDeleteButton(): boolean {
    const isInCreateMode: boolean = this.isInCreateMode();
    return isInCreateMode;
  }

  /**
   * Helper for getting the maximum number of entries a user is allowed per log 
   * based on upon their tiers permissions.
   */
  getMaxEntriesForLog(): number {
    const userTier = this.tierPermission.getUserTier();
    let maxEntriesForTier: number = userTier[this.tierPermission.MAX_DAY_ENTRIES_KEY];
    const isFreeUser: boolean = !(this.tierPermission.userHasActiveSubscription());
    const hasValidPromo: boolean = (this.tierPermission.getNumWeeksFreeTrial() == 4);
    if (isFreeUser && hasValidPromo) {
      maxEntriesForTier = 28;
    }
    return maxEntriesForTier;
  }

  /**
   * Returns true if the user has reached or exceeded the maximum number of entries allowed
   * for a nutrition log in this log based upon their tier permissions. Returns false 
   * otherwise. This function is also used as the ngIf handler for the max entries message.
   */
  hasReachedorExceededMaxEntries(): boolean {
    const maxEntriesForTier: number = this.getMaxEntriesForLog();
    const parentLog: NutritionLog = this.data.log;
    const actualEntries = parentLog.dayEntries.length;
    const reachedorExceededMaxEntries: boolean = (actualEntries >= maxEntriesForTier);
    return reachedorExceededMaxEntries;
  }

  /**
   * Reutrns true if the number of entries in the user's log is exactly
   * equal to the maximum number of entries allowed in the log based on
   * their tier.
   */
  hasExactlyReachedMaxedEntriesForLog(): boolean {
    const maxEntriesForTier: number = this.getMaxEntriesForLog();
    const parentLog: NutritionLog = this.data.log;
    const actualEntries = parentLog.dayEntries.length;
    const exactlyReached: boolean = (actualEntries == maxEntriesForTier);
    return exactlyReached;
  }

  /**
   * Returns true if the  confirm button for the dialog should be disabled. False otherwise.
   * The confirm button should be disabled if the user has reached or exceeded the maximum number
   * of entries that are permitted per log for their tier or if the day entry form is invalid.
   * 
   * Special case if user has exactly reached the maximum number of entries and has an incomplete 
   * entry. In this case, we will still allow them to submit. 
   */
  disableConfirmButton(): boolean {
    const latestIncomplete: boolean = this.payloadService.latestEntryIsIncomplete(this.parentLog);
    const hasReachedMaxExact: boolean = this.hasExactlyReachedMaxedEntriesForLog();
    const allowSubmitForSpecialCase: boolean = (latestIncomplete && hasReachedMaxExact);
    if (allowSubmitForSpecialCase) {
      const NOT_DISABLED: boolean = false;
      return NOT_DISABLED;
    }
    const dayEntryFormIsInvalid: boolean = !(this.dayEntryForm.valid);
    const reachedorExceededMaxEntries: boolean = this.hasReachedorExceededMaxEntries();
    const shouldDisableConfirm: boolean = (dayEntryFormIsInvalid || reachedorExceededMaxEntries);
    return shouldDisableConfirm;
  }

  /**
   * Returns true if the current user's number sytem is imperial. False otherwise.
   */
  currentNumberSystemIsImperial(): boolean {
    const currentUser: UserProfile = this.stateManager.getCurrentUser();
    const numSystem: boolean = currentUser.userPreferences[this.preference.GENERAL_PREFS][this.preference.NUMBER_SYSTEM];
    return numSystem;
  }

  /**
   * Helper function for getting the correct weight units for the current user's selected number system preference.
   */
  getCorrectWeightUnits(): string {
    const numSystem = this.currentNumberSystemIsImperial();
    const correctUnits: string = this.preference.getWeightUnits(numSystem);
    return correctUnits
  }

  /**
   * Helper function to close the dialog with a value indicating what operation was performed before the dialog was closed.
   */
  closeDialog(action: string): void {
    this.dialogRef.close(action);
  }

}
