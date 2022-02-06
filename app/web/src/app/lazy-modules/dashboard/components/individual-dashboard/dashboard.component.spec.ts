import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { IndividualDashboardComponent } from './dashboard.component';
import { autoSpy } from 'autoSpy';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { UserProfile } from 'functions/src/classes/user-profile';
import { BehaviorSubject, Subscription } from 'rxjs';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EnvironmentService } from 'src/app/services/general/environment.service';

describe('DashboardComponent', () => {
  const testHelper: TestHelpers = new TestHelpers();
  let component: IndividualDashboardComponent;

  beforeEach(() => {
    component = setup().default().build();
    component.stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(testHelper.createFreeUserProfile());
    jasmine.clock().install();
  })

  afterEach(() => {
    jasmine.clock().uninstall();
  })

  it('should not crash when ngOnInit is called', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should return true if the spinner is not being shown and the mainNutritionLog global variable is null when showSetMainLogPrompt is called', () => {
    component.mainNutritionLog = null;
    component.showSpinner = false;
    expect(component.showSetMainLogPrompt()).toBe(true);
  });

  it("should not set showSpinner to true in the body of the currentUser subscription if the mainNutrLog is null", async () => {
    let lamRef;
    component.stateManager.currentUserProfile = {
      subscribe: (someLam) => {
        lamRef = someLam;
      }
    } as any;
    component.mainNutritionLog = new NutritionLog();
    const expectedValue = "someVal" as any;
    component.showSpinner = expectedValue;
    component.currentUserSubscription();
    component.getCachedLogAndPayload = () => expectedValue;
    await lamRef(null);
    expect(component.showSpinner).toBe(!expectedValue);
  });

  it('should return false if the spinner is being shown and the mainNutritionLog global variable is not null when showSetMainLogPrompt is called', () => {
    component.mainNutritionLog = new NutritionLog();
    component.showSpinner = true;
    expect(component.showSetMainLogPrompt()).toBe(false);
  });

  it('should return true if the spinner is not being shown and the mainNutritionLog global variable is not null when showMainLogSummary is called', () => {
    component.mainNutritionLog = new NutritionLog();
    component.showSpinner = false;
    expect(component.showMainLogSummary()).toBe(true);
  });

  it('should return false if the spinner is being shown and the mainNutritionLog global variable is null when showMainLogSummary is called', () => {
    component.mainNutritionLog = null;
    component.showSpinner = true;
    expect(component.showMainLogSummary()).toBe(false);
  });

  it('should kill all non-null subscriptions when ngOnDestroy is called', () => {
    component.logAndPayloadSubscription = new Subscription();
    component.myCurUserSubscription = new Subscription();

    const logSubCreatorSpy: jasmine.Spy<() => void> = spyOn(component.logSubCreator, 'killSubscriptions');
    const myCurUserUnsubSpy: jasmine.Spy<() => void> = spyOn(component.myCurUserSubscription, 'unsubscribe');
    const logAndPayloadUnsubSpy: jasmine.Spy<() => void> = spyOn(component.logAndPayloadSubscription, 'unsubscribe');

    component.ngOnDestroy();

    expect(logSubCreatorSpy).toHaveBeenCalled();
    expect(myCurUserUnsubSpy).toHaveBeenCalled();
    expect(logAndPayloadUnsubSpy).toHaveBeenCalled();
  });

  it('should only kill the logSubCreator subscription if logAndPayloadSubscription and myCurUserSubscription are null when ngOnDestroy is called', () => {
    component.logAndPayloadSubscription = null;;
    component.myCurUserSubscription = null;
    const logSubCreatorSpy: jasmine.Spy<() => void> = spyOn(component.logSubCreator, 'killSubscriptions');

    component.ngOnDestroy();

    expect(logSubCreatorSpy).toHaveBeenCalled();
  });

  it('should create a subscritpion that generates new forms after editing when currentUserSubscription is called ', () => {
    component.showSpinner = false;
    const hideSpinnerSpy: jasmine.Spy<() => void> = spyOn(component, 'hideSpinner');
    const logSubCreatorSpy: jasmine.Spy<() => void> = spyOn(component.logSubCreator, 'killSubscriptions');

    component.currentUserSubscription();

    // currentUserSubscription is called in the components constructor
    expect(component.myCurUserSubscription).not.toBe(Subscription.EMPTY);

    expect(component.mainNutritionLog).toBe(null);

    expect(hideSpinnerSpy).toHaveBeenCalled();
    expect(logSubCreatorSpy).toHaveBeenCalled();
  });

  it('should update main nutrition log subscription when currentUserSubscription is called and the mainNutrLogId for the current user is null', () => {
    component.showSpinner = false;
    const hideSpinnerSpy: jasmine.Spy<() => void> = spyOn(component, 'hideSpinner');
    const updateLogSpy: jasmine.Spy<(id) => void> = spyOn(component, 'updateMainNutrLogSubscription');

    const userProfile = testHelper.createFreeUserProfile();
    userProfile.mainNutrLogId = 1;
    component.stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(userProfile);


    component.currentUserSubscription();

    expect(updateLogSpy).toHaveBeenCalled();
    expect(hideSpinnerSpy).not.toHaveBeenCalled();
  });

  it('should unsubscribe and kill subscriptions when updateMainNutrLogSubscription is called if logAndPayload subscription is not null', fakeAsync(() => {
    component.logAndPayloadSubscription = new Subscription();

    const logId = 0;
    let lamdaRef = null;
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    const log = new NutritionLog();
    const payload = new EnergyPayload();
    const stateChange = { 0: log, 1: payload } as any;
    const hideSpinnerSpy: jasmine.Spy<() => void> = spyOn(component, 'hideSpinner');
    const killSubSpy: jasmine.Spy<() => void> = spyOn(component.logSubCreator, 'killSubscriptions');
    const unsubSpy: jasmine.Spy<() => void> = spyOn(component.logAndPayloadSubscription, 'unsubscribe');
    const logSubSpy: jasmine.Spy<(id) => Promise<any>> = spyOn(component.logSubCreator, 'setLogSubscription').and.returnValue({ subscribe: async (stateChange: any) => lamdaRef = stateChange } as any);

    component.updateMainNutrLogSubscription(logId);

    tick();

    lamdaRef(stateChange);

    tick();

    expect(logSubSpy).toHaveBeenCalledWith(logId);
    expect(unsubSpy).toHaveBeenCalled();
    expect(killSubSpy).toHaveBeenCalled();
    expect(hideSpinnerSpy).toHaveBeenCalled();
    expect(component.logAndPayloadSubscription).not.toBe(null);
  }));

  it('should not update mainNutritionLog and mainLogPayload  if no changes have been made to them when updateMainNutrLogSubscription is called', fakeAsync(() => {
    component.logAndPayloadSubscription = null;

    const logId = 0;
    let lamdaRef = null;
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    const log = new NutritionLog();
    const payload = new EnergyPayload();
    const stateChange = { 0: log, 1: payload } as any;
    const hideSpinnerSpy: jasmine.Spy<() => void> = spyOn(component, 'hideSpinner');
    const killSubSpy: jasmine.Spy<() => void> = spyOn(component.logSubCreator, 'killSubscriptions');
    const logSubSpy: jasmine.Spy<(id) => Promise<any>> = spyOn(component.logSubCreator, 'setLogSubscription').and.returnValue({ subscribe: async (stateChange: any) => lamdaRef = stateChange } as any);

    component.updateMainNutrLogSubscription(logId);

    tick();

    lamdaRef(null);

    tick();

    expect(logSubSpy).toHaveBeenCalled();
    expect(killSubSpy).not.toHaveBeenCalled();
    expect(hideSpinnerSpy).not.toHaveBeenCalled();
    expect(component.logAndPayloadSubscription).not.toBe(null);
    expect(component.mainNutritionLog).not.toEqual(log);
    expect(component.mainLogPayload).not.toEqual(payload);
  }));

  it('should cache the mainNutritionLog and mainLogPayload  if  updateMainNutrLogSubscription is called an the log is the usersmain log', fakeAsync(() => {
    component.logAndPayloadSubscription = null;

    const logId = 0;
    let lamdaRef = null;
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: logId
      } as any
    }
    const log = new NutritionLog();
    log.id = logId;
    const payload = new EnergyPayload();
    const stateChange = { 0: log, 1: payload } as any;
    spyOn(component, 'hideSpinner');
    spyOn(component.logSubCreator, 'killSubscriptions');
    spyOn(component.logSubCreator, 'setLogSubscription').and.returnValue({ subscribe: async (stateChange: any) => lamdaRef = stateChange } as any);

    component.updateMainNutrLogSubscription(logId);

    tick();

    lamdaRef(stateChange);

    tick();

    expect(component.stateManager.setCachedMainLogAndPayload).toHaveBeenCalled();

  }));

  it('should hide the spinner when updateMainNutrLogSubscription is called and the state change is null', fakeAsync(() => {
    component.logAndPayloadSubscription = null;
    const logId = 0;
    let lamdaRef = null;
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    const log = null;
    const payload = null;
    const stateChange = { 0: log, 1: payload } as any;
    const hideSpinnerSpy: jasmine.Spy<() => void> = spyOn(component, 'hideSpinner');
    spyOn(component.logSubCreator, 'killSubscriptions');
    spyOn(component.logSubCreator, 'setLogSubscription').and.returnValue({ subscribe: async (stateChange: any) => lamdaRef = stateChange } as any);
    component.updateMainNutrLogSubscription(logId);
    tick();
    lamdaRef(stateChange);
    tick();
    expect(hideSpinnerSpy).toHaveBeenCalled();
  }));

  it('should hide spinner when hideSpinner is called', fakeAsync(() => {
    component.showSpinner = true;

    component.hideSpinner();
    tick(component.constants.SPINNER_TIMEOUT);
    expect(component.showSpinner).toBe(false);
  }));

  it('should open the main dialog when openMainDialog is called', () => {
    const openMainDialogSpy: jasmine.Spy<() => void> = spyOn(component.dialogCreator, 'openMainLogDialog');
    component.openMainDialog();

    expect(openMainDialogSpy).toHaveBeenCalled();
  });

  it("should go to the resources page when goToResources() is called", () => {
    component.router.navigate = (routeArr) => {
      expect(routeArr[0]).toBe("resources")
      return {} as any
    };
    component.goToResources();
  });

  it("should set the main log and main payload if they both exist in the cached and getCachedLogAndPayload() is called ", () => {
    const someLog = testHelper.getRandomNutritionLog();
    const somePayload = new EnergyPayload();
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.stateManager.getCachedMainLogAndPayload = () => {
      return [
        someLog,
        somePayload
      ]
    };
    component.getCachedLogAndPayload();
    expect(component.mainNutritionLog).toBe(someLog);
    expect(component.mainLogPayload).toBe(somePayload);
  });

  it("should NOT set the main log and main payload if either or both is null in the cached and getCachedLogAndPayload() is called ", () => {
    const someLog = testHelper.getRandomNutritionLog();
    const somePayload = new EnergyPayload();
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.stateManager.getCachedMainLogAndPayload = () => {
      return [
        null,
        somePayload
      ];
    };
    component.getCachedLogAndPayload();
    expect(component.mainNutritionLog).toBe(null);
    expect(component.mainLogPayload).toBe(null);
    component.stateManager.getCachedMainLogAndPayload = () => {
      return [
        someLog,
        null
      ];
    };
    component.getCachedLogAndPayload();
    expect(component.mainNutritionLog).toBe(null);
    expect(component.mainLogPayload).toBe(null);
  });

  it("should open the health sync dialog when openHealthSync() is called ", () => {
    component.openHealthSync();
    expect(component.dialogCreator.openMobileHealthSyncDialog).toHaveBeenCalled();
  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const constants = autoSpy(ConstantsService);
  const dialogCreator = autoSpy(DialogCreatorService);
  const logSubCreator = autoSpy(LogSubscriptionCreatorService);
  const router = autoSpy(Router);
  const environment = autoSpy(EnvironmentService);
  const builder = {
    stateManager,
    constants,
    dialogCreator,
    logSubCreator,
    default() {
      return builder;
    },
    build() {
      spyOn(stateManager, 'getCurrentUser').and.returnValue(new TestHelpers().createFreeUserProfile());
      stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(null);
      return new IndividualDashboardComponent(stateManager, constants, dialogCreator, router, logSubCreator, environment);
    }
  };

  jasmine.getEnv().allowRespy(true);

  return builder;
}