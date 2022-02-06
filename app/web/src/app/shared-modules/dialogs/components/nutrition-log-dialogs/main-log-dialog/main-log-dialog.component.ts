import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { Subscription } from 'rxjs';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';

/**
 * This dialog is used to let the user set their main log. The dialog contains three actionable elements,
 * a 'create new log' button, a 'use existing log' dropdown and a close button. The create new log 
 * button when pressed should open up the log modify dialog with an empty nutrition log and the isMain 
 * paramter as true indicating a new main log for the user. This button is diabled if the user has reached
 * or exceeded the maximum number of nutrition logs they are allowed based upon their tiers permissions.
 * The use existing drop down when clicked should set the log in the dropdown list of the user's existing logs
 * as their main log. When the log in the list is clicked, a spinner should be turned on and closing should be disabled.
 * When the request for setting the log  as the main log returns, regardless of success or failure, the dialog
 * will be closed. The close button when pressed will just close the dialog and no other operations will be performed.
 * 
 * Last edited by: Ryan Lefebvre 7/30/2020
 */
@Component({
  selector: 'app-main-log-dialog',
  templateUrl: './main-log-dialog.component.html',
  styleUrls: ['./main-log-dialog.component.css']
})
export class MainLogDialogComponent implements OnInit {

  /**
   * True if the spinner should be shown. False otherwise. 
   */
  showSpinner: boolean = true;

  /**
   * Spinner message shown while the user's list of Nutrition logs is loading.
   */
  LOADING_LOGS_MESSAGE: string = "Loading existing logs"

  /**
  * Spinner message shown while setting a nutrition log as the user's main log.
  */
  SETTING_LOG_MESSAGE: string = "Setting new main log. This may take a second."

  /**
   * The actual value of the message displayed underneath the spinner during a loading operation.
   */
  spinnerMessage: string = this.LOADING_LOGS_MESSAGE;

  /**
   * Local copy of the users list of nutrition logs. 
   */
  existingLogs: NutritionLog[] = [];

  /**
   * Reference to a subscription to the user's list of nutrition log that will update anytime
   * any of the user's nutrition log summaries are updated. This is set in the listOfLogSubscription
   * function body.
   */
  logSubscription: Subscription = null;

  /**
   * Return value indicating the close button was pressed.
   */
  JUST_CLOSE: string = "close";

  /**
   * Return value indicating that the create new button was pressed.
   */
  CREATE_NEW: string = "createNew";

  /**
   * True if the use existing controls should be shown, false otherwise.
   */
  showUseExisting: boolean = false;

  /**
   * @ignore
   */
  constructor(
    public dialogRef: MatDialogRef<MainLogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    public stateManager: StateManagerService,
    public firebaseGeneralManager: FirebaseGeneralService,
    public firebaseNutritionManager: FirebaseNutritionService,
    public tierPermissionManager: TierPermissionsService,
    public constants: ConstantsService
  ) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.listOfLogSubscription()
  }

  /**
   * Initializes a subscription to a reference to the user's list of nutrition log summaries which 
   * is essentailly a list of all of their nutrition logs. Whenever there is any state change to 
   * any of the nutrition log summaries this body of this subscription will be executed. In the
   * subscription body callback, a spinner is turned on to indicate a new state and then the logs 
   * are loaded into the list of logs and the spinner is turned off.
   */
  listOfLogSubscription(): void {
    const context = this;
    this.firebaseNutritionManager.getAllNutrLogsSubscription().subscribe((logs: NutritionLog[]) => {
      this.spinnerMessage = this.LOADING_LOGS_MESSAGE;
      this.showSpinner = true;
      setTimeout(() => {
        context.existingLogs = logs;
        context.showSpinner = false;
      }, this.constants.SPINNER_TIMEOUT);
    })
  }

  /**
   * Returns true if the use existing button should be enabled and false otherwise.
   * The use existing control should be enabled as long as the user has more than 
   * one existing log.
   */
  enableUseExisting(): boolean {
    const userHasAtLeastOneLog: boolean = (this.existingLogs.length >= 1);
    return userHasAtLeastOneLog;
  }

  /**
   * Used as the click handler for the use existing button and the back button.
   * If pressed, either button will flip the value of the showExisting variable
   * changing it off if it is on and on if it is off.
   */
  toggleUseExisting(): void {
    this.showUseExisting = !this.showUseExisting;
  }

  /**
   * Returns the maximum number of logs that the user if allowed for their tier 
   * based upon their tier permissions.
   */
  getMaxNumLogsForUser(): number {
    const userTier = this.tierPermissionManager.getUserTier();
    const maxNumLogs: number = userTier[this.tierPermissionManager.MAX_NUTR_LOGS_KEY];
    return maxNumLogs;
  }

  /**
   * Returns true if the user has reached or exceeded the max number of nutrition logs 
   * that they are allowed to have at a given time and false otherwise. This is used as
   * the handler for fisabling the create new button and called to show or hide the error
   * message that shows the max number of logs that the user is allowed.
   */
  reachedOrExceededMaxLogs(): boolean {
    const currentNumberOfLogs: number = this.existingLogs.length;
    const maxNumLogs: number = this.getMaxNumLogsForUser();
    const hasReachedOrExceededmaxLogs: boolean = (currentNumberOfLogs >= maxNumLogs);
    return hasReachedOrExceededmaxLogs;
  }

  /**
   * Returns true if the max logs error message should be shown. This is true if the 
   * user has reached or exceeded the maximum number of logs and the dialog is not 
   * in the show use existing mode.
   */
  showMaxErrorMessage(): boolean {
    const reachedOrExceedLogs: boolean = this.reachedOrExceededMaxLogs();
    const notInShowExistingView: boolean = !(this.showUseExisting);
    const showErrorMsg: boolean = (reachedOrExceedLogs && notInShowExistingView);
    return showErrorMsg;
  }

  /**
   * This function is the click handler for all of the actioanble elements in the dialog. 
   * When any button is clicked, the first checks done are to see if the logic needed 
   * for that button must be handled by the dialog creator or if there is no logic. In 
   * either of those cases, the dialog is closed and passed the actionValue given to this
   * function. If the return value does not indicate that the 'create new' or 'close' 
   * button was pressed, then the value passed in must be a nutrtition log and a request 
   * is made to set that log as the user's main log. During the request, a spinner 
   * is displayed and when the request returns, the dialog will be closed regardless 
   * of success or failure.
   * 
   * @param returnValue Identifier used to check what button was pressed and what logic to perform.
   */
  async closeDialog(returnValue: any) {
    try {
      const createNewPressed: boolean = (returnValue == this.CREATE_NEW);
      const closePressed: boolean = (returnValue == this.JUST_CLOSE);
      const sendToCallBack: boolean = (createNewPressed || closePressed);
      if (sendToCallBack) {
        this.dialogRef.close(returnValue);
      }
      else {
        this.dialogRef.disableClose = true;
        this.spinnerMessage = this.SETTING_LOG_MESSAGE;
        this.showSpinner = true;
        const logToSetAsMain: NutritionLog = returnValue;
        const currentUser: UserProfile = this.stateManager.getCurrentUser();
        this.firebaseGeneralManager.setUserMainNutrLog(currentUser, logToSetAsMain, currentUser.estimatedTDEE, this.stateManager)
        setTimeout(() => { this.dialogRef.close(this.JUST_CLOSE); }, 100);
      }
    }
    catch (error) {
      this.dialogRef.close(this.JUST_CLOSE);
    }
  }
}
