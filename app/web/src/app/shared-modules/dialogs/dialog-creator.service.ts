import { Injectable, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef, MatIcon } from '@angular/material';
import { StateManagerService } from '../../services/general/state-manager.service';
import { AuthenticationService } from '../../services/firebase/authentication.service';
import { MainLogDialogComponent } from './components/nutrition-log-dialogs/main-log-dialog/main-log-dialog.component';
import { NutritionLogModifyComponent } from './components/nutrition-log-dialogs/nutrition-log-modify/log-modify.component';
import { LogManagementDialogComponent } from './components/nutrition-log-dialogs/log-management-dialog/log-management-dialog.component';
import { SnackBarService } from '../material/snack-bar-manager.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { ConfirmationDialogComponent } from './components/general-dialogs/confirmation-dialog/confirmation-dialog.component';
import { ForgotPasswordComponent } from './components/general-dialogs/forgot-password-dialog/forgot-password.component';
import { ReAuthenticateDialogComponent } from './components/general-dialogs/re-authenticate-dialog/re-authenticate-dialog.component';
import { TermsDialogComponent } from './components/general-dialogs/terms-dialog/terms-dialog.component';
import { Router } from '@angular/router';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { SubscriptionMessageDialogComponent } from './components/general-dialogs/subscription-message-dialog/subscription-message-dialog.component';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { PurchaseProductComponent } from './components/general-dialogs/purchase-product-dialog/purchase-product-dialog.component';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { EntryModifyComponent } from './components/nutrition-log-dialogs/nutrition-entry-modify/entry-modify.component';
import { PayloadAnalyzerComponent } from './components/nutrition-log-dialogs/payload-analyzer/payload-analyzer.component';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { WaitForOperationDialog } from './components/general-dialogs/wait-for-operation/wait-for-operation.component';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { FirstTimeTipsComponent } from './components/general-dialogs/first-time-tips-dialog/first-time-tips.component';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { MobileHealthSyncComponent } from './components/general-dialogs/mobile-health-sync-dialog/mobile-health-sync.component';
import { MobileHealthSyncService } from 'src/app/services/general/mobile-health-sync.service';

/**
 * This service is responsible for opening any dialogs in the web application. If there 
 * is any logic that needs to be performed when the dialog is closing, it should be done 
 * in the component for the dialog. The only logic besides opening dialogs that should
 * be implemented in this service besides opening dialogs should be logic that absolutely 
 * needs to happen in the 'onClose' callback of the dialog. This logic is generally related 
 * to opening other dialogs.
 * 
 * Last edited by: Ryan Lefebvre 7/31/2020
 */
@Injectable({
  providedIn: 'root'
})
export class DialogCreatorService {

  /**
   * True if the account upgrade dialog is open. False otherwise.
   */
  upgradeDialogIsOpen: boolean = false;

  /**
   * Small helper for checking if on sub message page. Outside of any function
   * definition so that it can be more easily mocked when unit testing.
   */
  onSubMessagePage: () => boolean = () => location.href.includes("subscription-message");

  /**
   * @ignore 
   */
  constructor(
    public dialog: MatDialog,
    public stateManager: StateManagerService,
    public auth: AuthenticationService,
    public ngZone: NgZone,
    public snackBarManager: SnackBarService,
    public router: Router,
    public fbNutr: FirebaseNutritionService,
    public tierPermissionService: TierPermissionsService,
    public firebaseNutr: FirebaseNutritionService,
    public environmentService: EnvironmentService,
    public health: MobileHealthSyncService
  ) { }

  /**
   * Default options used to create a dialog, sets basic constraints on the 
   * width and height so that the dialog appears normal and is responsive. 
   */
  getDefaultDialogOptions(): any {
    const NO_DATA = null;
    return this.getDialogDataOptions(NO_DATA);
  }

