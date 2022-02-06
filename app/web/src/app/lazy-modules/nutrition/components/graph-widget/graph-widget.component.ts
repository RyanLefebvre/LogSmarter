import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { ConstantsService } from 'src/app/services/general/constants.service';

/**
 * Data visualization component used in the in-depth log-component to 
 * show the relationships between variables tracked in the user's entries. 
 * The component currently has 2 modes, 'line' and 'scatter'.
 * 
 * The line plot will plot one variable in chronological order on the 
 * y-axis with time representated as dates in the format d/mm/yyyy on the 
 * x-axis. The default variable plotted is calorie intake. When the 
 * graph is in line mode, and the y-axis is set to calories or weight, 
 * additional statistics will be plotted. If the y-axis is set to calories,
 * the user's estimated TDEE will be displayed as a solid line and the upper 
 * and lower boundaries of their goal intake will be shown as a dashed line.
 * If the y-axis is set to weight, then the user's change in weight from start
 * weight to current weight will be plotted as if the change was linear. 
 * 
 * The scatter plot is simpler. It gives user's control over both the x-axis and 
 * y-axis. Points are not plotted chronologically. Instead they are plotted 
 * in ascending order based on their numeric value. Date is not a valid 
 * option for the x-axis or y-axis when the scatter plot mode is turned on.
 * 
 * Only paid tiers have access to the scatter plot. Free user's are restricted 
 * to using the line chart. Instead, the free user will be prompted to upgrade 
 * their account if they attempt to change the component to scatter plot mode.
 * 
 * Last edited by: Ryan Lefebvre 9/11/2020
 */
@Component({
  selector: 'app-graph-widget',
  templateUrl: './graph-widget.component.html',
  styleUrls: ['./graph-widget.component.css']
})
export class GraphWidgetComponent implements OnInit, OnDestroy {

  /**
   * Constant used to refer to the graph when the type is set to line.
   */
  GRAPH_TYPE_LINE: string = "line";

  /**
   * Constant used to refer to the graph when the type is set to scatter.
   */
  GRAPH_TYPE_SCATTER: string = "scatter";

  /**
   * Constant used to refer to an x or y axis that is set to date.
   */
  AXIS_TYPE_DATE = "date";

  /**
  * Constant used to refer to an x or y axis that is set to weight.
  */
  AXIS_TYPE_WEIGHT = "weight";

  /**
  * Constant used to refer to an x or y axis that is set to calories.
  */
  AXIS_TYPE_KCAL = "calories";

  /**
   * True if the spinner should be shown. False otherwise. Used when something is loading.
   */
  showSpinner: boolean = false;

  /**
   * Reference to state changes to the log being displayed in the log in depth display component.
   */
  @Input()
  displayLogObservable: BehaviorSubject<[NutritionLog, EnergyPayload]>;

  /**
   * Value of the display log observable.
   */
  logBeingObserved: NutritionLog = null;

  /**
   * Reference to the subscription created from the display log observable.
   */
  displayLogSubRef: Subscription = null;

  /**
   * The display log observable is emitting a shared NutritionLog object. 
   * This means, if the entries in the logs entry list are sorted, it will 
   * also impact other components. This variable serves as a local deep 
   * copy of the logs entries that can be sorted in any order without 
   * affecting the way the entries are displayed in other components.
   */
  listOfCurrentEntries: DayEntry[] = [];

  /**
   * True if the initial TDEE has been received from the 
   * energy payload.
   */
  receivedInitialTDEE: boolean = false;

  /**
   * Energy payload returned from backend as a result of 
   * running logsmarter algorithm on the user's log.
   */
  payload: EnergyPayload = null;

  /**
   * JSON of Chartjs options to be passed into the canvas element.
   */
  chartOptions: any = null;

  /**
   * List of chart labels passed in for the x or y-axis.
   */
  chartLabels: any = [];

  /**
   * The actual data that will be plotted on the chart.
   */
  chartData: any[] = [];

  /**
   * Global reference to chart x-axis. Must be one of the axis type constants.
   */
  xAxisName: string = null;

  /**
   * Global reference to chart y-axis. Must be one of the axis type constants.
   */
  yAxisName: string = null;

  /**
   * Global reference to graph type. Must be one of the graph type constants.
  */
  graphTypeName: string = null;

  /**
   * True if the graph is in the middle of being updated aka the animation, false otherwise.
   */
  graphIsBeingUpdated: boolean = false;

  /**
   * Reference to the last list of entries from the graph that was stringified. 
   * False if they do not exist.
   */
  lastEntryListRef: string = null;

