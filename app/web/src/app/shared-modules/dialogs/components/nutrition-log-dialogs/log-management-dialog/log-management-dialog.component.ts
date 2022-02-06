import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { DayEntry } from 'functions/src/classes/day-entry';
import { Subscription } from 'rxjs';

/**
 * Dialog that allows users to perform some basic actions on a nutrition log. Acts 
 * as a control panel for some basic log operations. The dialog currently contains 
 * 5 buttons, an open button, an edit button, a delete button, a main log button 
 * and a close button. The nutrition log passed in as a parameter to this log is the
 * one that operations will be performed on. If the spinner is being shown, then the 
 * dialog should not be able to be closed 
 * 
 * If the open button is pressed, the user is routed to the nutrition-log-in-depth 
 * page for the log passed in to this dialog.
 * 
 * The edit button will close the log management dialog and open the edit nutrition log
 * dialog with the log passed in to this dialog as a param for the edit dialog.
 * 
 * The delete button will open the delete confirmation dialog which will prompt the 
 * user to make sure they positive they want to delete their log.
 * 
 * The main log button is a toggle for the state of the main log. If the log loaded
 * into the management dialog is the main log, then the button will remove it as the main
 * log. If the log loaded is not the main log then it will set the loaded log as the user's
 * main log. For either operation a spinner will be shown with a message indicating the operation 
 * until the operation completes. Regardless if the operation is successful or not, a snackbar 
 * notification is shown with the result of the operation and the dialog is closed.
 * 
 * If the close button is pressed then the dialog is closed. 
 * 
 * Last edited by: Ryan Lefebvre 7/27/2020
 */
@Component({
  selector: 'app-log-management-dialog',
  templateUrl: './log-management-dialog.component.html',
  styleUrls: ['./log-management-dialog.component.css']
})
export class LogManagementDialogComponent implements OnInit {

  /**
   * Key used to identify that the open button was pressed.
   */
  OPEN: string = "open";

  /**
   * Spinner message displayed when opening the log in depth.
   */
  SPIN_MSG_OPEN: string = "Opening log";

  /**
  * Key used to identify that the edit button was pressed.
  */
  EDIT: string = "edit";

  /**
  * Key used to identify that the delete button was pressed.
  */
  DELETE: string = "delete";

  /**
  * Key used to identify that the main button was pressed.
  */
  MAIN: string = "main";

  /**
  * Spinner message displayed when changin the main log.
  */
  SPIN_MSG_MAIN: string = "Updating your main log. This may take a second.";

  /**
  * Key used to identify that the close button was pressed.
  */
  CLOSE: string = "close";

  /**
   * Key used to open the first time tips dialog.
   */
  OPEN_TIPS: string = "tips";

  /**
   * True if the spinner should be shown. False otherwise.
   */
  showSpinner: boolean = false;

  /**
   * Holds the value of the message that is displayed underneath the spinner
   * if the spinner is showing. i.e. showSpinner is true.
   */
  spinnerMessage: string = "";

  /**
   * Constant passed as a value to closedialog when there is no data to return.
   */
  NO_CLOSE_DATA: null = null;

  /**
   * Generic error message displayed when an error occurs during a log operation.
   */
  FAIL_MSG: string = "Error in log operation";

  /**
   * @ignore
   */
  constructor(
    public stateManager: StateManagerService,
    public snackbar: SnackBarService,
    public firebaseGeneralManager: FirebaseGeneralService,
    public firebaseNutr: FirebaseNutritionService,
    public payload: PayloadService,
    public dialogRef: MatDialogRef<LogManagementDialogComponent>,
    public constants: ConstantsService,
    @Inject(MAT_DIALOG_DATA) public data) { }

  /**
  * @ignore
  */
  ngOnInit() { }

  /**
   * Closes the current dialog and passes in data to the onClose callback function 
   * that is associated with this dialog. 
   * 
   * @param data Data to be passed to the onClose callback.
   */
  closeDialog(data: any): void {
    this.dialogRef.close(data);
  }

  /**
   * Returns true if the log passed in as a parameter is the user's main log, false otherwise.
   */
  logIsMainLog(): boolean {
    const logModel: NutritionLog = this.data.logModel;
    const passedInId: number = logModel.id;
    const currentUser: UserProfile = this.stateManager.getCurrentUser();
    const userMainLogid: number = currentUser.mainNutrLogId;
    const mainLogIsThisLog: boolean = (passedInId == userMainLogid);
    return mainLogIsThisLog;
  }

