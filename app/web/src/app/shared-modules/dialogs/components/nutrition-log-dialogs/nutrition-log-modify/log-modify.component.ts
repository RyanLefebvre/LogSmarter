import { Component, OnInit, Inject, } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { ConstantsService } from 'src/app/services/general/constants.service';

/**
 * This dialog is used to edit nutrition logs or create new nutrition logs. The dialog is 
 * passed in a nutrition log and a boolean variable called isMain. If the nutrition log is 
 * null, then dialog is in create mode and will create a new log. If the nutrition log passed
 * is not null then it is in edit mode. If the isMain variable is true then if the user confirms
 * creation or their edits of the log passed in the log will be set as their main log. 
 * 
 * The dialog has a form with up to 2 fields. An input for the log title which is required
 * and cannot be blank so that the user can identify their log in a list of logs. The other 
 * field is a mat-select that allows the user to select their log goal from the valid list 
 * of log goals. If the log is in edit mode then the goal field will be hidden. This is 
 * because it does not make much sense for a user to change their log goal in the middle 
 * of a log. If a user's body composition goal were to change, then they should start a 
 * new log.
 * 
 * Below the log form are two buttons, a confirm button and a close button. If the close 
 * button is pressed, then the dialog is closed. If the confirm button is pressed, then 
 * the dialog disables closing and turns on a spinner indicating what operations are taking 
 * place, when the operations return, regardless of success or failure, the dialog is closed.
 * 
 * This dialog assumes that it will not be opened in create mode and does not check if the 
 * the user has reached or exceeded the maximum number of logs they are allowed based upon
 * their tiers permissions.
 * 
 * Last edited by: Ryan Lefebvre 7/30/2020
 */
@Component({
  selector: 'app-log-modify',
  templateUrl: './log-modify.component.html',
  styleUrls: ['./log-modify.component.css']
})
export class NutritionLogModifyComponent implements OnInit {

  /**
   * True if the spinner should be shown, false otherwise.
   */
  showSpinner: boolean = false;

  /**
   * Contains the actual value of the message displayed below the spinner.
   */
  spinnerMessage: string = "";

  /**
   * Formgroup used to edit the nutrition logs title and goal.
   */
  nutrLogForm: FormGroup = null;

  /**
   * Key used for the log title form control.
   */
  FORM_CONTROL_LOG_TITLE: string = "TITLE";

  /**
   * Key used for the log title form control.
   */
  FORM_CONTROL_LOG_GOAL: string = "GOAL";

  /**
   * Message displayed by snackbar whena  general exception occurs.
   */
  GENERAL_FAIL_MESSAGE: string = "An error occurred";

  /**
   * Spinner message displayed when creating a new nutrition log.
   */
  CREATING_NEW_LOG_MESSAGE: string = "Creating new log";

  /**
   * Spinner message displayed when editing an existing nutrition log.
   */
  EDITING_LOG_MESSAGE: string = "Updating log";

  /**
   * Spinner message displayed when setting an nutrition log as the user's main log.
   */
  SETTING_MAIN_LOG_MESSAGE: string = "Setting main log";

