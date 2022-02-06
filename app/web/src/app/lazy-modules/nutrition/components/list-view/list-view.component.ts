import { Component, OnInit, Input } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { MatDialog } from '@angular/material';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { TimePeriod } from 'src/app/model-classes/nutrition-log/time-period';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';

/**
 * This component is responsible for everything on the right side of the nutrition-log in-depth display component.
 *  It is essentially a container for the log's list of day entries.  At the top of the component are controls for
 *  sorting and ordering the entries in the day entry list. Below that is a button that lets the user add a new entry
 *  to their log. Below that button is the list of day entries for the log being observed. 
 * 
 *  The control for sort mode lets the user pick a period of time to ‘chunk’ their entries into. For example, if ‘week’
 *  is chosen as the sort mode, then all entries are grouped into 7 day blocks. If ‘day’ is chosen, then all entries are
 *  grouped into 1 day blocks. 
 *  
 *  The control for order mode lets the user choose in which order the day entries are displayed. If descending is chosen,
 *  then the latest if first followed by the next latest in chronological order. If ascending is chosen, then the earliest
 *  entry is displayed first followed by the next earliest entry in chronological order. 
 * 
 *  The button for adding a new entry is referred to as the ‘auto prompt’ button. It was added to the user interface
 *  after working with Alpha users. If the log is empty, meaning it has no entries, then the current date is displayed.
 *  Otherwise, one day after the date of the newest entry in the log is displayed. If clicked, the button will open the day
 *  entry modify dialog for a new entry at the date displayed on the auto prompt button.
 * 
 *  If the user's tier is not allowed to have 'in-depth-stats' i.e. the value 
 *  of the inDepthStats member of the user's tier is not true, then they should only be 
 * allowed to have sort mode set to day and order mode set to descending.
 * 
 *  Last edited by: Ryan Lefebvre 6/29/2020
 */
@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.css']
})
export class ListViewComponent implements OnInit {

  /**
   * Key used to refer to sort mode form control.
   */
  SORT_MODE: string = "sortMode";

  /**
   * Key used to refer to order mode form control.
   */
  ORDER_MODE: string = "orderMode";

  /**
   * Current state of the user's sort selection.
   */
  currentSortMode: string = null;

  /**
   * Current state of the user's order selection.
   */
  currentOrderMode: string = null;

  /**
   * Reference to the form used to edit list view sort and order mode.
   */
  listViewForm: FormGroup = this.getListViewControlsForm();

  /**
   * Captures all of the state changes of the displayLogObservable.
   */
  observedLog: NutritionLog = null;

  /**
   * Contains the state of the payload for the log being observed.
   */
  observedLogPayload: EnergyPayload = null;

  /**
   * Observable that emits any state changes about the log being observed.
   * i.e. the logs summary or entries change.
   */
  @Input()
  displayLogObservable: BehaviorSubject<[NutritionLog, any]>;

  /**
   * Reference to a subscription to the displayLogObservable.
   */
  displaySubRef: Subscription = null;

  /**
   * List of time periods that a have a start date, end date and a 
   * list of entries in the log being observed that fall into that 
   * time period. Used to split the log being observed's entries 
   * into chunks based on the value of the sort mode form control.
   */
  listOfTimePeriods: TimePeriod[] = [];

  /**
   * True if the spinner should be shown indicating a loading operation.
   */
  showSpinner: boolean = false;

  /**
   * True if the latest entry for the log is incomplete. False otherwise.
   */
  latestEntryIsIncomplete: boolean = false;

  /**
   * @ignore 
   */
  constructor(
    public stateManager: StateManagerService,
    public dialog: MatDialog,
    public dialogCreator: DialogCreatorService,
    public prefs: PreferenceService,
    public fb: FormBuilder,
    public subCreator: LogSubscriptionCreatorService,
    public tierPermissionService: TierPermissionsService,
    public payloadService: PayloadService,
    public timeService: TimeService,
    public fbNutr: FirebaseNutritionService,
    public constants: ConstantsService) {
  }

  /**
  * @ignore 
  */
  ngOnInit() {
    this.logBeingObservedSubscription();
  }

  /**
   * @ignore 
   */
  ngOnDestroy() {
    if (this.displaySubRef) {
      this.displaySubRef.unsubscribe();
    }
  }

