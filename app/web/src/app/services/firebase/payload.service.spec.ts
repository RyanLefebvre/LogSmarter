import { TestHelpers } from 'src/app/services/general/testHelpers';
import { CallableWrapperService } from './callable-wrapper.service';
import { StateManagerService } from '../general/state-manager.service';
import { NutritionConstanstsService } from '../nutrition-log/nutrition-constansts.service';
import { PayloadService } from './payload.service';
import { autoSpy } from 'autoSpy';
import { TimeService } from '../general/time-constant.service';
import { ObjectStorageService } from '../general/object-storage.service';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { DayEntry } from 'functions/src/classes/day-entry';

describe('PayloadService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: PayloadService;
  let cloudFunctionSpy;

  beforeEach(() => {
    service = setup().build();
    cloudFunctionSpy = spyOn(service.wrapper, 'firebaseCloudFunction').and.returnValue(new Promise<any>(resolve => resolve(null)));
  });

  it('should return the results of running the LogSmarter TDEE estimation algorithm when getEnergyPayLoad is called', (done) => {
    spyOn(service.stateManager, 'getCurrentUser').and.returnValue(testHelpers.createFreeUserProfile());
    service.getEnergyPayLoad(testHelpers.getRandomNutritionLog()).then(() => {
      expect(cloudFunctionSpy).toHaveBeenCalled();
      done();
    });
  });

  it("should return false if the latest entry is incomplete when latestEntryIsIncomplete() is called and there is no latest entry", () => {
    service.getLatestEntry = () => null;
    expect(service.latestEntryIsIncomplete(new NutritionLog())).toBe(false);
  });

  it("should return a call to entryIsIncomplete() if latestEntryIsIncomplete() is called and there is a latest entry", () => {
    service.getLatestEntry = () => true as any;
    const itGotCalled = "someValue";
    service.dayEntryIsIncomplete = () => itGotCalled as any;
    expect(service.latestEntryIsIncomplete(new NutritionLog())).toBe(itGotCalled as any);
  });

  it('should return that the entry is incomplete if it has no weight or calories', () => {
    expect(service.dayEntryIsIncomplete(new DayEntry())).toBe(true)
  });

  it('should return that the entry is incomplete if it only has a weight and no calories', () => {
    let entry = new DayEntry();
    entry.calories = null;
    entry.weight = 198;
    expect(service.dayEntryIsIncomplete(new DayEntry())).toBe(true)
  });

  it('should return that the entry is incomplete if it only has calories and no weight', () => {
    let entry = new DayEntry();
    entry.calories = 3000;
    entry.weight = null;
    expect(service.dayEntryIsIncomplete(new DayEntry())).toBe(true)
  });

  it('should return that the entry is incomplete if it only has a weight and no calories', () => {
    let entry = new DayEntry();
    entry.calories = null;
    entry.weight = 198;
    expect(service.dayEntryIsIncomplete(new DayEntry())).toBe(true)
  });

  it('should NOT return that the entry is incomplete if calories and weight are 0', () => {
    let entry = new DayEntry();
    entry.calories = 3000;
    entry.weight = 0;
    expect(service.dayEntryIsIncomplete(entry)).toBe(false)
    entry = new DayEntry();
    entry.calories = 0;
    entry.weight = 198;
    expect(service.dayEntryIsIncomplete(entry)).toBe(false)
  });

  it("should get the latest entry from the log when getLatestEntry() is called and the list is not empty", () => {
    let log = new NutritionLog();
    log.dayEntries = testHelpers.getRandomEntryList();
    let lowTime = 100;
    let highTime = 200;
    log.dayEntries = log.dayEntries.map(entry => { entry.date = new Date(lowTime); return entry; });
    let latestEntry = new DayEntry();
    latestEntry.date = new Date(highTime);
    log.dayEntries.push(latestEntry);
    expect(service.getLatestEntry(log)).toBe(latestEntry);
  });

  it("should return null when getLatestEntry() is called if the log is null", () => {
    expect(service.getLatestEntry(null)).toBe(null);
  });

  it("should return null when getLatestEntry() is called if the log is null", () => {
    expect(service.getLatestEntry(new NutritionLog())).toBe(null);
  });

});

function setup() {
  const wrapper = autoSpy(CallableWrapperService);
  const stateManager = autoSpy(StateManagerService);
  const time = autoSpy(TimeService);
  const store = autoSpy(ObjectStorageService);
  const constants = autoSpy(NutritionConstanstsService);
  const builder = {
    wrapper,
    stateManager,
    constants,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new PayloadService(wrapper, stateManager, time, store, constants);
    }
  };

  return builder;
}
