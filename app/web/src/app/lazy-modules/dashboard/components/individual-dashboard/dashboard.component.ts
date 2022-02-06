import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { Subscription } from 'rxjs';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { EnergyPayload } from 'src/app/model-classes/nutrition-log/energy-payload';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * This is the main display for authenticated LogSmarter users.
 * Users with auth credentials in local storage will automatically 
 * be redirected to this page. 
 * 
 * This page is meant to show the user their main log. The main log 
 * is the log the user is currently tracking their data in. The main log
 * can be accessed and manipulated using the log summary component.
 * 
 * If the user has no main log, instructions are shown to inform the user they
 * should create a main log and refer to the resources section for more guidance.
 * Below the instructions is a button that if pressed, will open the log creation
 * dialog and automatically set the newly created log as the main log. 
 * 
 * The bottom of the page will always be the social dashboard component. This 
 * keeps user's up to date with what LogSmarter is doing every time that they 
 * use the application. 
 * 
 * Last edited by: Ryan Lefebvre 7/18/2020
 */
@Component({
  selector: 'app-individual-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class IndividualDashboardComponent implements OnInit, OnDestroy {

  /**
  * User's main log. The log that has an id that is the 
  * same as the user's main log id. If the user has no main log,
  * this variable is null.
  */
  mainNutritionLog: NutritionLog = null;

  /**
   * The payload associated with the user's main nutrition log. Used to 
   * display statistics about the nutrition log in the summary component.
   */
  mainLogPayload: EnergyPayload = null;

  /**
  * Reference to state changes for current user. If the 
  * current user has any property updated, a new log 
  * subscription is created in case the user's main log id 
  * property changes.
  */
  myCurUserSubscription: Subscription = null;

  /**
   * Reference to state changes for the users main log.
   */
  logAndPayloadSubscription: Subscription = null;

  /**
   * Constant value that means the user does not have a main log.
   */
  NO_MAIN_LOG: number = null;

  /**
   * True if the initial request for the user's main logs existence 
   * has not completed.
   */
  showSpinner: boolean = true;

  /**
   * Message to be displayed underneath spinner wheel when main log is loading.
   */
  SPINNER_MESSAGE: string = "Loading main log";

  /**
  * @ignore
  */
  constructor(
    public stateManager: StateManagerService,
    public constants: ConstantsService,
    public dialogCreator: DialogCreatorService,
    public router: Router,
    public logSubCreator: LogSubscriptionCreatorService,
    public environmentService: EnvironmentService) {
    this.getCachedLogAndPayload();
    this.currentUserSubscription();
  }

  /**
  * @ignore
  */
  ngOnInit() {
  }

  /**
   * Handles the logic needed for getting the cached log and payload if they exist.
   * Returns true if the cached log and payload could be retrieved, false otherwise.
   */
  getCachedLogAndPayload(): boolean {
    let couldRetrieve: boolean = false;
    let cachedLogAndPayload: any = this.stateManager.getCachedMainLogAndPayload();
    if (cachedLogAndPayload) {
      const cachedLog: NutritionLog = cachedLogAndPayload[this.logSubCreator.NUTR_LOG_IDX];
      const cachedPayload: EnergyPayload = cachedLogAndPayload[this.logSubCreator.ENERGY_PAYLOAD_IDX];
      if (cachedLog && cachedPayload) {
        couldRetrieve = true;
        this.mainNutritionLog = cachedLog;
        this.mainLogPayload = cachedPayload;
      }
    }
    return couldRetrieve;
  }

  /**
   * Returns true if the user should be shown the set main log prompt. False otherwise.
   * This is true if the spinner is not being shown and the value of the current main 
   * log subscription is null.
   */
  showSetMainLogPrompt(): boolean {
    const noMainLog: boolean = !(this.mainNutritionLog);
    const spinnerIsNotShowing: boolean = !(this.showSpinner);
    const shouldShowPrompt: boolean = (noMainLog && spinnerIsNotShowing);
    return shouldShowPrompt;
  }

  /**
  * Returns true if the user should be shown a summary of their main log. False otherwise.
  * This is true if the spinner is not being shown and the mainNutritionLog global variable
  * is not null.
  */
  showMainLogSummary(): boolean {
    const hasMainLog: boolean = (this.mainNutritionLog != null);
    const spinnerIsNotShowing: boolean = !(this.showSpinner);
    const shouldShowPrompt: boolean = (hasMainLog && spinnerIsNotShowing);
    return shouldShowPrompt;
  }

  /**
  * @ignore Kill all subscriptions.
  */
  ngOnDestroy() {
    if (this.logAndPayloadSubscription) {
      this.logAndPayloadSubscription.unsubscribe();
    }
    if (this.myCurUserSubscription) {
      this.myCurUserSubscription.unsubscribe();
    }
    this.logSubCreator.killSubscriptions();
  }

  /**
   * Everytime the current user profile is updated, there is 
   * potential for a new main log. This function will cause a 
   * reset of the main log subscription and capture the subscription
   * in a global variable. 
   */
  currentUserSubscription(): void {
    let context = this;
    this.myCurUserSubscription = this.stateManager.currentUserProfile.subscribe(async (curUser: UserProfile) => {
      this.showSpinner = !(this.getCachedLogAndPayload());
      if (curUser) {
        if (curUser.mainNutrLogId == this.NO_MAIN_LOG) {
          this.logSubCreator.killSubscriptions();
          this.mainNutritionLog = null;
          localStorage.removeItem(this.stateManager.MAIN_LOG_LOCAL_STORAGE_KEY);
          await context.hideSpinner();
        } else {
          context.updateMainNutrLogSubscription(curUser.mainNutrLogId);
        }
      }
    });
  }

  /**
  * Subscribes to an observable that will push changes 
  * everytime the entries or summary associated with the 
  * requested log are edited.
  * 
  * This function assumes that the user requesting the 
  * log has a log with an id equal to logId. If they do
  * not the main log will be null and no log summary component 
  * will be displayed.
  * 
  * If a subscription to a previous main log exists, the 
  * subscription is killed and new subscription is set to the
  * new main log.
  * 
  * @param logID unique id of the log to subscribe to.
  */
  async updateMainNutrLogSubscription(logId: number): Promise<void> {
    if (this.logAndPayloadSubscription) {
      this.logAndPayloadSubscription.unsubscribe();
      this.logSubCreator.killSubscriptions();
    }
    const logStateChanges = await this.logSubCreator.setLogSubscription(logId);
    const context = this;
    this.logAndPayloadSubscription = logStateChanges.subscribe(async (stateChange: any) => {
      if (stateChange != null) {
        const log: NutritionLog = stateChange[context.logSubCreator.NUTR_LOG_IDX];
        const payload: EnergyPayload = stateChange[context.logSubCreator.ENERGY_PAYLOAD_IDX];
        if (log && payload && (log.id == this.stateManager.getCurrentUser().mainNutrLogId)) {
          this.mainNutritionLog = log;
          this.mainLogPayload = payload;
          context.stateManager.setCachedMainLogAndPayload(stateChange);
        }
        await context.hideSpinner();
      }
    });
  }

  /**
   * Hides the spinner with a delay that looks more natural
   */
  async hideSpinner(): Promise<void> {
    const context = this;
    context.showSpinner = false;
  }

  /**
  * Opens the main log dialog.
  */
  openMainDialog(): void {
    this.dialogCreator.openMainLogDialog();
  }

  /**
   * Navigates the user to the resources page.
   */
  goToResources(): void {
    this.router.navigate(['resources']);
  }

  /**
   * Opens the mobile health sync dialog.
   */
  openHealthSync(): void {
    this.dialogCreator.openMobileHealthSyncDialog(this.mainNutritionLog, this.mainLogPayload);
  }

}
