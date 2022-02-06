import { Component, OnInit, Inject } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { NutritionLogModifyComponent } from '../nutrition-log-modify/log-modify.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { EnergyPayload } from 'src/app/model-classes/nutrition-log/energy-payload';
import { ConstantsService } from 'src/app/services/general/constants.service';

/**
 * This component is used to display statistics calculated about a user's log and 
 * provide feedback about how they are doing at progressing towards their goal. 
 * The constraints and details related to how the algorithm provides feedback 
 * are too lengthy to list here and are listed in the algorithm documentation if they
 * are needed. 
 * 
 * The component contains groups of feedback that are split into feedback category. 
 * Each feedback category has an associated graph. If a feedback category does not 
 * have any feedback, then the category should be hidden. If the user has alot of 
 * feedback in multiple categories, it is likely that the feedback will overflow 
 * its parent container and the user will be able to scroll to view all of their 
 * feedback. 
 * 
 * Beneath the feedback is a close button that lets the user close the dialog, 
 * unlike other dialogs, this dialog will never disable closing.
 * 
 * Regardless of user tier, this component will appear but if the user does not have 
 * the correct permissions to view the statistics based upon their tiers permissions, then 
 * the dialog will show a message prompting the user to upgrade for the statistics with 
 * a beanie button below the message.
 * 
 * Last edited by: Ryan Lefebvre 9/11/2020
 */
@Component({
  selector: 'app-payload-analyzer',
  templateUrl: './payload-analyzer.component.html',
  styleUrls: ['./payload-analyzer.component.css']
})
export class PayloadAnalyzerComponent implements OnInit {

  /**
   * Local reference to the payload passed into this dialog as a parameter.
   */
  payload: EnergyPayload = null;

  /**
   * Local reference to the nutrition log passed into this dialog as a parameter.
   */
  log: NutritionLog = null;

  /**
   * True if the calories category of feedback should be shown. False otherwise.
   */
  showCalories: boolean = false;

  /**
   * True if the weight category of feedback should be shown. False otherwise.
   */
  showWeight: boolean = false;

  /**
   * True is the general category of feedback should be shown. False otherwise.
   */
  showGeneral = false;

  /**
   * Key used to identify the calorie category of feedback.
   */
  CALORIES: string = 'Calories';

  /**
   * Key used to identify the weight category of feedback.
   */
  WEIGHT = 'Weight';

  /**
   * Key used to identify the general category of feedback.
   */
  GENERAL = "General";

  /**
   * Reference to the list of feedback objects in the calorie category.
   */
  calorieFeedbackList = [];

  /**
   * Reference to the list of feedback objects in the weight category.
   */
  weightFeedbackList = [];

  /**
   * Reference to the list of feedback objects in the general category.
   */
  generalFeedbackList = [];

  /**
   * Labels used for the weight chart.
   */
  weightChartLabels = [];

  /**
   * Controls the type of chart we want to display for the weight chart which should 
   * be a bar chart.
   */
  weightChartType = "bar";

  /**
   * Used to set the show/hide status of the weight chart legend which should be shown.
   */
  showWeightChartLegend: boolean = true;

  /**
   * Contains the data that is passed into the weight chart.
   */
  weightChartData = [];

  /**
   * Contains the actual data displayed in the calorie chart.
   */
  calorieChartData = [];

  /**
   * Contains the labels displayed in the calorie chart.
   */
  calorieChartLabels = [];

  /**
   * Type of chart we want to display for the weight chart which should be a line chart.
   */
  calorieChartType = "line";

  /**
   * True if the dialogs spinner should be shown false otherwise.
   */
  showSpinner: boolean = false;

  /**
   * Message displayed by spinner. Only one case where spinner is shown so the spinner 
   * message only has a default value for this dialog.
   */
  spinnerMessage: string = "Doing science stuff. This may take a second.";

