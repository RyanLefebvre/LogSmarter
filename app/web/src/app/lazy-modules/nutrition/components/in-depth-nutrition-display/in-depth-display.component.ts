import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { ExporterService } from 'src/app/services/general/exporter-service.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * This component contains the entire lefthand side of the in depth nutrition display.
 * On initialization it will populate the display for the in-depth log stats that are received from 
 * firebase when an energy payload is requested, the graph widget and a display of the 
 * min, max and average values for day entry variables at the bottom of the mat-card. At the top right 
 * of the display is a settings button that will open the log management dialog. If the 
 * in depth stats panel is clicked, it will go slightly opaque and open the algorithm 
 * feedback dialog. There is very little logic in this component, it is mainly used 
 * to display the energy payload. Requirements for the statistics shown in the in depth 
 * statistics panel are given in the algorithm documentation and too long to describe in 
 * detail here. Refer to sections 6 and 7 of the documentation. 
 * https://docs.google.com/document/d/15R3Rgl6POdMgYOJDkLkvpQnZ_XBlRmJF/edit
 * 
 * On smaller displays, the user has the ability to hide the graph or variables. When the 
 * view flexes and moves the list of entries below the display on the left, a button appears 
 * that if clicked will open up a list that lets the user toggle which parts of the component
 * are shown on smaller screens.
 * 
 * Last edited by: Ryan Lefebvre 6/26/2020
 */
@Component({
  selector: 'app-in-depth-display',
  templateUrl: './in-depth-display.component.html',
  styleUrls: ['./in-depth-display.component.css']
})
export class InDepthNutritionLogDisplayComponent implements OnInit, OnDestroy {

  /**
   * Reference to the nutrition log being observed in depth.
   */
  logBeingObserved: NutritionLog = null;

  /**
   * True if the user wants the graph to be shown on smaller displays. False otherwise.
   */
  userShowGraph: boolean = true;

  /**
   * True if the user wants the variables to be shown on smaller displays. False otherwise.
   */
  userShowVars: boolean = false;

  /**
   * Reference to an observable that emits a new NutritionLog every time that 
   * the log being observed has the state its summary or entries changed 
   */
  @Input()
  displayLogObservable: BehaviorSubject<[NutritionLog, any]>;

  /**
   * Reference to a subscription to the dispay log observable.
   */
  displaySubRef: Subscription = null;

  /**
   * Reference to a subscription to the energy payload observable.
   */
  payloadSub: Subscription = null;

  /**
   * Contains the results of the energy payload calculated on the backend.
   * used to populate the in-depth stats panel.
   */
  payload: EnergyPayload = null;

  /**
   * True if the spinner for the log in depth stats should be shown. False otherwise.
   */
  showStatsSpinner: boolean = true;

  /**
   * True if the spinner for the log in depth stats should be shown. False otherwise.
   */
  showVariablesSpinner: boolean = true;

  /**
   * @ignore
   */
  constructor(
    public stateManager: StateManagerService,
    public router: Router,
    public dialog: DialogCreatorService,
    public tierPermissionsManager: TierPermissionsService,
    public logSubCreator: LogSubscriptionCreatorService,
    public constants: NutritionConstanstsService,
    public iap: InAppPurchaseService,
    public exporter: ExporterService,
    public environmentService: EnvironmentService) {
  }

  /**
   * @ignore kill subscriptions.
   */
  ngOnDestroy(): void {
    if (this.displaySubRef) {
      this.displaySubRef.unsubscribe();
    }
    if (this.payloadSub) {
      this.payloadSub.unsubscribe();
    }
  }

  /**
  * @ignore create subscriptions 
  */
  ngOnInit() {
    this.displayLogSubscription();
  }

  /**
   * Creates a subscription to an observable that emits a new nutrition log and payload
   * every time that the log being observed state changes. i.e. there is a change to the
   * log's summary or entries. Every time there is a new log emitted, the display is reset.
   */
  displayLogSubscription(): void {
    const context = this;
    this.displaySubRef = this.displayLogObservable.subscribe((logAndPayload) => {
      if (logAndPayload) {
        const logExists: boolean = (logAndPayload[this.logSubCreator.NUTR_LOG_IDX] != null);
        const payloadExists: boolean = (logAndPayload[this.logSubCreator.ENERGY_PAYLOAD_IDX] != null);
        if (logExists && payloadExists) {
          const isMainLog: boolean = this.stateManager.getCurrentUser().mainNutrLogId == logAndPayload[this.logSubCreator.NUTR_LOG_IDX].id
          if (isMainLog) {
            this.stateManager.setCachedMainLogAndPayload(logAndPayload);
          }
          context.logBeingObserved = logAndPayload[context.logSubCreator.NUTR_LOG_IDX];
          context.payload = logAndPayload[context.logSubCreator.ENERGY_PAYLOAD_IDX];
          context.showStatsSpinner = false;
          context.showVariablesSpinner = false;
        }
      }
    })
  }

  /**
   * Prevents the results of a calculation that returned insufficient value from 
   * being displayed in a way that would not make sense. Used as a pipe that 
   * cleans any data displayed to the user
   * 
   * @param value the value to be checked for being the result of a calculation with insuffcient data.
   */
  checkForInsufficientData(value): any {
    const isInsufficient: boolean = (value == this.constants.INSUFFICIENT_DATA);
    if (isInsufficient) {
      return this.constants.INSUFFICIENT_DATA_STRING;
    }
    else {
      return value;
    }
  }

  /**
   * Returns true if the buttons for manually showing and hiding the variables should be 
   * displayed. this is true if the screen is flexed which happens when the window is 
   * roughly 673 pixels. This is false otherwise and the button will not be shown.
   */
  showGraphAndVarsButtons(): boolean {
    return window.innerWidth < 673;
  }

  /**
   * True if the variables table at the bottom of the in depth 
   * component should be displayed. False otherwise. This is true 
   * if the screen is not flexed or the variables are set to be shown by the
   * user's preferences.
   */
  showVars(): boolean {
    return (!this.showGraphAndVarsButtons() || this.userShowVars);
  }

  /**
   * True if the graph widget in the middle of the in-depth display
   * component should be displayed. False otherwise. This is true 
   * if the screen is not flexed or the graph widget is set to be shown by the
   * user's preferences.
   */
  showGraph(): boolean {
    return (!this.showGraphAndVarsButtons() || this.userShowGraph);
  }

  /**
   * Helper function for opening the log management dialog for the log being observed.
   */
  settingsClick(): void {
    this.dialog.openLogManagementDialog(this.logBeingObserved);
  }

  /**
   * Returns true if the user has permissions to see the in 
   * depth stats. False otherwise. 
   */
  showInDepthStats(): boolean {
    return this.tierPermissionsManager.getUserTier().inDepthStats
  }

  /**
   * Helper function for opening the algorithm feedback component.
   * This only works if the user has permissions to view in-depth log stats.
   * If tehy do not have permissions, then the appropriate account warning dialog is opened.
   */
  openAnalysis(): void {
    if (this.showInDepthStats()) {
      this.dialog.openEnergyPayloadDialog(this.logBeingObserved, this.payload);
    }
    else {
      this.dialog.openAppropritateAccountDialog(this.iap);
    }
  }
}