  /**
   * Click handler for all of the buttons in the log management dialog. Identifies button
   * type using constant value sassociated with each button. This function is responsible 
   * for turning on the spinner, disabling the dialog close, setting the spinner message 
   * and then calling the function responsible for the logic associated with the button 
   * pressed. One special case is if the close button is pressed, in that case, the dialog 
   * is closed right away.
   * 
   * @param buttonType The type of button being pressed. Expected to be a constant in this file.
   */
  async handleButtonPress(buttonType: string): Promise<void> {
    try {
      this.dialogRef.disableClose = true;
      if (buttonType == this.CLOSE) {
        this.closeDialog(this.NO_CLOSE_DATA);
      }
      else {
        const isDeleteButton = (buttonType == this.DELETE);
        const isEditButton: boolean = (buttonType == this.EDIT);
        const isTipsButton: boolean = (buttonType == this.OPEN_TIPS);
        const needToOpenOtherDialog: boolean = (isDeleteButton || isEditButton || isTipsButton);
        if (needToOpenOtherDialog) {
          this.closeDialog(buttonType);
        }
        else {
          let buttonFunc: Function = null;
          const isOpenButton: boolean = (buttonType == this.OPEN);
          const isMainButton: boolean = (buttonType == this.MAIN);
          if (isOpenButton) {
            buttonFunc = this.handleOpenClick;
            this.spinnerMessage = this.SPIN_MSG_OPEN;
          } else if (isMainButton) {
            buttonFunc = this.handleMainClick;
            this.spinnerMessage = this.SPIN_MSG_MAIN;
          }
          const buttonHasFunction: boolean = (buttonFunc != null);
          if (buttonHasFunction) {
            this.showSpinner = true;
            const nutrLog: NutritionLog = this.data.logModel;
            await buttonFunc(nutrLog, this);
          }
          setTimeout(() => { this.closeDialog(this.NO_CLOSE_DATA) }, this.constants.SPINNER_TIMEOUT);
        }
      }
    }
    catch (error) {
      this.snackbar.showFailureMessage(this.FAIL_MSG);
      this.closeDialog(this.NO_CLOSE_DATA);
    }
  }

  /**
   * Click handler for opening the nutrition log passed in as a param 
   * in the log-in-depth page. Waits for the log to be opened in depth 
   * and then returns.
   * 
   * @param log Log to open in depth.
   * @param context Reference to calling object
   */
  async handleOpenClick(log: NutritionLog, context: any): Promise<any> {
    await context.firebaseNutr.openInDepthNutritionLog(log);
  }

  /**
   * The main log button is a toggle for the state of the main log. If the log loaded
   * into the management dialog is the main log, then the button will remove it as the main
   * log. If the log loaded is not the main log then it will set the loaded log as the user's
   * main log. For either operation a spinner will be shown with a message indicating the 
   * operation until the operation completes. Regardless if the operation is successful or
   * not, a snackbar notification is shown with the result of the operation and the dialog
   * is closed. If the user chooses to remove their main log, a request for the log's payload
   * needs to be made to make sure that the user keeps their current estimated TDEE.
   * 
   * @param log Log to update main status of.
   * @param context Reference to calling object.
   */
  async handleMainClick(log: NutritionLog, context: any): Promise<any> {
    const isMainLog: boolean = context.logIsMainLog();
    const currentUser: UserProfile = context.stateManager.getCurrentUser();
    if (isMainLog) {
      let tdee = currentUser.estimatedTDEE;
      context.firebaseGeneralManager.removeUserMainNutrLog(currentUser, tdee, context.stateManager);
    }
    else {
      const hasMainLogAlready: boolean = (currentUser.mainNutrLogId != null);
      if (hasMainLogAlready) {
        let tdee;
        let entryListSub: Subscription;
        let nutrLogSub: Subscription;
        new Promise<any>(async (resolve) => {
          try {
            nutrLogSub = await context.firebaseNutr.getNutrLogSummarySubscription(currentUser.mainNutrLogId).subscribe(async (mainLog: NutritionLog) => {
              entryListSub = await context.firebaseNutr.getNutrLogEntriesSubscription(currentUser.mainNutrLogId).subscribe(async (entryList: DayEntry[]) => {
                mainLog.dayEntries = entryList;
                tdee = context.stateManager.getCurrentUser().estimatedTDEE;
                context.firebaseGeneralManager.setUserMainNutrLog(currentUser, log, tdee, context.stateManager);
                if (entryListSub) {
                  entryListSub.unsubscribe()
                }
                if (nutrLogSub) {
                  nutrLogSub.unsubscribe();
                }
                resolve();
              });
            });
          } catch (error) {
            resolve();
          }
        });
      }
      else {
        context.firebaseGeneralManager.setUserMainNutrLog(currentUser, log, context.stateManager.getCurrentUser().estimatedTDEE, context.stateManager);
      }

    }
  }

}
