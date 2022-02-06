import { Component, OnInit, Input } from '@angular/core';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { PayloadService } from 'src/app/services/firebase/payload.service';

/**
 * Component used as an overview of the user's main log on the dashboard component.
 * Displays statistics and information that can be calculated without needing to make
 * a request to the energy payload firebase function. These statistics include starting 
 * weight, current weight, start date of the log, title and the log goal. At the bottom of the 
 * component are buttons that can be used to open the log, edit the log and open the log
 * management dialog. Below are the functional requirements for the component buttons and displayed 
 * statistics.
 * 
 * The log title is shown at the top of the component. If it overflows, a horizontal scroll
 * bar appears that lets the user scroll to see the whole title.
 * 
 * Next is start weight and current weight. A log’s start weight is calculated as the mean of the
 * logged weight for the first 1 to 7 entries in a log and a log’s current weight is the
 * mean weight for the last 1 to 7 entries. The number of entries used is not constant
 * because entries are only considered for the calculations if they are within 1 week of
 * the first entry or within one week of the last entry and have a record of the user's weight.
 * If there are less than 7 entries, the start weight and current weight is the mean of the
 * existing entries logged weights. Using means further mitigates the risk of wild fluctuations
 * in the displayed log statistics. Start weight and current weight will be the same value
 * until there are more than 7 entries in a log unless there are incomplete entries.
 * Start weight and current weight calculations will also include overlapping entries until
 * there are 14 or more entries in a log unless there are incomplete entries. If a log has 
 * no entries then no start weight or current weight is displayed. Extra steps are taken 
 * with incomplete entries (missing weight or kcals). Refer to section 6.2 of the algorithm 
 * documentation for more information.
 * 
 * Start date and latest entry are simpler. They are both dates. In general start date is the 
 * date of the first entry in the log and latest date is the date of the last entry in the log.
 * If there are no entries in the log, the date the log was created is displayed as start date and 
 * latest entry.
 * 
 * Log goal is required to be set at creation time and cannot be changed. It is one of 3 values.
 * Fat loss, muscle gain or maintain weight.
 * 
 * The open button will open the log in depth component.
 * 
 * The edit button will open the log edit / creation dialog.
 * 
 * The settings button will open up the log management dialog.
 * 
 * Last edited by: Ryan Lefebvre 12/23/2020
 */
@Component({
  selector: 'app-log-summary',
  templateUrl: './log-summary.component.html',
  styleUrls: ['./log-summary.component.css']
})
export class NutritionLogSummaryComponent implements OnInit {

  /**
  * Nutrition log that the summary will show statistics for.
  */
  @Input()
  logModel: NutritionLog;

  /**
   * Energy payload that the summary will use to get statistics.
   */
  @Input()
  payload: EnergyPayload

  /**
  * @ignore
  */
  constructor(
    public fbNutr: FirebaseNutritionService,
    public dialogService: DialogCreatorService,
    public payloadService: PayloadService,
    public constants: NutritionConstanstsService) {
  }

  /**
  * @ignore
  */
  ngOnInit() {
  }

  /**
   * Returns the autoprompt date for this log and payload.
   */
  getAutoPromptDate(): Date {
    return this.fbNutr.getAutoPromptDate(this.logModel, this.payload)
  }

  /**
   * Returns true if the latest entry for this log is incomplete. False otherwise.
   */
  latestEntryIsIncomplete(): boolean {
    return this.payloadService.latestEntryIsIncomplete(this.logModel);
  }

  /** 
  * Opens the entry modify dialog for the incomplete entry at the 
  * front of the users current main log.
  */
  openFinish(): void {
    this.dialogService.openNutritionEntryModifyDialog(
      new Date(this.payload.latestDate),
      this.logModel,
      this.payload
    );
  }

  /**
   * Helper function for opening the entry modify dialog outside of the 
   * nutrition log-in depth page.
   */
  openQuickAdd(): void {
    this.dialogService.openNutritionEntryModifyDialog(
      this.getAutoPromptDate(),
      this.logModel,
      this.payload
    );
  }

}
