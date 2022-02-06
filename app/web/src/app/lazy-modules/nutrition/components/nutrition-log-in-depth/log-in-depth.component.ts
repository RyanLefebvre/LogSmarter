import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { EnergyPayload } from 'src/app/model-classes/nutrition-log/energy-payload';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';

/**
 * This component is a wrapper around the Nutrition Log In Depth Display component
 * and the Nutrition Log List View Grid Component. Those two components make up the 
 * Log In Depth component which is opened whenever the user clicks on the open button 
 * in the Log Management Dialog or Log Summary Dialog. The responsibilities of this 
 * wrapper component are to handle UI structure and create the initial Nutrition Log
 * Subscription for the log being observed.
 * 
 * Initially, all that is displayed is a spinner. While this component is waiting for a nutrition
 * Log Subscription and Energy payload to be returned, the spinner will continue to be displayed. 
 * Once the subscription is returned, the sub components are passed an observable that emits state 
 * changes for the log being observed and the payload is passed as the next value for an observable
 * that emits new copies of the energy payload any time the log's state changes. Then the spinner
 * is hidden and the two sub components are displayed. If any error occurs, then an error message
 * is displayed and the user is returned to the dashboard.
 * 
 * This component generally displays the two sub components side by side but if 
 * flexed the List View Grid will flex underneath the Nutrition Log In Depth Display.
 * 
 * Last edited by: Ryan Lefebvre 7/01/2020 
 */
@Component({
  selector: 'app-log-in-depth',
  templateUrl: './log-in-depth.component.html',
  styleUrls: ['./log-in-depth.component.css']
})
export class NutritionLogInDepthComponent implements OnInit, OnDestroy {

  /**
   * Subscription to route query parameters.
   */
  myRouteSub: Subscription = null;

  /**
   * Observable that will emit state changes 
   * whenever the log being observed has its entries or
   * its summary edited.
   */
  displayLogObservable: BehaviorSubject<[NutritionLog, any]> = null;

  /**
   * Value of the route that will reutrn the user to the dashboard.
   */
  DASHBOARD: string = "dashboard";

  /**
   * True if the initial value of the observable has been received,
   * false otherwise. Used to check for valid observable values and 
   * jump back to the dashboard if any error occurs. 
   */
  initialPayloadReceived: boolean = false;

  /**
  * Message displayed underneath the mat-spinner in the log-smarter-spinner-wheel component.
  */
  spinnerMessage: string = "Loading nutrition log data";


  /**
   * Key used to cache the user's main log in local storage. 
   */
  MAIN_LOG_LOCAL_STORAGE_KEY: string = "MLLS";

  /**
   * The uid specified as a query param.
   */
  uid: string = null;

  /**
  * The log id specified as a query parameter.
  */
  lid: number = null;

  /**
   * True if the client has already extracted the cached log. False otherwise.
   */
  hasAlreadyGottenCacehdLog: boolean = false;

  /**
   * @ignore
   */
  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public stateManager: StateManagerService,
    public authService: AuthenticationService,
    public snackbar: SnackBarService,
    public logSubCreator: LogSubscriptionCreatorService) {
    this.getLogIdAndUidFromRoute();
  }

  /**
   * Creates a subscription from query parameters on the current route that only emits one
   * value. Used to get the Nutrition Log ID (LID) and the User ID (UID) of the Log being 
   * observed. If either of these values are not present or an error occurs, the user is 
   * returned to the dashboard.
   * 
   * If the values are present, then an initial request for the energy payload for the 
   * log is made. When the energy payload is returned, the result is emitted as an event 
   * by the energy payload observable. NeedsInitialPayload is marked as false and this 
   * will trigger the in depth display to be loaded.
   */
  async getLogIdAndUidFromRoute(): Promise<void> {
    const context = this;
    this.myRouteSub = this.route.params.pipe(take(1)).subscribe(async (params: any) => {
      try {
        this.lid = params.lid
        this.uid = params.uid
        if (!this.uid || !this.lid) {
          context.backToDash();
        }
        else {
          context.displayLogObservable = await context.logSubCreator.setLogSubscription(this.lid);
          context.watchForBadObservableValue();
        }
      } catch (error) {
        context.backToDash();
      }
    });
  }

  /**
   * Checks the subscription to the log for errors. The first value emitted by the observable 
   * will be null because that is the value of the observable when it is initialized. However,
   * if the observable returns null or does not have a nutrition log or a payload after the initial 
   * null response from the observable then an issue has occured. In that case, the safest thing to 
   * do is just jump the user back to the dashboard were they are 'safe'. This handles cases where
   * a user is signed in on one device and viewing a log in depth then deletes the same log on 
   * another device or if their data somehow got ccorupted.
   */
  watchForBadObservableValue(): void {
    const context = this;
    const cachedLogAndPayload = this.stateManager.getCachedMainLogAndPayload();
    const haveCachedLog: boolean = cachedLogAndPayload != null;
    let userIsRequestingTheCachedLog = false;
    if (haveCachedLog && !this.hasAlreadyGottenCacehdLog) {
      userIsRequestingTheCachedLog = (cachedLogAndPayload[0].id == this.lid);
      if (userIsRequestingTheCachedLog) {
        this.hasAlreadyGottenCacehdLog = true;
        this.displayLogObservable.next(cachedLogAndPayload);
      }
    }
    this.displayLogObservable.subscribe((observableValue: [NutritionLog, EnergyPayload]) => {
      const hasNotReceivedFirstPayload: boolean = !(this.initialPayloadReceived);
      if (hasNotReceivedFirstPayload) {
        context.initialPayloadReceived = true;
      } else {
        const noPayloadAtAll: boolean = !observableValue;
        const noLogInPayload: boolean = (noPayloadAtAll || !(observableValue[this.logSubCreator.NUTR_LOG_IDX]));
        const noFeedbackOrStats: boolean = (noPayloadAtAll || !(observableValue[this.logSubCreator.ENERGY_PAYLOAD_IDX]));
        const isNotValidPayload: boolean = (noLogInPayload || noFeedbackOrStats);
        const requestingCachedLogButNoLongerMain: boolean = (userIsRequestingTheCachedLog && !(this.stateManager.getCurrentUser().mainNutrLogId == this.lid))
        if (isNotValidPayload && (!userIsRequestingTheCachedLog || requestingCachedLogButNoLongerMain)) {
          context.backToDash();
        }
      }
    });
  }

  /**
   * Helper function for sending authenticated user back to the dashboard.
   */
  backToDash(): void {
    this.snackbar.showFailureMessage("Could not load log.")
    this.router.navigate([this.DASHBOARD]);
  }

  /**
   * @ignore
   */
  ngOnInit() {
  }

  /**
   * @ignore
   */
  ngOnDestroy() {
    if (this.myRouteSub) {
      this.myRouteSub.unsubscribe();
    }
    this.logSubCreator.killSubscriptions();
  }

  /**
   * Helper function for getting the value of the display log observable.
   * Returns whatever value was most recently emitted by the observable or 
   * null if the observable is null.
   */
  getDisplayLog(): [NutritionLog, any] {
    const observableIsNull: boolean = !this.displayLogObservable;
    if (observableIsNull) {
      return null;
    }
    else {
      const logAndPayload = this.displayLogObservable.value;
      return logAndPayload;
    }
  }

  /**
   * Returns true if the in depth display should be shown. This is when 
   * the initial value from the log subscription has been received. False
   * otherwise.
   */
  displayInDepth(): boolean {
    const shouldDisplayInDepth: boolean = (this.getDisplayLog() != null);
    return shouldDisplayInDepth;
  }

}