  /**
   * Creates a subscription that every time there is a state change for the log 
   * being observed, the list view of the log's day entries is updated to reflect the 
   * new state of the log.
   */
  logBeingObservedSubscription(): void {
    const context = this;
    this.displaySubRef = this.displayLogObservable.subscribe((logAndPayload: [NutritionLog, any]) => {
      if (logAndPayload) {
        const logExists: boolean = (logAndPayload[this.subCreator.NUTR_LOG_IDX] != null);
        const payloadExists: boolean = (logAndPayload[this.subCreator.ENERGY_PAYLOAD_IDX] != null);
        if (logExists && payloadExists) {
          context.observedLog = logAndPayload[context.subCreator.NUTR_LOG_IDX];
          context.observedLogPayload = logAndPayload[context.subCreator.ENERGY_PAYLOAD_IDX];
          context.updateListView();
          context.latestEntryIsIncomplete = context.payloadService.latestEntryIsIncomplete(context.observedLog);
        }
      }
    });
  }

  /**
   * Turns on a spinner and sets a 350 msec timeout before updating the 
   * list of time periods for the log being observed, this looks more 
   * natural than the abrupt flickering of the spinner when the logBeingObserved
   * has its day entries updated.
   */
  updateListView(): void {
    this.showSpinner = true;
    const context = this;
    context.splitAndOrderEntries();
    context.showSpinner = false;
  }

  /**
   * Returns a form that is used to control the sort mode and 
   * order mode of the log being observed's day entry list. 
   * Values are intiialized with the current user's preferences.
   */
  getListViewControlsForm(): FormGroup {
    const currentUserPrefs = this.stateManager.getCurrentUser().userPreferences;
    return this.fb.group({
      [this.SORT_MODE]: [currentUserPrefs.nutrition.sortMode],
      [this.ORDER_MODE]: [currentUserPrefs.nutrition.orderMode]
    });
  }

  /**
   * Returns the current value of the sort mode form controls.
   */
  getCurrentSortMode(): string {
    return this.listViewForm.controls[this.SORT_MODE].value;
  }

  /**
  * Returns the current value of the sort mode form controls.
  */
  getCurrentOrderMode(): string {
    return this.listViewForm.controls[this.ORDER_MODE].value;
  }

  /**
   * Splits the log being observed's list of day entries into time periods 
   * based on the value of the list view forms sort mode control and then 
   * orders them based on the value of the list view forms order mode control.
   */
  splitAndOrderEntries(): void {
    this.listOfTimePeriods = [];
    this.listOfTimePeriods = this.splitEntriesBySortMode(this.observedLog.dayEntries);
    this.orderAppropriately();
  }

  /**
   * Helper function for ordering the log's list of entries based on the current sort mode and order
   * mode of the list view form. Sorting by day needs to be handled slightly differently than sorting by any 
   * other unit of time. This is because of how the component is styled. 
   * 
   * When sorting by day, each entry in the list of entries needs to be compared to other entries in the 
   * list to order them in ascending or descending order. But if the user is sorting by any other time period,
   * then we want to sort by the start date of the time period and not sort the individual entries within 
   * the time periods. 
   */
  orderAppropriately() {
    if (this.getCurrentSortMode() == this.prefs.SORT_MODE_DAY) {
      if (this.getCurrentOrderMode() == this.prefs.ORDER_MODE_DESC) {
        this.listOfTimePeriods.forEach((timePeriod: TimePeriod) => {
          timePeriod.listOfEntries.sort(function (entry1: DayEntry, entry2: DayEntry) {
            return (entry2.date.getTime() - entry1.date.getTime());
          });
        });
      }
      else if (this.getCurrentOrderMode() == this.prefs.ORDER_MODE_ASC) {
        this.listOfTimePeriods.forEach((timePeriod: TimePeriod) => {
          timePeriod.listOfEntries.sort(function (entry1: DayEntry, entry2: DayEntry) {
            return (entry1.date.getTime() - entry2.date.getTime());
          });
        });
      }
    }
    else {
      if (this.getCurrentOrderMode() == this.prefs.ORDER_MODE_DESC) {
        this.listOfTimePeriods.sort(function (timePeriod1: TimePeriod, timePeriod2: TimePeriod) {
          return (timePeriod2.startDate.getTime() - timePeriod1.startDate.getTime());
        });
      }
      else if (this.getCurrentOrderMode() == this.prefs.ORDER_MODE_ASC) {
        this.listOfTimePeriods.sort(function (timePeriod1: TimePeriod, timePeriod2: TimePeriod) {
          return (timePeriod1.startDate.getTime() - timePeriod2.startDate.getTime());
        });
      }
    }
  }