  /**
   * @ignore
   */
  constructor(
    public time: TimeService,
    public subCreator: LogSubscriptionCreatorService,
    public stateManager: StateManagerService,
    public preferenceManager: PreferenceService,
    public conversionManager: ConversionService,
    public payloadManager: PayloadService,
    public tierPermissionService: TierPermissionsService,
    public constants: NutritionConstanstsService,
    public generalConstants: ConstantsService) {
  }

  /**
   * @ignore 
   */
  ngOnInit() {
    this.setInitialValuesFromPreferences();
    this.displayLogSubscription();
  }

  /**
   * @ignore kill subscriptions.
   */
  ngOnDestroy(): void {
    if (this.displayLogSubRef) {
      this.displayLogSubRef.unsubscribe();
    }
  }

  /**
   * Sets the components initial chart state from the user's preferences. Currently, 
   * only controls graph type. Will be expanded to include axis control as well.
   */
  setInitialValuesFromPreferences(): void {
    this.graphTypeName = this.stateManager.getCurrentUser().userPreferences.nutrition.graphMode;
    this.xAxisName = this.AXIS_TYPE_DATE;
    this.yAxisName = this.AXIS_TYPE_KCAL;
  }

  /**
   * Handles logic for display log subscription. Every time the state of the log being 
   * displayed changes, the display log is set to the new state of the log, a deep copy is 
   * made of the new entry list and the graph state is updated. Sets the global payload to the
   * new payload, marks that we have received a TDEE and that the TDEE can be plotted if it exists.
   * Lastly updates the graph.
   */
  displayLogSubscription(): void {
    const context = this;
    this.displayLogSubRef = this.displayLogObservable.subscribe((logAndPayload: [NutritionLog, any]) => {
      if (logAndPayload) {
        const logExists: boolean = (logAndPayload[this.subCreator.NUTR_LOG_IDX] != null);
        const payloadExists: boolean = (logAndPayload[this.subCreator.ENERGY_PAYLOAD_IDX] != null);
        if (logExists && payloadExists) {
          const logFromObservable: NutritionLog = logAndPayload[context.subCreator.NUTR_LOG_IDX];
          const entriesAreDifferent: boolean = (!context.lastEntryListRef || (context.lastEntryListRef != JSON.stringify(logFromObservable.dayEntries)));
          context.logBeingObserved = logAndPayload[context.subCreator.NUTR_LOG_IDX];
          context.lastEntryListRef = JSON.stringify(context.logBeingObserved.dayEntries);
          context.listOfCurrentEntries = context.logBeingObserved.dayEntries.concat([]);
          context.sortDisplayEntriesChronologically();
          context.payload = logAndPayload[context.subCreator.ENERGY_PAYLOAD_IDX];
          context.receivedInitialTDEE = true;
          if (!this.graphIsBeingUpdated && entriesAreDifferent) {
            context.graphIsBeingUpdated = true;
            context.updateGraph();
            setTimeout(() => context.graphIsBeingUpdated = false, context.generalConstants.SPINNER_TIMEOUT)
          }
        }
      }
    });
  }

  /**
   * Updates the graph to a new state. This occurs when new data is received,
   * the graph type is changed or an axis is changed to a new variables.
   * 
   * If graph type is changed to scatter and date is plotted on the x-axis,
   * the x axis is changed to weight because date does not make sense for 
   * the x-axis of the scatterplot.
   * 
   * If the graph type is changed to line, the x-axis is forced to be date 
   * because the line mode only allows control of the y-axis.
   * 
   * A timeout is set with a slight delay to make the transition between 
   * chart states look less abrupt.
   */
  updateGraph(): void {
    this.showSpinner = true;
    const context = this;
    setTimeout(function () {
      if (context.graphTypeName == context.GRAPH_TYPE_SCATTER) {
        if (context.xAxisName == context.AXIS_TYPE_DATE) {
          context.xAxisName = context.AXIS_TYPE_WEIGHT;
        }
        context.scatterPlot();
      }
      else if (context.graphTypeName == context.GRAPH_TYPE_LINE) {
        context.xAxisName = context.AXIS_TYPE_DATE
        context.lineGraph();
      }
      context.showSpinner = false;
    }, context.generalConstants.SPINNER_TIMEOUT);
  }

