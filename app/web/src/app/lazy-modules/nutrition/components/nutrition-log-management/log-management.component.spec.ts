import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { NutritionLogManagementComponent } from './log-management.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { Subscription, BehaviorSubject } from 'rxjs';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';

describe('NutritionLogManagementComponent', () => {

  let component: NutritionLogManagementComponent;
  let testHelpers = new TestHelpers();

  /**
   * Reference to spy function that must be mockjed because it is called in the 
   * constructor and will throw errors otherwise.
   */
  let logSummarySpy = null;

  beforeEach(() => {
    logSummarySpy = spyOn(NutritionLogManagementComponent.prototype, 'logSummarySubscription');
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should call generateNewForm() when ngOnInit() is called ', () => {
    const generateFormSpy = spyOn(component, 'generateNewForm');
    component.ngOnInit();
    expect(generateFormSpy).toHaveBeenCalled();
  });

  it("should not error out if subscriptions are null when ngOnDestroy() is called ", () => {
    component.myLogSubscription = null;
    let crashed = false;
    try {
      component.ngOnDestroy();
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should kill any subscriptions that are not null when ngOnDestroy() is called", () => {
    component.myLogSubscription = new Subscription();
    const unsubSpy = spyOn(component.myLogSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('should return true if showSpinner is true and showSpinner() is called ', () => {
    component.showSpinner = true;
    const spinnerIsShowing = component.spinnerIsShowing();
    expect(spinnerIsShowing).toBe(component.showSpinner);
  });

  it('should return false if showSpinner is true and showSpinner() is called ', () => {
    component.showSpinner = false;
    const spinnerIsShowing = component.spinnerIsShowing();
    expect(spinnerIsShowing).toBe(component.showSpinner);
  });

  it("should return true when disable create new is called if the spinner is showing", () => {
    component.spinnerIsShowing = () => true;
    expect(component.disableCreateNew()).toBe(true);
  });

  it("should return true when disable create new is called if the user maxed out their logs", () => {
    component.spinnerIsShowing = () => false;
    component.userHasMaxedOutLogs = () => true;
    expect(component.disableCreateNew()).toBe(true);
  });

  it("should return false when disable create new is called if the spinner is hidden and the user has not maxed out their logs", () => {
    component.spinnerIsShowing = () => false;
    component.userHasMaxedOutLogs = () => false;
    expect(component.disableCreateNew()).toBe(false);
  });

  it("should open a createRegularLogDialog if createNewLog() is called ", () => {
    component.userHasMaxedOutLogs = () => false;
    component.createNewLog();
    expect(component.dialogService.openCreateRegularLogDialog).toHaveBeenCalled();
  });

  it("should NOT open a createRegularLogDialog if createNewLog() is called ", () => {
    component.userHasMaxedOutLogs = () => true;
    component.tierPermissionService.getUserTier = () => { return { maxNumNutrLogs: 99 } }
    component.createNewLog();
    expect(component.dialogService.openCreateRegularLogDialog).not.toHaveBeenCalled();
  });

  it("should open a logManagementDialog if createNewLog() is called ", () => {
    component.openManagementDialog(null);
    expect(component.dialogService.openLogManagementDialog).toHaveBeenCalled();
  });

  it("should call sort on the local list of logs if sortLogsByFunc() is called ", () => {
    component.listOfNutritionLogs = [];
    const sortSpy = spyOn(component.listOfNutritionLogs, 'sort');
    const fakeSortFunc = () => null;
    component.sortLogsByFunc(fakeSortFunc);
    expect(sortSpy).toHaveBeenCalled();
  });

  it("should return true if the user has more logs than their tier allows when userHasMaxedOutLogs() is called", () => {
    component.listOfNutritionLogs = [new NutritionLog(), new NutritionLog(), new NutritionLog()];
    const userNumLogs = component.listOfNutritionLogs.length;
    component.tierPermissionService.getUserTier = () => {
      return { maxNumNutrLogs: (userNumLogs - 1) };
    };
    expect(component.userHasMaxedOutLogs()).toBe(true);
  });

  it("should return true if the user has the same number of logs that their tier allows when userHasMaxedOutLogs() is called", () => {
    component.listOfNutritionLogs = [new NutritionLog(), new NutritionLog(), new NutritionLog()];
    const userNumLogs = component.listOfNutritionLogs.length;
    component.tierPermissionService.getUserTier = () => {
      return { maxNumNutrLogs: (userNumLogs) };
    };
    expect(component.userHasMaxedOutLogs()).toBe(true);
  });

  it("should return false if the user has less logs than their tier allows when userHasMaxedOutLogs() is called", () => {
    component.listOfNutritionLogs = [new NutritionLog(), new NutritionLog(), new NutritionLog()];
    const userNumLogs = component.listOfNutritionLogs.length;
    component.tierPermissionService.getUserTier = () => {
      return { maxNumNutrLogs: (userNumLogs + 1) };
    };
    expect(component.userHasMaxedOutLogs()).toBe(false);
  });

  it("should set the logMangementForm when generateNewForm() is called ", () => {
    component.logManagementForm = null;
    component.fb.group = () => new FormGroup({});
    expect(component.logManagementForm).toBe(null);
    component.generateNewForm();
    const formIsSet = component.logManagementForm != null;
    expect(formIsSet).toBe(true);
  });

  it("should set the order property form control and order form control to their respective global variables when generateNewForm() is called ", () => {
    component.logManagementForm = null;
    component.fb.group = () => new FormGroup({});
    expect(component.logManagementForm).toBe(null);
    component.generateNewForm();
    const formIsSet = component.logManagementForm != null;
    expect(formIsSet).toBe(true);
  });

  it("should set the order property form control and order form control to their default values when generateNewForm() is called ", () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => someObj as any;
    expect(component.logManagementForm).toBe(null);
    component.generateNewForm();
    const orderProperty = component.logManagementForm[component.ORDER_PROPERTY];
    const ordering = component.logManagementForm[component.ORDER];
    expect(orderProperty).toBe(component.DEFAULT_ORDER_PROPERTY);
    expect(ordering).toBe(component.DEFUALT_ORDER);
  });

  it('should set the log subscription when logSummarySubscription() is called ', () => {
    logSummarySpy.and.callThrough();
    const randomObseravble = new BehaviorSubject<NutritionLog[]>([]);
    component.firebaseNutritionManager.getAllNutrLogsSubscription = () => randomObseravble;
    spyOn(randomObseravble, 'subscribe').and.callFake(() => new Subscription);
    component.myLogSubscription = null;
    component.logSummarySubscription();
    const susbcriptionIsNotNull = component.myLogSubscription != null;
    expect(susbcriptionIsNotNull).toBe(true);
  });

  it('should turn the spinner on then sort logs by the current ordering after the spinner delay in the logSummarySubscription body ', () => {
    logSummarySpy.and.callThrough();
    const randomObseravble = new BehaviorSubject<NutritionLog[]>([]);
    component.firebaseNutritionManager.getAllNutrLogsSubscription = () => randomObseravble;
    const subscribeSpy = spyOn(randomObseravble, 'subscribe');
    const orderingSpy = spyOn(component, 'applyOrdering');
    component.myLogSubscription = null;
    component.logSummarySubscription();
    const subscriptionBody = subscribeSpy.calls.argsFor(0)[0];
    subscriptionBody(testHelpers.getRandomListOfLogs());
    expect(component.showSpinner).toBe(true);
    jasmine.clock().tick(300);
    expect(orderingSpy).toHaveBeenCalled();
  });

  it('should turn the spinner on then off after the spinner delay if apply ordering is called ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_LAST_EDIT
          },
          [component.ORDER]: {
            value: component.ORDER_DESC
          }
        }
      } as any;
    };
    component.generateNewForm();
    spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    expect(component.showSpinner).toBe(true);
    jasmine.clock().tick(300);
    expect(component.showSpinner).toBe(false);
  });

  it('should turn the spinner on then off after the spinner delay if apply ordering is called with no sort mode when desc ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: null
          },
          [component.ORDER]: {
            value: component.ORDER_DESC
          }
        }
      } as any;
    };
    component.generateNewForm();
    spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    expect(component.showSpinner).toBe(true);
    jasmine.clock().tick(300);
    expect(component.showSpinner).toBe(false);
  });

  it('should turn the spinner on then off after the spinner delay if apply ordering is called with no sort mode when asc ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: null
          },
          [component.ORDER]: {
            value: component.ORDER_ASC
          }
        }
      } as any;
    };
    component.generateNewForm();
    spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    expect(component.showSpinner).toBe(true);
    jasmine.clock().tick(300);
    expect(component.showSpinner).toBe(false);
  });

  it('should turn the spinner on then off after the spinner delay if apply ordering is called and no order mode is set', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_LAST_EDIT
          },
          [component.ORDER]: {
            value: null
          }
        }
      } as any;
    };
    component.generateNewForm();
    spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    expect(component.showSpinner).toBe(true);
    jasmine.clock().tick(300);
    expect(component.showSpinner).toBe(false);
  });

  it('should sort by LastEditDescending if ordering is descending and property is last edit ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_LAST_EDIT
          },
          [component.ORDER]: {
            value: component.ORDER_DESC
          }
        }
      } as any;
    };
    component.generateNewForm();
    const sortBySpy = spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    jasmine.clock().tick(300);
    expect(sortBySpy).toHaveBeenCalledWith(component.lastEditDescending);
  });

  it('should sort by creation date if ordering is descending and property is last edit ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_CREATED
          },
          [component.ORDER]: {
            value: component.ORDER_DESC
          }
        }
      } as any;
    };
    component.generateNewForm();
    const sortBySpy = spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    jasmine.clock().tick(300);
    expect(sortBySpy).toHaveBeenCalledWith(component.createdDescending);
  });

  it('should sort by title if ordering is descending and property is last edit ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_TITLE
          },
          [component.ORDER]: {
            value: component.ORDER_DESC
          }
        }
      } as any;
    };
    component.generateNewForm();
    const sortBySpy = spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    jasmine.clock().tick(300);
    expect(sortBySpy).toHaveBeenCalledWith(component.titleDescending);
  });

  it('should sort by title if ordering is ascending and property is last edit ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_TITLE
          },
          [component.ORDER]: {
            value: component.ORDER_ASC
          }
        }
      } as any;
    };
    component.generateNewForm();
    const sortBySpy = spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    jasmine.clock().tick(300);
    expect(sortBySpy).toHaveBeenCalledWith(component.titleAscending);
  });

  it('should sort by LastEditAscending if ordering is ascending and property is last edit ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_LAST_EDIT
          },
          [component.ORDER]: {
            value: component.ORDER_ASC
          }
        }
      } as any;
    };
    component.generateNewForm();
    const sortBySpy = spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    jasmine.clock().tick(300);
    expect(sortBySpy).toHaveBeenCalledWith(component.lastEditAscending);
  });

  it('should sort by creation date if ordering is ascending and property is last edit ', () => {
    component.logManagementForm = null;
    component.fb.group = (someObj) => {
      return {
        controls: {
          [component.ORDER_PROPERTY]: {
            value: component.PROPERTY_CREATED
          },
          [component.ORDER]: {
            value: component.ORDER_ASC
          }
        }
      } as any;
    };
    component.generateNewForm();
    const sortBySpy = spyOn(component, 'sortLogsByFunc');
    component.applyOrdering();
    jasmine.clock().tick(300);
    expect(sortBySpy).toHaveBeenCalledWith(component.createdAscending);
  });

  it('should sort the list of logs such that most recently edited logs come first if lastEditDescending is called ', () => {
    component.listOfNutritionLogs = testHelpers.getRandomListOfLogs();
    component.sortLogsByFunc(component.lastEditDescending);
    let orderingIsWrong = false;
    for (let logOneIdx = 0; logOneIdx < component.listOfNutritionLogs.length; logOneIdx++) {
      for (let logTwoIdx = 0; logTwoIdx < component.listOfNutritionLogs.length; logTwoIdx++) {
        const logOneComesBeforeLogTwo = logOneIdx < logTwoIdx;
        if (logOneComesBeforeLogTwo) {
          const logOne = component.listOfNutritionLogs[logOneIdx];
          const logTwo = component.listOfNutritionLogs[logTwoIdx];
          if (logOne.lastEdit < logTwo.lastEdit) {
            orderingIsWrong = true;
          }
        }
      }
    }
    expect(orderingIsWrong).toBe(false);
  });

  it('should sort the list of logs such that most recently edited logs come last if lastEditAscending is called ', () => {
    component.listOfNutritionLogs = testHelpers.getRandomListOfLogs();
    component.sortLogsByFunc(component.lastEditAscending);
    let orderingIsWrong = false;
    for (let logOneIdx = 0; logOneIdx < component.listOfNutritionLogs.length; logOneIdx++) {
      for (let logTwoIdx = 0; logTwoIdx < component.listOfNutritionLogs.length; logTwoIdx++) {
        const logOneComesBeforeLogTwo = logOneIdx < logTwoIdx;
        if (logOneComesBeforeLogTwo) {
          const logOne = component.listOfNutritionLogs[logOneIdx];
          const logTwo = component.listOfNutritionLogs[logTwoIdx];
          if (logOne.lastEdit > logTwo.lastEdit) {
            orderingIsWrong = true;
          }
        }
      }
    }
    expect(orderingIsWrong).toBe(false);
  });
  //
  it('should sort the list of logs such that most recently created come first if createdDescending is called ', () => {
    component.listOfNutritionLogs = testHelpers.getRandomListOfLogs();
    component.sortLogsByFunc(component.createdDescending);
    let orderingIsWrong = false;
    for (let logOneIdx = 0; logOneIdx < component.listOfNutritionLogs.length; logOneIdx++) {
      for (let logTwoIdx = 0; logTwoIdx < component.listOfNutritionLogs.length; logTwoIdx++) {
        const logOneComesBeforeLogTwo = logOneIdx < logTwoIdx;
        if (logOneComesBeforeLogTwo) {
          const logOne: NutritionLog = component.listOfNutritionLogs[logOneIdx];
          const logTwo = component.listOfNutritionLogs[logTwoIdx];
          if (logOne.id < logTwo.id) {
            orderingIsWrong = true;
          }
        }
      }
    }
    expect(orderingIsWrong).toBe(false);
  });

  it('should sort the list of logs such that most recently created logs come last if createdAscending is called ', () => {
    component.listOfNutritionLogs = testHelpers.getRandomListOfLogs();
    component.sortLogsByFunc(component.createdAscending);
    let orderingIsWrong = false;
    for (let logOneIdx = 0; logOneIdx < component.listOfNutritionLogs.length; logOneIdx++) {
      for (let logTwoIdx = 0; logTwoIdx < component.listOfNutritionLogs.length; logTwoIdx++) {
        const logOneComesBeforeLogTwo = logOneIdx < logTwoIdx;
        if (logOneComesBeforeLogTwo) {
          const logOne = component.listOfNutritionLogs[logOneIdx];
          const logTwo = component.listOfNutritionLogs[logTwoIdx];
          if (logOne.id > logTwo.id) {
            orderingIsWrong = true;
          }
        }
      }
    }
    expect(orderingIsWrong).toBe(false);
  });

  it('should sort the list of logs such that alphanumerically larger titles come last if titleAscending is called ', () => {
    component.listOfNutritionLogs = testHelpers.getRandomListOfLogs();
    component.sortLogsByFunc(component.titleAscending);
    let orderingIsWrong = false;
    for (let logOneIdx = 0; logOneIdx < component.listOfNutritionLogs.length; logOneIdx++) {
      for (let logTwoIdx = 0; logTwoIdx < component.listOfNutritionLogs.length; logTwoIdx++) {
        const logOneComesBeforeLogTwo = logOneIdx < logTwoIdx;
        if (logOneComesBeforeLogTwo) {
          const logOne = component.listOfNutritionLogs[logOneIdx];
          const logTwo = component.listOfNutritionLogs[logTwoIdx];
          if (logOne.title > logTwo.title) {
            orderingIsWrong = true;
          }
        }
      }
    }
    expect(orderingIsWrong).toBe(false);
  });

  it('should sort the list of logs such that alphanumerically lower titles come first if titleAscending is called ', () => {
    component.listOfNutritionLogs = testHelpers.getRandomListOfLogs();
    component.sortLogsByFunc(component.titleDescending);
    let orderingIsWrong = false;
    for (let logOneIdx = 0; logOneIdx < component.listOfNutritionLogs.length; logOneIdx++) {
      for (let logTwoIdx = 0; logTwoIdx < component.listOfNutritionLogs.length; logTwoIdx++) {
        const logOneComesBeforeLogTwo = logOneIdx < logTwoIdx;
        if (logOneComesBeforeLogTwo) {
          const logOne = component.listOfNutritionLogs[logOneIdx];
          const logTwo = component.listOfNutritionLogs[logTwoIdx];
          if (logOne.title < logTwo.title) {
            orderingIsWrong = true;
          }
        }
      }
    }
    expect(orderingIsWrong).toBe(false);
  });
});

function setup() {
  const firebaseManager = autoSpy(FirebaseGeneralService);
  const firebaseNutritionManager = autoSpy(FirebaseNutritionService);
  const stateManager = autoSpy(StateManagerService);
  const conversionManager = autoSpy(ConversionService);
  const dialogService = autoSpy(DialogCreatorService);
  const fb = autoSpy(FormBuilder);
  const snackbar = autoSpy(SnackBarService);
  const tierPermissionService = autoSpy(TierPermissionsService);
  const constants = autoSpy(ConstantsService);
  const nutrConstants = autoSpy(NutritionConstanstsService);
  const builder = {
    firebaseManager,
    firebaseNutritionManager,
    stateManager,
    conversionManager,
    dialogService,
    fb,
    snackbar,
    tierPermissionService,
    constants,
    default() {
      return builder;
    },
    build() {
      return new NutritionLogManagementComponent(firebaseManager, firebaseNutritionManager, stateManager, conversionManager, dialogService, fb, snackbar, tierPermissionService, constants, nutrConstants);
    }
  };

  return builder;
}
