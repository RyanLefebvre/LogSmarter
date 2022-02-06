import { TimeService } from 'src/app/services/general/time-constant.service';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { GraphWidgetComponent } from './graph-widget.component';
import { autoSpy } from 'autoSpy';
import { Subscription, BehaviorSubject } from 'rxjs';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { getLocaleNumberFormat } from '@angular/common';

describe('GraphWidgetComponent', () => {

  let component: GraphWidgetComponent;
  let testHelpers = new TestHelpers();

  beforeEach(() => {
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should call the correct setup functions when ngOnInit() is called', () => {
    const setPefSpy: jasmine.Spy<() => void> = spyOn(component, "setInitialValuesFromPreferences").and.callFake(() => { });
    const dispLogSubSpy: jasmine.Spy<() => void> = spyOn(component, "displayLogSubscription").and.callFake(() => { });
    component.ngOnInit();
    expect(setPefSpy).toHaveBeenCalled();
    expect(dispLogSubSpy).toHaveBeenCalled();
  });

  it('should kill the displayLogSubscription when ngOnDestroy() is called', () => {
    component.displayLogSubRef = new Subscription();
    const unsubSpy: jasmine.Spy<() => void> = spyOn(component.displayLogSubRef, "unsubscribe");
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });


  it('should not do anything when ngOnDestroy() is called and the displayLogSubRef is null', () => {
    component.displayLogSubRef = null
    component.ngOnDestroy();
    expect(component.displayLogSubRef).toBe(null);
  });

  it('should set the graph type and axes appropriately when setInitialValuesFromPreferences() is called', () => {
    const expectedGraphTypeName: string = "fakeGraphMode";
    component.stateManager.getCurrentUser = () => {
      const dummyUser: UserProfile = new UserProfile();
      dummyUser.userPreferences = {
        nutrition: {
          graphMode: expectedGraphTypeName
        }
      }
      return dummyUser;
    }
    component.setInitialValuesFromPreferences();
    const graphTypeIsCorrect: boolean = (component.graphTypeName == expectedGraphTypeName);
    const xAxisIsCorrect: boolean = (component.xAxisName == component.AXIS_TYPE_DATE);
    const yAxisIsCorrect: boolean = (component.yAxisName == component.AXIS_TYPE_KCAL);
    const valuesWereSetCorrectly: boolean = (graphTypeIsCorrect && xAxisIsCorrect && yAxisIsCorrect);
    expect(valuesWereSetCorrectly).toBe(true);
  });

  it('should set the displayLogSubRef variable to the displayLogObservable Subscription when displayLogSubscription() is called', () => {
    const expectedReturnValue: Subscription = new Subscription();
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    spyOn(component.displayLogObservable, "subscribe").and.callFake(() => expectedReturnValue);
    component.displayLogSubscription();
    const subscriptionWasCorrectlySet: boolean = (component.displayLogSubRef == expectedReturnValue);
    expect(subscriptionWasCorrectlySet).toBe(true);
  });

  it("should not do anything in the displayLogObservableSUbscription if the logAndPayload are null ", () => {
    let lamRef;
    component.displayLogObservable = {
      subscribe: (lambda) => {
        lamRef = lambda;
      }
    } as any;
    component.updateGraph = jasmine.createSpy();
    component.displayLogSubscription();
    lamRef(null);
    expect(component.updateGraph).not.toHaveBeenCalled();
  });

  it('should turn the spinner on when updateGraph() is called ', () => {
    component.updateGraph();
    const spinnerIsShowing: boolean = component.showSpinner;
    expect(spinnerIsShowing).toBe(true);
  });

  it('should still turn the spinner on and then off when updateGraph() is called if the graph type is unknown ', () => {
    component.generalConstants.SPINNER_TIMEOUT = 50;
    component.graphTypeName = "someRandomGraphType"
    component.updateGraph();
    const spinnerIsShowing: boolean = component.showSpinner;
    expect(spinnerIsShowing).toBe(true);
    jasmine.clock().tick(component.generalConstants.SPINNER_TIMEOUT + 10);
  });

  it("should still update the graph info if updateGraphInfo() is called and the update type is unknown", () => {
    component.updateGraph = jasmine.createSpy();
    component.updateGraphInfo(null, null);
    expect(component.updateGraph).toHaveBeenCalled();
  });

  it('should call scatterPlot() if the graph type is scatter and updateGraph() is called ', () => {
    component.graphTypeName = component.GRAPH_TYPE_SCATTER;
    const spyOnScatter: jasmine.Spy<() => void> = spyOn(component, 'scatterPlot');
    component.updateGraph();
    jasmine.clock().tick(300);
    expect(spyOnScatter).toHaveBeenCalled();
  });

  it('should set X-axis to weight if graph type is scatter and X-axis is date and updateGraph() is called ', () => {
    component.graphTypeName = component.GRAPH_TYPE_SCATTER;
    component.xAxisName = component.AXIS_TYPE_DATE;
    spyOn(component, 'scatterPlot');
    component.updateGraph();
    jasmine.clock().tick(300);
    const xAxisIsWeight: boolean = (component.xAxisName == component.AXIS_TYPE_WEIGHT);
    expect(xAxisIsWeight).toBe(true);
  });

  it('should set X-axis to date and call lineGraph() if graph type is line and updateGraph() is called ', () => {
    component.graphTypeName = component.GRAPH_TYPE_LINE;
    component.xAxisName = component.AXIS_TYPE_DATE;
    const spyOnLine: jasmine.Spy<() => void> = spyOn(component, 'lineGraph');
    component.updateGraph();
    jasmine.clock().tick(300);
    const xAxisIsDate: boolean = (component.xAxisName == component.AXIS_TYPE_DATE);
    expect(xAxisIsDate).toBe(true);
    expect(spyOnLine).toHaveBeenCalled();
  });

  it("should return an empty string if capitalizeFirstletter() is called and string.length is 0", () => {
    const emptyString: string = "";
    const expectedValue: string = emptyString;
    const actualValue: string = component.capitalizeFirstLetter(emptyString);
    const actualisExpected: boolean = (expectedValue === actualValue);
    expect(actualisExpected).toBe(true);
  });

  it("should return the same string with the first letter capitalized if capitalizeFirstletter() is called and string.length is > 0", () => {
    const inputString: string = "someStupidString";
    const expectedValue: string = "SomeStupidString";
    const actualValue: string = component.capitalizeFirstLetter(inputString);
    const actualisExpected: boolean = (expectedValue === actualValue);
    expect(actualisExpected).toBe(true);
  });

  it("should return false if the logBeingObserved is empty and shouldPlotLinearWeightChange() is called ", () => {
    component.logBeingObserved = new NutritionLog();
    const expectedValue: boolean = false;
    const actualValue: boolean = component.shouldPlotLinearWeightChange();
    const actualIsExpected: boolean = (actualValue === expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should return false if the graph type is scatter and shouldPlotLinearWeightChange() is called ", () => {
    component.logBeingObserved = new NutritionLog();
    component.graphTypeName = component.GRAPH_TYPE_SCATTER;
    const expectedValue: boolean = false;
    const actualValue: boolean = component.shouldPlotLinearWeightChange();
    const actualIsExpected: boolean = (actualValue === expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should return false if the y-axis is not weight and shouldPlotLinearWeightChange() is called ", () => {
    component.logBeingObserved = new NutritionLog();
    component.graphTypeName = component.GRAPH_TYPE_LINE;
    component.yAxisName = component.AXIS_TYPE_KCAL;
    const expectedValue: boolean = false;
    const actualValue: boolean = component.shouldPlotLinearWeightChange();
    const actualIsExpected: boolean = (actualValue === expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should return true if the y-axis is weight, the log is not empty, the grraph type is scatter and shouldPlotLinearWeightChange() is called ", () => {
    component.logBeingObserved = new NutritionLog();
    component.logBeingObserved.dayEntries.push(new DayEntry());
    component.graphTypeName = component.GRAPH_TYPE_LINE;
    component.yAxisName = component.AXIS_TYPE_WEIGHT;
    const expectedValue: boolean = true;
    const actualValue: boolean = component.shouldPlotLinearWeightChange();
    const actualIsExpected: boolean = (actualValue === expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should call update graph if updateGraphInfo() is called ", () => {
    const updateGraphSpy: jasmine.Spy<() => void> = spyOn(component, "updateGraph");
    const updateType: string = "t";
    const updateValue: string = "someRandomValue"
    component.updateGraphInfo(updateType, updateValue);
    expect(updateGraphSpy).toHaveBeenCalled();
  });

  it("should set the x-axis if updateGraphInfo() is called and updateType is x-axis ", () => {
    spyOn(component, "updateGraph");
    const updateType: string = "x";
    const updateValue: string = "someRandomValue"
    component.updateGraphInfo(updateType, updateValue);
    const xAxisValueIsExpected = (component.xAxisName === updateValue);
    expect(xAxisValueIsExpected).toBe(true);
  });

  it("should set the y-axis if updateGraphInfo() is called and updateType is y-axis ", () => {
    spyOn(component, "updateGraph");
    const updateType: string = "y";
    const updateValue: string = "someRandomValue"
    component.updateGraphInfo(updateType, updateValue);
    const yAxisValueIsExpected: boolean = (component.yAxisName === updateValue);
    expect(yAxisValueIsExpected).toBe(true);
  });

  it("should set the type if updateGraphInfo() is called and updateType is graphType ", () => {
    spyOn(component, "updateGraph");
    const updateType: string = "t";
    const updateValue: string = "someRandomValue"
    component.updateGraphInfo(updateType, updateValue);
    const yAxisValueIsExpected: boolean = (component.graphTypeName === updateValue);
    expect(yAxisValueIsExpected).toBe(true);
  });

  it("Should sort the listOfCurrentEntries in chronological order when sortDisplayEntriesChronologically() is called  ", () => {
    component.listOfCurrentEntries = [];
    for (let i = 0; i < 100; i++) {
      const newEntry: DayEntry = new DayEntry();
      newEntry.date = testHelpers.getRandomDate();
      component.listOfCurrentEntries.push(newEntry);
    }
    component.sortDisplayEntriesChronologically();
    let sortedChronologically: boolean = true;
    for (let idxOfEntrty1 = 0; idxOfEntrty1 < component.listOfCurrentEntries.length; idxOfEntrty1++) {
      for (let idxOfEntrty2 = 0; idxOfEntrty2 < component.listOfCurrentEntries.length; idxOfEntrty2++) {
        if (idxOfEntrty1 > idxOfEntrty2) {
          const entry1Time: number = component.listOfCurrentEntries[idxOfEntrty1].date.getTime();
          const entry2Time: number = component.listOfCurrentEntries[idxOfEntrty2].date.getTime();
          if (entry1Time < entry2Time) {
            sortedChronologically = false;
          }
        }
      }
    }
    expect(sortedChronologically).toBe(true);
  });

  it("should call plotTdee() if shouldPlotEstimatedTDEE() is true and checkForSpecialPlot() is called ", () => {
    const spyOnPlotTDEE: jasmine.Spy<() => any[]> = spyOn(component, 'plotTDEE');
    spyOn(component, 'shouldPlotEstimatedTDEE').and.callFake(() => true);
    const fakeData: [] = [];
    component.checkForSpecialPlot(fakeData);
    expect(spyOnPlotTDEE).toHaveBeenCalled();
  });

  it("should call plotLinearWeightChange() if shouldPlotLinearWeightChange() is true and checkForSpecialPlot() is called ", () => {
    const spyOnPlotTDEE: jasmine.Spy<() => any[]> = spyOn(component, 'plotLinearWeightChange');
    spyOn(component, 'shouldPlotEstimatedTDEE').and.callFake(() => false);
    spyOn(component, 'shouldPlotLinearWeightChange').and.callFake(() => true);
    const fakeData: [] = [];
    component.checkForSpecialPlot(fakeData);
    expect(spyOnPlotTDEE).toHaveBeenCalled();
  });

  it("should just return data if no special plot conditions are true and checkForSpecialPlot() is called ", () => {
    spyOn(component, 'plotLinearWeightChange');
    spyOn(component, 'shouldPlotEstimatedTDEE').and.callFake(() => false);
    spyOn(component, 'shouldPlotLinearWeightChange').and.callFake(() => false);
    const fakeData: string[] = ["someFakeData", "someMoreFakeData"];
    const returnedData: any[] = component.checkForSpecialPlot(fakeData);
    const actualIsExpected: boolean = (fakeData == returnedData);
    expect(actualIsExpected).toBe(true);
  });

  it("should return false if the graph type is scatter and shouldPlotEstimatedTDEE() is called ", () => {
    component.graphTypeName = component.GRAPH_TYPE_SCATTER;
    const expectedReturnValue: boolean = false;
    const acutalReturnValue: boolean = component.shouldPlotEstimatedTDEE();
    const actualIsExpected: boolean = (acutalReturnValue === expectedReturnValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should return false if the yAxis is not calories and shouldPlotEstimatedTDEE() is called ", () => {
    component.graphTypeName = component.GRAPH_TYPE_LINE;
    component.yAxisName = component.AXIS_TYPE_WEIGHT;
    const expectedReturnValue: boolean = false;
    const acutalReturnValue: boolean = component.shouldPlotEstimatedTDEE();
    const actualIsExpected: boolean = (acutalReturnValue === expectedReturnValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should return false if the estimatedTDEE of the payload is null and shouldPlotEstimatedTDEE() is called ", () => {
    component.graphTypeName = component.GRAPH_TYPE_LINE;
    component.yAxisName = component.AXIS_TYPE_KCAL;
    component.payload = new EnergyPayload();
    const expectedReturnValue: boolean = false;
    const acutalReturnValue: boolean = component.shouldPlotEstimatedTDEE();
    const actualIsExpected: boolean = (acutalReturnValue === expectedReturnValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should return true if the estimatedTDEE of the payload is not null, the graph type is not scatter, the y-axis is calories and shouldPlotEstimatedTDEE() is called ", () => {
    component.graphTypeName = component.GRAPH_TYPE_LINE;
    component.yAxisName = component.AXIS_TYPE_KCAL;
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    const expectedReturnValue: boolean = true;
    const acutalReturnValue: boolean = component.shouldPlotEstimatedTDEE();
    const actualIsExpected: boolean = (acutalReturnValue === expectedReturnValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should round the ticks using Math.round() as the callback function for chartOptions.ticks when scatterPlot() is called ", () => {
    component.chartOptions = {};
    component.scatterPlot();
    const callBackFunc: Function = component.chartOptions.scales.ticks.callback;
    const randomDecimal: number = Math.random();
    const expectedValue: number = Math.round(randomDecimal);
    const actualValue: number = callBackFunc(randomDecimal);
    const actualIsExpected: boolean = (expectedValue === actualValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should call convertLbsToKG() is the users number system is metric and scatterPlot() is called ", () => {
    component.chartOptions = {};
    const valueForIsImperailWhenNumberSystemIsMetric: boolean = false
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: valueForIsImperailWhenNumberSystemIsMetric
        }
      }
      return newUser;
    }
    component.listOfCurrentEntries = [new DayEntry()];
    component.scatterPlot();
    expect(component.conversionManager.convertLbsToKg).toHaveBeenCalled();
  });

  it("should set the x point of x,y pairs to entry.calories if the x-axis is calories ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    const newEntry: DayEntry = new DayEntry();
    const weight: number = 123;
    const calories: number = 321;
    newEntry.weight = weight;
    newEntry.calories = calories;
    component.listOfCurrentEntries.push(newEntry);
    component.xAxisName = component.AXIS_TYPE_KCAL;
    component.scatterPlot();
    const chartPoints: [{ x, y }] = component.chartData[0].data;
    const xValueOfFirstPoint: number = chartPoints[0].x;
    const firstXValueIsExpected: boolean = (xValueOfFirstPoint === newEntry.calories);
    expect(firstXValueIsExpected).toBe(true);
  });

  it("should set the x point of x,y pairs to entry.weight if the x-axis is weight ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    const newEntry: DayEntry = new DayEntry();
    const weight: number = 123;
    const calories: number = 321;
    newEntry.weight = weight;
    newEntry.calories = calories;
    component.listOfCurrentEntries.push(newEntry);
    component.xAxisName = component.AXIS_TYPE_WEIGHT;
    component.scatterPlot();
    const chartPoints: [{ x, y }] = component.chartData[0].data;
    const xValueOfFirstPoint: number = chartPoints[0].x;
    const firstXValueIsExpected: boolean = (xValueOfFirstPoint === newEntry.weight);
    expect(firstXValueIsExpected).toBe(true);
  });

  it("should set the y point of x,y pairs to entry.calories if the x-axis is calories ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    const newEntry: DayEntry = new DayEntry();
    const weight: number = 123;
    const calories: number = 321;
    newEntry.weight = weight;
    newEntry.calories = calories;
    component.listOfCurrentEntries.push(newEntry);
    component.yAxisName = component.AXIS_TYPE_KCAL;
    component.scatterPlot();
    const chartPoints: [{ x, y }] = component.chartData[0].data;
    const yValueOfFirstPoint: number = chartPoints[0].y;
    const firstYValueIsExpected: boolean = (yValueOfFirstPoint === newEntry.calories);
    expect(firstYValueIsExpected).toBe(true);
  });

  it("should set the y point of x,y pairs to entry.weight if the x-axis is weight ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    const newEntry: DayEntry = new DayEntry();
    const weight: number = 123;
    const calories: number = 321;
    newEntry.weight = weight;
    newEntry.calories = calories;
    component.listOfCurrentEntries.push(newEntry);
    component.yAxisName = component.AXIS_TYPE_WEIGHT;
    component.scatterPlot();
    const chartPoints: [{ x, y }] = component.chartData[0].data;
    const yValueOfFirstPoint: number = chartPoints[0].y;
    const firstYValueIsExpected: boolean = (yValueOfFirstPoint === newEntry.weight);
    expect(firstYValueIsExpected).toBe(true);
  });

  it("should call convertLbsToKG() if the users number system is metric and lineGraph() is called ", () => {
    component.chartOptions = {};
    const valueForIsImperailWhenNumberSystemIsMetric: boolean = false
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: valueForIsImperailWhenNumberSystemIsMetric
        }
      }
      return newUser;
    }
    component.payload = new EnergyPayload();
    spyOn(component, 'capitalizeFirstLetter');
    spyOn(component, 'checkForSpecialPlot');
    component.time.getOneDayLater = (date: Date) => date;
    component.listOfCurrentEntries = [new DayEntry()];
    component.lineGraph();
    expect(component.conversionManager.convertLbsToKg).toHaveBeenCalled();
  });

  it("should check for special plots when lineGraph() is called ", () => {
    component.chartOptions = {};
    component.payload = new EnergyPayload();
    spyOn(component, 'capitalizeFirstLetter');
    const checkSpecialSpy = spyOn(component, 'checkForSpecialPlot');
    component.time.getOneDayLater = (date: Date) => date;
    component.lineGraph();
    expect(checkSpecialSpy).toHaveBeenCalled();
  });

  it("should set the first label to the payload start date if there is one or less x-axis labels and lineGraph() is called ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    component.payload = new EnergyPayload();
    component.payload.startDate = testHelpers.getRandomDate().getTime();
    spyOn(component, 'capitalizeFirstLetter');
    spyOn(component, 'checkForSpecialPlot');
    component.time.getOneDayLater = (date: Date) => date;
    component.lineGraph();
    const idxOfLabeltoCheck: number = 0;
    const label: string = component.chartLabels[idxOfLabeltoCheck];
    const expectedValue: string = new Date(component.payload.startDate).toLocaleDateString();
    const actualIsExpected: boolean = (label === expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should set the second label to one day after the payload start date if there is one or less x-axis labels and lineGraph() is called ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    component.payload = new EnergyPayload();
    component.payload.startDate = testHelpers.getRandomDate().getTime();
    spyOn(component, 'capitalizeFirstLetter');
    spyOn(component, 'checkForSpecialPlot');
    component.time.getOneDayLater = (date: Date) => new Date(component.payload.startDate + 2400);
    component.lineGraph();
    const idxOfLabeltoCheck: number = 1;
    const label: string = component.chartLabels[idxOfLabeltoCheck];
    const payloadStartDateAsDate: Date = new Date(component.payload.startDate);
    const expectedValue: string = component.time.getOneDayLater(payloadStartDateAsDate).toLocaleDateString();
    const actualIsExpected: boolean = (label === expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it("should set the yPoint of x,y points to calories if the y-axis is calories and lineGraph() is called ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    component.payload = new EnergyPayload();
    component.payload.startDate = testHelpers.getRandomDate().getTime();
    spyOn(component, 'capitalizeFirstLetter');
    spyOn(component, 'checkForSpecialPlot').and.callFake(data => data);
    component.time.getOneDayLater = (date: Date) => new Date(component.payload.startDate + 2400);
    const newEntry: DayEntry = new DayEntry();
    const weight: number = 123;
    const calories: number = 321;
    newEntry.weight = weight;
    newEntry.calories = calories;
    component.listOfCurrentEntries.push(newEntry);
    component.yAxisName = component.AXIS_TYPE_KCAL;
    component.lineGraph();
    const points: any[] = component.chartData[0].data;
    const firstY: number = points[0];
    const actualIsExpected: boolean = (firstY === newEntry.calories);
    expect(actualIsExpected).toBe(true);
  });

  it("should set the yPoint of x,y points to weight  if the y-axis is weight and lineGraph() is called ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    component.payload = new EnergyPayload();
    component.payload.startDate = testHelpers.getRandomDate().getTime();
    spyOn(component, 'capitalizeFirstLetter');
    spyOn(component, 'checkForSpecialPlot').and.callFake(data => data);
    component.time.getOneDayLater = (date: Date) => new Date(component.payload.startDate + 2400);
    const newEntry: DayEntry = new DayEntry();
    const weight: number = -1;
    const calories: number = 321;
    newEntry.weight = weight;
    newEntry.calories = calories;
    component.listOfCurrentEntries.push(newEntry);
    component.yAxisName = component.AXIS_TYPE_WEIGHT;
    component.lineGraph();
    const points: any[] = component.chartData[0].data;
    const firstY: number = points[0];
    const actualIsExpected: boolean = (firstY === newEntry.weight);
    expect(actualIsExpected).toBe(true);
  });

  it("should convert all of the x,y points to line data if the y-axis is weight and lineGraph() is called ", () => {
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true
        }
      }
      return newUser;
    }
    component.payload = new EnergyPayload();
    component.payload.startDate = testHelpers.getRandomDate().getTime();
    spyOn(component, 'capitalizeFirstLetter');
    spyOn(component, 'checkForSpecialPlot').and.callFake(data => data);
    component.time.getOneDayLater = (date: Date) => new Date(component.payload.startDate + 2400);
    component.listOfCurrentEntries = testHelpers.getRandomEntryList();
    component.yAxisName = component.AXIS_TYPE_WEIGHT;
    component.lineGraph();
    expect(component.chartData[0].data.length).toBe(component.listOfCurrentEntries.length);
  });

  it("should call convertLbsToKg() is user's number system is metric and plotLinearWeightChange() is called ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.logBeingObserved = new NutritionLog();
    component.logBeingObserved.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {};
    const valueForIsImperailWhenNumberSystemIsMetric: boolean = false
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: valueForIsImperailWhenNumberSystemIsMetric,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.chartLabels = [{}];
    component.plotLinearWeightChange([]);
    expect(component.conversionManager.convertLbsToKg).toHaveBeenCalled();
  });

  it("should add one object to chartData if plotLinearWeightChange() is called ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.logBeingObserved = new NutritionLog();
    component.logBeingObserved.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {};
    const valueForIsImperailWhenNumberSystemIsMetric: boolean = false
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: valueForIsImperailWhenNumberSystemIsMetric,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.chartLabels = [{}];
    const dummyData = [];
    const expectedLength = dummyData.length + 1;
    const returnedValue = component.plotLinearWeightChange(dummyData);
    const actualLength = returnedValue.length;
    const actualIsExpected = (actualLength === expectedLength);
    expect(actualIsExpected).toBe(true);
  });

  it("should set the y-value of the first point on the line to the payloads startWeight if plotLinearWeightChange() is called ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.logBeingObserved = new NutritionLog();
    component.logBeingObserved.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {};
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.chartLabels = [{}];
    const dummyData = [];
    const returnedValue = component.plotLinearWeightChange(dummyData);
    const line = returnedValue[0].data;
    const firstPoint = line[0];
    const firstPointIsStartWeight = (firstPoint === component.payload.startWeight);
    expect(firstPointIsStartWeight).toBe(true);
  });

  it("should set the y-value of subsequent points on the line to the previous point + the averageDailyChange if plotLinearWeightChange() is called ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.logBeingObserved = new NutritionLog();
    component.logBeingObserved.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {};
    const startCurrentDifference: number = (-1 * (component.payload.startWeight - component.payload.currentWeight));
    const averageDailyChange: number = startCurrentDifference / component.logBeingObserved.dayEntries.length;
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.chartLabels = [{}, {}];
    const dummyData = [];
    const returnedValue = component.plotLinearWeightChange(dummyData);
    const line = returnedValue[0].data;
    const secondPoint = line[1];
    const expectedValue = payLoad.startWeight + averageDailyChange;
    const secondPointIsExpected = (secondPoint === expectedValue);
    expect(secondPointIsExpected).toBe(true);
  });

  it("should add 3 objects to the chart data if plotTDEE() is called and the user can see in depth stats", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    const dummyData = [];
    const expectedReturnValueLength = dummyData.length + 3;
    const actualReturnValueLength = component.plotTDEE(dummyData).length;
    const actualIsExpected = (actualReturnValueLength === expectedReturnValueLength);
    expect(actualIsExpected).toBe(true);
  });

  it("should add 3 objects to the chart data  and not break if plotTDEE() is called, the user can see in depth stats and hasGoalAndTDEE is true", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    const dummyData = []
    const dummyPayload = new EnergyPayload();
    component.logBeingObserved = new NutritionLog();
    component.logBeingObserved.dayEntries = testHelpers.getRandomEntryListOfLength(100).map(entry => {
      entry.creationEstimatedTDEE = testHelpers.getRandomCalories();
      entry.goalIntakeBoundaries = [Math.random(), Math.random()];
      component.chartLabels.push(entry.date.toLocaleDateString())
      return entry;
    });
    dummyPayload.goalIntakeBoundaries = [Math.random(), Math.random()];
    component.payload = dummyPayload;
    const expectedReturnValueLength = dummyData.length + 3;
    const actualReturnValueLength = component.plotTDEE(dummyData).length;
    const actualIsExpected = (actualReturnValueLength === expectedReturnValueLength);
    expect(actualIsExpected).toBe(true);
  });

  it("should only add 1 object to the chart data if plotTDEE() is called and the user can  NOT see in depth stats", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: false } };
    const dummyData = [];
    const expectedReturnValueLength = dummyData.length + 1;
    const actualReturnValueLength = component.plotTDEE(dummyData).length;
    const actualIsExpected = (actualReturnValueLength === expectedReturnValueLength);
    expect(actualIsExpected).toBe(true);
  });

  it("should set goal min value to tdee minus the upper intake boundary if goal is fat loss and plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants.GOAL_FAT_LOSS = "fatLoss";
    component.logBeingObserved.goal = component.constants.GOAL_FAT_LOSS;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE - component.payload.goalIntakeBoundaries[1];
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const minGoalLine = dataAfterPlot[2].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < minGoalLine.length; i++) {
      if (minGoalLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should set goal min value to tdee minus the upper intake boundary if goal is to maintain and plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants.GOAL_MAINTAIN = "maintain";
    component.logBeingObserved.goal = component.constants.GOAL_MAINTAIN;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE - component.payload.goalIntakeBoundaries[1];
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const minGoalLine = dataAfterPlot[2].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < minGoalLine.length; i++) {
      if (minGoalLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should set goal min value to tdee plus the lower intake boundary if goal is to gain muscle and plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants.GOAL_MUSCLE_GAIN = "gainMuscle";
    component.logBeingObserved.goal = component.constants.GOAL_MUSCLE_GAIN;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE + component.payload.goalIntakeBoundaries[0];
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const minGoalLine = dataAfterPlot[2].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < minGoalLine.length; i++) {
      if (minGoalLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should set goal max value to tdee minus the lower intake boundary if goal is to lose fat and plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants.GOAL_FAT_LOSS = "fatLoss";
    component.logBeingObserved.goal = component.constants.GOAL_FAT_LOSS;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE - component.payload.goalIntakeBoundaries[0];
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const maxGoalLine = dataAfterPlot[1].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < maxGoalLine.length; i++) {
      if (maxGoalLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should set goal max value to tdee plus the upper intake boundary if goal is to gain muscle and plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants.GOAL_MUSCLE_GAIN = "fatLoss";
    component.logBeingObserved.goal = component.constants.GOAL_MUSCLE_GAIN;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE + component.payload.goalIntakeBoundaries[1];
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const maxGoalLine = dataAfterPlot[1].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < maxGoalLine.length; i++) {
      if (maxGoalLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should always set every point to the payload's TDEE if plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE;
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const tdeeLine = dataAfterPlot[0].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < tdeeLine.length; i++) {
      if (tdeeLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should always set every point to the payload's TDEE if plotTDEE() is called even if the log does not have a goal (could not actually happen)", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants = new NutritionConstanstsService();
    component.logBeingObserved.goal = null;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE;
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const tdeeLine = dataAfterPlot[0].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < tdeeLine.length; i++) {
      if (tdeeLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should set goal max value to tdee plus the upper intake boundary if goal is to gain muscle and plotTDEE() is called", () => {
    component.stateManager.getCurrentUser = () => {
      const newUser: UserProfile = new UserProfile();
      newUser.userPreferences = {
        general: {
          isImperial: true,
          currentTheme: "someFakeTheme"
        }
      }
      return newUser;
    }
    component.tierPermissionService.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.logBeingObserved = new NutritionLog();
    component.constants.GOAL_MUSCLE_GAIN = "fatLoss";
    component.logBeingObserved.goal = component.constants.GOAL_MUSCLE_GAIN;
    component.chartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE + component.payload.goalIntakeBoundaries[1];
    const dummyData = [];
    const dataAfterPlot = component.plotTDEE(dummyData);
    const maxGoalLine = dataAfterPlot[1].data;
    let somePointIsNotTheExpectedValue = false;
    for (let i = 0; i < maxGoalLine.length; i++) {
      if (maxGoalLine[i] !== expectedValue) {
        somePointIsNotTheExpectedValue = true;
      }
    }
    expect(somePointIsNotTheExpectedValue).toBe(false);
  });

  it("should set the display log subscription when displayLogSubscription() is called ", () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null])
    component.displayLogSubscription();
    const subscriptionIsNotNull = component.displayLogSubRef != null;
    expect(subscriptionIsNotNull).toBe(true);
  });

  it("should set the current log, sort the entries and update the graph in the body of the display log subscription ", async () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null])
    component.logBeingObserved = new NutritionLog();
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe').and.callThrough();
    component.subCreator.NUTR_LOG_IDX = 0;
    component.subCreator.ENERGY_PAYLOAD_IDX = 1;
    const sortDispSpy = spyOn(component, 'sortDisplayEntriesChronologically');
    const updateSpy = spyOn(component, 'updateGraph')
    let timeoutRef = setTimeout;
    let lamRef;
    (window as any).setTimeout = (lam, time) => lamRef = lam;
    component.displayLogSubscription();
    const subBodyFunc = (subscribeSpy.calls.argsFor(0))[0];
    const expectedLog: NutritionLog = new NutritionLog();
    const expectedPayload: EnergyPayload = new EnergyPayload();
    subBodyFunc([expectedLog, expectedPayload]);
    expect(sortDispSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    const logIsExpected: boolean = (component.logBeingObserved === expectedLog);
    const payloadIsExpected: boolean = (component.payload === expectedPayload);
    expect(logIsExpected).toBe(true);
    expect(payloadIsExpected).toBe(true);
    lamRef();
    expect(component.graphIsBeingUpdated).toBe(false);
    (window as any).setTimeout = timeoutRef;
  });

  it("should set the current log, sort the entries and NOT update the graph in the body of the display log subscription if the graph is being updated", async () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null])
    component.logBeingObserved = new NutritionLog();
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe').and.callThrough();
    component.subCreator.NUTR_LOG_IDX = 0;
    component.subCreator.ENERGY_PAYLOAD_IDX = 1;
    const sortDispSpy = spyOn(component, 'sortDisplayEntriesChronologically');
    const updateSpy = spyOn(component, 'updateGraph')
    component.displayLogSubscription();
    component.graphIsBeingUpdated = true;
    const subBodyFunc = (subscribeSpy.calls.argsFor(0))[0];
    const expectedLog: NutritionLog = new NutritionLog();
    const expectedPayload: EnergyPayload = new EnergyPayload();
    subBodyFunc([expectedLog, expectedPayload]);
    expect(sortDispSpy).toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
    const logIsExpected: boolean = (component.logBeingObserved === expectedLog);
    const payloadIsExpected: boolean = (component.payload === expectedPayload);
    expect(logIsExpected).toBe(true);
    expect(payloadIsExpected).toBe(true);
  });


  it("should set the current log, sort the entries and NOT update the graph in the body of the display log subscription if the graph is being updated (last entry ref set)", async () => {
    component.lastEntryListRef = JSON.stringify(testHelpers.getRandomEntryList())
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null])
    component.logBeingObserved = new NutritionLog();
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe').and.callThrough();
    component.subCreator.NUTR_LOG_IDX = 0;
    component.subCreator.ENERGY_PAYLOAD_IDX = 1;
    const sortDispSpy = spyOn(component, 'sortDisplayEntriesChronologically');
    const updateSpy = spyOn(component, 'updateGraph')
    component.displayLogSubscription();
    component.graphIsBeingUpdated = true;
    const subBodyFunc = (subscribeSpy.calls.argsFor(0))[0];
    const expectedLog: NutritionLog = new NutritionLog();
    const expectedPayload: EnergyPayload = new EnergyPayload();
    subBodyFunc([expectedLog, expectedPayload]);
    expect(sortDispSpy).toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
    const logIsExpected: boolean = (component.logBeingObserved === expectedLog);
    const payloadIsExpected: boolean = (component.payload === expectedPayload);
    expect(logIsExpected).toBe(true);
    expect(payloadIsExpected).toBe(true);
  });

});

function setup() {
  const time = autoSpy(TimeService);
  const subCreator = autoSpy(LogSubscriptionCreatorService);
  const stateManager = autoSpy(StateManagerService);
  const preferenceManager = autoSpy(PreferenceService);
  const conversionManager = autoSpy(ConversionService);
  const payloadManager = autoSpy(PayloadService);
  const tierPermissionService = autoSpy(TierPermissionsService);
  const constants = autoSpy(NutritionConstanstsService);
  const generalConstants = autoSpy(ConstantsService);
  const builder = {
    time,
    subCreator,
    stateManager,
    preferenceManager,
    conversionManager,
    payloadManager,
    tierPermissionService,
    constants,
    generalConstants,
    default() {
      return builder;
    },
    build() {
      return new GraphWidgetComponent(time, subCreator, stateManager, preferenceManager, conversionManager, payloadManager, tierPermissionService, constants, generalConstants);
    }
  };

  return builder;
}