  /**
   * Returns default options but adds data to the options. The data param of the
   * options is used within dialogs to access data that is passed in from functions
   * that open them. If data is null, it is replaced with an empty object.
   * 
   * @param data Data to be passed into dialog through options.
   */
  getDialogDataOptions(data: any, fullBleed?: boolean): any {
    const dataIsEmpty: boolean = !(data);
    if (dataIsEmpty) {
      data = {};
    }
    const options = {
      width: '95%',
      maxWidth: '575px',
      minWidth: '290px',
      maxHeight: '550px',
      data: data
    }
    if (fullBleed) {
      options['panelClass'] = 'app-full-bleed-dialog';
    }
    return options;
  }

  /**
   * Opens a dialog that shows LogSmarter users some tips if it is their first time 
   * using LogSmarter.
   */
  openFirstTimeTipsDialog(): void {
    const options = {
      panelClass: 'app-full-bleed-dialog',
      minWidth: '290px',
      width: '95%',
      maxWidth: '700px',
      padding: "0px",
    }
    this.dialog.open(FirstTimeTipsComponent, options);
  }

  /**
   * Opens the mobile health sync dialog that interacts with the cordova 
   * healthkit pulgin. Allows user to pull data from their devices
   * health app into their main log.
   */
  async openMobileHealthSyncDialog(mainLog: NutritionLog, payload: EnergyPayload) {
    const installed: boolean = await this.health.promptInstall();
    const appIsNotInstalledOnAndroid: boolean = !(installed);
    if (appIsNotInstalledOnAndroid) {
      this.snackBarManager.showFailureMessage("Must install Google Fit!");
    }
    else {
      await this.health.requestAuthorization();
      const isAvailable: boolean = await this.health.healthIsAvailable();
      if (!isAvailable) {
        this.snackBarManager.showFailureMessage("Health data is not available");
        return;
      }
      else {
        const dataIsAvailable: boolean = await this.health.healthDataAvailable();
        if (dataIsAvailable) {
          const dialogRef = this.dialog.open(MobileHealthSyncComponent,
            this.getDialogDataOptions({
              log: mainLog,
              payload: payload
            }));
          dialogRef.afterClosed().subscribe((syncSuccessful: boolean) => {
            if (syncSuccessful == true) {
              if (this.environmentService.isiOS) {
                this.snackBarManager.showSuccessMessage("Successful sync with Apple Health");
              }
              else if (this.environmentService.isAndroid) {
                this.snackBarManager.showSuccessMessage("Successful sync with Google Fit");
              }
              this.openGetEnergypayloadDialog(mainLog);
            }
          });
        }
        else {
          this.snackBarManager.showFailureMessage("Must enable access to health data!")
        }
      }
    }
  }

  /**
   * Opens the terms of service dialog. The terms dialog has no logic so no callback function
   * needs to be defined and it can just be opened with the basic dialog options.
   */
  openTermsDialog(): void {
    this.dialog.open(TermsDialogComponent, this.getDefaultDialogOptions());
  }

  /**
  * Opens a password reset dialog prompting the user to reset their password
  * if the dialog confirms the users wishes to rest then a reset email is sent to 
  * the email passed as a param. It is assumed that the email passed in is a valid 
  * email for a LogSmarter user.
  * 
  * @param email Email address to send the password reset to.
  */
  openPasswordResetDialog(email: string): void {
    const passwordResetData = { email: email };
    const passwordResetOptions = this.getDialogDataOptions(passwordResetData);
    this.dialog.open(ForgotPasswordComponent, passwordResetOptions);
  }