  /**
   * Options that are used to initialize the calorie chart correctly.
   */
  chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    datasetStroke: true,
    showScale: true,
    showLine: true,
    tooltips: {
      enabled: false
    }
  };

  /**
   * @ignore
   */
  constructor(
    public dialogRef: MatDialogRef<NutritionLogModifyComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    public preference: PreferenceService,
    public tierPermissions: TierPermissionsService,
    public stateManager: StateManagerService,
    public conversionManager: ConversionService,
    public payloadService: PayloadService,
    public time: TimeService,
    public constants: ConstantsService,
    public nutrConstants: NutritionConstanstsService) { }

  /**
  * @ignore
  */
  ngOnInit() {
    this.parseLogAndPayload();
  }

  /**
   * Returns true if the show upgrade display should be shown based on the user's
   * tier permissions. This is true if the user's nutrition preferences indicate that
   * in-depth stats should not be shown.
   */
  showUpgradeDisplay(): boolean {
    const currentUserTier: UserProfile = this.tierPermissions.getUserTier();
    const shouldNotShowInDepth = !(currentUserTier[this.tierPermissions.IN_DEPTH_STATS_KEY])
    return shouldNotShowInDepth;
  }

  /**
   * Extracts the payload and log from the dialog data parameters 
   * and assigns the value of local references to the parameters
   * for the dialog to work with. Then sorts the logs entries 
   * chronologically so the feedback graphs, if they are displayed 
   * will look correct. Lastly extracts feedback objects from 
   * the payload prepares them to be displayed in the UI of the dialog.
   * 
   * If there is no payload passed in as a parameter to this dialog, it was
   * probably intentional. This means the programmer wants to force a request to be 
   * made for a new payload which will get the most current feedback for the state
   * of a user's log.
   */
  async parseLogAndPayload(): Promise<void> {
    this.log = this.data.log;
    this.payload = this.data.payload;
    const hasNoPayload: boolean = (this.data.payload == null);
    if (hasNoPayload) {
      try {
        this.showSpinner = true;
        this.payload = await this.payloadService.getEnergyPayLoad(this.log);
        setTimeout(() => { this.showSpinner = false; }, this.constants.SPINNER_TIMEOUT);
      }
      catch (error) {
        this.dialogRef.close();
      }
    }
    if (!this.log || !this.payload) {
      this.closeDialog();
    }
    this.sortEntriesChronologically();
    this.processPayload(this.payload);
  }

  /**
   * Returns true if the current user's number sytem is imperial. False otherwise.
   */
  currentNumberSystemIsImperial(): boolean {
    const currentUser: UserProfile = this.stateManager.getCurrentUser();
    const numSystem: boolean = currentUser.userPreferences[this.preference.GENERAL_PREFS][this.preference.NUMBER_SYSTEM];
    return numSystem;
  }

  /**
   * Returns the current users preferred theme.
   */
  getPreferredTheme(): string {
    const currentUser: UserProfile = this.stateManager.getCurrentUser();
    const themeColor: string = currentUser.userPreferences[this.preference.GENERAL_PREFS][this.preference.THEME_COLOR];
    return themeColor;
  }

  /**
   * Iterates through the payload and sets the UI to only display 
   * feedback catagories that have feedback objects and will initialize 
   * charts if they should be shown.
   * 
   * @param payload Payload to process and set UI for.
   */
  processPayload(payload: any) {
    const categories = payload.analysis;
    categories.forEach((feedbackCategory: any) => {
      if (feedbackCategory.category == this.CALORIES) {
        this.calorieFeedbackList = feedbackCategory.feedbackList;
        this.initKcalChart();
        this.showCalories = true;
      }
      else if (feedbackCategory.category == this.WEIGHT) {
        this.weightFeedbackList = feedbackCategory.feedbackList;
        this.initWeightChart()
        this.showWeight = true;
      }
      else if (feedbackCategory.category == this.GENERAL) {
        this.generalFeedbackList = feedbackCategory.feedbackList;
        this.showGeneral = true;
      }
    });
  }

  /**
   * Used to sort day entries in chronological order so that 
   * charts that display body weight or calorie intake are 
   * in the correct order.
   */
  sortEntriesChronologically(): void {
    this.log.dayEntries.sort(
      function (a, b) {
        return a.date.getTime() - b.date.getTime()
      });
  }

  /**
   * Initializes the weight chart that is displayed next to the weight feedback category.
   * Weight chart is displayed as a bar chart where x-axis is date and y-axis is a user's body weight for 
   * a day entry. The user's hypothetical linear weight change is displayed as well 
   * and it is drawn asa  straight dashed line. This feedback should only be shown if there is >= 14 
   * entries in a user's log so the case where the linear change is not displayed because of no entries
   * in the log does not need to be checked.
   */
  initWeightChart(): void {
    const startCurrentDifference: number = (-1 * (this.payload.startWeight - this.payload.currentWeight));
    const averageDailyChange: number = (startCurrentDifference / this.log.dayEntries.length);
    let linearWeight: number = null;
    const context = this;
    this.weightChartData = [
      {
        data: this.log.dayEntries.map(entry => {
          if (!(context.currentNumberSystemIsImperial())) {
            return context.conversionManager.convertLbsToKg(entry.weight);
          }
          else {
            return entry.weight;
          }
        }), label: "Actual Weight",
      },
      {
        data: context.log.dayEntries.map(entry => {
          if (!linearWeight) {
            linearWeight = context.payload.startWeight;
          }
          else {
            linearWeight += averageDailyChange;
          }
          if (!(context.currentNumberSystemIsImperial())) {
            return context.conversionManager.convertLbsToKg(linearWeight);
          }
          else {
            return linearWeight;
          }
        }),
        label: "Linear Change",
        type: 'line',
        borderColor: context.getPreferredTheme(),
        backgroundColor: context.getPreferredTheme(),
        pointBorderColor: context.getPreferredTheme(),
        pointBackgroundColor: context.getPreferredTheme(),
        pointHoverBackgroundColor: context.getPreferredTheme(),
        pointHoverBorderColor: context.getPreferredTheme(),
        fill: false,
        pointRadius: 0,
        borderDash: [10, 5],
        options: { fill: false }
      },
    ];
    this.weightChartLabels = this.log.dayEntries.map(entry => { return entry.date.toLocaleDateString(); });
  }

  /**
   * Initializes the calorie chart that is displayed next to the calorie feedback category.
   * Display is a line chart where x-axis is date and y-axis is calorie intake. A daily 
   * calorie intake is represented by a pink diamond that is plotted on the (x,y) where
   * the date and calorie intake align. If the user has a valid TDEE, then their min goal
   * intake, max goal intake and TDEE are plotted as straight lines similar to the graph 
   * widget component.
   */
  initKcalChart(): void {
    this.calorieChartData = [{
      data: this.log.dayEntries.map(entry => { return entry.calories }),
      label: 'Calories',
      pointStyle: 'rectRot',
      fill: false,
      showLine: false,
      pointRadius: 10,
      pointHoverRadius: 12
    }];
    this.calorieChartLabels = this.log.dayEntries.map(entry => { return entry.date.toLocaleDateString() });
    if (this.calorieChartLabels.length <= 1) {
      const startDate = new Date(this.payload.startDate);
      this.calorieChartLabels[0] = startDate.toLocaleDateString()
      this.calorieChartLabels[1] = this.time.getOneDayLater(startDate).toLocaleDateString()
    }
    const estimatedisValid: boolean = (this.payload.estimatedTDEE != this.nutrConstants.INSUFFICIENT_DATA);
    if (estimatedisValid) {
      this.calorieChartData = this.plotTDEE(this.calorieChartData);
    }
  }

  /**
   * Plots the user's adjusted baseline estimate of their TDEE with a solid 
   * line. Plots the user's max goal intake and min goal intake as dashed lines.
   * 
   * @param chartData chart data to be augmented with special plot.
   */
  plotTDEE(chartData: any): any[] {
    const context = this;

    let estimatedLine: number[] = [];
    let goalMaxLine: number[] = [];
    let goalMinLine: number[] = [];

    for (let dateIdx = 0; dateIdx < context.calorieChartLabels.length; dateIdx++) {

      let estimated = this.payload.estimatedTDEE;
      let goalBoundaries = context.payload.goalIntakeBoundaries;
      const isLatestDate = (dateIdx == (context.calorieChartLabels.length - 1));

      if (!isLatestDate) {
        const dateOneAfterCurrentIdx = new Date(context.calorieChartLabels[dateIdx + 1]);
        const entryAtNextDateInLogBeingObserved = context.log.getEntryAtDate(dateOneAfterCurrentIdx);
        const entryExists: boolean = (entryAtNextDateInLogBeingObserved != null);
        const entryHasCreationTDEE: boolean = ((entryExists) && (entryAtNextDateInLogBeingObserved.creationEstimatedTDEE != null));
        const entryHasGoalBoundaries: boolean = ((entryExists) && (entryAtNextDateInLogBeingObserved.goalIntakeBoundaries != null))
        const hasGoalAndTDEE: boolean = (entryHasCreationTDEE && entryHasGoalBoundaries);
        if (hasGoalAndTDEE) {
          estimated = entryAtNextDateInLogBeingObserved.creationEstimatedTDEE;
          goalBoundaries = entryAtNextDateInLogBeingObserved.goalIntakeBoundaries;
        }
      }

      let goalMinVal = estimated;
      let goalMaxVal = estimated;

      if (context.log.goal == context.nutrConstants.GOAL_FAT_LOSS || context.log.goal == context.nutrConstants.GOAL_MAINTAIN) {
        goalMinVal -= goalBoundaries[1];
      }
      else if (context.log.goal == context.nutrConstants.GOAL_MUSCLE_GAIN) {
        goalMinVal += goalBoundaries[0];
      }

      if (context.log.goal == context.nutrConstants.GOAL_FAT_LOSS) {
        goalMaxVal -= goalBoundaries[0];
      }
      else if (context.log.goal == context.nutrConstants.GOAL_MUSCLE_GAIN || context.log.goal == context.nutrConstants.GOAL_MAINTAIN) {
        goalMaxVal += goalBoundaries[1];
      }

      estimatedLine.push(estimated)
      goalMaxLine.push(goalMaxVal)
      goalMinLine.push(goalMinVal)
    }

    chartData.push({
      data: estimatedLine,
      label: "TDEE",
      showLine: true,
      fill: 'none',
      borderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
      backgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
      pointBorderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
      pointBackgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
      pointHoverBackgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
      pointHoverBorderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
      pointRadius: 0,
    });

    if (this.tierPermissions.getUserTier().inDepthStats) {
      chartData.push({
        data: goalMaxLine,
        label: 'Goal Max',
        borderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        backgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointBorderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointBackgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointHoverBackgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointHoverBorderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        fill: false,
        pointRadius: 0,
        borderDash: [10, 5],
        options: {
          fill: false, tooltips: {
            enabled: false
          }
        }
      });

      chartData.push({
        data: goalMinLine,
        label: 'Goal Min',
        borderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        backgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointBorderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointBackgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointHoverBackgroundColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        pointHoverBorderColor: context.stateManager.getCurrentUser().userPreferences.general.currentTheme,
        fill: false,
        pointRadius: 0,
        borderDash: [10, 5],
        options: {
          fill: false, tooltips: {
            enabled: false
          }
        }
      });
    }

    return chartData;
  }


  /**
  * Helper function for closing the dialog reference.
  */
  closeDialog(): void {
    this.dialogRef.close();
  }

}