  /**
   * Splits a list of entries based on the sort mode control of the list view form. This function 
   * returns a list of time periods that have a start date, an end date and a list of entries that 
   * are contained with that period of time. 
   * 
   * If the form controls indicate the user is sorting by day, then just one time period is returned and
   * it contains a list with every single entry in the log being observed. This behavior is also used if the 
   * log being observed is null or the list of entries for the log being observed is empty.    
   * 
   * Otherwise the logs list of entries are chunked into time periods based on the selected sort mode. 
   * Time periods begin at the start date of the log, so even if the user has sort mode set to week,
   * the entries will not be chunked based on the Gregorian Calendar.  
   * 
   * @param listOfEntries list of entries to be sorted by sort mode.
   */
  splitEntriesBySortMode(listOfEntries: DayEntry[]) {

    let listOfTimePeriods: TimePeriod[] = [];
    listOfEntries = Array.from(listOfEntries);
    const sortingByDay: boolean = this.sortByDay();
    const logBeingObservedIsEmpty: boolean = (listOfEntries.length <= 0);
    const sortingByDayOrEmptyLog: boolean = (sortingByDay || logBeingObservedIsEmpty);

    if (sortingByDayOrEmptyLog) {
      listOfTimePeriods = this.splitForSortByDay(listOfEntries);
    } else {
      const currentSortMode: string = this.listViewForm.controls[this.SORT_MODE].value;
      let timePeriodLengthInMillis: number = 0;
      if (currentSortMode == this.prefs.SORT_MODE_WEEK) {
        timePeriodLengthInMillis = this.timeService.getWeekInMillis();
      }
      listOfTimePeriods = this.splitEntriesWhenNotSortingByDay(listOfEntries, timePeriodLengthInMillis);
    }

    return listOfTimePeriods;
  }

  /**
   * Helper for function for splitting the log being observed's list of entries 
   * into time periods when the sort mode is set to day. This function is also called 
   * in the case where the log being observed is null or empty, meaning the 
   * log's day entry list has a length of 0.
   */
  splitForSortByDay(listOfEntries: DayEntry[]): TimePeriod[] {
    const listOfTimePeriods: TimePeriod[] = [];
    let newTimePeriod: TimePeriod = new TimePeriod();
    newTimePeriod.listOfEntries = listOfEntries;
    newTimePeriod.startDate = new Date();
    listOfTimePeriods.push(newTimePeriod);
    return listOfTimePeriods;
  }