  /**
   * Used when a dialog needs to be opened regarding a message about the users subscription
   * state. This happens in one of two cases, when the user's subscription was active but 
   * but missed a payment and then became an unpaid subscription which is a case where they
   * lose their paid tier premissions. The other case is when the user's free trial is 
   * running out or has run out, in that case they should be prompted to upgrade their 
   * account. The logic for deciding one of the account dialogs is necessary should be 
   * implemented by whatever component or service is calling this function becuase 
   * different events can trigger a need for these dialogs.
   */
  openAppropritateAccountDialog(inAppPurchaseService: InAppPurchaseService): void {
    this.dialog.closeAll();
    const subscriptionUnpaid: boolean = this.tierPermissionService.userSubscriptionUnpaid();
    if (subscriptionUnpaid) {
      const UNPAID_TITLE: string = "UNPAID SUBSCRIPTION";
      const UNPAID_MESSAGE: string = this.tierPermissionService.getUnpaidMessage();
      const SHOW_CONTACT_INFO: boolean = true;
      this.openSubscriptionMessageDialog(UNPAID_TITLE, UNPAID_MESSAGE, SHOW_CONTACT_INFO);
    }
    else {
      const canBuyIndividualOnMobile = (this.environmentService.isMobile &&
        inAppPurchaseService.INDIVIDUAL_SUBSCRIPTION_PRODUCT &&
        inAppPurchaseService.INDIVIDUAL_SUBSCRIPTION_PRODUCT.canPurchase);
      const safeToAutoOpen = (this.environmentService.isWeb || canBuyIndividualOnMobile);
      if (safeToAutoOpen) {
        this.openFreeAccountWarningDialog(inAppPurchaseService);
      }
    }
  }

  /**
   * Opens a dialog that is intended to inform the user about their subscription. It is
   * currently only used to inform the user if their subscription is unpaid but can be 
   * expanded for more situations in the future.
   * 
   * @param errorTitle Title of the dialog. 
   * @param errorMessage Message displayed in the dialog about the user's subscription
   * @param showContact True if contact info should be shown, false otherwise.
   */
  openSubscriptionMessageDialog(errorTitle: string, errorMessage: string, showContact: boolean): void {
    const subMessageData: any = { title: errorTitle, message: errorMessage, showContact: showContact };
    this.dialog.open(SubscriptionMessageDialogComponent, this.getDialogDataOptions(subMessageData));
  }

  /**
   * Opens a dialog that warns the user they have some or no time remaining in their free
   * trial. If there is time remaining they should be able to close the dialog, otherwise
   * they should be stuck on the dialog.
   * 
   * @param inAppPurchaseService the IAP that interfaces with the cordova store
   * @param wasOpenedFromIAP true if the IAP passed in is the service that opened this dialog
   */
  openFreeAccountWarningDialog(inAppPurchaseService: InAppPurchaseService): void {
    this.dialog.closeAll();
    const options = {
      panelClass: 'app-full-bleed-dialog',
      minWidth: '290px',
      padding: "0px",
      data: {
        iap: inAppPurchaseService
      }
    }
    this.upgradeDialogIsOpen = true;
    const dialogRef = this.dialog.open(PurchaseProductComponent, options);
    const context = this;
    dialogRef.afterClosed().subscribe(async closingLogic => {
      if (closingLogic) {
        await closingLogic();
      }
      context.upgradeDialogIsOpen = false;
      if (this.onSubMessagePage()) {
        window.scroll(0, 0);
      }
    });
  }

  /**
   * 
   * This function returns a promise. If the promise is true then the subscription state change
   * request was satisfied successfully. Otherwise the function returns false indicating that
   * the request failed.
   * 
   * @param logic logic to wait for
   * @param operationName name of the operation that will displayed at the top of the dialog
   * @param matIcon mat icon displayed next to the operation name
   * @param spinnerMessage message displayed underneath the spinner while the operation is being waited upon
   */
  openWaitForOperationDialog(logic: (() => Promise<any>), operationName: string, matIcon: string, spinnerMessage: string, scrollBackToTop?: boolean) {
    const REQUEST_SUCCESFUL: boolean = true;
    const REQUEST_NOT_SUCCESFUL: boolean = false;
    return new Promise<boolean>((resolve, _) => {
      try {
        const dialogRef: MatDialogRef<WaitForOperationDialog, any> = this.dialog.open(WaitForOperationDialog, this.getDialogDataOptions({
          logic: logic,
          operationName: operationName,
          matIcon: matIcon,
          spinnerMessage: spinnerMessage
        }));
        dialogRef.afterClosed().subscribe(() => {
          resolve(REQUEST_SUCCESFUL);
          if (scrollBackToTop) {
            window.scroll(0, 0);
          }
        });
      }
      catch (error) {
        resolve(REQUEST_NOT_SUCCESFUL);
      }
    });
  }

