import { TestHelpers } from './testHelpers';
import { TimeService } from './time-constant.service';
import { ConversionService } from './conversion.service';
import { MobileHealthSyncService } from './mobile-health-sync.service';
import { autoSpy } from 'autoSpy';
import { DayEntry } from 'functions/src/classes/day-entry';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { EnvironmentService } from './environment.service';

describe('MobileHealthSyncService', () => {

  let service: MobileHealthSyncService;

  beforeEach(() => {
    const { build } = setup().default();
    service = build();
  });


  it('when setUpHealthSync is called it should add an event listener to the deviceReady event', () => {
    document.addEventListener = async (event, lam) => {
      expect(event).toBe('deviceready');
      await lam();
      service.HEALTH = {};
      await lam();
      return;
    }
    service.setUpHealthSync();
  });

  it("should return false when healthIsAvailable() is called if health is null", async () => {
    service.HEALTH = null;
    expect(await service.healthIsAvailable()).toBe(false);
  })

  it("should resolve to the result of HEALTH.isAvailable when healthIsAvailable is called and HEALTH is not null", async () => {
    const expectedVal: any = "blahBlah";
    service.HEALTH = {
      isAvailable: (someLam) => {
        someLam(expectedVal);
      }
    }
    expect(await service.healthIsAvailable()).toBe(expectedVal);
  });

  it("should query the health object with the data passed in and return whatever the query resolves to when query is called", async () => {
    const expectedData = ["someData", "someOtherData"];
    const fakeStartDate: any = "fakeStartDate";
    const fakeEndDate: any = "fakeEndDate";
    const fakeDataType = "fakeDataType";
    service.HEALTH = {
      query: (queryParams, lam) => {
        expect(queryParams.startDate).toBe(fakeStartDate);
        expect(queryParams.endDate).toBe(fakeEndDate);
        expect(queryParams.dataType).toBe(fakeDataType);
        lam(expectedData);
      }
    };
    expect(await service.query(fakeDataType, fakeStartDate, fakeEndDate)).toBe(expectedData);
  });

  it("should query the health plugin for weight and calories then call convertRawDataToEntryList when getEntriesFromHealthQuery() is called ", async () => {
    const calorieQueryResponse = "calQResp";
    const weightQueryResponse = "weightQResp";
    service.query = (dataType) => {
      if (dataType == service.DATA_TYPE_CALORIES) {
        return calorieQueryResponse as any;
      }
      else if (dataType == service.DATA_TYPE_WEIGHT) {
        return weightQueryResponse as any;
      }
      else {
        return null as any;
      }
    }
    const expectedConvertResponse = "someResponse";
    service.convertRawDataToEntryList = (weightData, calorieData) => {
      expect(weightData).toBe(weightQueryResponse);
      expect(calorieData).toBe(calorieQueryResponse);
      return expectedConvertResponse as any;
    }
    expect(await service.getEntriesFromHealthQuery(new Date(), new Date())).toBe(expectedConvertResponse as any)
  });

  it("should query the health plugin for weight and calories then call convertRawDataToEntryList when getEntriesFromHealthQuery() is called (android)", async () => {
    service.environmentService.isAndroid = true;
    const calorieQueryResponse = "calQResp";
    const weightQueryResponse = "weightQResp";
    service.query = (dataType) => {
      if (dataType == service.DATA_TYPE_CALORIES) {
        return calorieQueryResponse as any;
      }
      else if (dataType == service.DATA_TYPE_WEIGHT) {
        return weightQueryResponse as any;
      }
      else {
        return null as any;
      }
    }
    service.time = new TimeService();
    const time = service.time;
    const startDate = new Date(time.getTimeStamp());
    const endDate = new Date(startDate.getTime() + (time.getWeekInMillis()));
    const halfwayEntry = new DayEntry();
    halfwayEntry.date = { getTime: () => startDate.getTime() + time.getDayInMillis() } as any;
    const expectedConvertResponse = [halfwayEntry];
    service.convertRawDataToEntryList = (weightData, calorieData) => {
      expect(weightData).toBe(weightQueryResponse);
      expect(calorieData).toBe(calorieQueryResponse);
      return expectedConvertResponse as any;
    }
    expect(await service.getEntriesFromHealthQuery(startDate, endDate)).toEqual(expectedConvertResponse as any)
  });

  it("should return the auth result when requestAuthorization() is called ", async () => {
    const expectedAuthRequestResponse = "IamAuthorizedMaybe";
    service.HEALTH = {
      requestAuthorization: (queryParams, lam) => {
        expect(queryParams).toBe(service.READ_DATA_DEFINITION);
        lam(expectedAuthRequestResponse);
      }
    };
    expect(await service.requestAuthorization()).toBe(expectedAuthRequestResponse as any);
  });

  it("should return true if healhtDataIsAvailable is called and the user can write to either weight or calories 1", async () => {
    let calorieResponse = true;
    let weightResponse = false;
    service.HEALTH = {
      isAuthorized: (queryParams, lam) => {
        if (queryParams[0]['write'] == service.DATA_TYPE_CALORIES) {
          lam(calorieResponse)
        }
        else if (queryParams[0]['write'] == service.DATA_TYPE_WEIGHT) {
          lam(weightResponse)
        }
        else {
          lam(false)
        }
      }
    };
    expect(await service.healthDataAvailable()).toBe(true);
  });

  it("should return true if healhtDataIsAvailable is called and the user can write to either weight or calories 2", async () => {
    let calorieResponse = false;
    let weightResponse = true;
    service.HEALTH = {
      isAuthorized: (queryParams, lam) => {
        if (queryParams[0]['write'] == service.DATA_TYPE_CALORIES) {
          lam(calorieResponse)
        }
        else if (queryParams[0]['write'] == service.DATA_TYPE_WEIGHT) {
          lam(weightResponse)
        }
        else {
          lam(false)
        }
      }
    };
    expect(await service.healthDataAvailable()).toBe(true);
  });

  it("should return true if healhtDataIsAvailable is called and the user can write to either weight or calories 3", async () => {
    let calorieResponse = false;
    let weightResponse = false;
    service.HEALTH = {
      isAuthorized: (queryParams, lam) => {
        if (queryParams[0]['write'] == service.DATA_TYPE_CALORIES) {
          lam(calorieResponse)
        }
        else if (queryParams[0]['write'] == service.DATA_TYPE_WEIGHT) {
          lam(weightResponse)
        }
        else {
          lam(false)
        }
      }
    };
    expect(await service.healthDataAvailable()).toBe(false);
  });

  it("should convert all of the rawWeightData and rawCalorieData into concatenated entries when convertRawDataToEntryList() is called ", async () => {
    const timeService = new TimeService();
    service.time = timeService;
    const fakeDate1 = new Date();
    const fakeDate2 = timeService.getOneDayLater(fakeDate1);
    const fakeDate3 = timeService.getOneDayLater(fakeDate2);
    const fakeDate4 = timeService.getOneDayLater(fakeDate3);
    const fakeDate5 = timeService.getOneDayLater(fakeDate4);
    const fakeDate6 = timeService.getOneDayLater(fakeDate5);
    let convertWasCalled = false;
    service.converter.convertKgToLbs = (num) => { convertWasCalled = true; return num };
    const rawCalorieData = [
      { value: 1, startDate: fakeDate1 },
      { value: 2, startDate: fakeDate2 },
      { value: 3, startDate: fakeDate3 },
      { value: 19, startDate: fakeDate5 },
      { value: 21, startDate: fakeDate5 },
      { value: null, startDate: fakeDate5 }
    ];
    const rawWeightData = [
      { value: 64, startDate: fakeDate1 },
      { value: 65, startDate: fakeDate2 },
      { value: 63, startDate: fakeDate3 },
      { value: 27, startDate: fakeDate4 },
      { value: null, startDate: fakeDate4 }
    ];
    const converted = await (service.convertRawDataToEntryList(rawWeightData, rawCalorieData));
    const forceChronologicalOrder = (entry1: DayEntry, entry2: DayEntry) => { return entry1.id - entry2.id };
    converted.sort(forceChronologicalOrder);
    expect(converted[0].weight).toBe(64);
    expect(converted[0].calories).toBe(1);
    expect(converted[1].weight).toBe(65);
    expect(converted[1].calories).toBe(2);
    expect(converted[2].weight).toBe(63);
    expect(converted[2].calories).toBe(3);
    expect(converted[3].weight).toBe(27);
    expect(converted[3].calories).toBe(null);
    expect(converted[4].weight).toBe(null);
    expect(converted[4].calories).toBe(40);
    expect(converted.length).toBe(5);
    expect(convertWasCalled).toBe(true);
  });

  it("should fail silently when writeToHealthAppIfAuthorized() is called and there is an error  ", async () => {
    let crashed = false;
    try {
      const entry = new DayEntry();
      service.healthIsAvailable = () => { throw { message: "SomeRandomError" } };
      await service.writeToHealthAppIfAuthorized(entry);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it("should not write to the health app when writeToHealthAppIfAuthorized is called and the entry has no weight or calories  ", async () => {
    let crashed = false;
    service.HEALTH = {
      store: jasmine.createSpy()
    }
    try {
      const entry = new DayEntry();
      service.healthIsAvailable = () => { throw { message: "SomeRandomError" } };
      await service.writeToHealthAppIfAuthorized(entry);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
    expect(service.HEALTH.store).not.toHaveBeenCalled();
  });

  it("should not write to the health app when writeToHealthAppIfAuthorized is called and the service is not available ", async () => {
    let crashed = false;
    service.HEALTH = {
      store: jasmine.createSpy()
    }
    try {
      const entry = new DayEntry();
      entry.calories = 9739329;
      service.healthIsAvailable = async () => false;
      await service.writeToHealthAppIfAuthorized(entry);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
    expect(service.HEALTH.store).not.toHaveBeenCalled();
  });

  it("should not write to the health app when writeToHealthAppIfAuthorized is called and the data is not available ", async () => {
    let crashed = false;
    service.HEALTH = {
      store: jasmine.createSpy()
    }
    try {
      const entry = new DayEntry();
      entry.weight = 9739329;
      service.healthIsAvailable = async () => true;
      service.healthDataAvailable = async () => false;
      await service.writeToHealthAppIfAuthorized(entry);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
    expect(service.HEALTH.store).not.toHaveBeenCalled();
  });

  it("should write to the health app when writeToHealthAppIfAuthorized is called and the services, data and entry are all valid with no overwrites", async () => {
    let crashed = false;
    const time = new TimeService();
    service.time = new TimeService();
    service.HEALTH = {
      store: jasmine.createSpy().and.callFake((storageStuff, callback, err) => {
        if (storageStuff.dataType == service.DATA_TYPE_WEIGHT) {
          expect(time.datesAreOnSameDay(storageStuff.startDate, storageStuff.endDate)).toBe(true);
        }
        else if (storageStuff.dataType == service.DATA_TYPE_CALORIES) {
          expect(time.datesAreOnSameDay(storageStuff.startDate, storageStuff.endDate)).toBe(true);
        }
        callback();
        err();
      })
    }
    try {
      const entry = new DayEntry();
      entry.weight = 9739329;
      entry.calories = 69420;
      service.getEntriesFromHealthQuery = () => [{ date: new Date(new Date().getTime() / 100) }, { date: entry.date, weight: 0, calories: 0 }] as any;
      service.healthIsAvailable = async () => true;
      service.healthDataAvailable = async () => true;
      await service.writeToHealthAppIfAuthorized(entry);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
    expect(service.HEALTH.store).toHaveBeenCalled();
  });

  it("should NOT write to the health app when writeToHealthAppIfAuthorized is called and the services, data and entry are all valid but it would overwrite existing data", async () => {
    let crashed = false;
    const time = new TimeService();
    service.time = new TimeService();
    service.HEALTH = {
      store: jasmine.createSpy().and.callFake((storageStuff, callback, err) => {
        if (storageStuff.dataType == service.DATA_TYPE_WEIGHT) {
          expect(time.datesAreOnSameDay(storageStuff.startDate, storageStuff.endDate)).toBe(true);
        }
        else if (storageStuff.dataType == service.DATA_TYPE_CALORIES) {
          expect(time.datesAreOnSameDay(storageStuff.startDate, storageStuff.endDate)).toBe(true);
        }
        callback();
        err();
      })
    }
    try {
      const entry = new DayEntry();
      entry.weight = 9739329;
      entry.calories = 69420;
      service.getEntriesFromHealthQuery = () => [{ date: entry.date, weight: 8484, calories: 858585 }] as any;
      service.healthIsAvailable = async () => true;
      service.healthDataAvailable = async () => true;
      await service.writeToHealthAppIfAuthorized(entry);
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(false);
    expect(service.HEALTH.store).not.toHaveBeenCalled();
  });


  it("should resolve to false and return false when healthDataIsAvailable is called and neither promise resolves", async () => {
    service.HEALTH = {
      isAuthorized: (stuffToAuthorize, success, failure) => {
        // just dont do anything to force time out
      }
    };
    expect(await service.healthDataAvailable()).toBe(false)
  });

  it("should resolve to false and return false when healthDataIsAvailable is called and both promises resolve to false", async () => {
    service.HEALTH = {
      isAuthorized: (stuffToAuthorize, success, failure) => {
        if (failure) {
          failure()
        }
      }
    };
    expect(await service.healthDataAvailable()).toBe(false)
  });

  it("should resolve to false and return false whenrequestAuthorization is called and there is an error", async () => {
    service.HEALTH = {
      requestAuthorization: (stuffToAuthorize, success, failure) => {
        if (failure) {
          failure()
        }
      }
    };
    expect(await service.requestAuthorization()).toBe(false)
  });

  it("should return an empty array when query is calld if there is an error", async () => {
    service.HEALTH = {
      query: (stuffToAuthorize, success, failure) => {
        if (failure) {
          failure()
        }
      }
    };
    expect(await service.query("someDataType", new Date(), new Date())).toEqual([]);
  });

  it("should return true if the environment is not android and promptInstall() is called ", async () => {
    service.environmentService.isAndroid = false;
    expect(await service.promptInstall()).toBe(true);
  });

  it("should return true if the environment is android and promptInstall() succeeds ", async () => {
    service.environmentService.isAndroid = true;
    service.HEALTH = {
      promptInstallFit: (success, failure) => {
        success(true)
      }
    };
    expect(await service.promptInstall()).toBe(true);
  });

  it("should return true if the environment is n android and promptInstall() succeeds ", async () => {
    service.environmentService.isAndroid = true;
    service.HEALTH = {
      promptInstallFit: (success, failure) => {
        failure();
      }
    };
    expect(await service.promptInstall()).toBe(false);
  });

});

function setup() {
  const testHelpers = autoSpy(TestHelpers);
  const time = autoSpy(TimeService);
  const converter = autoSpy(ConversionService);
  const Snackbar = autoSpy(SnackBarService);
  const environment = autoSpy(EnvironmentService);
  const builder = {
    testHelpers,
    time,
    converter,
    default() {
      return builder;
    },
    build() {
      return new MobileHealthSyncService(testHelpers, time, converter, Snackbar, environment);
    }
  };

  return builder;
}