import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { MainLogDialogComponent } from './main-log-dialog.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';

describe('MainLogDialogComponent', () => {

  let component: MainLogDialogComponent;
  let testHelpers: TestHelpers = new TestHelpers();

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("should call listOfLogsSubscription() when ngOnInit() is called ", () => {
    component.listOfLogSubscription = jasmine.createSpy();
    component.ngOnInit();
    expect(component.listOfLogSubscription).toHaveBeenCalled();
  });

  it("should turn the spinner on, set the global logs and turn the spinner off in the listOfLogSubscription() body ", () => {
    let lamdaRef = null;
    component.firebaseNutritionManager.getAllNutrLogsSubscription = () => {
      return {
        subscribe: (someFunc) => {
          lamdaRef = someFunc;
        }
      } as any;
    }
    const fakeLogList = testHelpers.getRandomListOfLogs();
    component.listOfLogSubscription();
    lamdaRef(fakeLogList);
    expect(component.showSpinner).toBe(true);
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
    expect(component.existingLogs).toBe(fakeLogList);
    expect(component.showSpinner).toBe(false);
  });

  it("should return true when enableUseExisting() is called if the user has 1 log ", () => {
    component.existingLogs = testHelpers.getRandomListOfLogsOfLength(1);
    expect(component.enableUseExisting()).toBe(true);
  });

  it("should return true when enableUseExisting() is called if the user has more than 1 log ", () => {
    component.existingLogs = testHelpers.getRandomListOfLogsOfLength(200);
    expect(component.enableUseExisting()).toBe(true);
  });

  it("should return false when enableUseExisting() is called if the user has more less 1 log ", () => {
    component.existingLogs = [];
    expect(component.enableUseExisting()).toBe(false);
  });

  it("should set invert the showUseExistingVariable when toggleUseExisting is called ", () => {
    const originalVal = component.showUseExisting;
    component.toggleUseExisting();
    expect(component.showUseExisting).toBe(!originalVal);
  });

  it("should return the max number of logs for the user's tier when getMaxNumLogs for user is called ", () => {
    const expectedMaxLogs = 14;
    component.tierPermissionManager.MAX_NUTR_LOGS_KEY = "someKeyForStuff"
    component.tierPermissionManager.getUserTier = () => {
      return {
        [component.tierPermissionManager.MAX_NUTR_LOGS_KEY]: expectedMaxLogs
      }
    }
    expect(component.getMaxNumLogsForUser()).toBe(expectedMaxLogs);
  });

  it("should return true if the current number of logs is greater than the max number of logs and reachedOrExceededMaxLogs() is called ", () => {
    component.getMaxNumLogsForUser = () => 10;
    component.existingLogs = testHelpers.getRandomListOfLogsOfLength(component.getMaxNumLogsForUser() + 1);
    expect(component.reachedOrExceededMaxLogs()).toBe(true);
  });

  it("should return true if the current number of logs is equal to the max number of logs and reachedOrExceededMaxLogs() is called ", () => {
    component.getMaxNumLogsForUser = () => 10;
    component.existingLogs = testHelpers.getRandomListOfLogsOfLength(component.getMaxNumLogsForUser());
    expect(component.reachedOrExceededMaxLogs()).toBe(true);
  });

  it("should return false if the current number of logs is less than the max number of logs and reachedOrExceededMaxLogs() is called ", () => {
    component.getMaxNumLogsForUser = () => 10;
    component.existingLogs = testHelpers.getRandomListOfLogsOfLength(component.getMaxNumLogsForUser() - 1);
    expect(component.reachedOrExceededMaxLogs()).toBe(false);
  });

  it("should show an error message if the user has reachedOrExceeded the max number of logs and is NOT inShowExisting when showMaxErrorMessage() is called ", () => {
    component.showUseExisting = false;
    component.reachedOrExceededMaxLogs = () => true;
    expect(component.showMaxErrorMessage()).toBe(true);
  });

  it("should NOT show an error message if the user has NOT reachedOrExceeded the max number of logs and is NOT InShowExisting when showMaxErrorMessage() is called ", () => {
    component.showUseExisting = false;
    component.reachedOrExceededMaxLogs = () => false;
    expect(component.showMaxErrorMessage()).toBe(false);
  });

  it("should NOT show an error message if the user has reachedOrExceeded the max number of logs and is inShowExisting when showMaxErrorMessage() is called ", () => {
    component.showUseExisting = true;
    component.reachedOrExceededMaxLogs = () => true;
    expect(component.showMaxErrorMessage()).toBe(false);
  });

  it("should close the dialog with the just close data when closeDialog() is called if there is an error ", async () => {
    component.dialogRef.close = jasmine.createSpy().and.callFake((someVal) => {
      if (someVal != component.JUST_CLOSE) {
        throw {
          name: "forceErrorInsideCloseDialog"
        }
      }
      else {
        return;
      }
    })
    component.closeDialog(component.CREATE_NEW);
    expect(component.dialogRef.close).toHaveBeenCalledWith(component.JUST_CLOSE);
  });

  it("should close the dialog the CREATE NEW value when closeDialog() is called if createNew is pressed ", async () => {
    await component.closeDialog(component.CREATE_NEW);
    expect(component.dialogRef.close).toHaveBeenCalledWith(component.CREATE_NEW);
  });

  it("should close the dialog the JUST_CLOSE  value when closeDialog() is called if close is pressed ", async () => {
    await component.closeDialog(component.JUST_CLOSE);
    expect(component.dialogRef.close).toHaveBeenCalledWith(component.JUST_CLOSE);
  });

  it("should disable closing, show the spinner, set the current user's main log and then close the dialog after a timeout if " +
    " closeDialog() is called and the button pressed is a button that sets the log as a main log", async () => {
      const expectedCurUser = { estimatedTDEE: "someRandomExpectedVal" } as any;
      component.stateManager.getCurrentUser = () => expectedCurUser;
      const fakeLog = testHelpers.getRandomNutritionLog();
      await component.closeDialog(fakeLog);
      expect(component.dialogRef.disableClose).toBe(true);
      expect(component.showSpinner).toBe(true);
      expect(component.firebaseGeneralManager.setUserMainNutrLog).toHaveBeenCalledWith(expectedCurUser, fakeLog, expectedCurUser.estimatedTDEE, component.stateManager);
      jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT + 1);
      expect(component.dialogRef.close).toHaveBeenCalledWith(component.JUST_CLOSE);
    });

  it("should not error out if closeDialog() is called with a  random value", async () => {
    let crashed = false;
    try {
      await component.closeDialog(null);
    } catch (error) {
      crashed = true
    }
    expect(crashed).toBe(false);
  });

});

function setup() {
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const stateManager = autoSpy(StateManagerService);
  const firebaseGeneralManager = autoSpy(FirebaseGeneralService);
  const firebaseNutritionManager = autoSpy(FirebaseNutritionService);
  const tierPermissionManager = autoSpy(TierPermissionsService);
  const constants = autoSpy(ConstantsService);
  const builder = {
    dialogRef,
    data,
    stateManager,
    firebaseGeneralManager,
    firebaseNutritionManager,
    tierPermissionManager,
    constants,
    default() {
      return builder;
    },
    build() {
      return new MainLogDialogComponent(dialogRef, data, stateManager, firebaseGeneralManager, firebaseNutritionManager, tierPermissionManager, constants);
    }
  };

  return builder;
}