  /**
   * Handles logic for setting chart variables to display a scatter plot.
   * Fills the points array with {x,y} pairs to be plotted as points.
   * Sets chardata and Chartoptions to optimal values for the scatterplot display.
   * 
   * All values plotted on the chart are rounded to whole numbers for simplicity and 
   * to avoid large repeating decimals.
   */
  scatterPlot(): void {
    let points: any[] = [];
    this.listOfCurrentEntries.forEach((entry: DayEntry) => {

      let pointX: any = null;
      let pointY: any = null;

      let weightInCorrectUnits: number = entry.weight;
      if (!(this.stateManager.getCurrentUser().userPreferences.general.isImperial)) {
        weightInCorrectUnits = this.conversionManager.convertLbsToKg(weightInCorrectUnits);
      }

      if (this.xAxisName == this.AXIS_TYPE_KCAL) {
        pointX = entry.calories;
      }
      else if (this.xAxisName == this.AXIS_TYPE_WEIGHT) {
        pointX = weightInCorrectUnits;
      }

      if (this.yAxisName == this.AXIS_TYPE_KCAL) {
        pointY = entry.calories;
      }
      else if (this.yAxisName == this.AXIS_TYPE_WEIGHT) {
        pointY = weightInCorrectUnits;
      }

      points.push({ x: pointX, y: pointY });
    });

    this.chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      datasetStroke: true,
      showScale: true,
      showLine: true,
      tooltips: {
        enabled: false
      }
    };

    this.chartOptions.scales = {
      yAxes: [{
        display: true,
      }],
      xAxes: [{
        type: 'linear',
        position: 'bottom'
      }],
      ticks: {
        callback: function (value) {
          return Math.round(value)
        }
      }
    }