  /**
  * Opens a dialog that will wait for a subscription state change operation and 
  * not be able to be closed until the state change request completes successfully
  * or errors out. Once that happens the dialog will close itself.
  */
  openSubscriptionStateChangeDialog(logic: (() => Promise<any>)): Promise<boolean> {
    return this.openWaitForOperationDialog(logic, "SUBSCRIPTION", "card_giftcard",
      "Updating your account's subscription information. This may take a second."
    );
  }

  /**
  * Opens a dialog that will wait for a subscription state change operation and 
  * not be able to be closed until the state change request completes successfully
  * or errors out. Once that happens the dialog will close itself.
  */
  openProfileStateChangeDialog(logic: (() => Promise<any>)): Promise<boolean> {
    return this.openWaitForOperationDialog(logic, "PROFILE", "perm_identity",
      "Updating your profile information. This may take a second."
    );
  }

  /**
  * Opens a dialog that will wait for a subscription state change operation and 
  * not be able to be closed until the state change request completes successfully
  * or errors out. Once that happens the dialog will close itself.
  */
  openPreferenceStateChangeDialog(logic: (() => Promise<any>)): Promise<boolean> {
    return this.openWaitForOperationDialog(logic, "PREFERENCES", "perm_identity",
      "Updating your preference information. This may take a second."
    );
  }

  /**
   * This dialog open function is more complex than any of the other dialogs.
   * That is because it is a wrapper around a firebase authhentication request.
   * This function returns a boolean promise that on complete will be true 
   * if the user successfully reauthenticated and will be false if they 
   * failed to authenticate.
   * 
   * @param operationMessage A string describing the sensitive operation that requires reauthentication. 
   */
  openReauthDialog(operationMessage): Promise<boolean> {
    let context = this;
    const AUTH_FAILURE: boolean = false;
    const AUTH_SUCCESS: boolean = true;
    const authData = { operationMessage: operationMessage };
    return new Promise<boolean>((resolve, reject) => {
      try {
        const dialogRef = context.dialog.open(ReAuthenticateDialogComponent, this.getDialogDataOptions(authData));
        dialogRef.afterClosed().subscribe(userSuccessfullyReauthenticated => {
          if (userSuccessfullyReauthenticated) {
            resolve(AUTH_SUCCESS);
          }
          else {
            resolve(AUTH_FAILURE);
          }
        });
      }
      catch (error) {
        resolve(AUTH_FAILURE);
      }
    });
  }

  /**
   * Opens a dialog prompting the user if they truly want to perform an action or not.
   * This is used for sensitive operations like deletion. As a parameter the dialog 
   * takes a title a message to display as a prompt for the action, some logic to perform
   * if the action is confirmed and a spinner message for the confirmed action. 
   * This dialog is different than the reauthentication dialog because instead of 
   * returning the result of the action in the dialog, if the action is confirmed
   * then the logic function will me executed in the dialog and the dialog will close after
   * the logic executes. For the logic to be executed correctly, it should be passed in as 
   * a function with no parameters. If the logic needs parameters, wrap another function with 
   * parameters in a lambda function with no params. Currently this dialog would only really 
   * look normal for delete operations but parameters can quickly be added for controlling
   * icon and button styles to expand it to other operations.
   * 
   * @param title Title of the dialog.
   * @param messageToDisplay Message to inform user about what pressing confirm will do.
   * @param logic Logic to be executed if the confirm button is pressed.
   * @param spinMsg Message to be displayed while spinner is shown and logic is executing.
   */
  openConfirmationDialog(title: string, messageToDisplay: string, logic: Function, spinMsg: string) {
    const confirmationDialogData = { title: title, message: messageToDisplay, confirmationLogic: logic, spinnerMessage: spinMsg }
    this.dialog.open(ConfirmationDialogComponent, this.getDialogDataOptions(confirmationDialogData));
  }

