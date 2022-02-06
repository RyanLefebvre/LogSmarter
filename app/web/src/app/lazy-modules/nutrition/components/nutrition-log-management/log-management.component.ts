import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { Subscription } from 'rxjs';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';

/**
* This component displays a list of every log that the user has. At the top of the component 
 * is a mat-card that acts as controls for the user's collection of logs. Under the controls 
 * is the users list of logs with a table that has 3 columns. The columns are the log's title, 
 * the date the log was last edited and the date the log was created. If any of the rows are hovered 
 * over in the table, they will light up the color of the theme color and if clicked, will open up a 
 * log management dialog for the log that the clicked row is associated with. In the development 
 * environment, there is sometimes a ‘load dummy data’ button that will create a new log using the dummy 
 * data service and add it to the user's list of log's for easy testing.
 * 
 * The log controls contain two mat-selects. One for order and one for property. Order controls 
 * whether the user's logs are sorted in ascending or descending order and property controls what 
 * property of the logs is used to order by.
 * 
 * There are also 2 buttons in the controls. The 'apply order' button will enforce whatever constraints
 * are applied through the property and order form controls. The 'create new log' button will open the 
 * log modify dialog with an empty log so the user can create a new log.
 * 
 * If the user has no logs, then a blank table is shown with one row that says the user has no logs.
 * if the row is clicked on then the same click handler for the create new nutrition dialog is used to 
 * open a nutrition log modify dialog with a null log.
 * 
 * All buttons are disabled if the spinner is shown indicating a loading operation. Additionally
 * if the user has maxed out their total number of logs for their tier then they cannot click the 
 * create new log button.
 * 
 * Last edited by: Ryan Lefebvre 7/03/2020 
 */
@Component({
  selector: 'app-log-management',
  templateUrl: './log-management.component.html',
  styleUrls: ['./log-management.component.css']
})
export class NutritionLogManagementComponent implements OnInit, OnDestroy {

  /**
   * Form that is used for the mat-select's that control order and order property.
   */
  logManagementForm: FormGroup = null;

  /**
   * Key used for the log order form control.
   */
  ORDER: string = "ordering";

  /**
   * Key used for the order property form control.
   */
  ORDER_PROPERTY: string = "orderProperty";

  /**
   * Default value for the order property form control.
   */
  DEFAULT_ORDER_PROPERTY: string = "recent";

  /**
   * Default value for the order form control.
   */
  DEFUALT_ORDER: string = "descending";

  /**
   * Key for order form control value descending.
   */
  ORDER_DESC: string = "descending";

  /**
   * Key for order form control value ascending.
   */
  ORDER_ASC: string = "ascending";

  /**
   * Key for order property form control value last edit.
   */
  PROPERTY_LAST_EDIT: string = "recent";

  /**
  * Key for order property form control value last edit.
  */
  PROPERTY_CREATED: string = "created";

  /**
  * Key for order property form control value title.
  */
  PROPERTY_TITLE: string = "title";

  /**
   * True if a spinner should be shown to indicate a loading operation. False otherwise.
   */
  showSpinner: boolean = true;

  /**
   * Local list of the user's nutrition log's. These logs are incomplete because they only 
   * contain the log summaries. The log's entries are not requested until the log is opened 
   * in depth.
   */
  listOfNutritionLogs: NutritionLog[] = [];

  /**
   * Reference to any state changes to any of the current user's nutrition 
   * log summaries. Any updates to any of the logs summaries will autmotaically
   * refresh the display.
   */
  myLogSubscription: Subscription = null;

  /**
   * Message displayed if an error occurs during state change of the user's list of nutrition logs.
   */
  FAILUER_MESSAGE: string = "Error loading user nutrition logs";

  /**
  * Message displayed underneath the mat-spinner in the log-smarter-spinner-wheel component.
  */
  spinnerMessage: string = "Loading nutrition logs";

  /**
   * @ignore
   */
  constructor(
    public firebaseManager: FirebaseGeneralService,
    public firebaseNutritionManager: FirebaseNutritionService,
    public stateManager: StateManagerService,
    public conversionManager: ConversionService,
    public dialogService: DialogCreatorService,
    public fb: FormBuilder,
    public snackbar: SnackBarService,
    public tierPermissionService: TierPermissionsService,
    public constants: ConstantsService,
    public nutrConstants: NutritionConstanstsService
  ) {
    this.logSummarySubscription();
  }

  /**
   * Creates a subscription to the user's list of nutrition log summaries. If any of the summaries
   * are edited, then the display is refreshed with a slight delay to be less abrupt. Every time 
   * the list of log summaries has its state changed, the logs are sorted by the most current value 
   * in the log management form.
   */
  logSummarySubscription(): void {
    let context = this;
    this.myLogSubscription = this.firebaseNutritionManager.getAllNutrLogsSubscription().subscribe((listOfLogsResponse: NutritionLog[]) => {
      context.showSpinner = true;
      setTimeout(() => {
        context.listOfNutritionLogs = listOfLogsResponse;
        context.applyOrdering();
      }, this.constants.SPINNER_TIMEOUT);
    });
  }

