import { Component, OnInit, Input } from '@angular/core';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { TimePeriod } from 'src/app/model-classes/nutrition-log/time-period';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * This components is a view to display a time period. A time period 
 * has a start date an end date and list of entries contained in that 
 * time period.
 * 
 * The list of entries in the time period is displayed as a table. 
 * Each row in the table represents one entry and each column in the 
 * table represents one attribute that entries have. 
 * 
 * Empty entries are not displayed. Any incomplete entries, meaning they
 * do not have a value for an attribute but the entry exists, will have a 
 * blank cell.
 * 
 * If a row is hovered over by the user, it should change the color of the
 * text in that row to the theme color. If the user clicks on the row, then 
 * an entry modify dialog is opened with that rows corresponding entries data 
 * loaded in the dialog. 
 * 
 * If the sort mode for this component is anything other than 'day', the component
 * will have a header that displays the beginning of the time period followed by 
 * a dash followed by the end of the time period.
 * 
 * If the time period is empty, which means the log is empty, then only one row with the 
 * current date is displayed.
 * 
 * Last edited by: Ryan Lefebvre 6/30/2020
 */
@Component({
  selector: 'app-list-view-grid',
  templateUrl: './list-view-grid.component.html',
  styleUrls: ['./list-view-grid.component.css']
})
export class ListViewGridComponent implements OnInit {

  /**
   * Time period object that this class is displaying.
   */
  @Input()
  timePeriod: TimePeriod;

  /**
   * True if style of the list view grid should be set for sort by day. False otherwise.
   */
  @Input()
  sortByDay: boolean;

  /**
   * Nutrition log that this time period is from 
   */
  @Input()
  parentLog: NutritionLog;

  /**
   * Payload that the parentlog variable is associated with.
   */
  @Input()
  parentLogPayload: EnergyPayload;

  /**
   * @ignore
   */
  constructor(
    public stateManager: StateManagerService,
    public preferenceManager: PreferenceService,
    public dialogCreator: DialogCreatorService,
    public time: TimeService,
    public environment: EnvironmentService) {
  }

  /**
   * @ignore
   */
  ngOnInit() {
  }

  /**
   * Returns true if the styles should be applied for sticky column headers, false otherwise.
   * Column headers should not be sticky on mobile becuse the cordova webview will fail to load
   * them until the parent container is scrolled. No easy solutions were found. A couple of hacky 
   * solutions were found but a safer solution seemed to be disabling sticky column headers on mobile.
   * This means that when the listview is scrolled on mobile that the column headers will dissapear while 
   * the user is scrolling downwards. On web, the column headers will stay fixed at the top of the container
   * while the rest of the rows in the table scroll. 
   */
  stickyColHeaders(): boolean {
    return !(this.environment.isMobile);
  }

  /**
   * Helper function for openening the nutrition entry modify dialog. 
   * Opens the dialog for the entry at the date passed in as a param 
   * for the time period that this component is representing. If the 
   * time period does not contain an entry at that date, then the dialog
   * is opened for an empty entry.
   * 
   * @param rowClickDate date of the entry to be opened in the dialog. 
   */
  openEntryModify(rowClickDate: Date): void {
    this.dialogCreator.openNutritionEntryModifyDialog(rowClickDate, this.parentLog, this.parentLogPayload);
  }

  /**
   * Used to add an end date to the time period title if the end date is null. This happens
   * when there is only one time period and it has no entries. In this case, we want to displa
   * a date range that will include 6 days after the start date. If there is an end date 
   * already then that date is returned.
   * 
   * @param endDate End date of the time period to check
   */
  filterEndDate(endDate: Date): Date {
    const hasEndDate: boolean = endDate != null;
    if (hasEndDate) {
      return endDate;
    }
    else {
      const startDate: Date = this.timePeriod.startDate;
      const startDateMillis: number = startDate.getTime();
      const oneWeek: number = (this.time.getDayInMillis() * 6);
      const oneWeekLater: Date = new Date(startDateMillis + oneWeek);
      return oneWeekLater
    }
  }

}


