import { ActivatedRoute, Params } from '@angular/router';
import { Router } from '@angular/router';
import { LogSubscriptionCreatorService } from 'src/app/services/firebase/nutrition-log-subscription-creator.service';
import { NutritionLogInDepthComponent } from './log-in-depth.component';
import { autoSpy } from 'autoSpy';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { fakeAsync, tick } from '@angular/core/testing';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { UserProfile } from 'src/app/model-classes/general/user-profile';

describe('NutritionLogInDepthComponent', () => {

  let component: NutritionLogInDepthComponent;

  /**
   * Need references to these functions because they are globally mocked.
   */
  let getInfoFromRouteSpy = null;
  let watchForBadValueSpy = null;

  beforeEach(() => {
    getInfoFromRouteSpy = spyOn(NutritionLogInDepthComponent.prototype, 'getLogIdAndUidFromRoute')
    watchForBadValueSpy = spyOn(NutritionLogInDepthComponent.prototype, 'watchForBadObservableValue')
    component = setup().default().build();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should not crash when ngOnInit() is called', () => {
    let somethingBadHappened = false;
    try {
      component.ngOnInit();
    } catch (error) {
      somethingBadHappened = true;
    }
    expect(somethingBadHappened).toBe(false)
  });

  it('should kill all subscriptions when ngOnDestroy() is called', () => {
    component.myRouteSub = new Subscription();
    const unsubRouterSpy = spyOn(component.myRouteSub, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubRouterSpy).toHaveBeenCalled();
    expect(component.logSubCreator.killSubscriptions).toHaveBeenCalled();
  });

  it('should call router.navigate() with the dashboard url as the param when backtoDash() is called ', () => {
    component.DASHBOARD = "fakeDashboardRoute";
    component.backToDash()
    expect(component.router.navigate).toHaveBeenCalledWith([component.DASHBOARD]);
  });

  it("should return true when displayInDepth() is called if the displayLog is not null ", () => {
    spyOn(component, 'getDisplayLog').and.callFake(() => [new NutritionLog(), null]);
    expect(component.displayInDepth()).toBe(true);
  });

  it("should return false when displayInDepth() is called if the displayLog is  null ", () => {
    spyOn(component, 'getDisplayLog').and.callFake(() => null);
    expect(component.displayInDepth()).toBe(false);
  });

  it('should return null when getDisplayLog() is called if the displayLogObservable is null', () => {
    component.displayLogObservable = null;
    expect(component.getDisplayLog()).toBe(null);
  });

  it('should return null when getDisplayLog() is called if the displayLogObservable is null', () => {
    const expectedValueOfObservable = "someFakeValue";
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    spyOnProperty(component.displayLogObservable, 'value').and.returnValue(expectedValueOfObservable);
    expect(component.getDisplayLog()).toBe(expectedValueOfObservable);
  });

  it('should call subscribe on the displayLogObservable when watchForBadObservableVale() is called ', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    expect(subscribeSpy).toHaveBeenCalled();
  });

  it('should set the initialPayloadReceived variable to true if it is false when watching for bad observable values', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    const subscribeSpyBody = subscribeSpy.calls.argsFor(0)[0];
    component.initialPayloadReceived = false;
    expect(component.initialPayloadReceived).toBe(false);
    subscribeSpyBody(null);
    expect(component.initialPayloadReceived).toBe(true);
  });


  it('should set the main log and main log payload to the cached log and payload if they exist when watching for bad observable values', () => {
    watchForBadValueSpy.and.callThrough();
    const someLog = new NutritionLog();
    const somePayload = new EnergyPayload();
    component.hasAlreadyGottenCacehdLog = false;
    component.displayLogObservable = {
      next: jasmine.createSpy(),
      subscribe: jasmine.createSpy()
    } as any;
    const cachedLogandPayload: any = [
      someLog,
      somePayload
    ];
    component.lid = someLog.id;
    component.stateManager.getCachedMainLogAndPayload = () => {
      return cachedLogandPayload;
    }
    component.watchForBadObservableValue();
    expect(component.hasAlreadyGottenCacehdLog).toBe(true);
    expect(component.displayLogObservable.next).toHaveBeenCalledWith(cachedLogandPayload)
  });

  it('should NOT set the main log and main log payload to the cached log and payload if they exist when watching for bad observable values but log is not main', () => {
    watchForBadValueSpy.and.callThrough();
    const someLog = new NutritionLog();
    const somePayload = new EnergyPayload();
    component.hasAlreadyGottenCacehdLog = false;
    component.displayLogObservable = {
      next: jasmine.createSpy(),
      subscribe: jasmine.createSpy()
    } as any;
    const cachedLogandPayload: any = [
      someLog,
      somePayload
    ];
    component.lid = someLog.id + (Math.random() + 1);
    component.stateManager.getCachedMainLogAndPayload = () => {
      return cachedLogandPayload;
    }
    component.watchForBadObservableValue();
    expect(component.hasAlreadyGottenCacehdLog).toBe(false);
    expect(component.displayLogObservable.next).not.toHaveBeenCalledWith(cachedLogandPayload)
  });

  it('should NOT set the main log and main log payload to the cached log and payload if they exist but it has already been done when watching for bad observable values', () => {
    watchForBadValueSpy.and.callThrough();
    const someLog = new NutritionLog();
    const somePayload = new EnergyPayload();
    component.hasAlreadyGottenCacehdLog = false;
    component.displayLogObservable = {
      next: jasmine.createSpy(),
      subscribe: jasmine.createSpy()
    } as any;
    const cachedLogandPayload: any = [
      someLog,
      somePayload
    ];
    component.lid = someLog.id;
    component.stateManager.getCachedMainLogAndPayload = () => {
      return cachedLogandPayload;
    }
    component.hasAlreadyGottenCacehdLog = true;
    component.watchForBadObservableValue();
    expect(component.displayLogObservable.next).not.toHaveBeenCalled();
  });

  it('should NOT set the main log and main log payload to the cached log and payload if they do not exist when watching for bad observable values', () => {
    watchForBadValueSpy.and.callThrough();
    component.hasAlreadyGottenCacehdLog = false;
    component.displayLogObservable = {
      next: jasmine.createSpy(),
      subscribe: jasmine.createSpy()
    } as any;
    const cachedLogandPayload: any = null;
    component.stateManager.getCachedMainLogAndPayload = () => {
      return cachedLogandPayload;
    }
    component.watchForBadObservableValue();
    expect(component.displayLogObservable.next).not.toHaveBeenCalled();
  });

  it('should go back to the dashboard when watching for bad observable values if the obseravble value is null', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    const dashSpy = spyOn(component, 'backToDash');
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    const subscribeSpyBody = subscribeSpy.calls.argsFor(0)[0];
    component.initialPayloadReceived = true;
    subscribeSpyBody(null);
    expect(dashSpy).toHaveBeenCalled();
  });

  it('should go back to the dashboard when watching for bad observable values if the log in the obseravble value is null', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    const dashSpy = spyOn(component, 'backToDash');
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    const subscribeSpyBody = subscribeSpy.calls.argsFor(0)[0];
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.initialPayloadReceived = true;
    subscribeSpyBody([null, new EnergyPayload()]);
    expect(dashSpy).toHaveBeenCalled();
  });

  it('should NOT go back to the dashboard when watching for bad observable values if the user is requesting the cached log and it is their main', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    const dashSpy = spyOn(component, 'backToDash');
    const mainLog = new NutritionLog();
    mainLog.id = 1234567890;
    component.lid = mainLog.id;
    component.stateManager.getCachedMainLogAndPayload = () => { return [mainLog, new EnergyPayload()] }
    component.stateManager.getCurrentUser = () => { let user = new UserProfile(); user.mainNutrLogId = mainLog.id; return user; };
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    const subscribeSpyBody = subscribeSpy.calls.argsFor(0)[0];
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.initialPayloadReceived = true;
    subscribeSpyBody([null, new EnergyPayload()]);
    expect(dashSpy).not.toHaveBeenCalled();
  });

  it('should go back to the dashboard when watching for bad observable values if the user is requesting the cached log and it is not their main', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    const dashSpy = spyOn(component, 'backToDash');
    const mainLog = new NutritionLog();
    mainLog.id = 1234567890;
    component.lid = mainLog.id;
    component.stateManager.getCachedMainLogAndPayload = () => { return [mainLog, new EnergyPayload()] }
    component.stateManager.getCurrentUser = () => new UserProfile();
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    const subscribeSpyBody = subscribeSpy.calls.argsFor(0)[0];
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.initialPayloadReceived = true;
    subscribeSpyBody([null, new EnergyPayload()]);
    expect(dashSpy).toHaveBeenCalled();
  });

  it('should go back to the dashboard when watching for bad observable values if the log in the obseravble value is null', () => {
    component.displayLogObservable = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    const subscribeSpy = spyOn(component.displayLogObservable, 'subscribe');
    const dashSpy = spyOn(component, 'backToDash');
    watchForBadValueSpy.and.callThrough();
    component.watchForBadObservableValue();
    const subscribeSpyBody = subscribeSpy.calls.argsFor(0)[0];
    component.logSubCreator.NUTR_LOG_IDX = 0;
    component.logSubCreator.ENERGY_PAYLOAD_IDX = 1;
    component.initialPayloadReceived = true;
    subscribeSpyBody([new NutritionLog(), null]);
    expect(dashSpy).toHaveBeenCalled();
  });

  it('should set the myRouteSub variable when getLogIdAndUidFromRoute() is called ', () => {
    component.myRouteSub = null;
    expect(component.myRouteSub).toBe(null);
    getInfoFromRouteSpy.and.callThrough();
    component.route.params = {
      pipe: (someShitAsParams) => { return new Observable() }
    } as any;
    component.getLogIdAndUidFromRoute();
    const subIsNotNull = component.myRouteSub != null;
    expect(subIsNotNull).toBe(true);
  });

  it('should call backtoDash() when getLogIdAndUidFromRoute() is called if there is an error in the subscription body ', fakeAsync(() => {
    component.myRouteSub = null;
    expect(component.myRouteSub).toBe(null);
    getInfoFromRouteSpy.and.callThrough();
    const dashSpy = spyOn(component, 'backToDash');
    const objectSentAsObservableValue = null;
    component.route.params = {
      pipe: (someShitAsParams) => { return new BehaviorSubject<any>(objectSentAsObservableValue) }
    } as any;
    component.getLogIdAndUidFromRoute();
    expect(dashSpy).toHaveBeenCalled();
  }));

  it('should call backtoDash() when getLogIdAndUidFromRoute() is called if there is no lid in the subscription body ', fakeAsync(() => {
    component.myRouteSub = null;
    expect(component.myRouteSub).toBe(null);
    getInfoFromRouteSpy.and.callThrough();
    const dashSpy = spyOn(component, 'backToDash');
    const objectSentAsObservableValue = {
      uid: "uid",
      lid: null
    }
    component.route.params = {
      pipe: (someShitAsParams) => { return new BehaviorSubject<any>(objectSentAsObservableValue) }
    } as any;
    component.getLogIdAndUidFromRoute();
    expect(dashSpy).toHaveBeenCalled();
  }));

  it('should call backtoDash() when getLogIdAndUidFromRoute() is called if there is no uid in the subscription body ', fakeAsync(() => {
    component.myRouteSub = null;
    expect(component.myRouteSub).toBe(null);
    getInfoFromRouteSpy.and.callThrough();
    const dashSpy = spyOn(component, 'backToDash');
    const objectSentAsObservableValue = {
      uid: null,
      lid: "lid"
    }
    component.route.params = {
      pipe: (someShitAsParams) => { return new BehaviorSubject<any>(objectSentAsObservableValue) }
    } as any;
    component.getLogIdAndUidFromRoute();
    expect(dashSpy).toHaveBeenCalled();
  }));

  it("should still kill subscriptions even if the route sub is null", () => {
    component.myRouteSub = null;
    component.ngOnDestroy();
    expect(component.logSubCreator.killSubscriptions).toHaveBeenCalled();
  })

  it('should set the displayLogObservable and watchForBadValues() when getLogIdAndUidFromRoute() is called if there is an lid and uid in the subscription body ', fakeAsync(() => {
    component.myRouteSub = null;
    expect(component.myRouteSub).toBe(null);
    getInfoFromRouteSpy.and.callThrough();
    let setLogWasCalled = false;
    component.logSubCreator.setLogSubscription = () => {
      setLogWasCalled = true;
      return null
    };
    const objectSentAsObservableValue = {
      uid: "uid",
      lid: "lid"
    }
    component.route.params = {
      pipe: (someShitAsParams) => { return new BehaviorSubject<any>(objectSentAsObservableValue) }
    } as any;
    component.getLogIdAndUidFromRoute();
    tick();
    expect(setLogWasCalled).toBe(true);
    expect(watchForBadValueSpy).toHaveBeenCalled();
  }));

});

function setup() {
  const route = autoSpy(ActivatedRoute);
  const router = autoSpy(Router);
  const logSubCreator = autoSpy(LogSubscriptionCreatorService);
  const stateManager = autoSpy(StateManagerService);
  const authService = autoSpy(AuthenticationService);
  const snackbar = autoSpy(SnackBarService);
  const builder = {
    route,
    router,
    logSubCreator,
    stateManager,
    default() {
      return builder;
    },
    build() {
      return new NutritionLogInDepthComponent(route, router, stateManager, authService, snackbar, logSubCreator);
    }
  };

  return builder;
}