    this.chartData =
      [{
        data: points,
        pointRadius: 3,
        pointHoverRadius: 6
      }];
  }

  /**
   * Controlled by buttons under graph widget that control component state.
   * Updates the chart axis info or updates the chart type. Then
   * force updates the graph display by resetting the state.
   *  
   * @param updateType type of update for chart state.
   * @param updateValue the new value of the variable to be updated.
   */
  updateGraphInfo(updateType: string, updateValue: string): void {

    const UPDATE_X_AXIS: string = "x";
    const UPDATE_Y_AXIS: string = "y";
    const UPDATE_CHART_TYPE: string = "t";

    if (updateType == UPDATE_X_AXIS) {
      this.xAxisName = updateValue;
    }
    else if (updateType == UPDATE_Y_AXIS) {
      this.yAxisName = updateValue;
    }
    else if (updateType == UPDATE_CHART_TYPE) {
      this.graphTypeName = updateValue;
    }

    this.updateGraph();

  }

  /**
   * Handles logic for setting chart variables to display a line plot.
   * Fills array of x axis labels with date values and line with points 
   * to be plotted on the y-azis.
   * 
   * All values plotted on the chart are rounded to whole numbers for simplicity and 
   * to avoid large repeating decimals.
   * 
   * Additional checks are done for whether or not the special plots can be displayed for the given
   * line graph. Restrictions for the special plots are described in the helper functions that 
   * are responsible for constructing the special plot.
   */
  lineGraph(): void {
    let line: number[] = [];
    let xAxisLabels: string[] = [];

    this.listOfCurrentEntries.forEach((entry: DayEntry) => {

      let pointX: string;
      let pointY: number;

      let weightInCorrectUnits: number = entry.weight;
      if (!(this.stateManager.getCurrentUser().userPreferences.general.isImperial)) {
        weightInCorrectUnits = this.conversionManager.convertLbsToKg(weightInCorrectUnits);
      }

      pointX = entry.date.toLocaleDateString();

      if (this.yAxisName == this.AXIS_TYPE_KCAL) {
        pointY = entry.calories;
      }
      else if (this.yAxisName == this.AXIS_TYPE_WEIGHT) {
        pointY = weightInCorrectUnits;
      }

      line.push(pointY)
      xAxisLabels.push(pointX);
    });

    if (xAxisLabels.length <= 1) {
      let payloadStartDateaAsStamp: number = this.payload.startDate;
      const payLoadDoesNotHaveValidStartDate: boolean = !(payloadStartDateaAsStamp)
      if (payLoadDoesNotHaveValidStartDate) {
        payloadStartDateaAsStamp = this.time.getTimeStamp();
      }
      const actualStartDate: Date = new Date(payloadStartDateaAsStamp);
      xAxisLabels[0] = actualStartDate.toLocaleDateString();
      xAxisLabels[1] = (this.time.getOneDayLater(actualStartDate)).toLocaleDateString();
    }
    this.chartLabels = xAxisLabels;

    this.chartData = this.checkForSpecialPlot([
      {
        data: line,
        label: this.capitalizeFirstLetter(this.yAxisName),
        pointRadius: 3,
        pointHoverRadius: 6
      }]);
    this.chartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      datasetStroke: true,
      showScale: true,
      showLine: true,
      tooltips: {
        enabled: false
      }
    };
  }

  /**
   * Helper function for sorting the list of display entries chronologically.
   */
  sortDisplayEntriesChronologically(): void {
    this.listOfCurrentEntries.sort(
      function (a, b) {
        return (a.date.getTime() - b.date.getTime());
      })
  }

  /**
   * Capitalizes the first letter of an input string. If the
   * string is empty, then an empty string is returned.
   * 
   * @param string string to have the first char capitalized
   */
  capitalizeFirstLetter(string: string): string {
    if (string.length == 0) {
      return string;
    } else {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }

  /**
   * Performs checks on whether the passed in data 
   * satisfies any of the requirements to plot 
   * the special line graph statistics. If no special 
   * plots can be shown, then the original data is returned 
   * unaltered.
   * 
   * @param data chart data to be plotted.
   */
  checkForSpecialPlot(data: any[]): any[] {
    if (this.shouldPlotEstimatedTDEE()) {
      return this.plotTDEE(data);
    }
    else if (this.shouldPlotLinearWeightChange()) {
      return this.plotLinearWeightChange(data);
    }
    else {
      return data;
    }
  }

  /**
   * Returns true if the linear weight line should be plotted. This is only for when
   * the graph type is line and y axis is weight. Also returns false if the log is empty.
   */
  shouldPlotLinearWeightChange(): boolean {
    return (
      this.logBeingObserved.dayEntries.length != 0 &&
      this.graphTypeName != this.GRAPH_TYPE_SCATTER &&
      this.yAxisName == this.AXIS_TYPE_WEIGHT);
  }

  /**
   * Plots change from starting weight to current weight as if it were linear. The result
   * is a straight dashed line from the start of the logs entries to the end. This is done by calculating 
   * what the average change in weight per entry would have been if the weight change were linear.
   * 
   * Then one point is added for each entry to another dataset that is plotted with the original using the 
   * same x-axis labels but different y-axis labels to represent the hypothetical linear change.
   *  
   * @param chartData data to augment with special plot.
   */
  plotLinearWeightChange(chartData: any[]): any[] {
    const startCurrentDifference: number = (-1 * (this.payload.startWeight - this.payload.currentWeight));
    const averageDailyChange: number = startCurrentDifference / this.logBeingObserved.dayEntries.length;
    let context = this;
    let linearWeight: number = null;

    chartData.push({
      data: context.chartLabels.map(() => {

        if (!linearWeight)
          linearWeight = context.payload.startWeight;
        else
          linearWeight += averageDailyChange;

        if (!(this.stateManager.getCurrentUser().userPreferences.general.isImperial)) {
          return context.conversionManager.convertLbsToKg(linearWeight);
        }
        else {
          return linearWeight;
        }
      }),
      label: "Linear Change",
      type: 'line',
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

    return chartData;
  }


  /**
   * Returns true if the estimated TDEE and goal intake min/max should be plotted.
   */
  shouldPlotEstimatedTDEE(): boolean {
    return (
      this.graphTypeName != this.GRAPH_TYPE_SCATTER &&
      this.yAxisName == this.AXIS_TYPE_KCAL &&
      this.payload.estimatedTDEE != null);
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

    for (let dateIdx = 0; dateIdx < context.chartLabels.length; dateIdx++) {

      let estimated = this.payload.estimatedTDEE;
      let goalBoundaries = context.payload.goalIntakeBoundaries;
      const isLatestDate = (dateIdx == (context.chartLabels.length - 1));

      if (!isLatestDate) {
        const dateOneAfterCurrentIdx = new Date(context.chartLabels[dateIdx + 1]);
        const entryAtNextDateInLogBeingObserved = context.logBeingObserved.getEntryAtDate(dateOneAfterCurrentIdx);
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

      if (context.logBeingObserved.goal == context.constants.GOAL_FAT_LOSS || context.logBeingObserved.goal == context.constants.GOAL_MAINTAIN) {
        goalMinVal -= goalBoundaries[1];
      }
      else if (context.logBeingObserved.goal == context.constants.GOAL_MUSCLE_GAIN) {
        goalMinVal += goalBoundaries[0];
      }

      if (context.logBeingObserved.goal == context.constants.GOAL_FAT_LOSS) {
        goalMaxVal -= goalBoundaries[0];
      }
      else if (context.logBeingObserved.goal == context.constants.GOAL_MUSCLE_GAIN || context.logBeingObserved.goal == context.constants.GOAL_MAINTAIN) {
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

    if (this.tierPermissionService.getUserTier().inDepthStats) {
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

}