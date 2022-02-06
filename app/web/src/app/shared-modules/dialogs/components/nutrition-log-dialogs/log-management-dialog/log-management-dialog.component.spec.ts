import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { PayloadService } from 'src/app/services/firebase/payload.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { LogManagementDialogComponent } from './log-management-dialog.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { UserProfile } from 'src/app/model-classes/general/user-profile';

describe('LogManagementDialogComponent', () => {

  let component: LogManagementDialogComponent;
  let testHelpers: TestHelpers = new TestHelpers();
  let originalTimeout;

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });


  it('should not crash when ngOnInit() is called', () => {
    let crashed = false;
    try {
      component.ngOnInit();
    } catch (error) {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should call close on the dialogRef with the pased in data whenever closeDialog() is called ", () => {
    const expectedData = ("someData");
    component.closeDialog(expectedData);
    expect(component.dialogRef.close).toHaveBeenCalledWith(expectedData);
  });

  it("should return true if the log passed in is the user's main log ", () => {
    const mainLogId = "someId" as any;
    const logModel = new NutritionLog();
    logModel.id = mainLogId;
    const curUser = new UserProfile();
    curUser.mainNutrLogId = mainLogId;
    component.stateManager.getCurrentUser = () => curUser;
    component.data.logModel = logModel;
    expect(component.logIsMainLog()).toBe(true);
  });

  it("should return false if the log passed in is NOT the user's main log ", () => {
    const mainLogId = "someId" as any;
    const logModel = new NutritionLog();
    logModel.id = mainLogId;
    const curUser = new UserProfile();
    curUser.mainNutrLogId = (mainLogId + "someStuffThatMakesItNotTHeID") as any;
    component.stateManager.getCurrentUser = () => curUser;
    component.data.logModel = logModel;
    expect(component.logIsMainLog()).toBe(false);
  });

  it("should call openIndepth() on whatever nutrition log is passed into the handleOpenClick() function ", async () => {
    const someLog = testHelpers.getRandomNutritionLog();
    const fakeContext = component as any;
    await component.handleOpenClick(someLog, fakeContext);
    expect(fakeContext.firebaseNutr.openInDepthNutritionLog).toHaveBeenCalledWith(someLog);
  });

  it("should set the log passed in as the user's main log if it is NOT the users main log when handleMainClick() is called ", async () => {
    const expectedCurUser = new UserProfile();
    const someLog = testHelpers.getRandomNutritionLog();
    component.stateManager.getCurrentUser = () => expectedCurUser;
    component.logIsMainLog = () => false;
    await component.handleMainClick(someLog, component);
    expect(component.firebaseGeneralManager.setUserMainNutrLog).toHaveBeenCalled();
  });

  it("should remove the log passed in as the user's main log and update their TDEE if it is the users main log when handleMainClick() is called ", async () => {
    const expectedCurUser = new UserProfile();
    const someLog = testHelpers.getRandomNutritionLog();
    component.stateManager.getCurrentUser = () => expectedCurUser;
    const expectedTDEE = Math.random();
    component.payload.getEnergyPayLoad = (log) => {
      expect(log).toBe(log);
      return {
        estimatedTDEE: expectedTDEE
      } as any
    }
    component.logIsMainLog = () => true;
    await component.handleMainClick(someLog, component);
    expect(component.firebaseGeneralManager.removeUserMainNutrLog).toHaveBeenCalled();
  });

  it("should remove the log passed in as the user's main log and update their TDEE if it is the users main log when handleMainClick() is called even if the payload is null ", async () => {
    const expectedCurUser = new UserProfile();
    expectedCurUser.estimatedTDEE = 69420;
    const someLog = testHelpers.getRandomNutritionLog();
    component.stateManager.getCurrentUser = () => expectedCurUser;
    component.payload.getEnergyPayLoad = () => null;
    component.logIsMainLog = () => true;
    await component.handleMainClick(someLog, component);
    expect(component.firebaseGeneralManager.removeUserMainNutrLog).toHaveBeenCalled();
  });

  it("should close the dialog with no close data if the buttontype is CLOSE when handleButtonPress is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    await component.handleButtonPress(component.CLOSE);
    expect(component.closeDialog).toHaveBeenCalledWith(component.NO_CLOSE_DATA);
  });

  it("should disable closing when handleButtonPress is called ", async () => {
    await component.handleButtonPress(null);
    expect(component.dialogRef.disableClose).toBe(true);
  });

  it("should close the dialog with the button type if the buttontype is DELETE and handleButtonPress() is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    await component.handleButtonPress(component.DELETE);
    expect(component.closeDialog).toHaveBeenCalledWith(component.DELETE);
  });

  it("should close the dialog with the button type if the buttontype is EDIT and handleButtonPress() is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    await component.handleButtonPress(component.EDIT);
    expect(component.closeDialog).toHaveBeenCalledWith(component.EDIT);
  });

  it("should call the buttonFunction and close the dialog with no data if the buttonType is OPEN and handleButtonPress() is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    component.handleOpenClick = jasmine.createSpy();
    await component.handleButtonPress(component.OPEN);
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT);
    expect(component.handleOpenClick).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalledWith(component.NO_CLOSE_DATA);
  });

  it("should call the buttonFunction and close the dialog with no data if the buttonType is MAIN and handleButtonPress() is called ", async () => {
    component.closeDialog = jasmine.createSpy();
    component.handleMainClick = jasmine.createSpy();
    await component.handleButtonPress(component.MAIN);
    jasmine.clock().tick(new ConstantsService().SPINNER_TIMEOUT);
    expect(component.handleMainClick).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalledWith(component.NO_CLOSE_DATA);
  });

  it("should show an error message and close the dialog with no data if there is an error in handleButtonPress() ", async () => {
    component.closeDialog = jasmine.createSpy().and.callFake((param) => {
      if (param == component.NO_CLOSE_DATA) {
        return;
      } else {
        throw {
          name: "randomError"
        }
      }
    });
    await component.handleButtonPress(component.EDIT);
    expect(component.snackbar.showFailureMessage).toHaveBeenCalled();
    expect(component.closeDialog).toHaveBeenCalledWith(component.NO_CLOSE_DATA);
  });

  it("should catch the error wehn setUserMainNutrLog() when handleMainLogCLick() is called and there is an error", async () => {
    component.logIsMainLog = () => false;
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: "someId"
      } as any;
    }
    const someLog: NutritionLog = testHelpers.getRandomNutritionLog();
    component.firebaseGeneralManager.setUserMainNutrLog = async (user, log, tdee): Promise<any> => {
      expect(tdee != undefined);
    }
    let crashed = false;
    try {
      await ((component.handleMainClick(someLog, component)));
    } catch (error) {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should NOT get the user's current main logs tdee and pass that in to setUserMainNutrLog() when handleMainLogCLick() is called and the user has a main log", async () => {
    component.logIsMainLog = () => false;
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: null
      } as any;
    }
    const someLog: NutritionLog = testHelpers.getRandomNutritionLog();
    component.firebaseGeneralManager.setUserMainNutrLog = async (user, log, tdee): Promise<any> => {
      expect(tdee == undefined).toBe(true);
    }
    let crashed = false;
    try {
      await ((component.handleMainClick(someLog, component)));
    } catch (error) {
      crashed = true;
    }
  });

  it("should get the user's main logs summary, then its entries then get its TDEE when handleMainclick() is called if the user already has a main log", async (done) => {
    component.logIsMainLog = () => false;
    const expectedMainLogId: string = "someLogIdBruh";
    const fakeTDEE = 1908308954098320983290;
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: expectedMainLogId,
        estimatedTDEE: fakeTDEE
      } as any;
    }
    let getNutrLogSummaryRef: (param: any) => Promise<any>;
    let getNutrLogEntryRef: (param: any) => Promise<any>;
    let entriesUnsubbed: boolean = false;
    let summaryUnsubbed: boolean = false;
    component.firebaseNutr.getNutrLogSummarySubscription = (logId: any) => {
      expect(logId == expectedMainLogId);
      return {
        subscribe: (lambda) => {
          getNutrLogSummaryRef = lambda;
          return {
            unsubscribe: () => {
              summaryUnsubbed = true;
            }
          };
        }
      } as any
    }
    component.firebaseNutr.getNutrLogEntriesSubscription = (logId: any) => {
      expect(logId == expectedMainLogId);
      return {
        subscribe: (lambda) => {
          getNutrLogEntryRef = lambda;
          return {
            unsubscribe: () => {
              entriesUnsubbed = true;
            }
          };
        },

      } as any;
    }
    component.firebaseGeneralManager.setUserMainNutrLog = async (user, log, tdee): Promise<any> => {
      expect(tdee == fakeTDEE).toBe(true);

    }
    const expectedMainLog = testHelpers.getRandomNutritionLog()
    await component.handleMainClick(expectedMainLog, component);
    await (getNutrLogSummaryRef(expectedMainLog));
    await (getNutrLogEntryRef(testHelpers.getRandomEntryList()));
    expect(entriesUnsubbed).toBe(true);
    expect(summaryUnsubbed).toBe(true);
    done();
  });

  it("should not unsub from the subscriptions  when handleMainclick() is called if the subscriptions are null", async (done) => {
    component.logIsMainLog = () => false;
    const expectedMainLogId: string = "someLogIdBruh";
    const fakeTDEE = 1908308954098320983290;
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: expectedMainLogId,
        estimatedTDEE: fakeTDEE
      } as any;
    }
    let getNutrLogSummaryRef: (param: any) => Promise<any>;
    let getNutrLogEntryRef: (param: any) => Promise<any>;
    let entriesUnsubbed: boolean = false;
    let summaryUnsubbed: boolean = false;
    component.firebaseNutr.getNutrLogSummarySubscription = (logId: any) => {
      expect(logId == expectedMainLogId);
      return {
        subscribe: (lambda) => {
          getNutrLogSummaryRef = lambda;
          return;
        }
      } as any
    }
    component.firebaseNutr.getNutrLogEntriesSubscription = (logId: any) => {
      expect(logId == expectedMainLogId);
      return {
        subscribe: (lambda) => {
          getNutrLogEntryRef = lambda;
          return
        },
      } as any;
    }
    component.firebaseGeneralManager.setUserMainNutrLog = async (user, log, tdee): Promise<any> => {
      expect(tdee == fakeTDEE).toBe(true);

    }
    component.payload.getEnergyPayLoad = (someLog) => {
      expect(someLog).toBe(expectedMainLog);
      return {
        estimatedTDEE: fakeTDEE
      } as any;
    }
    const expectedMainLog = testHelpers.getRandomNutritionLog()
    await component.handleMainClick(expectedMainLog, component);
    await (getNutrLogSummaryRef(expectedMainLog));
    await (getNutrLogEntryRef(testHelpers.getRandomEntryList()));
    expect(entriesUnsubbed).toBe(false);
    expect(summaryUnsubbed).toBe(false);
    done();
  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const snackbar = autoSpy(SnackBarService);
  const firebaseGeneralManager = autoSpy(FirebaseGeneralService);
  const firebaseNutr = autoSpy(FirebaseNutritionService);
  const payload = autoSpy(PayloadService);
  const data = {};
  const dialogRef = new TestHelpers().getDialogMock();
  const constants = autoSpy(ConstantsService);
  const builder = {
    stateManager,
    snackbar,
    firebaseGeneralManager,
    firebaseNutr,
    payload,
    dialogRef,
    constants,
    data,
    default() {
      return builder;
    },
    build() {
      return new LogManagementDialogComponent(stateManager, snackbar, firebaseGeneralManager, firebaseNutr, payload, dialogRef, constants, data);
    }
  };

  return builder;
}
