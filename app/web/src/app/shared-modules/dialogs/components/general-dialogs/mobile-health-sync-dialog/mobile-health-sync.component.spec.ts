import { TimeService } from 'src/app/services/general/time-constant.service';
import { FormBuilder } from '@angular/forms';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { MobileHealthSyncService } from 'src/app/services/general/mobile-health-sync.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { MobileHealthSyncComponent } from './mobile-health-sync.component';
import { autoSpy } from 'autoSpy';
import { MatDialogRef } from '@angular/material';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { ElementArrayFinder } from 'protractor';
import { EnvironmentService } from 'src/app/services/general/environment.service';

describe('MobileHealthSyncComponent', () => {

  let component: MobileHealthSyncComponent;
  let testHelpers: TestHelpers = new TestHelpers();

  beforeEach(() => {
    const { build } = setup().default();
    component = build();
  });

  it('should call setMainLogAndPayload() when ngOnInit() is called ', () => {
    component.setMainLogAnddPayload = jasmine.createSpy();
    component.ngOnInit();
    expect(component.setMainLogAnddPayload).toHaveBeenCalled();
  });


  it('should set the main log and payload when setMainLogAndPayload() is called ', () => {
    const fakeData = {
      log: "fakeLog",
      payload: "FakePayload"
    };
    component.data = fakeData;
    component.setMainLogAnddPayload();
    expect(component.mainLog).toBe(fakeData.log as any);
    expect(component.payload).toBe(fakeData.payload as any);
  });

  it('should set the main log and payload when setMainLogAndPayload()  is called ', () => {
    const fakeData = {
      log: "fakeLog",
      payload: "FakePayload"
    };
    component.data = fakeData;
    component.setMainLogAnddPayload();
    expect(component.mainLog).toBe(fakeData.log as any);
    expect(component.payload).toBe(fakeData.payload as any);
  });

  it("should return true if shouldShowRangeControls() is called and the sync config is on the custom value ", () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM }
      }
    } as any;
    expect(component.shouldShowRangeControls()).toBe(true);
  });

  it("should return false if shouldShowRangeControls() is called and the sync config is NOT on the custom value ", () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_WHOLE_LOG }
      }
    } as any;
    expect(component.shouldShowRangeControls()).toBe(false);
  });

  it("should get the entries from health using just todays date if the SYNC_FORM_RANGE Control is just today", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_TODAY },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
      }
    } as any;
    const time = new TimeService();
    component.health.getEntriesFromHealthQuery = jasmine.createSpy().and.callFake((startDate, endDate) => {
      expect(time.datesAreOnSameDay(startDate, endDate)).toBe(true);
    });
    await component.getEntriesFromHealth();
  });

  it("should get the entries from health using the payloads start date and end date if the SYNC_FORM_RANGE Control is whole log", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_WHOLE_LOG },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
      }
    } as any;
    const fakeData = {
      log: "fakeLog",
      payload: {
        startDate: 3,
        latestDate: 5
      }
    };
    component.data = fakeData;
    component.setMainLogAnddPayload();
    const expectedReturn = "somereturn" as any;
    component.health.getEntriesFromHealthQuery = jasmine.createSpy().and.callFake((startDate, endDate) => {
      expect(startDate == new Date(fakeData.payload.startDate));
      expect(endDate == new Date(fakeData.payload.latestDate));
      return expectedReturn;
    });
    expect(await component.getEntriesFromHealth()).toBe(expectedReturn);
  });

  it("should get the entries from health using the range controls start date and end date if the SYNC_FORM_RANGE Control is whole log", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: "-11111-" },
        [component.FORM_CONTROL_NAME_TO]: { value: "22--222" },
      }
    } as any;
    const expectedReturn = "somereturn" as any;
    component.health.getEntriesFromHealthQuery = jasmine.createSpy().and.callFake((startDate, endDate) => {
      expect(startDate == new Date(component.SYNC_FORM.controls[component.FORM_CONTROL_NAME_FROM].value.replaceAll("-", "/")));
      expect(endDate == new Date(component.SYNC_FORM.controls[component.FORM_CONTROL_NAME_TO].value.replaceAll("-", "/")));
      return expectedReturn;
    });
    await component.getEntriesFromHealth();
    expect(await component.getEntriesFromHealth()).toBe(expectedReturn);
  });

  it("should build a combined entry list when buildCombineEntryList() is called ", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: null }
      }
    } as any;
    const timeServie = new TimeService();
    let startDate = new Date();
    component.mainLog = new NutritionLog();
    component.mainLog.dayEntries = testHelpers.getRandomEntryListOfLength(100).map(entry => {
      entry.date = new Date(startDate.getTime());
      startDate = timeServie.getOneDayLater(startDate);
      return entry
    });
    component.getEntriesFromHealth = () => {
      return component.mainLog.dayEntries.map(entry => {
        const newEntry: DayEntry = new DayEntry();
        newEntry.weight = entry.weight + 1;
        newEntry.calories = entry.calories + 1;
        newEntry.date = new Date(entry.date.getTime() * 100)
        newEntry.id = newEntry.date.getTime();
        return newEntry;
      }) as any;
    }
    expect((await component.buildCombinedEntryList()).length).toBe(200)
  });

  it("should build a combined entry list when buildCombineEntryList() is called ", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: null }
      }
    } as any;
    const timeServie = new TimeService();
    let startDate = new Date();
    component.mainLog = new NutritionLog();
    component.mainLog.dayEntries = testHelpers.getRandomEntryListOfLength(100).map(entry => {
      entry.date = new Date(startDate.getTime());
      startDate = timeServie.getOneDayLater(startDate);
      return entry
    });
    component.getEntriesFromHealth = () => {
      return component.mainLog.dayEntries.map(entry => {
        const newEntry: DayEntry = new DayEntry();
        newEntry.weight = entry.weight + 1;
        newEntry.calories = entry.calories + 1;
        newEntry.date = new Date(entry.date.getTime() * 100)
        newEntry.id = newEntry.date.getTime();
        return newEntry;
      }) as any;
    }
    expect((await component.buildCombinedEntryList()).length).toBe(200)
  });

  it("should build a combined entry list when buildCombineEntryList() is called but not override data for conflicting days if the override is no", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_NO }
      }
    } as any;
    const timeService = new TimeService();
    component.timeService = timeService
    let startDate = new Date();
    component.mainLog = new NutritionLog();
    component.mainLog.dayEntries = testHelpers.getRandomEntryListOfLength(100).map(entry => {
      entry.date = new Date(startDate.getTime());
      startDate = timeService.getOneDayLater(startDate);
      return entry
    });
    const mapped = component.mainLog.dayEntries.map(entry => {
      const newEntry: DayEntry = new DayEntry();
      newEntry.weight = entry.weight + 1;
      newEntry.calories = entry.calories + 1;
      newEntry.date = entry.date
      newEntry.id = entry.id;
      return newEntry;
    })
    component.getEntriesFromHealth = () => {
      return mapped as any;
    }
    const combined = (await component.buildCombinedEntryList());
    expect(combined.length).toBe(100)
    expect(combined)
    combined.forEach(entry => {
      const entryFromHealth = mapped.find(entryFromMapped => entry.date.getTime() == entryFromMapped.date.getTime());
      const entryFromMain = component.mainLog.dayEntries.find(entryFromMain => entry.date.getTime() == entryFromMain.date.getTime());
      expect(entry == entryFromMain);
      expect(entry != entryFromHealth);
    });
  });

  it("should build a combined entry list when buildCombineEntryList() is called but and override data for conflicting weights if the override is yes", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    const timeService = new TimeService();
    component.timeService = timeService
    let startDate = new Date();
    component.mainLog = new NutritionLog();
    component.mainLog.dayEntries = testHelpers.getRandomEntryListOfLength(100).map(entry => {
      entry.date = new Date(startDate.getTime());
      startDate = timeService.getOneDayLater(startDate);
      return entry
    });
    const mapped = component.mainLog.dayEntries.map(entry => {
      const newEntry: DayEntry = new DayEntry();
      newEntry.weight = entry.weight + 1;
      newEntry.calories = entry.calories + 1;
      newEntry.date = entry.date
      newEntry.id = entry.id;
      return newEntry;
    })
    component.getEntriesFromHealth = () => {
      return mapped as any;
    }
    const combined = (await component.buildCombinedEntryList());
    expect(combined.length).toBe(100)
    combined.forEach(entry => {
      const entryFromHealth = mapped.find(entryFromMapped => entry.date.getTime() == entryFromMapped.date.getTime());
      const entryFromMain = component.mainLog.dayEntries.find(entryFromMain => entry.date.getTime() == entryFromMain.date.getTime());
      expect(entry.weight != entryFromMain.weight);
      expect(entry.calories != entryFromMain.calories);
      expect(entry.weight == entryFromHealth.weight);
      expect(entry.calories == entryFromHealth.calories);
    });
  });

  it("should result in an unsuccessful submission and revert the main logs day entries to their initial state if handleSubmit() is called and there is an error", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    component.mainLog = new NutritionLog();
    const entryRef = testHelpers.getRandomEntryListOfLength(100);
    component.mainLog.dayEntries = entryRef;
    component.shouldShowRangeControls = () => { throw { message: "someMessage" } };
    component.dialogRef.close = jasmine.createSpy()
    await component.handleSubmit()
    expect(component.mainLog.dayEntries).toBe(entryRef);
    expect(component.dialogRef.close).toHaveBeenCalledWith(false)
  });

  it("should reject submission and show a failure message if handleSubmit() is called and the range is invalid", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    component.mainLog = new NutritionLog();
    const entryRef = testHelpers.getRandomEntryListOfLength(100);
    component.mainLog.dayEntries = entryRef;
    component.shouldShowRangeControls = () => true;
    await component.handleSubmit()
    expect(component.mainLog.dayEntries).toBe(entryRef);
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.showSpinner).toBe(false)
  });

  it("should reject submission and revert the day entries if the user has exceeded their max number of entries", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: null },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    component.mainLog = new NutritionLog();
    const entryRef = testHelpers.getRandomEntryListOfLength(100);
    component.mainLog.dayEntries = entryRef;
    component.shouldShowRangeControls = () => false;
    component.buildCombinedEntryList = () => testHelpers.getRandomEntryListOfLength(500) as any;
    component.dialogRef.close = jasmine.createSpy();
    component.tierPermissions.MAX_DAY_ENTRIES_KEY = "someKey";
    component.tierPermissions.getUserTier = () => {
      return {
        [component.tierPermissions.MAX_DAY_ENTRIES_KEY]: 0
      }
    }
    await component.handleSubmit()
    expect(component.mainLog.dayEntries).toBe(entryRef);
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.showSpinner).toBe(false)
    expect(component.dialogRef.close).toHaveBeenCalledWith(false)
  });

  it("should reject submission and revert the day entries if the user has no data to sync", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: 1111 },
        [component.FORM_CONTROL_NAME_TO]: { value: null },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    component.mainLog = new NutritionLog();
    const entryRef = testHelpers.getRandomEntryListOfLength(100);
    component.mainLog.dayEntries = entryRef;
    component.shouldShowRangeControls = () => false;
    component.buildCombinedEntryList = () => [] as any;
    component.dialogRef.close = jasmine.createSpy();
    component.tierPermissions.MAX_DAY_ENTRIES_KEY = "someKey";
    component.tierPermissions.getUserTier = () => {
      return {
        [component.tierPermissions.MAX_DAY_ENTRIES_KEY]: 500
      }
    }
    await component.handleSubmit()
    expect(component.mainLog.dayEntries).toBe(entryRef);
    expect(component.snackBar.showFailureMessage).toHaveBeenCalled();
    expect(component.showSpinner).toBe(false)
    expect(component.dialogRef.close).toHaveBeenCalledWith(false)
  });

  it("should merge the entries, map the dates to the entries ids and add the entry to the log when handleSubmit() is successful", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: 1111 },
        [component.FORM_CONTROL_NAME_TO]: { value: 2222 },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    component.mainLog = new NutritionLog();
    const entryRef = testHelpers.getRandomEntryListOfLength(100);
    component.mainLog.dayEntries = entryRef;
    component.shouldShowRangeControls = () => true;
    component.buildCombinedEntryList = () => testHelpers.getRandomEntryListOfLength(100) as any;
    component.dialogRef.close = jasmine.createSpy();
    component.tierPermissions.MAX_DAY_ENTRIES_KEY = "someKey";
    component.tierPermissions.getUserTier = () => {
      return {
        [component.tierPermissions.MAX_DAY_ENTRIES_KEY]: 500
      }
    }
    component.firebaseNutr.syncDataFromHealth = jasmine.createSpy().and.callFake((mainlog) => {
      return {
        syncedData: mainlog.dayEntries.map(entry => {
          entry.date = null;
          return entry;
        })
      }
    });
    component.firebaseNutr.addEntryToLog = jasmine.createSpy().and.callFake(() => true)
    await component.handleSubmit();
    component.mainLog.dayEntries.forEach(entry => {
      expect(entry.date != null);
      expect(entry.date.getTime() == entry.id);
    })
    expect(component.showSpinner).toBe(false)
    expect(component.dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.firebaseNutr.addEntryToLog).toHaveBeenCalled();
  });

  it("should merge the entries, map the dates to the entries ids and add the entry to the log when handleSubmit() is successful and syncedData is null", async () => {
    component.SYNC_FORM = {
      controls: {
        [component.SYNC_FORM_RANGE_NAME]: { value: component.SYNC_FORM_RANGE_CUSTOM },
        [component.FORM_CONTROL_NAME_FROM]: { value: 1111 },
        [component.FORM_CONTROL_NAME_TO]: { value: 2222 },
        [component.SYNC_FORM_OVERRIDE_EXISTING_DATA_NAME]: { value: component.OVERRIDE_YES }
      }
    } as any;
    component.mainLog = new NutritionLog();
    const entryRef = testHelpers.getRandomEntryListOfLength(100);
    component.mainLog.dayEntries = entryRef;
    component.shouldShowRangeControls = () => true;
    component.buildCombinedEntryList = () => testHelpers.getRandomEntryListOfLength(100) as any;
    component.dialogRef.close = jasmine.createSpy();
    component.tierPermissions.MAX_DAY_ENTRIES_KEY = "someKey";
    component.tierPermissions.getUserTier = () => {
      return {
        [component.tierPermissions.MAX_DAY_ENTRIES_KEY]: 500
      }
    }
    component.firebaseNutr.syncDataFromHealth = jasmine.createSpy().and.callFake((mainlog) => {
      return {
        syncedData: null
      }
    });
    component.firebaseNutr.addEntryToLog = jasmine.createSpy().and.callFake(() => true)
    await component.handleSubmit();
    expect(component.showSpinner).toBe(false)
    expect(component.dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.firebaseNutr.addEntryToLog).toHaveBeenCalled();
  });



});

function setup() {
  const timeService = autoSpy(TimeService);
  const data = {} as any;
  const fb = autoSpy(FormBuilder);
  const dialogRef = autoSpy(MatDialogRef) as any;
  const firebaseNutr = autoSpy(FirebaseNutritionService);
  const tierPermissions = autoSpy(TierPermissionsService);
  const snackBar = autoSpy(SnackBarService);
  const health = autoSpy(MobileHealthSyncService);
  const stateManager = autoSpy(StateManagerService);
  const env = autoSpy(EnvironmentService)
  const builder = {
    timeService,
    data,
    fb,
    dialogRef,
    firebaseNutr,
    tierPermissions,
    snackBar,
    health,
    stateManager,
    default() {
      return builder;
    },
    build() {
      return new MobileHealthSyncComponent(timeService, data, fb, dialogRef, firebaseNutr, tierPermissions, snackBar, health, stateManager, env);
    }
  };

  return builder;
}
