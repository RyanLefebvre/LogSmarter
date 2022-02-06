import { PreferenceService } from 'src/app/services/general/preference.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { PayloadAnalyzerComponent } from './payload-analyzer.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { UserProfile } from 'functions/src/classes/user-profile';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { DayEntry } from 'functions/src/classes/day-entry';

describe('PayloadAnalyzerComponent', () => {

  let component: PayloadAnalyzerComponent;
  let testHelpers: TestHelpers = new TestHelpers();

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should close the dialog when closeDialog() is called ', () => {
    component.closeDialog();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should return the current users preferred theme when getPreferredTheme() is called", () => {
    const fakeUser = new UserProfile();
    component.preference = new PreferenceService({} as any);
    fakeUser.userPreferences = (component.preference).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => fakeUser;
    expect(component.getPreferredTheme()).toBe(fakeUser.userPreferences[component.preference.GENERAL_PREFS][component.preference.THEME_COLOR])
  });

  it("should return the current users preferred numberSystem when  currentNumberSystemIsImperial() is called", () => {
    const fakeUser = new UserProfile();
    component.preference = new PreferenceService({} as any);
    fakeUser.userPreferences = (component.preference).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => fakeUser;
    expect(component.currentNumberSystemIsImperial()).toBe(fakeUser.userPreferences[component.preference.GENERAL_PREFS][component.preference.NUMBER_SYSTEM])
  });

  it("should call parseLogAndPayload() when ngOnInt() is called ", () => {
    component.parseLogAndPayload = jasmine.createSpy();
    component.ngOnInit();
    expect(component.parseLogAndPayload).toHaveBeenCalled();
  });

  it("should reutrn the inverse of the user's tiers showInDepth value when showUpgradeDisplay() is called (1)", () => {
    component.tierPermissions.IN_DEPTH_STATS_KEY = "inDepthStats";
    const inverseExpectedValue: any = true;
    component.tierPermissions.getUserTier = () => {
      return {
        [component.tierPermissions.IN_DEPTH_STATS_KEY]: inverseExpectedValue
      }
    }
    expect(component.showUpgradeDisplay()).toBe(!inverseExpectedValue)
  });

  it("should reutrn the inverse of the user's tiers showInDepth value when showUpgradeDisplay() is called (2)", () => {
    component.tierPermissions.IN_DEPTH_STATS_KEY = "inDepthStats";
    const inverseExpectedValue: any = false;
    component.tierPermissions.getUserTier = () => {
      return {
        [component.tierPermissions.IN_DEPTH_STATS_KEY]: inverseExpectedValue
      }
    }
    expect(component.showUpgradeDisplay()).toBe(!inverseExpectedValue)
  });

  it("should catch any errors and close the dialog when parseLogAndPayload() is called ", async () => {
    component.payloadService.getEnergyPayLoad = jasmine.createSpy().and.throwError("someError");
    component.sortEntriesChronologically = jasmine.createSpy();
    component.processPayload = jasmine.createSpy();
    await component.parseLogAndPayload();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it("should turn on the spinner, get a new payload if one is NOT passed in, sort the entries chronologically, parse the payload "
    + " and turn off the spinner if parseLogAndPayload() is called ", async () => {
      component.data.log = testHelpers.getRandomNutritionLog();
      const expectedPayload = "fakePayload" as any;
      component.payloadService.getEnergyPayLoad = jasmine.createSpy().and.callFake(() => expectedPayload);
      component.sortEntriesChronologically = jasmine.createSpy();
      component.processPayload = jasmine.createSpy();
      expect(component.data.payload).toBeFalsy();
      await component.parseLogAndPayload();
      expect(component.showSpinner).toBe(true);
      expect(component.payloadService.getEnergyPayLoad).toHaveBeenCalledWith(component.data.log);
      expect(component.sortEntriesChronologically).toHaveBeenCalled();
      expect(component.processPayload).toHaveBeenCalledWith(expectedPayload);
      jasmine.clock().tick((new ConstantsService()).SPINNER_TIMEOUT + 1);
      expect(component.showSpinner).toBe(false)
    });

  it("should NOT get a new payload if one is passed in, sort the entries chronologically and parse the payload if parseLogAndPayload() is called ", async () => {
    component.data.log = testHelpers.getRandomNutritionLog();
    const expectedPayload = "fakePayload" as any;
    component.data.payload = expectedPayload;
    component.payloadService.getEnergyPayLoad = jasmine.createSpy();
    component.sortEntriesChronologically = jasmine.createSpy();
    component.processPayload = jasmine.createSpy();
    expect(component.data.payload).toBeDefined();
    await component.parseLogAndPayload();
    expect(component.showSpinner).toBe(false);
    expect(component.processPayload).toHaveBeenCalledWith(expectedPayload);
    expect(component.sortEntriesChronologically).toHaveBeenCalled();
    expect(component.payloadService.getEnergyPayLoad).not.toHaveBeenCalled();
  });

  it("should init the Kcal chart and set showCalories to true if the payload has calorie feedback when processPayload() is called ", () => {
    const expectedFeedbackList = "someFakeFeedbackList" as any;
    const fakePayload = {
      analysis: [
        {
          category: component.CALORIES,
          feedbackList: expectedFeedbackList
        }
      ]
    } as any;
    component.initKcalChart = jasmine.createSpy();
    component.processPayload(fakePayload);
    expect(component.calorieFeedbackList).toBe(expectedFeedbackList);
    expect(component.initKcalChart).toHaveBeenCalled();
    expect(component.showCalories).toBe(true);
  });

  it("should NOT init the Kcal chart and NOT set showCalories to true if the payload has NO calorie feedback when processPayload() is called ", () => {
    const fakePayload = {
      analysis: [
        //no calorie feedback 
      ]
    } as any;
    component.initKcalChart = jasmine.createSpy();
    component.processPayload(fakePayload);
    expect(component.calorieFeedbackList).toEqual([]);
    expect(component.initKcalChart).not.toHaveBeenCalled();
    expect(component.showCalories).toBe(false);
  });

  //

  it("should init the weight chart and set showWeight to true if the payload has weight feedback when processPayload() is called ", () => {
    const expectedFeedbackList = "someFakeFeedbackList" as any;
    const fakePayload = {
      analysis: [
        {
          category: component.WEIGHT,
          feedbackList: expectedFeedbackList
        }
      ]
    } as any;
    component.initWeightChart = jasmine.createSpy();
    component.processPayload(fakePayload);
    expect(component.weightFeedbackList).toBe(expectedFeedbackList);
    expect(component.initWeightChart).toHaveBeenCalled();
    expect(component.showWeight).toBe(true);
  });

  it("should NOT init the weight chart and NOT set showWeight to true if the payload has NO weight feedback when processPayload() is called ", () => {
    const fakePayload = {
      analysis: [
        //no weight feedback 
      ]
    } as any;
    component.initWeightChart = jasmine.createSpy();
    component.processPayload(fakePayload);
    expect(component.weightFeedbackList).toEqual([]);
    expect(component.initWeightChart).not.toHaveBeenCalled();
    expect(component.showWeight).toBe(false);
  });

  //

  it("should set showGeneral to true and assign the generalFeedbackList if there is general feedback when processPayload() is called ", () => {
    const expectedFeedbackList = "someFakeFeedbackList" as any;
    const fakePayload = {
      analysis: [
        {
          category: component.GENERAL,
          feedbackList: expectedFeedbackList
        }
      ]
    } as any;
    component.processPayload(fakePayload);
    expect(component.generalFeedbackList).toBe(expectedFeedbackList);
    expect(component.showGeneral).toBe(true);
  });

  it("should NOT set showGeneral to true and NOT assign the generalFeedbackList if there is NO general feedback when processPayload() is called ", () => {
    const fakePayload = {
      analysis: [
        // no general feedback 
      ]
    } as any;
    component.processPayload(fakePayload);
    expect(component.generalFeedbackList).toEqual([]);
    expect(component.showGeneral).toBe(false);
  });

  it("should NOT show any feedback if processPayload() is called and it is an unknown category", () => {
    const fakePayload = {
      analysis: [
        {
          category: "unknown"
        }
      ]
    } as any;
    component.processPayload(fakePayload);
    expect(component.showWeight).toBe(false);
    expect(component.showCalories).toBe(false);
    expect(component.showGeneral).toBe(false);
  });


  it("Should sort the listOfCurrentEntries in chronological order when sortDisplayEntriesChronologically() is called  ", () => {
    component.log = new NutritionLog();
    component.log.dayEntries = [];
    for (let i = 0; i < 100; i++) {
      const newEntry: DayEntry = new DayEntry();
      newEntry.date = testHelpers.getRandomDate();
      component.log.dayEntries.push(newEntry);
    }
    component.sortEntriesChronologically();
    let sortedChronologically: boolean = true;
    for (let idxOfEntrty1 = 0; idxOfEntrty1 < component.log.dayEntries.length; idxOfEntrty1++) {
      for (let idxOfEntrty2 = 0; idxOfEntrty2 < component.log.dayEntries.length; idxOfEntrty2++) {
        if (idxOfEntrty1 > idxOfEntrty2) {
          const entry1Time: number = component.log.dayEntries[idxOfEntrty1].date.getTime();
          const entry2Time: number = component.log.dayEntries[idxOfEntrty2].date.getTime();
          if (entry1Time < entry2Time) {
            sortedChronologically = false;
          }
        }
      }
    }
    expect(sortedChronologically).toBe(true);
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    const dummyData = []
    const dummyPayload = new EnergyPayload();
    component.log = new NutritionLog();
    component.log.dayEntries = testHelpers.getRandomEntryListOfLength(100).map(entry => {
      entry.creationEstimatedTDEE = testHelpers.getRandomCalories();
      entry.goalIntakeBoundaries = [Math.random(), Math.random()];
      component.calorieChartLabels.push(entry.date.toLocaleDateString())
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: false } };
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants.GOAL_FAT_LOSS = "fatLoss";
    component.log.goal = component.nutrConstants.GOAL_FAT_LOSS;
    component.calorieChartLabels = [{}, {}, {}];
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

  it("should set goal min value to tdee if goal is not known and plotTDEE() is called", () => {
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants = new NutritionConstanstsService();
    component.log.goal = null;
    component.calorieChartLabels = [{}, {}, {}];
    const expectedValue = component.payload.estimatedTDEE;
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants.GOAL_MAINTAIN = "maintain";
    component.log.goal = component.nutrConstants.GOAL_MAINTAIN;
    component.calorieChartLabels = [{}, {}, {}];
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants.GOAL_MUSCLE_GAIN = "gainMuscle";
    component.log.goal = component.nutrConstants.GOAL_MUSCLE_GAIN;
    component.calorieChartLabels = [{}, {}, {}];
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants.GOAL_FAT_LOSS = "fatLoss";
    component.log.goal = component.nutrConstants.GOAL_FAT_LOSS;
    component.calorieChartLabels = [{}, {}, {}];
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants.GOAL_MUSCLE_GAIN = "fatLoss";
    component.log.goal = component.nutrConstants.GOAL_MUSCLE_GAIN;
    component.calorieChartLabels = [{}, {}, {}];
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.calorieChartLabels = [{}, {}, {}];
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
    component.tierPermissions.getUserTier = () => { return { inDepthStats: true } };
    component.payload = new EnergyPayload();
    component.payload.estimatedTDEE = 3000;
    component.payload.goalIntakeBoundaries = [250, 300];
    component.log = new NutritionLog();
    component.nutrConstants.GOAL_MUSCLE_GAIN = "fatLoss";
    component.log.goal = component.nutrConstants.GOAL_MUSCLE_GAIN;
    component.calorieChartLabels = [{}, {}, {}];
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

  it("should map the calorie chart data to the entries calories and dates data when initKcalChart() is called ", () => {
    component.log = testHelpers.getRandomNutritionLog();
    component.log.dayEntries = testHelpers.getRandomEntryListOfLength(100);
    component.payload = { estimatedTDEE: null } as any;
    component.initKcalChart();
    expect(component.calorieChartLabels).toEqual(
      component.log.dayEntries.map(entry => { return entry.date.toLocaleDateString() })
    );
    expect(component.calorieChartData[0].data).toEqual(
      component.log.dayEntries.map(entry => { return entry.calories })
    );
  });

  it("should call plotTDEE() when initKcalChart() is called if the payload has a TDEE ", () => {
    component.log = testHelpers.getRandomNutritionLog();
    component.log.dayEntries = testHelpers.getRandomEntryListOfLength(100);
    component.payload = { estimatedTDEE: 369 } as any;
    component.plotTDEE = jasmine.createSpy().and.callFake((someParam) => someParam);
    component.initKcalChart();
    expect(component.plotTDEE).toHaveBeenCalledWith(component.calorieChartData);
  });


  it("should set the chartlabels equal to the payloads start date at idx 0 and the next day at idx 1 if there is 1 or less entries ", () => {
    component.log = testHelpers.getRandomNutritionLog();
    component.log.dayEntries = testHelpers.getRandomEntryListOfLength(1);
    component.payload = {
      startDate: testHelpers.getRandomDate().getTime(),
      estimatedTDEE: 369
    } as any;
    component.plotTDEE = jasmine.createSpy();
    component.time = new TimeService();
    component.initKcalChart();
    expect(component.calorieChartLabels[0]).toBe(
      (new Date(component.payload.startDate)).toLocaleDateString()
    );
    expect(component.calorieChartLabels[1]).toBe(
      component.time.getOneDayLater(new Date(component.payload.startDate)).toLocaleDateString()
    );
  });

  it("should call convertLbsToKg() is user's number system is metric and initWeightChart() is called ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.log = testHelpers.getRandomNutritionLog()
    component.log.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {} as any;
    component.currentNumberSystemIsImperial = () => false;
    component.getPreferredTheme = () => "fakeTheme";
    component.weightChartLabels = [{}];
    component.initWeightChart();
    expect(component.conversionManager.convertLbsToKg).toHaveBeenCalled();
  });

  it("should NOT call convertLbsToKg() is user's number system is imperial and initWeightChart() is called ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.log = testHelpers.getRandomNutritionLog()
    component.log.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {} as any;
    component.currentNumberSystemIsImperial = () => true;
    component.getPreferredTheme = () => "fakeTheme";
    component.weightChartLabels = [{}];
    component.initWeightChart();
    expect(component.conversionManager.convertLbsToKg).not.toHaveBeenCalled();
  });

  it("should create a chart data object of length 2 when initWeightChart() is called (one real, one linear )  ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.log = testHelpers.getRandomNutritionLog()
    component.log.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {} as any;
    component.currentNumberSystemIsImperial = () => true;
    component.getPreferredTheme = () => "fakeTheme";
    component.weightChartLabels = [{}];
    component.initWeightChart();
    expect(component.weightChartData.length).toBe(2);
  });

  it("should map the logs day entries dates to a string to set the weightChartLabels when initWeightChart() is called  ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.log = testHelpers.getRandomNutritionLog()
    component.log.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {} as any;
    component.currentNumberSystemIsImperial = () => true;
    component.getPreferredTheme = () => "fakeTheme";
    component.weightChartLabels = [{}];
    component.initWeightChart();
    expect(component.weightChartLabels).toEqual(
      component.log.dayEntries.map(entry => { return entry.date.toLocaleDateString(); })
    );
  });

  it("should map the logs day entries weights to the first datasets data property when initWeightChart() is called  ", () => {
    const payLoad = new EnergyPayload();
    payLoad.startWeight = 187;
    payLoad.currentWeight = 181;
    component.log = testHelpers.getRandomNutritionLog()
    component.log.dayEntries.push(new DayEntry());
    component.payload = payLoad;
    component.chartOptions = {} as any;
    component.currentNumberSystemIsImperial = () => true;
    component.getPreferredTheme = () => "fakeTheme";
    component.weightChartLabels = [{}];
    component.initWeightChart();
    expect(component.weightChartData[0].data).toEqual(
      component.log.dayEntries.map(entry => { return entry.weight; })
    );
  });

});

function setup() {
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const preference = autoSpy(PreferenceService);
  const tierPermissions = autoSpy(TierPermissionsService);
  const stateManager = autoSpy(StateManagerService);
  const conversionManager = autoSpy(ConversionService);
  const payloadService = autoSpy(PayloadService);
  const time = autoSpy(TimeService);
  const constants = autoSpy(ConstantsService);
  const nutrConstants = autoSpy(NutritionConstanstsService);
  const builder = {
    dialogRef,
    data,
    preference,
    tierPermissions,
    stateManager,
    conversionManager,
    payloadService,
    time,
    constants,
    nutrConstants,
    default() {
      return builder;
    },
    build() {
      return new PayloadAnalyzerComponent(dialogRef, data, preference, tierPermissions, stateManager, conversionManager, payloadService, time, constants, nutrConstants);
    }
  };

  return builder;
}
