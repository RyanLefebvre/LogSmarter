import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { Router } from '@angular/router';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { InDepthNutritionLogDisplayComponent } from './in-depth-display.component';
import { autoSpy } from 'autoSpy';
import { Subscription, BehaviorSubject } from 'rxjs';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { ExporterService } from 'src/app/services/general/exporter-service.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';

describe('InDepthNutritionLogDisplayComponent', () => {

  let component: InDepthNutritionLogDisplayComponent;

  beforeEach(() => {
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should call displayLogSubscription() wehn ngOnInit() is called', () => {
    const displayLogSubSpy = spyOn(component, 'displayLogSubscription');
    component.ngOnInit();
    expect(displayLogSubSpy).toHaveBeenCalled();
  })

  it('should kill any subscriptions that are not null when ngOnDestroy() is called', () => {
    component.displaySubRef = new Subscription();
    component.payloadSub = new Subscription();
    const displayUnsubSpy = spyOn(component.displaySubRef, 'unsubscribe');
    const payloadUnsubSpy = spyOn(component.payloadSub, 'unsubscribe');
    component.ngOnDestroy();
    expect(displayUnsubSpy).toHaveBeenCalled();
    expect(payloadUnsubSpy).toHaveBeenCalled();
  });

  it('should kill any subscriptionsif they are null when ngOnDestroy() is called', () => {
    component.displaySubRef = null
    component.payloadSub = null;
    component.ngOnDestroy();
    expect(component.displaySubRef).toBe(null)
    expect(component.payloadSub).toBe(null);
  });

  it('should return true if window.innerWidth is < than 673 and showGraphAndVarsButtons is called', () => {
    spyOnProperty(window, 'innerWidth').and.returnValue(670);
    expect(component.showGraphAndVarsButtons()).toBe(true);
  });

  it('should return false if window.innerWidth is 673 and showGraphAndVarsButtons is called', () => {
    spyOnProperty(window, 'innerWidth').and.returnValue(673);
    expect(component.showGraphAndVarsButtons()).toBe(false);
  });

  it('should return false if window.innerWidth is  > 673 and showGraphAndVarsButtons is called', () => {
    spyOnProperty(window, 'innerWidth').and.returnValue(690);
    expect(component.showGraphAndVarsButtons()).toBe(false);
  });

  it('should open the energy payload dialog if showInDepthStats() is true and openAnalysis() is called', () => {
    spyOn(component, 'showInDepthStats').and.callFake(() => true);
    component.openAnalysis();
    expect(component.dialog.openEnergyPayloadDialog).toHaveBeenCalled();
  });

  it('should open an account warning dialog if the showInDepthStats() is false and openAnalysis() is called', () => {
    spyOn(component, 'showInDepthStats').and.callFake(() => false);
    component.openAnalysis();
    expect(component.dialog.openAppropritateAccountDialog).toHaveBeenCalled();
  });

  it('should open the logManagementDialog if settingsClick() is called', () => {
    component.settingsClick();
    expect(component.dialog.openLogManagementDialog).toHaveBeenCalled();
  });

  it('should return the users tiers inDepthStats value if showInDepthStats() is called ', () => {
    const expectedValue = true;
    component.tierPermissionsManager.getUserTier = () => {
      return {
        inDepthStats: expectedValue
      }
    }
    const actualvalue = component.showInDepthStats();
    const actualIsExpected = (actualvalue == expectedValue);
    expect(actualIsExpected).toBe(true);
  });

  it('should return true when showVars() is called if showGraphAndVarsButtons() is false ', () => {
    spyOn(component, 'showGraphAndVarsButtons').and.callFake(() => false);
    expect(component.showVars()).toBe(true);
  });

  it('should return true when showVars() is called if showVars is true ', () => {
    spyOn(component, 'showGraphAndVarsButtons').and.callFake(() => true);
    component.userShowVars = true;
    expect(component.showVars()).toBe(true);
  });

  it('should return false when showVars() is called if showVars is false and showGraphAndVarsButtons() is false ', () => {
    spyOn(component, 'showGraphAndVarsButtons').and.callFake(() => true);
    component.userShowVars = false;
    expect(component.showVars()).toBe(false);
  });

  it('should return true when showGraph() is called if showGraphAndVarsButtons() is false ', () => {
    spyOn(component, 'showGraphAndVarsButtons').and.callFake(() => false);
    expect(component.showGraph()).toBe(true);
  });

  it('should return true when showGraph() is called if showGraph is true ', () => {
    spyOn(component, 'showGraphAndVarsButtons').and.callFake(() => true);
    component.userShowGraph = true;
    expect(component.showGraph()).toBe(true);
  });

  it('should return false when showGraph() is called if showGraph is false and showGraphAndVarsButtons() is false ', () => {
    spyOn(component, 'showGraphAndVarsButtons').and.callFake(() => true);
    component.userShowGraph = false;
    expect(component.showGraph()).toBe(false);
  });

  it('should return the insufficient data string when checkForInsufficientData() is called if the value passed in is insufficient', () => {
    component.constants.INSUFFICIENT_DATA = null;
    component.constants.INSUFFICIENT_DATA_STRING = "thisIsTheExpectedString"
    expect(component.checkForInsufficientData(component.constants.INSUFFICIENT_DATA)).toBe(component.constants.INSUFFICIENT_DATA_STRING);
  });

  it('should return the value passed in when checkForInsufficientData() is called if the value passed in is sufficient', () => {
    component.constants.INSUFFICIENT_DATA = null;
    component.constants.INSUFFICIENT_DATA_STRING = "thisIsTheExpectedString"
    const valToPassIn = "SomeValueThatIsNotInsufficient";
    expect(component.checkForInsufficientData(valToPassIn)).toBe(valToPassIn);
  });

  it("should do nothing if the logAndPayload are null when the displayLogSubscription body is triggered ", () => {
    let lamRef;
    component.displayLogObservable = {
      subscribe: (someLam) => {
        lamRef = someLam;
      }
    } as any;
    let crashed = false;
    try {
      component.displayLogSubscription();
      lamRef(null)
      lamRef([null, null]);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should set the display log when displayLogSubscription() is called ", () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    spyOn(component.displayLogObservable, 'subscribe').and.callFake(() => new Subscription);
    component.displayLogSubscription();
    const subRefIsNotNull = (component.displaySubRef != null);
    expect(subRefIsNotNull).toBe(true);
  });

  it('should set the log and payload and turn off all spinners in the display log subscription body ', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeCallSpy = spyOn(component.displayLogObservable, 'subscribe').and.callFake(() => new Subscription);
    component.displayLogSubscription();
    const subscriptionBody = subscribeCallSpy.calls.argsFor(0)[0];
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: "someRandomValueThatIsntEvenANumber"
      } as any
    }
    const expectedNutritionLog = new NutritionLog();
    const expectedPayload = new EnergyPayload();
    subscriptionBody([expectedNutritionLog, expectedPayload]);
    expect(component.logBeingObserved).toBe(expectedNutritionLog);
    expect(component.payload).toBe(expectedPayload);
    expect(component.showStatsSpinner).toBe(false);
    expect(component.showVariablesSpinner).toBe(false);
  });

  it("should cache the log in the display log subscription body if it is the user's main log", () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeCallSpy = spyOn(component.displayLogObservable, 'subscribe').and.callFake(() => new Subscription);
    component.displayLogSubscription();
    const subscriptionBody = subscribeCallSpy.calls.argsFor(0)[0];
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    const expectedNutritionLog = new NutritionLog();
    const expectedPayload = new EnergyPayload();
    component.stateManager.getCurrentUser = () => {
      return {
        mainNutrLogId: expectedNutritionLog.id
      } as any
    }
    const logAndPayload = [expectedNutritionLog, expectedPayload] as any
    subscriptionBody(logAndPayload);
    expect(component.stateManager.setCachedMainLogAndPayload).toHaveBeenCalledWith(logAndPayload);

  });

});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const router = autoSpy(Router);
  const dialog = autoSpy(DialogCreatorService);
  const tierPermissionsManager = autoSpy(TierPermissionsService);
  const constants = autoSpy(NutritionConstanstsService);
  const subCreator = autoSpy(LogSubscriptionCreatorService);
  const iap = autoSpy(InAppPurchaseService);
  const exporter = autoSpy(ExporterService);
  const builder = {
    stateManager,
    router,
    dialog,
    tierPermissionsManager,
    constants,
    subCreator,
    default() {
      return builder;
    },
    build() {
      return new InDepthNutritionLogDisplayComponent(stateManager, router, dialog, tierPermissionsManager, subCreator, constants, iap, exporter, new EnvironmentService());
    }
  };

  return builder;
}
