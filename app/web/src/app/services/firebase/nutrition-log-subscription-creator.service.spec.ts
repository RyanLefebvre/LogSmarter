import { TestHelpers } from 'src/app/services/general/testHelpers';
import { PayloadService } from './payload.service';
import { StateManagerService } from '../general/state-manager.service';
import { FirebaseNutritionService } from './firebase-nutrition.service';
import { ObjectStorageService } from '../general/object-storage.service';
import { LogSubscriptionCreatorService } from './nutrition-log-subscription-creator.service';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject, Subscription, of } from 'rxjs';
import { EnergyPayload } from 'src/app/model-classes/nutrition-log/energy-payload';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';

describe('LogSubscriptionCreatorService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: LogSubscriptionCreatorService;

  beforeEach(() => {
    service = setup().build();
    service['logStateChangeHandler'] = new BehaviorSubject<[NutritionLog, EnergyPayload]>(null);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
  });

  it('should kill subscriptions when killSubscriptions is called 1', () => {
    service['entrySubRef'] = new Subscription();
    service['logSubRef'] = new Subscription();

    service.killSubscriptions();

    expect(service['entrySubRef'].closed).toBe(true);
    expect(service['logSubRef'].closed).toBe(true);
  });

  it('should kill subscriptions when killSubscriptions is called 2', () => {
    service['entrySubRef'] = new Subscription();
    service['logSubRef'] = null;

    service.killSubscriptions();

    expect(service['entrySubRef'].closed).toBe(true);
  });


  it('should kill subscriptions when killSubscriptions is called 2', () => {
    service['entrySubRef'] = null;
    service['logSubRef'] = new Subscription();

    service.killSubscriptions();

    expect(service['logSubRef'].closed).toBe(true);
  });

  it('send updates aout log state to other services and components when updateLogStateIfComplete is called', (done) => {
    service['initialEntriesReceived'] = true;
    service['initialSummaryReceived'] = true;
    const payloadSpy = spyOn(service.payload, 'getEnergyPayLoad').and.returnValue(new Promise(resolve => resolve(null)));
    service.updateLogStateIfComplete().then(() => {
      expect(payloadSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should set the log subscription when setLogSubscription is called (null NutritionLog)', (done) => {
    const nutrSpy = spyOn(service.fbNutr, 'getNutrLogSummarySubscription').and.returnValue(of(testHelpers.getRandomNutritionLog()));
    const nutrLogSpy = spyOn(service.fbNutr, 'getNutrLogEntriesSubscription').and.returnValue(of(testHelpers.getRandomEntryListOfLength(5)));

    service.setLogSubscription(1).then(() => {
      expect(nutrSpy).toHaveBeenCalled();
      expect(nutrLogSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should set the log subscription when setLogSubscription is called (existing NutritionLog)', (done) => {
    const nutrSpy = spyOn(service.fbNutr, 'getNutrLogSummarySubscription').and.returnValue(of(testHelpers.getRandomNutritionLog()));
    const nutrLogSpy = spyOn(service.fbNutr, 'getNutrLogEntriesSubscription').and.returnValue(of(testHelpers.getRandomEntry()));
    service['nutrLog'] = testHelpers.getRandomNutritionLog();

    service.setLogSubscription(1).then(() => {
      expect(nutrSpy).toHaveBeenCalled();
      expect(nutrLogSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should set the log subscription when setLogSubscription is called (entries have already been received)', async () => {
    service.initialEntriesReceived = true;
    let summaryLamRef;
    service.fbNutr.getNutrLogSummarySubscription = () => {
      return {
        subscribe: async (someLambda) => {
          summaryLamRef = someLambda;
          await someLambda(testHelpers.getRandomNutritionLog());
        }
      } as any
    }
    let entryLamRef;
    service.updateLogStateIfComplete = jasmine.createSpy();
    service.fbNutr.getNutrLogEntriesSubscription = () => {
      return {
        subscribe: async (someLambda) => {
          entryLamRef = someLambda;
          await someLambda(testHelpers.getRandomEntryList());
        }
      } as any;
    }
    service.setLogSubscription(1);
    expect(service.initialSummaryReceived).toBe(true);
    expect(service.updateLogStateIfComplete).toHaveBeenCalled();
  });

  it('should set the log subscription when setLogSubscription is called (summary has already been received)', async () => {
    service.initialSummaryReceived = true;
    service.initialEntriesReceived = false;
    let summaryLamRef;
    service.fbNutr.getNutrLogSummarySubscription = () => {
      return {
        subscribe: async (someLambda) => {
          summaryLamRef = someLambda;
          await someLambda(testHelpers.getRandomNutritionLog());
        }
      } as any
    }
    let entryLamRef;
    service.updateLogStateIfComplete = jasmine.createSpy();
    service.fbNutr.getNutrLogEntriesSubscription = () => {
      return {
        subscribe: async (someLambda) => {
          entryLamRef = someLambda;
          await someLambda(testHelpers.getRandomEntryList());
        }
      } as any;
    }
    service.setLogSubscription(1);
    expect(service.updateLogStateIfComplete).toHaveBeenCalled();
  });

  it('should set the log subscription when setLogSubscription is called (error in summary and error in entries)', async () => {
    service.initialSummaryReceived = true;
    service.initialEntriesReceived = false;
    let summaryLamRef;
    service.updateLogStateIfComplete = jasmine.createSpy();
    service.fbNutr.getNutrLogSummarySubscription = () => {
      return {
        subscribe: async (someLambda) => {
          summaryLamRef = someLambda;
          service.nutrLog = {} as any;
          await someLambda(null);
        }
      } as any
    }
    let entryLamRef;
    service.fbNutr.getNutrLogEntriesSubscription = () => {
      return {
        subscribe: async (someLambda) => {
          entryLamRef = someLambda;
          service.nutrLog = new NutritionLog()
          await someLambda(null);
        }
      } as any;
    }
    service.setLogSubscription(1);
    expect(service.nutrLog).toBe(null)
  });

  it('should set the log subscription when setLogSubscription is called (errors)', (done) => {
    const nutrSpy = spyOn(service.fbNutr, 'getNutrLogSummarySubscription').and.returnValue(of(testHelpers.getRandomNutritionLog()));
    const nutrLogSpy = spyOn(service.fbNutr, 'getNutrLogEntriesSubscription').and.returnValue(of(testHelpers.getRandomEntry()));

    service.setLogSubscription(1).then(() => {
      expect(nutrSpy).toHaveBeenCalled();
      expect(nutrLogSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT set the log subscription when setLogSubscription is called if it does not need to', (done) => {
    service.logId = 694201337;
    service.logStateChangeHandler = "someObject" as any;
    let originalStateChangeRef = service.logStateChangeHandler;
    service.setLogSubscription(service.logId).then(handler => {
      expect(handler).toBe(originalStateChangeRef);
      done();
    });
  });

});

function setup() {
  const payload = autoSpy(PayloadService);
  const stateManager = autoSpy(StateManagerService);
  const fbNutr = autoSpy(FirebaseNutritionService);
  const objectManager = autoSpy(ObjectStorageService);
  const builder = {
    payload,
    stateManager,
    fbNutr,
    objectManager,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new LogSubscriptionCreatorService(payload, stateManager, fbNutr, objectManager);
    }
  };

  return builder;
}