  /**
  * Helper function for splitting the log being observed's list of entries 
  * into time periods when the sort mode is NOT set to day. This function assumes that
  * when it is called, the log's list of entries is not empty and that the log being 
  * observed is not null.
  * 
  * The first step is get the length of the timer period in milliseconds and one day less 
  * than the length of the time period in milliseconds. Then make a deep copy of the list 
  * of entries passed in as a parameter and sort them in ascending order to ensure that 
  * the oldest entries are at the front of the list. 
  * 
  * Then a temp variable is created to hold the list of entries for the first time period 
  * in the list of time periods to be returned. Then the start date and end date for the 
  * first time period is calculated. Next, for each entry in the list of entries, 
  * we check the difference between the date of the entry in the list and the end date 
  * of the current time period. If the difference is less than or equal to one time period, 
  * then we add the entry to the current time period. Otherwise, there is more than one 
  * timePeriod between the current entry and the start of the time period which means it is 
  * not contained in that time period. Instead, we push the current time period onto the list 
  * of time periods to be returned. We make sure to check that the list of entries for the 
  * time period is not empty so that there are not any empty blocks of time displayed.
  * 
  * Then we create a new time period that begins one day after the time period we just pushed 
  * onto the return list ends. We also decrement the counter variable that is used to iterate 
  * through the log being observed's list of entries. This let's us reconsider the entry that we 
  * were just on to see if it is contained in the new time period we just created. This is repeated 
  * until the log being observed is exhausted of entries, then the final time period is pushed 
  * onto the return list and we return the list of time periods.
  * 
  * @param listOfEntries List of entries to split into time periods.
  * @param timePeriodLength length of the time period in milliseconds.
  */
  splitEntriesWhenNotSortingByDay(listOfEntries: DayEntry[], timePeriodLength: number): TimePeriod[] {
    const listOfTimePeriods: TimePeriod[] = [];
    const timePeriodLengthMillis: number = timePeriodLength
    const oneDayLessThanTimePeriod: number = timePeriodLengthMillis - this.timeService.getDayInMillis();
    if (listOfEntries.length > 0) {
      listOfEntries.sort(function sortEntriesAscending(entry1: DayEntry, entry2: DayEntry) {
        return entry1.date.getTime() - entry2.date.getTime();
      });
      let timePeriodEntryList = [];
      timePeriodEntryList.push(listOfEntries[0]);
      let firstDateOfWeek = new Date(listOfEntries[0].date.getTime());
      let lastDateOfWeek = new Date(firstDateOfWeek.getTime() + timePeriodLengthMillis);
      for (let currentEntryIdx = 1; currentEntryIdx < listOfEntries.length; currentEntryIdx++) {
        if (listOfEntries[currentEntryIdx].date.getTime() < lastDateOfWeek.getTime()) {
          timePeriodEntryList.push(listOfEntries[currentEntryIdx]);
        }
        else {
          const newTimePeriod: TimePeriod = new TimePeriod();
          newTimePeriod.startDate = new Date(firstDateOfWeek.getTime());
          newTimePeriod.endDate = new Date(firstDateOfWeek.getTime() + oneDayLessThanTimePeriod);
          newTimePeriod.listOfEntries = timePeriodEntryList;
          if (newTimePeriod.listOfEntries.length > 0) {
            listOfTimePeriods.push(newTimePeriod);
          }
          timePeriodEntryList = [];
          firstDateOfWeek.setTime(firstDateOfWeek.getTime() + timePeriodLengthMillis);
          lastDateOfWeek.setTime(firstDateOfWeek.getTime() + timePeriodLengthMillis)
          currentEntryIdx--;
        }
      }
      const newTimePeriod: TimePeriod = new TimePeriod();
      newTimePeriod.startDate = new Date(firstDateOfWeek.getTime());
      newTimePeriod.endDate = new Date(firstDateOfWeek.getTime() + oneDayLessThanTimePeriod);
      newTimePeriod.listOfEntries = timePeriodEntryList;
      listOfTimePeriods.push(newTimePeriod);
    }
    return listOfTimePeriods;
  }

  /**
   * Helper function for displaying the text in the auto prompt dialog.
   * If the log is being observed is empty or null, then the current 
   * date is returned. Otherwise, one day after the latest entry in the log 
   * is returned.
   */
  getAutoPromptDate(): Date {
    return this.fbNutr.getAutoPromptDate(this.observedLog, this.observedLogPayload);
  }

  /**
   * Click handler for the auto prompt button. Opens the entry modify dialog for the 
   * date displayed on the auto prompt button. Should always open up to a new entry.
   */
  openAutoPromptDialog(): void {
    this.dialogCreator.openNutritionEntryModifyDialog(this.getAutoPromptDate(), this.observedLog, this.observedLogPayload);
  }

  /**
   * Click handler for the finish entry button. Opens a dialog at the date of the latest entry in the log.
   */
  openFinishLogDialog(): void {
    this.dialogCreator.openNutritionEntryModifyDialog(new Date(this.observedLogPayload.latestDate), this.observedLog, this.observedLogPayload);
  }

  /**
   * Returns true if the form controls of the list view form indicate 
   * the current sort mode is sort by day. This is necessary because the 
   * styles are drastically different when sorting by day vs sorting by 
   * another unit of time.
   */
  sortByDay(): boolean {
    return this.getCurrentSortMode() == this.prefs.SORT_MODE_DAY;
  }

}