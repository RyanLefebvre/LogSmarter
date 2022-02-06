import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { MatDialog } from '@angular/material';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { ListViewComponent } from './list-view.component';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { UserProfile } from 'functions/src/classes/user-profile';
import { TimePeriod } from 'src/app/model-classes/nutrition-log/time-period';
import { DayEntry } from 'functions/src/classes/day-entry';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';

describe('ListViewComponent', () => {

  let component: ListViewComponent;
  let testHelpers = new TestHelpers();

  /**
   * This function needs to be mocked before each test so this variable 
   * stores a reference to the original function before we mock it so 
   * that we can still test it.
   */
  let getListViewControlsSpy: jasmine.Spy<() => FormGroup> = null;


  beforeEach(() => {
    getListViewControlsSpy = spyOn(ListViewComponent.prototype, 'getListViewControlsForm');
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should call logBeingObservedSubscription() when ngOnInit() is called', () => {
    const subscriptionLogicSpy = spyOn(component, "logBeingObservedSubscription");
    component.ngOnInit();
    expect(subscriptionLogicSpy).toHaveBeenCalled();
  });

  it('should kill the logBeingObservedSubscription if the reference is not null and ngOnDestroy() is called', () => {
    component.displaySubRef = (new BehaviorSubject<any>(null)).subscribe();
    const unsubSpy = spyOn(component.displaySubRef, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('should NOT kill the logBeingObservedSubscription if the reference is null and ngOnDestroy() is called', () => {
    component.displaySubRef = null;
    component.ngOnDestroy();
    expect(component.displaySubRef).toBe(null);
  });

  it('should set the displayLogSubRef when logBeingObservedSubscription() is called', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null]);
    spyOn(component.displayLogObservable, 'subscribe').and.callFake(() => new Subscription());
    component.logBeingObservedSubscription();
    const subscriptionRefIsNotNull = component.displaySubRef != null;
    expect(subscriptionRefIsNotNull).toBe(true);
  });

  it('should set the observedLog in the body of the display log observable subscription', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null]);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe').and.callFake(() => new Subscription());
    component.updateListView = () => null;
    component.logBeingObservedSubscription();
    const subscriptionBody: Function = subscribeSpy.calls.argsFor(0)[0];
    component.subCreator.NUTR_LOG_IDX = 0;
    component.subCreator.ENERGY_PAYLOAD_IDX = 1;
    const expectedNutrLog: NutritionLog = new NutritionLog();
    const expectedPayload: EnergyPayload = new EnergyPayload();
    subscriptionBody([expectedNutrLog, expectedPayload]);
    const observedLogIsExpected = (component.observedLog === expectedNutrLog);
    expect(observedLogIsExpected).toBe(true);
  });

  it('should call updateListView in the body of the display log observable subscription if observedLog is not null', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>([null, null]);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe').and.callFake(() => new Subscription());
    component.logBeingObservedSubscription();
    const subscriptionBody: Function = subscribeSpy.calls.argsFor(0)[0];
    component.subCreator.NUTR_LOG_IDX = 0;
    component.subCreator.ENERGY_PAYLOAD_IDX = 1;
    component.observedLog = new NutritionLog();
    const expectedNutrLog: NutritionLog = new NutritionLog();
    const expectedPayload: EnergyPayload = new EnergyPayload();
    const updateListViewSpy = spyOn(component, 'updateListView');
    subscriptionBody([expectedNutrLog, expectedPayload]);
    expect(updateListViewSpy).toHaveBeenCalled();
  });

  it("should open an entryModifyDialog when openFinishlogDialog() is called ", () => {
    component.observedLogPayload = {
      latestDate: (new Date()).getTime()
    } as any;
    component.openFinishLogDialog();
    expect(component.dialogCreator.openNutritionEntryModifyDialog).toHaveBeenCalled();
  });

  it('should turn the spinner on and then off after the spinner delay when updateListView() is called', () => {
    spyOn(component, 'splitAndOrderEntries');
    component.splitAndOrderEntries = jasmine.createSpy();
    component.updateListView();
    jasmine.clock().tick(351);
    expect(component.showSpinner).toBe(false);
  });

  it('should call splitAndOrderEntries() when updateListView() is called', () => {
    const splitOrderSpy = spyOn(component, 'splitAndOrderEntries');
    component.updateListView();
    jasmine.clock().tick(351);
    expect(splitOrderSpy).toHaveBeenCalled();
  });

  it('should set the sort and order form controls to the current users preferred sort and order mode when getListViewFormControls() is called', () => {
    const expectedSortMode = "fakeSortMode";
    const expectedOrderMode = "fakeOrderMode";
    const sortModeKey = "SORTMODE";
    const orderModeKey = "ORDERMODE";
    component.stateManager.getCurrentUser = () => {
      component.SORT_MODE = sortModeKey;
      component.ORDER_MODE = orderModeKey;
      const newCurrentUser = new UserProfile();
      newCurrentUser.userPreferences = {
        nutrition: {
          sortMode: expectedSortMode,
          orderMode: expectedOrderMode
        }
      }
      return newCurrentUser;
    }
    getListViewControlsSpy.and.callThrough();
    component.fb.group = (params: FormGroup) => params;
    const formDefinition = component.getListViewControlsForm();
    const sortModeIsCorrect = (formDefinition[sortModeKey][0] === expectedSortMode);
    const orderModeIsCorrect = (formDefinition[orderModeKey][0] === expectedOrderMode);
    expect(sortModeIsCorrect).toBe(true);
    expect(orderModeIsCorrect).toBe(true);
  });

  it('should return the value of the sort mode control when getCurrentSortMode() is called', () => {
    const expectedSortMode = "fakeSortMode";
    const expectedOrderMode = "fakeOrderMode";
    const sortModeKey = "SORTMODE";
    const orderModeKey = "ORDERMODE";
    component.SORT_MODE = sortModeKey;
    component.ORDER_MODE = orderModeKey;
    component.listViewForm = new FormGroup({});
    component.listViewForm.controls = {
      [sortModeKey]: { value: expectedSortMode },
      [orderModeKey]: { value: expectedOrderMode }
    } as any;
    const sortModeIsExpected = (component.getCurrentSortMode() === expectedSortMode);
    expect(sortModeIsExpected).toBe(true);
  });

  it('should return the value of the order mode control when getCurrentOrderMode() is called', () => {
    const expectedSortMode = "fakeSortMode";
    const expectedOrderMode = "fakeOrderMode";
    const sortModeKey = "SORTMODE";
    const orderModeKey = "ORDERMODE";
    component.SORT_MODE = sortModeKey;
    component.ORDER_MODE = orderModeKey;
    component.listViewForm = new FormGroup({});
    component.listViewForm.controls = {
      [sortModeKey]: { value: expectedSortMode },
      [orderModeKey]: { value: expectedOrderMode }
    } as any;
    const orderModeIsExpected = (component.getCurrentOrderMode() === expectedOrderMode);
    expect(orderModeIsExpected).toBe(true);
  });

  it("should split the time periods by sort mode, assign them to the time period list and then order appropriately when splitAndOrderEntries() is called", () => {
    const orderAppropriatelySpy = spyOn(component, 'orderAppropriately');
    const expectedSplitBySortModeReturnValue = [new TimePeriod()];
    spyOn(component, 'splitEntriesBySortMode').and.callFake(() => expectedSplitBySortModeReturnValue);
    component.observedLog = new NutritionLog();
    component.splitAndOrderEntries();
    const listOfTimePeriodsIsExpected = (component.listOfTimePeriods === expectedSplitBySortModeReturnValue);
    expect(listOfTimePeriodsIsExpected).toBe(true);
    expect(orderAppropriatelySpy).toHaveBeenCalled();
  });

  it('should return true if getCurrentSortMode() is day and sortByDay() is called', () => {
    component.prefs.SORT_MODE_DAY = "someFakeValue";
    component.prefs.SORT_MODE_WEEK = "someOtherFakeValue";
    spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_DAY);
    const sortByDay = component.sortByDay();
    expect(sortByDay).toBe(true);
  });

  it('should return false if getCurrentSortMode() isweek and sortByDay() is called', () => {
    component.prefs.SORT_MODE_DAY = "someFakeValue";
    component.prefs.SORT_MODE_WEEK = "someOtherFakeValue";
    spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_WEEK);
    const sortByDay = component.sortByDay();
    expect(sortByDay).toBe(false);
  });

  it('should open a new entry modify dialog when openAutoPromptDial() is called ', () => {
    spyOn(component, 'getAutoPromptDate');
    component.openAutoPromptDialog();
    expect(component.dialogCreator.openNutritionEntryModifyDialog).toHaveBeenCalled();
  });

  it("should call fbNutr.getAutoPromptDate() when getAutoPromptDate() is called ", () => {
    component.observedLog = new NutritionLog();
    component.observedLogPayload = new EnergyPayload();
    component.getAutoPromptDate();
    expect(component.fbNutr.getAutoPromptDate).toHaveBeenCalledWith(component.observedLog, component.observedLogPayload);
  });

  it('should just push 1 object onto a list of time periods and return it if splitForSortByDay() is called ', () => {
    const listOfEntries = [new DayEntry()];
    const timePeriodsSortedByDay = component.splitForSortByDay(listOfEntries);
    const expectedLength = 1;
    const actualLength = timePeriodsSortedByDay.length;
    const actualIsExpected = (actualLength === expectedLength);
    expect(actualIsExpected).toBe(true);
  });

  it("should call splitForSortByDay() if sorting by day and splitEntriesBySortMode() is called ", () => {
    spyOn(component, 'sortByDay').and.callFake(() => true);
    const expectedReturnValueForSortByDay = [new TimePeriod(), new TimePeriod(), new TimePeriod()];
    const splitSpy = spyOn(component, 'splitForSortByDay').and.callFake(() => {
      return expectedReturnValueForSortByDay;
    });
    const actualReturnValue = component.splitEntriesBySortMode([new DayEntry()]);
    expect(splitSpy).toHaveBeenCalled();
    const actualIsExpected = (actualReturnValue === expectedReturnValueForSortByDay);
    expect(actualIsExpected).toBe(true);
  });

  it("should call splitForSortByDay() if listOfEntries is empty and splitEntriesBySortMode() is called ", () => {
    spyOn(component, 'sortByDay').and.callFake(() => false);
    const expectedReturnValueForSortByDay = [new TimePeriod(), new TimePeriod(), new TimePeriod()];
    const splitSpy = spyOn(component, 'splitForSortByDay').and.callFake(() => {
      return expectedReturnValueForSortByDay;
    });
    const actualReturnValue = component.splitEntriesBySortMode([]);
    expect(splitSpy).toHaveBeenCalled();
    const actualIsExpected = (actualReturnValue === expectedReturnValueForSortByDay);
    expect(actualIsExpected).toBe(true);
  });

  it("should call splitEntriesWhenNotSortingByDay() if sortByDay() is false, listOfEntries is not empty and splitEntriesBySortMode() is called ", () => {
    const expectedSortMode = "fakeSortMode";
    const expectedOrderMode = "fakeOrderMode";
    const sortModeKey = "SORTMODE";
    const orderModeKey = "ORDERMODE";
    component.SORT_MODE = sortModeKey;
    component.ORDER_MODE = orderModeKey;
    component.listViewForm = new FormGroup({});
    component.listViewForm.controls = {
      [sortModeKey]: { value: expectedSortMode },
      [orderModeKey]: { value: expectedOrderMode }
    } as any;
    spyOn(component, 'sortByDay').and.callFake(() => false);
    const expectedReturnValueForNotSortingByDay = [new TimePeriod(), new TimePeriod(), new TimePeriod()];
    const splitSpy = spyOn(component, 'splitEntriesWhenNotSortingByDay').and.callFake(() => {
      return expectedReturnValueForNotSortingByDay;
    });
    const actualReturnValue = component.splitEntriesBySortMode([new DayEntry()]);
    expect(splitSpy).toHaveBeenCalled();
    const actualIsExpected = (actualReturnValue === expectedReturnValueForNotSortingByDay);
    expect(actualIsExpected).toBe(true);
  });

  it("should call getWeekInMillis() to set time period length if sortByDay() is false, listOfEntries is not empty and splitEntriesBySortMode() is called and sort mode is week", () => {
    const expectedSortMode = "fakeSortMode";
    const expectedOrderMode = "fakeOrderMode";
    const sortModeKey = "SORTMODE";
    const orderModeKey = "ORDERMODE";
    component.SORT_MODE = sortModeKey;
    component.ORDER_MODE = orderModeKey;
    component.prefs.SORT_MODE_WEEK = expectedSortMode;
    component.listViewForm = new FormGroup({});
    component.listViewForm.controls = {
      [sortModeKey]: { value: expectedSortMode },
      [orderModeKey]: { value: expectedOrderMode }
    } as any;
    spyOn(component, 'sortByDay').and.callFake(() => false);
    spyOn(component, 'splitEntriesWhenNotSortingByDay');
    component.splitEntriesBySortMode(testHelpers.getRandomEntryList());
    expect(component.timeService.getWeekInMillis).toHaveBeenCalled();
  });

  it('should sort the one time periods entry list such that later entries come first if sort' +
    'mode is day and order mode is descending and orderAppropriately() is called', () => {
      component.prefs.SORT_MODE_DAY = "sortModeDay";
      component.prefs.SORT_MODE_WEEK = "sortModeWeek";
      component.prefs.ORDER_MODE_ASC = "ascending";
      component.prefs.ORDER_MODE_DESC = "descending";
      spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_DAY);
      spyOn(component, 'getCurrentOrderMode').and.callFake(() => component.prefs.ORDER_MODE_DESC);
      const dummyTimePeriod = new TimePeriod();
      dummyTimePeriod.listOfEntries = testHelpers.getRandomEntryList();
      component.listOfTimePeriods = [dummyTimePeriod];
      component.orderAppropriately();
      let entriesAreInCorrectOrder = true;
      for (let entry1 = 0; entry1 < component.listOfTimePeriods[0].listOfEntries.length; entry1++) {
        for (let entry2 = 0; entry2 < component.listOfTimePeriods[0].listOfEntries.length; entry2++) {
          const oneComesBeforeTwo = entry1 < entry2;
          if (oneComesBeforeTwo) {
            const entryOneDate = component.listOfTimePeriods[0].listOfEntries[entry1].date;
            const entryTwoDate = component.listOfTimePeriods[0].listOfEntries[entry2].date;
            const entryTwoIsNewerThanOne = entryTwoDate.getTime() > entryOneDate.getTime();
            if (entryTwoIsNewerThanOne) {
              entriesAreInCorrectOrder = false;
            }
          }
        }
      }
      expect(entriesAreInCorrectOrder).toBe(true);
    });

  it("should not do anything in the displayLogObservable if the logAndPayload() are null ", () => {
    let lamRef;
    component.displayLogObservable = {
      subscribe: (lambda) => {
        lamRef = lambda;
      }
    } as any;
    component.logBeingObservedSubscription();
    component.subCreator.NUTR_LOG_IDX = 0;
    component.subCreator.ENERGY_PAYLOAD_IDX = 1;
    let crashed = false;
    try {
      lamRef(null);
      lamRef([null, null]);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false)

  });

  it('should sort the one time periods entry list such that earlier entries come first if sort' +
    'mode is day and order mode is ascending and orderAppropriately() is called', () => {
      component.prefs.SORT_MODE_DAY = "sortModeDay";
      component.prefs.SORT_MODE_WEEK = "sortModeWeek";
      component.prefs.ORDER_MODE_ASC = "ascending";
      component.prefs.ORDER_MODE_DESC = "descending";
      spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_DAY);
      spyOn(component, 'getCurrentOrderMode').and.callFake(() => component.prefs.ORDER_MODE_ASC);
      const dummyTimePeriod = new TimePeriod();
      dummyTimePeriod.listOfEntries = testHelpers.getRandomEntryList();
      component.listOfTimePeriods = [dummyTimePeriod];
      component.orderAppropriately();
      let entriesAreInCorrectOrder = true;
      for (let entry1 = 0; entry1 < component.listOfTimePeriods[0].listOfEntries.length; entry1++) {
        for (let entry2 = 0; entry2 < component.listOfTimePeriods[0].listOfEntries.length; entry2++) {
          const oneComesBeforeTwo = entry1 < entry2;
          if (oneComesBeforeTwo) {
            const entryOneDate = component.listOfTimePeriods[0].listOfEntries[entry1].date;
            const entryTwoDate = component.listOfTimePeriods[0].listOfEntries[entry2].date;
            const entryTwoIsEarlierThanOne = entryTwoDate.getTime() < entryOneDate.getTime();
            if (entryTwoIsEarlierThanOne) {
              entriesAreInCorrectOrder = false;
            }
          }
        }
      }
      expect(entriesAreInCorrectOrder).toBe(true);
    });


  it('should NOT sort the one time periods entry list if there is no order mode specified in sort by day ', () => {
    component.prefs.SORT_MODE_DAY = "sortModeDay";
    component.prefs.SORT_MODE_WEEK = "sortModeWeek";
    component.prefs.ORDER_MODE_ASC = "ascending";
    component.prefs.ORDER_MODE_DESC = "descending";
    spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_DAY);
    spyOn(component, 'getCurrentOrderMode').and.callFake(() => null);
    const dummyTimePeriod = new TimePeriod();
    dummyTimePeriod.listOfEntries = testHelpers.getRandomEntryList();
    component.listOfTimePeriods = [dummyTimePeriod];
    component.orderAppropriately();
    let entriesAreInCorrectOrder = true;
    for (let entry1 = 0; entry1 < component.listOfTimePeriods[0].listOfEntries.length; entry1++) {
      for (let entry2 = 0; entry2 < component.listOfTimePeriods[0].listOfEntries.length; entry2++) {
        const oneComesBeforeTwo = entry1 < entry2;
        if (oneComesBeforeTwo) {
          const entryOneDate = component.listOfTimePeriods[0].listOfEntries[entry1].date;
          const entryTwoDate = component.listOfTimePeriods[0].listOfEntries[entry2].date;
          const entryTwoIsEarlierThanOne = entryTwoDate.getTime() < entryOneDate.getTime();
          if (entryTwoIsEarlierThanOne) {
            entriesAreInCorrectOrder = false;
          }
        }
      }
    }
    expect(entriesAreInCorrectOrder).toBe(false);
  });

  it('should NOT sort the one time periods entry list if there is no order mode specified in sort by some other way than day ', () => {
    component.prefs.SORT_MODE_DAY = "sortModeDay";
    component.prefs.SORT_MODE_WEEK = "sortModeWeek";
    component.prefs.ORDER_MODE_ASC = "ascending";
    component.prefs.ORDER_MODE_DESC = "descending";
    spyOn(component, 'getCurrentSortMode').and.callFake(() => null);
    spyOn(component, 'getCurrentOrderMode').and.callFake(() => null);
    const dummyTimePeriod = new TimePeriod();
    dummyTimePeriod.listOfEntries = testHelpers.getRandomEntryList();
    component.listOfTimePeriods = [dummyTimePeriod];
    component.orderAppropriately();
    let entriesAreInCorrectOrder = true;
    for (let entry1 = 0; entry1 < component.listOfTimePeriods[0].listOfEntries.length; entry1++) {
      for (let entry2 = 0; entry2 < component.listOfTimePeriods[0].listOfEntries.length; entry2++) {
        const oneComesBeforeTwo = entry1 < entry2;
        if (oneComesBeforeTwo) {
          const entryOneDate = component.listOfTimePeriods[0].listOfEntries[entry1].date;
          const entryTwoDate = component.listOfTimePeriods[0].listOfEntries[entry2].date;
          const entryTwoIsEarlierThanOne = entryTwoDate.getTime() < entryOneDate.getTime();
          if (entryTwoIsEarlierThanOne) {
            entriesAreInCorrectOrder = false;
          }
        }
      }
    }
    expect(entriesAreInCorrectOrder).toBe(false);
  });

  it('should sort the time periods list such that earlier time periods come first if sort' +
    'mode is not day and order mode is ascending and orderAppropriately() is called', () => {
      component.prefs.SORT_MODE_DAY = "sortModeDay";
      component.prefs.SORT_MODE_WEEK = "sortModeWeek";
      component.prefs.ORDER_MODE_ASC = "ascending";
      component.prefs.ORDER_MODE_DESC = "descending";
      spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_WEEK);
      spyOn(component, 'getCurrentOrderMode').and.callFake(() => component.prefs.ORDER_MODE_ASC);
      const dummyTimePeriodList = [];
      for (let i = 0; i < 100; i++) {
        const newTimePeriod = new TimePeriod();
        const randomAssDate = testHelpers.getRandomDate();
        newTimePeriod.startDate = randomAssDate;
        dummyTimePeriodList.push(newTimePeriod);
      }
      component.listOfTimePeriods = dummyTimePeriodList;
      component.orderAppropriately();
      let timePeriodsAreOrderedCorrectly = true;
      for (let tp1 = 0; tp1 < component.listOfTimePeriods.length; tp1++) {
        for (let tp2 = 0; tp2 < component.listOfTimePeriods.length; tp2++) {
          const oneComesBeforeTwo = tp1 < tp2;
          if (oneComesBeforeTwo) {
            const entryOneDate = component.listOfTimePeriods[tp1].startDate;
            const entryTwoDate = component.listOfTimePeriods[tp2].startDate;
            const tpTwoIsEarlierThanTpOne = entryTwoDate.getTime() < entryOneDate.getTime();
            if (tpTwoIsEarlierThanTpOne) {
              timePeriodsAreOrderedCorrectly = false;
            }
          }
        }
      }
      expect(timePeriodsAreOrderedCorrectly).toBe(true);
    });

  it('should sort the time periods list such that newer time periods come first if sort' +
    'mode is not day and order mode is descending and orderAppropriately() is called', () => {
      component.prefs.SORT_MODE_DAY = "sortModeDay";
      component.prefs.SORT_MODE_WEEK = "sortModeWeek";
      component.prefs.ORDER_MODE_ASC = "ascending";
      component.prefs.ORDER_MODE_DESC = "descending";
      spyOn(component, 'getCurrentSortMode').and.callFake(() => component.prefs.SORT_MODE_WEEK);
      spyOn(component, 'getCurrentOrderMode').and.callFake(() => component.prefs.ORDER_MODE_DESC);
      const dummyTimePeriodList = [];
      for (let i = 0; i < 100; i++) {
        const newTimePeriod = new TimePeriod();
        const randomAssDate = testHelpers.getRandomDate();
        newTimePeriod.startDate = randomAssDate;
        dummyTimePeriodList.push(newTimePeriod);
      }
      component.listOfTimePeriods = dummyTimePeriodList;
      component.orderAppropriately();
      let timePeriodsAreOrderedCorrectly = true;
      for (let tp1 = 0; tp1 < component.listOfTimePeriods.length; tp1++) {
        for (let tp2 = 0; tp2 < component.listOfTimePeriods.length; tp2++) {
          const oneComesBeforeTwo = tp1 < tp2;
          if (oneComesBeforeTwo) {
            const entryOneDate = component.listOfTimePeriods[tp1].startDate;
            const entryTwoDate = component.listOfTimePeriods[tp2].startDate;
            const tpTwoIsEarlierThanTpOne = entryTwoDate.getTime() > entryOneDate.getTime();
            if (tpTwoIsEarlierThanTpOne) {
              timePeriodsAreOrderedCorrectly = false;
            }
          }
        }
      }
      expect(timePeriodsAreOrderedCorrectly).toBe(true);
    });

  it("should return an empty timeperiod list if the list of entries passed in empty and splitEntriesWhenNotSortingByDay() is called", () => {
    const DAY_IN_MILLIS: number = (24 * 60 * 60 * 1000)
    const WEEK_IN_MILLIS: number = 7 * DAY_IN_MILLIS;
    component.timeService.getWeekInMillis = () => WEEK_IN_MILLIS;
    component.timeService.getDayInMillis = () => DAY_IN_MILLIS;
    const expectedLength = 0;
    const actualLength = ((component.splitEntriesWhenNotSortingByDay([], WEEK_IN_MILLIS))).length;
    const actualIsExpected = (actualLength === expectedLength);
    expect(actualIsExpected).toBe(true);
  });

  it("should sort the entries for each time period in ascending order when splitEntriesWhenNotSortingByDay() is called ", () => {
    const DAY_IN_MILLIS: number = (24 * 60 * 60 * 1000)
    const WEEK_IN_MILLIS: number = 7 * DAY_IN_MILLIS;
    component.timeService.getWeekInMillis = () => WEEK_IN_MILLIS;
    component.timeService.getDayInMillis = () => DAY_IN_MILLIS;
    const timePeriods = (component.splitEntriesWhenNotSortingByDay(testHelpers.getRandomEntryList(), WEEK_IN_MILLIS));
    let entriesAreInCorrectOrder = true;
    timePeriods.forEach((timePeriod: TimePeriod) => {
      for (let entry1 = 0; entry1 < timePeriod.listOfEntries.length; entry1++) {
        for (let entry2 = 0; entry2 < timePeriod.listOfEntries.length; entry2++) {
          const oneComesBeforeTwo = entry1 < entry2;
          if (oneComesBeforeTwo) {
            const entryOneDate = timePeriod.listOfEntries[entry1].date;
            const entryTwoDate = timePeriod.listOfEntries[entry2].date;
            const entryTwoIsEarlierThanOne = entryTwoDate.getTime() < entryOneDate.getTime();
            if (entryTwoIsEarlierThanOne) {
              entriesAreInCorrectOrder = false;
            }
          }
        }
      }
    });
    expect(entriesAreInCorrectOrder).toBe(true);
  });

  it("should not create any timePeriods that are a greater length than the time period length when splitEntriesWhenNotSortingByDay() is called ", () => {
    const DAY_IN_MILLIS: number = (24 * 60 * 60 * 1000)
    const WEEK_IN_MILLIS: number = 7 * DAY_IN_MILLIS;
    const MAX_TIME_PERIOD_LENGTH = WEEK_IN_MILLIS - DAY_IN_MILLIS;
    component.timeService.getWeekInMillis = () => WEEK_IN_MILLIS;
    component.timeService.getDayInMillis = () => DAY_IN_MILLIS;
    const timePeriods = (component.splitEntriesWhenNotSortingByDay(testHelpers.getRandomEntryList(), WEEK_IN_MILLIS));
    let tpsAreCorrectLength = true;
    timePeriods.forEach((timePeriod: TimePeriod) => {
      const lengthOfTimePeriod = Math.abs(timePeriod.startDate.getTime() - timePeriod.endDate.getTime());
      if (lengthOfTimePeriod > MAX_TIME_PERIOD_LENGTH) {
        tpsAreCorrectLength = false;
      }
    });
    expect(tpsAreCorrectLength).toBe(true);
  });

  it("should not create any timePeriods that have entries whose dates dont belong in the time period when splitEntriesWhenNotSortingByDay() is called ", () => {
    const DAY_IN_MILLIS: number = (24 * 60 * 60 * 1000)
    const WEEK_IN_MILLIS: number = 7 * DAY_IN_MILLIS;
    component.timeService.getWeekInMillis = () => WEEK_IN_MILLIS;
    component.timeService.getDayInMillis = () => DAY_IN_MILLIS;
    const timePeriods = (component.splitEntriesWhenNotSortingByDay(testHelpers.getRandomEntryList(), WEEK_IN_MILLIS));
    let entryDatesAreCorrect = true;
    timePeriods.forEach((timePeriod: TimePeriod) => {
      const startDateTime = timePeriod.startDate.getTime() - DAY_IN_MILLIS;
      const endDateTime = timePeriod.endDate.getTime() + DAY_IN_MILLIS;
      timePeriod.listOfEntries.forEach(entry => {
        const entryTime = entry.date.getTime();
        if (entryTime < startDateTime || entryTime > endDateTime) {
          entryDatesAreCorrect = false;
        }
      });
    });
    expect(entryDatesAreCorrect).toBe(true);
  });

  it("should not create any timePeriods that have no entries when splitEntriesWhenNotSortingByDay() is called ", () => {
    const DAY_IN_MILLIS: number = (24 * 60 * 60 * 1000)
    const WEEK_IN_MILLIS: number = 7 * DAY_IN_MILLIS;
    component.timeService.getWeekInMillis = () => WEEK_IN_MILLIS;
    component.timeService.getDayInMillis = () => DAY_IN_MILLIS;
    const entry1 = new DayEntry();
    const entry2 = new DayEntry();
    entry2.date = new Date(entry1.date.getTime() * 2);
    const entryListWithWeeksInBetweenEntries = testHelpers.getRandomEntryList();
    entryListWithWeeksInBetweenEntries.push(entry1);
    entryListWithWeeksInBetweenEntries.push(entry2);
    const timePeriods = (component.splitEntriesWhenNotSortingByDay(testHelpers.getRandomEntryList(), WEEK_IN_MILLIS));
    let entryListLengthsAreCorrect = true;
    timePeriods.forEach((timePeriod: TimePeriod) => {
      if (timePeriod.listOfEntries.length == 0) {
        entryListLengthsAreCorrect = false;
      }
    });
    expect(entryListLengthsAreCorrect).toBe(true);
  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const dialog = autoSpy(MatDialog);
  const dialogCreator = autoSpy(DialogCreatorService);
  const prefs = autoSpy(PreferenceService);
  const fb = autoSpy(FormBuilder);
  const subCreator = autoSpy(LogSubscriptionCreatorService);
  const tierPermissionService = autoSpy(TierPermissionsService);
  const timeService = autoSpy(TimeService);
  const constants = autoSpy(ConstantsService);
  const fbNutr = autoSpy(FirebaseNutritionService);
  const payload = autoSpy(PayloadService);
  const builder = {
    stateManager,
    dialog,
    dialogCreator,
    prefs,
    fb,
    subCreator,
    tierPermissionService,
    timeService,
    constants,
    payload,
    default() {
      return builder;
    },
    build() {
      return new ListViewComponent(stateManager, dialog, dialogCreator, prefs, fb, subCreator, tierPermissionService, payload, timeService, fbNutr, constants);
    }
  };

  return builder;
}