  /**
   * @ignore
   */
  constructor(
    public dialogRef: MatDialogRef<NutritionLogModifyComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    public fb: FormBuilder,
    public stateManager: StateManagerService,
    public firebaseGeneralManager: FirebaseGeneralService,
    public firebaseNutritionManager: FirebaseNutritionService,
    public snackBar: SnackBarService,
    public nutritionConstants: NutritionConstanstsService,
    public constants: ConstantsService) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.nutrLogForm = this.generateNutrLogForm(this.data.logToBeEdited);
  }

  /**
   * Generates a new form for a nutrition log to edit the logs title and goal. The form controls
   * for title and goal are pre filled with the data of the log that is passed in.
   * 
   * @param log Nutrition log to model the form after.
   */
  generateNutrLogForm(log: NutritionLog): FormGroup {
    let logToSetFormWith: NutritionLog = log;
    const noLogExists: boolean = (logToSetFormWith == null);
    if (noLogExists) {
      logToSetFormWith = new NutritionLog();
    }
    const nutrLogForm: FormGroup = this.fb.group({
      [this.FORM_CONTROL_LOG_TITLE]: [logToSetFormWith.title, Validators.required],
      [this.FORM_CONTROL_LOG_GOAL]: [logToSetFormWith.goal, Validators.required],
    });
    return nutrLogForm;
  }

  /**
   * Returns true if the dialog should be in create mode. False otherwise.
   * The log is in create mode if the log passed in through the data param is null.
   */
  inCreateMode(): boolean {
    const passedNullLog: boolean = (this.data.logToBeEdited == null);
    return passedNullLog
  }

  /**
   * Returns true if the dialog should be in edit mode. False otherwise.
   * The log is in edit mode if the log passed in trough the data param is NOT null.
   */
  inEditMode(): boolean {
    const notPassedNullLog: boolean = (this.data.logToBeEdited != null);
    return notPassedNullLog
  }

  /**
   * Helper function for closing the dialog.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Used as the click handler for the confirm button. If the log passed in is null,
   * then a log is created and added to the user's list of logs. If the log passed in 
   * is not null then it is updated and written to the database. If the isMain 
   * variable passed into this dialog is true, then a request is made to set 
   * the log as the user's main log regardless of whether the log is created or in edit 
   * mode. When the final request is returned, the dialog is closed. If any error 
   * occurs, a general error message is displayed  and the dialog is closed. While the 
   * requests are being waited upon, the dialog should display a spinner and a spinner 
   * message.
   */
  async assignInputs(): Promise<void> {
    try {
      this.dialogRef.disableClose = true;
      let logToAssign: NutritionLog = null;
      let operationLogic: Function = null;
      if (this.inEditMode()) {
        logToAssign = this.data.logToBeEdited;
        operationLogic = this.editExistingLog;
        this.spinnerMessage = this.EDITING_LOG_MESSAGE;
      }
      else if (this.inCreateMode()) {
        logToAssign = new NutritionLog();
        operationLogic = this.createNewLog;
        this.spinnerMessage = this.CREATING_NEW_LOG_MESSAGE;
        const bestEstimateOfStartTdee: number = this.stateManager.getCurrentUser().estimatedTDEE;
        logToAssign.startTDEE = bestEstimateOfStartTdee;
      }
      this.showSpinner = true;
      logToAssign.title = this.nutrLogForm.controls[this.FORM_CONTROL_LOG_TITLE].value;
      logToAssign.goal = this.nutrLogForm.controls[this.FORM_CONTROL_LOG_GOAL].value;
      operationLogic(logToAssign, this);
      const needToSetAsMain: boolean = (this.data.isMain);
      if (needToSetAsMain) {
        this.spinnerMessage = this.SETTING_MAIN_LOG_MESSAGE;
        const currentUser: UserProfile = this.stateManager.getCurrentUser();
        this.firebaseGeneralManager.setUserMainNutrLog(currentUser, logToAssign, currentUser.estimatedTDEE, this.stateManager);
      }
      this.closeDialog();
    }
    catch (error) {
      this.snackBar.showFailureMessage(this.GENERAL_FAIL_MESSAGE);
      this.closeDialog();
    }
  }

  /**
   * Helper function for logic needed to call the firebase function responsible for
   * updating a user's existing log.
   * 
   * @param nutritionLog Existing log to be edited.
   */
  editExistingLog(nutritionLog: NutritionLog, context: any): Promise<void> {
    return context.firebaseNutritionManager.updateExistingLogForCurrentUser(nutritionLog);
  }

  /**
   * Helper function for logic needed to call the firebase function responsible for creating a
   * new nutrition log.
   * 
   * @param nutritionLog Existing log to be edited.
   */
  createNewLog(nutritionLog: NutritionLog, context: any): Promise<void> {
    return context.firebaseNutritionManager.addNutritionalLogToCurrentUser(nutritionLog);
  }

}