  /**
   * Click handler for the 'apply order' button. Applies whatever the current 
   * values of the order and order property form controls are as constrains on the 
   * user's collection of logs and refreshes the display to show the new ordering. A
   * spinner is turned on before sorting and shut off after, a slight delay is added to 
   * make the transition appear less abrupt.
   */
  applyOrdering(): void {
    this.showSpinner = true;
    const context = this;
    const ordering: string = this.logManagementForm.controls[this.ORDER].value
    const property: string = this.logManagementForm.controls[this.ORDER_PROPERTY].value
    setTimeout(() => {
      if (ordering == context.ORDER_DESC) {
        if (property == context.PROPERTY_LAST_EDIT) {
          context.sortLogsByFunc(context.lastEditDescending)
        } else if (property == context.PROPERTY_CREATED) {
          context.sortLogsByFunc(context.createdDescending)
        } else if (property == context.PROPERTY_TITLE) {
          context.sortLogsByFunc(context.titleDescending)
        }
      } else if (ordering == context.ORDER_ASC) {
        if (property == context.PROPERTY_LAST_EDIT) {
          context.sortLogsByFunc(context.lastEditAscending)
        } else if (property == context.PROPERTY_CREATED) {
          context.sortLogsByFunc(context.createdAscending)
        } else if (property == context.PROPERTY_TITLE) {
          context.sortLogsByFunc(context.titleAscending)
        }
      }
      context.showSpinner = false;
    }, 250);
  }

  /**
   * Returns true if the spinner is shown. False otherwise.
   */
  spinnerIsShowing(): boolean {
    return this.showSpinner;
  }

  /**
   * Returns true if the user's list of logs is greater than or equal to the number of logs 
   * that their tier allows.
   */
  userHasMaxedOutLogs(): boolean {
    const numUserLogs: number = this.listOfNutritionLogs.length;
    const maxNumLogs: number = this.tierPermissionService.getUserTier().maxNumNutrLogs;
    return numUserLogs >= maxNumLogs;
  }

  /**
   * Returns true if the create new log button should be shown.
   * This is when the spinner is shown or the user has maxed 
   * out their logs.
   */
  disableCreateNew(): boolean {
    return (this.spinnerIsShowing() || this.userHasMaxedOutLogs());
  }

  /**
   * @ignore
   */
  ngOnInit() {
    this.generateNewForm();
  }

  /**
   * @ignore kill subscriptions
   */
  ngOnDestroy() {
    if (this.myLogSubscription) {
      this.myLogSubscription.unsubscribe();
    }
  }

  /**
   * Helper function for opening the edit log dialog with 
   * a null log passed in as a parameter. This is the click handler 
   * for the 'create new log' button.
   */
  createNewLog(): void {
    if (this.userHasMaxedOutLogs()) {
      this.snackbar.showFailureMessage("Maximum number of logs " + this.tierPermissionService.getUserTier().maxNumNutrLogs);
    }
    else {
      this.dialogService.openCreateRegularLogDialog();
    }
  }

  /**
   * Opens the log management dialog for the log that is passed in as a parameter.
   * 
   * @param logModel log to open the management dialog for.
   */
  openManagementDialog(logModel: NutritionLog): void {
    this.dialogService.openLogManagementDialog(logModel);
  }

  /**
   * Creates a new form with a control for log order and log order property.
   */
  generateNewForm(): void {
    this.logManagementForm = this.fb.group({
      [this.ORDER_PROPERTY]: this.DEFAULT_ORDER_PROPERTY,
      [this.ORDER]: this.DEFUALT_ORDER
    });
  }

  /**
   * Sorts the local list of nutrition logs by the order function passed in.
   * 
   * @param logSortFunc Function used to compare nutrition logs for sorting.
   */
  sortLogsByFunc(logSortFunc: ((log1: NutritionLog, log2: NutritionLog) => number)) {
    this.listOfNutritionLogs.sort(logSortFunc);
  }

  /**
   * Compares logs by last edit date in descending order. This means 
   * that logs edited later than other logs will be listed first.
   * A log is considered to be edited anytime it has its title edited
   * or an entry is created, edited or deleted. This is the default 
   * order function applied.
   * 
   * 
   * @param log1 first nutrition log to compare.
   * @param log2 second nutrition log to compare.
   */
  lastEditDescending = function (log1: NutritionLog, log2: NutritionLog): number {
    return (log2.lastEdit - log1.lastEdit)
  }

  /**
   * Compares logs by last edit date in ascending order. This means 
   * that logs edited earlier than other logs will be listed first.
   * A log is considered to be edited anytime it has its title edited
   * or an entry is created, edited or deleted.
   * 
   * @param log1 first nutrition log to compare.
   * @param log2 second nutrition log to compare.
   */
  lastEditAscending = function (log1: NutritionLog, log2: NutritionLog): number {
    return (log1.lastEdit - log2.lastEdit);
  }

  /**
   * Compares logs by creation date in descending order. This means 
   * that logs created later than other logs will be listed first.
   * 
   * @param log1 first nutrition log to compare.
   * @param log2 second nutrition log to compare.
   */
  createdDescending = function (log1: NutritionLog, log2: NutritionLog): number {
    return (log2.id - log1.id);
  }

  /**
   * Compares logs by creation date in ascending order. This means 
   * that logs created earlier than other logs will be listed first.
   * 
   * @param log1 first nutrition log to compare.
   * @param log2 second nutrition log to compare.
   */
  createdAscending = function (log1: NutritionLog, log2: NutritionLog): number {
    return (log1.id - log2.id);
  }

  /**
   * Compares logs by title in descending order. This means 
   * that logs with titles that come after other logs 
   * in alpha numeric order will be listed first.
   * 
   * @param log1 first nutrition log to compare.
   * @param log2 second nutrition log to compare.
   */
  titleDescending = function (log1: NutritionLog, log2: NutritionLog): number {
    return (log2.title.localeCompare(log1.title));
  }

  /**
   * Compares logs by title in ascending order. This means 
   * that logs with titles that come before other logs 
   * in alpha numeric order will be listed first.
   * 
   * @param log1 first nutrition log to compare.
   * @param log2 second nutrition log to compare.
   */
  titleAscending = function (log1: NutritionLog, log2: NutritionLog): number {
    return (log1.title.localeCompare(log2.title));
  }

}