  /**
 * Opens a dialog asking the user to confirm whether or not if they want to delete a nutrition log. If 
 * the user confirms that they want to delete the log, a spinner is shown and their log is deleted. 
 * Otherwise nothing happens and the dialog is closed.
 * 
 * @param NutritionLog Nutrition log to be deleted.
 */
  openDeleteProfileDialog(): void {
    const DELETE_PROF_TITLE: string = "Delete Profile";
    const DELETE_PROF_MSG: string = "Deleting your profile is permanent and all of your data will be lost, are you sure?";
    const context = this;
    const DELETE_SPINNER_MESSAGE: string = "Deleting profile";
    const DELETE_PROF_LOGIC: Function = async function (): Promise<void> {
      const currentUser: UserProfile = context.stateManager.getCurrentUser();
      return await context.auth.deleteCurrentUser(currentUser);
    }
    this.openConfirmationDialog(DELETE_PROF_TITLE, DELETE_PROF_MSG, DELETE_PROF_LOGIC, DELETE_SPINNER_MESSAGE);
  }

  /**
  * Opens a dialog asking the user to confirm whether or not if they want to delete a nutrition log. If 
  * the user confirms that they want to delete the log, a spinner is shown and their log is deleted. 
  * Otherwise nothing happens and the dialog is closed.
  * 
  * @param NutritionLog Nutrition log to be deleted.
  */
  openDeleteLogDialog(log: NutritionLog): void {
    const DELETE_LOG_TITLE: string = "Delete log";
    const DELETE_LOG_MSG: string = "Deleting a log is permanent and all of your data will be lost, are you sure?";
    const context = this;
    const DELETE_SPINNER_MESSAGE: string = "Deleting log";
    const DELETE_LOG_LOGIC: Function = async function (): Promise<void> {
      return context.firebaseNutr.deleteLogFromCurrentUser(log);
    }
    this.openConfirmationDialog(DELETE_LOG_TITLE, DELETE_LOG_MSG, DELETE_LOG_LOGIC, DELETE_SPINNER_MESSAGE);
  }

  /**
  * Opens a dialog that allows the user to create or edit a nutrition log. 
  * If the log passed in is null then the dialog will be in create mode.
  * If the log passed in is not null then the dialog will be in edit mode.
  * 
  * @param logToBeModified Log or null that is passed into the dialog. 
  * @param isMainlog True is the log passed in should be set as the main log, false otherwise.
  */
  openNutritionLogModifyDialog(logToBeModified: NutritionLog, isMainlog: boolean): void {
    const logEditData = { logToBeEdited: logToBeModified, isMain: isMainlog };
    this.dialog.open(NutritionLogModifyComponent, this.getDialogDataOptions(logEditData));
  }

  /**
   * Opens a dialog that lets the the user create a newlog that is then assigned 
   * as their main log if they press the confirm button of the log-modify dialog.
   */
  openCreateMainLogDialog(): void {
    const NO_LOG: NutritionLog = null;
    const IS_MAIN_LOG: boolean = true;
    this.openNutritionLogModifyDialog(NO_LOG, IS_MAIN_LOG);
  }

  /**
   * Opens a dialog that lets the the user create a newlog that is just added 
   * to their list of logs and not set as their main log.
   */
  openCreateRegularLogDialog(): void {
    const NO_LOG: NutritionLog = null;
    const NOT_MAIN_LOG: boolean = false;
    this.openNutritionLogModifyDialog(NO_LOG, NOT_MAIN_LOG);
  }

  /**
   * Opens a dialog that lets the the user edit an existing nutrition log.
   * If the confirm button is pressed, then the log is updated to take on the 
   * values present in the form.
   */
  openEditExistingLogDialog(existingLog: NutritionLog): void {
    const NOT_MAIN_LOG: boolean = false;
    this.openNutritionLogModifyDialog(existingLog, NOT_MAIN_LOG);
  }

  /**
   * Opens the nutrition log management dialog. This dialog allows the user to perform basic operations on their log
   * like opening it in depth, editing its summary, deleting the log or setting/removing it as the user's main log. 
   * This function is responsible in the onClose callback function for opening the log modify dialog or the confirmation
   * dialog if those buttons are pressed in the log management dialog,
   * 
   * @param logModel Nutrition log to open the management dialog for.
   */
  openLogManagementDialog(logModel: NutritionLog): void {
    const managementData = { logModel: logModel };
    const dialogRef = this.dialog.open(LogManagementDialogComponent, this.getDialogDataOptions(managementData));
    dialogRef.afterClosed().subscribe((buttonPressed: string) => {
      const OPEN_EDIT_NUTR_LOG: string = "edit";
      const OPEN_DELETE_NUTR_LOG: string = "delete";
      const OPEN_TIPS: string = "tips";
      if (buttonPressed == OPEN_EDIT_NUTR_LOG) {
        this.openEditExistingLogDialog(logModel);
      }
      else if (buttonPressed == OPEN_TIPS) {
        this.openFirstTimeTipsDialog();
      }
      else if (buttonPressed == OPEN_DELETE_NUTR_LOG) {
        this.openDeleteLogDialog(logModel);
      }
    });
  }

  /**
   * Opens a dialog that allows the user to set their main log by creating a new log or
   * choosing from the list of their existing logs. This is only intended to be called 
   * when the user does not ahvea main log but is functional regardless.
   */
  openMainLogDialog(): void {
    const dialogRef = this.dialog.open(MainLogDialogComponent, this.getDefaultDialogOptions());
    dialogRef.afterClosed().subscribe((action: string) => {
      const CREATE_NEW_MAIN: string = "createNew";
      if (action == CREATE_NEW_MAIN) {
        this.openCreateMainLogDialog();
      }
    });
  }

  /**
   * Opens a dialog that allows the user to edit an existing day entry or create a new one.
   * If there is an entry in the log that has the same date as the date passed in, then the
   * dialog is in edit mode. If no entry exists in the log with such a date, then the log is
   * in create mode. Inside the dialog an entry can be edited, created or deleted. 
   * 
   * @param dateOfEntry Date of the day entry to open the dialog for.
   * @param logEntryIsFrom Log that the day entry is from to check for existing entries.
   */
  openNutritionEntryModifyDialog(dateOfEntry: Date, logEntryIsFrom: NutritionLog, parentLogPayload: EnergyPayload): void {
    const entryModifyData = { date: dateOfEntry, log: logEntryIsFrom, payload: parentLogPayload };
    const dialogRef = this.dialog.open(EntryModifyComponent, this.getDialogDataOptions(entryModifyData));
    dialogRef.afterClosed().subscribe((closingAction: string) => {
      const CLOSE_EDIT: string = "edit";
      const CLOSE_CREATE: string = "create";
      const closeIsCreate: boolean = (closingAction == CLOSE_CREATE);
      const closeIsEdit: boolean = (closingAction == CLOSE_EDIT);
      const closeIsCreatOrEdit: boolean = (closeIsCreate || closeIsEdit);
      if (closeIsCreatOrEdit) {
        this.openGetEnergypayloadDialog(logEntryIsFrom);
      }
    })
  }

  /**
   * Opens the enegy payload dialog without passing in a payload first which will 
   * force the dialog to make a request for the most current state of the payload. 
   * This prevent having to pass subscription references around to keep dialogs 
   * in sync with their parent components that opened them.
   */
  openGetEnergypayloadDialog(log: NutritionLog): void {
    const NO_PAYLOAD: null = null;
    return this.openEnergyPayloadDialog(log, NO_PAYLOAD);
  }

  /**
   * Opens a dialog that displays a group of statistics/feedback from our algortihm about a log.
   * We refer to these statistics as the energy payload because they are satistics about energy 
   * expenditure that we receive as the payload of an http request. This dialog expects the payload
   * to already be received when it is opened. It does not make a request for a payload or update when
   * a newpayload is received. The options for this dialog are much different then the others so it 
   * does not use the helper functions which would mess up its styling. In general, it is suggested
   * to use the options helper methods.
   * 
   * @param payload Payload to display in the dialog.
   */
  openEnergyPayloadDialog(log: NutritionLog, payload: EnergyPayload): void {
    const payloadOptions = {
      maxWidth: '700px',
      minWidth: '290x',
      width: '95%',
      autoFocus: false,
      data: { payload: payload, log: log }
    };
    this.dialog.open(PayloadAnalyzerComponent, payloadOptions);
  }

}
