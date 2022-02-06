import { DayEntry } from 'src/app/model-classes/nutrition-log/day-entry';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService } from './authentication.service';
import { TimeService } from '../general/time-constant.service';
import { StateManagerService } from '../general/state-manager.service';
import { ObjectStorageService } from '../general/object-storage.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConversionService } from '../general/conversion.service';
import { TierPermissionsService } from '../general/tier-permissions.service';
import { FirebaseGeneralService } from './firebase-general.service';
import { PayloadService } from './payload.service';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { NutritionConstanstsService } from '../nutrition-log/nutrition-constansts.service';
import { FirebaseNutritionService } from './firebase-nutrition.service';
import { autoSpy } from 'autoSpy';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { CallableWrapperService } from './callable-wrapper.service';
import { MobileHealthSyncService } from '../general/mobile-health-sync.service';
import { EnvironmentService } from '../general/environment.service';

describe('FirebaseNutritionService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: FirebaseNutritionService;
  let checkDocRef;

  beforeEach(() => {
    service = setup().build();
    checkDocRef = service.checkIfDocumentOffline;
    service.checkIfDocumentOffline = async () => false;
  });

  it('should open the in depth nutrition log when openInDepthNutritionLog is called', () => {
    const navigateSpy = spyOn(service.router, 'navigate');
    service.openInDepthNutritionLog(testHelpers.getRandomNutritionLog());
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should get the log summary document when getLogSummaryDocument is called', () => {
    const dbCollSpy = spyOn(service.db, 'collection').and.returnValue({
      doc: function () {
        return {
          collection: function () {
            return {
              doc: function () {
                return {}
              }
            }
          }
        }
      }
    } as any);
    service.getLogSummaryDocument(1);
    expect(dbCollSpy).toHaveBeenCalled();
  });

  it('should return the day entries document when getDayEntriesDocument is called', () => {
    const dbCollSpy = spyOn(service.db, 'collection').and.returnValue({
      doc: function () {
        return {
          collection: function () {
            return {
              doc: function () {
                return {}
              }
            }
          }
        }
      }
    } as any);
    service.getDayEntriesDocument(1);
    expect(dbCollSpy).toHaveBeenCalled();
  });

  it('should delete a log from the current user when deleteLogFromCurrentUser is called (no error)', (done) => {
    spyOn(service, 'getLogSummaryDocument').and.returnValue({
      delete: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      delete: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    userProfile.mainNutrLogId = nutrLog.id;
    spyOn(service.stateManager, 'getCurrentUser').and.returnValue(userProfile);
    spyOn(service.payload, 'getEnergyPayLoad').and.returnValue({
      estimatedTDEE: 1800
    } as any);
    spyOn(service.firebaseGeneralService, 'removeUserMainNutrLog').and.returnValue(new Promise(resolve => resolve(null)));
    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.deleteLogFromCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should delete a log from the current user when deleteLogFromCurrentUser is called (error)', (done) => {
    spyOn(service, 'getLogSummaryDocument').and.returnValue(null);
    spyOn(service, 'getDayEntriesDocument').and.returnValue(null);
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    userProfile.mainNutrLogId = nutrLog.id;
    spyOn(service.stateManager, 'getCurrentUser').and.returnValue(userProfile);
    spyOn(service.payload, 'getEnergyPayLoad').and.returnValue({
      estimatedTDEE: 1800
    } as any);
    spyOn(service.firebaseGeneralService, 'removeUserMainNutrLog').and.returnValue(new Promise(resolve => resolve(null)));
    const snackBarSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.deleteLogFromCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add a nutrition log to the current user when addNutritionalLogToCurrentUser is called (no error)', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    spyOn(service.objectManager, 'convertLogSummaryToFireStorageFormat').and.returnValue({});
    spyOn(service, 'getLogSummaryDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.addNutritionalLogToCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT add a nutrition log to the current user when addNutritionalLogToCurrentUser is called if the document is offline', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    spyOn(service.objectManager, 'convertLogSummaryToFireStorageFormat').and.returnValue({});
    spyOn(service, 'getLogSummaryDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    service.checkIfDocumentOffline = async () => true;
    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.addNutritionalLogToCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).not.toHaveBeenCalled();
      done();
    });
  });

  it('should show a warning message if the document is unavailable when addNutritionLogToCurrentUser() is called (no error)', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    spyOn(service.objectManager, 'convertLogSummaryToFireStorageFormat').and.returnValue({});
    spyOn(service, 'getLogSummaryDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    service.objectManager.convertLogSummaryToFireStorageFormat = () => { throw { code: service.ERROR_CODE_UNAVAILABLE } }
    const snackBarSpy = spyOn(service.snackBarManager, 'showWarningMessage');
    service.addNutritionalLogToCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalledWith(service.MESSAGE_UNAVAILABLE);
      done();
    });
  });

  it('should add a nutrition log to the current user when addNutritionalLogToCurrentUser is called (error)', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    const snackBarSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.addNutritionalLogToCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should update an existing log for the current user when updateExistingLogForCurrentUser is called (no error)', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    spyOn(service.time, 'getTimeStamp').and.returnValue(new Date().getTime());
    spyOn(service.objectManager, 'convertLogSummaryToFireStorageFormat').and.returnValue({});
    spyOn(service, 'getLogSummaryDocument').and.returnValue({
      update: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.updateExistingLogForCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should update an existing log for the current user when updateExistingLogForCurrentUser is called (error)', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    const snackBarSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.updateExistingLogForCurrentUser(nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should delete the day entry from the log when deleteEntryFromLog is called (no error)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service.objectManager, 'convertDayEntryListToFireStorageFormat').and.returnValue({} as any);

    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.deleteEntryFromLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT delete the day entry from the log when deleteEntryFromLog is called (no error)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    service.checkIfDocumentOffline = async () => true;
    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service.objectManager, 'convertDayEntryListToFireStorageFormat').and.returnValue({} as any);

    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.deleteEntryFromLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).not.toHaveBeenCalled();
      done();
    });
  });

  it('should delete the day entry from the log when deleteEntryFromLog is called (error)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    const snackBarSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.deleteEntryFromLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add an entry to a log when addEntryToLog is called (no error)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();

    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service.objectManager, 'convertDayEntryListToFireStorageFormat').and.returnValue({});
    spyOn(service, 'markLogAsUpdated').and.returnValue(new Promise(resolve => resolve(null)));

    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.addEntryToLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add an entry to a log when addEntryToLog is called and not show the messages if hideMessages is true (no error)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();

    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service.objectManager, 'convertDayEntryListToFireStorageFormat').and.returnValue({});
    spyOn(service, 'markLogAsUpdated').and.returnValue(new Promise(resolve => resolve(null)));

    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.addEntryToLog(dayEntry, nutrLog, true).then(() => {
      expect(snackBarSpy).not.toHaveBeenCalled();
      done();
    });
  });

  it('should add an entry to a log when addEntryToLog is called (no error and updating exisitng)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    nutrLog.dayEntries = [
      dayEntry
    ];
    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service.objectManager, 'convertDayEntryListToFireStorageFormat').and.returnValue({});
    spyOn(service, 'markLogAsUpdated').and.returnValue(new Promise(resolve => resolve(null)));

    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.addEntryToLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add an entry to a log when addEntryToLog is called and try to write to the health app if mobile', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();
    nutrLog.dayEntries = [
      dayEntry
    ];
    spyOn(service, 'getDayEntriesDocument').and.returnValue({
      set: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);
    spyOn(service.objectManager, 'convertDayEntryListToFireStorageFormat').and.returnValue({});
    spyOn(service, 'markLogAsUpdated').and.returnValue(new Promise(resolve => resolve(null)));

    const snackBarSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.environmentSrvice.isMobile = true;
    service.addEntryToLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      expect(service.mobileHealthService.writeToHealthAppIfAuthorized).toHaveBeenCalled();
      done();
    });
  });

  it('should add an entry to a log when addEntryToLog is called (error)', (done) => {
    const dayEntry: DayEntry = testHelpers.getRandomEntry();
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();

    const snackBarSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.addEntryToLog(dayEntry, nutrLog).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should mark a log as updated when markLogAsUpdated is called', (done) => {
    const nutrLog: NutritionLog = testHelpers.getRandomNutritionLog();

    const timeStampSpy = spyOn(service.time, 'getTimeStamp').and.returnValue(new Date().getTime());
    const logSummarySpy = spyOn(service.objectManager, 'convertLogSummaryToFireStorageFormat').and.returnValue({});
    const logDocumentSpy = spyOn(service, 'getLogSummaryDocument').and.returnValue({
      update: function () {
        return new Promise(resolve => resolve(null));
      }
    } as any);

    service.markLogAsUpdated(nutrLog).then(() => {
      expect(timeStampSpy).toHaveBeenCalled();
      expect(logSummarySpy).toHaveBeenCalled();
      expect(logDocumentSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return all the nutr log subscriptions when getAllNutrLogsSubscription is called', (done) => {
    spyOn(service.objectManager, 'convertLogSummaryFromFireStorageFormat').and.returnValue({} as any);
    spyOn(service.objectManager, 'convertDayEntryListFromStorageFormat').and.returnValue({} as any);
    const dbCollectionSpy = spyOn(service.db, 'collection').and.returnValue({
      doc: function () {
        return {
          collection: function () {
            return {
              valueChanges: function () {
                return of([{}, {}, {}]);
              }
            }
          }
        }
      }
    } as any);
    service.getAllNutrLogsSubscription().toPromise().then(() => {
      expect(dbCollectionSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should get the nutrition log entries subscription when getNutrLogEntriesSubscription is called', () => {
    const dayEntriesSpy = spyOn(service, 'getDayEntriesDocument').and.returnValue({
      valueChanges: function () {
        return of([{}, {}, {}]);
      }
    } as any);
    service.getNutrLogEntriesSubscription(1);
    expect(dayEntriesSpy).toHaveBeenCalled();
  });

  it('should get the nutrition log summary subscription when getNutrLogSummarySubscription is called', () => {
    const logSummarySpy = spyOn(service, 'getLogSummaryDocument').and.returnValue({
      valueChanges: function () {
        return of([{}, {}, {}]);
      }
    } as any);
    service.getNutrLogSummarySubscription(1);
    expect(logSummarySpy).toHaveBeenCalled();
  });

  it("should return todays date if the observedLog is null and getAutoPromptDate() is called", () => {
    const expectedReturnValue = new Date();
    const actualDate = service.getAutoPromptDate(null, new EnergyPayload());
    const actualIsExpected = (
      expectedReturnValue.getDate() === actualDate.getDate()
      && expectedReturnValue.getMonth() === actualDate.getMonth()
      && expectedReturnValue.getFullYear() === actualDate.getFullYear())
    expect(actualIsExpected).toBe(true);
  });

  it("should return todays date if the observedPayload is null and getAutoPromptDate() is called", () => {
    const expectedReturnValue = new Date();
    const someLog = new NutritionLog();
    someLog.dayEntries = testHelpers.getRandomEntryList();
    const actualDate = service.getAutoPromptDate(someLog, null);
    const actualIsExpected = (
      expectedReturnValue.getDate() === actualDate.getDate()
      && expectedReturnValue.getMonth() === actualDate.getMonth()
      && expectedReturnValue.getFullYear() === actualDate.getFullYear())
    expect(actualIsExpected).toBe(true);
  });

  it("should return todays date if the observedLog is empty and getAutoPromptDate() is called", () => {
    const expectedReturnValue = new Date();
    const someLog = new NutritionLog();
    const actualDate = service.getAutoPromptDate(someLog, new EnergyPayload());
    const actualIsExpected = (
      expectedReturnValue.getDate() === actualDate.getDate()
      && expectedReturnValue.getMonth() === actualDate.getMonth()
      && expectedReturnValue.getFullYear() === actualDate.getFullYear())
    expect(actualIsExpected).toBe(true);
  });

  it("should return one day after the payloads latest date if the observed log is not empty or null and getAutoPromptDate() is called", () => {
    const observedLog = new NutritionLog();
    observedLog.dayEntries = [new DayEntry()];
    const expectedOneDayLater = testHelpers.getRandomDate();
    const payloadLatesDate = new Date();
    service.time.getOneDayLater = (date: Date) => {
      if (date.getTime() === payloadLatesDate.getTime()) {
        return expectedOneDayLater
      }
      else {
        return null;
      }
    }
    const payload = new EnergyPayload();
    payload.latestDate = payloadLatesDate.getTime();
    const expectedReturnValue = service.time.getOneDayLater(payloadLatesDate);
    const actualDate = service.getAutoPromptDate(observedLog, payload);
    const actualIsExpected = (
      expectedReturnValue.getDate() === actualDate.getDate()
      && expectedReturnValue.getMonth() === actualDate.getMonth()
      && expectedReturnValue.getFullYear() === actualDate.getFullYear())
    expect(actualIsExpected).toBe(true);
  });

  it("should say the document is offline if an error occurs when checkIfDocumentIsOffline() is called ", async () => {
    const fakeDocument: any = {
      missingTheNessaryProperties: "soThisWillCauseAnError"
    };
    service.checkIfDocumentOffline = checkDocRef;
    const docIsOffline = await service.checkIfDocumentOffline(fakeDocument);
    expect(docIsOffline).toBe(true);
    expect(service.snackBarManager.showWarningMessage).toHaveBeenCalled();
  });

  it("should say the document is or is not from the cache based on hte _fromCache when checkIfDocumentIsOffline() is called ", async () => {
    let fakeDocument: any = {
      get: () => {
        return {
          toPromise: () => {
            return {
              '_fromCache': true
            }
          }
        }
      }
    };
    service.checkIfDocumentOffline = checkDocRef;
    let docIsOffline = await service.checkIfDocumentOffline(fakeDocument);
    expect(docIsOffline).toBe(true);
    expect(service.snackBarManager.showWarningMessage).toHaveBeenCalled();
    fakeDocument = {
      get: () => {
        return {
          toPromise: () => {
            return {
              '_fromCache': false
            }
          }
        }
      }
    };
    service.checkIfDocumentOffline = checkDocRef;
    docIsOffline = await service.checkIfDocumentOffline(fakeDocument);
    expect(docIsOffline).toBe(false);
    expect(service.snackBarManager.showWarningMessage).toHaveBeenCalled();
  });

  it("should return INSUFFICIENT_DATA if there is an error when getNutrLogEntriesSubscription() is called ", () => {
    service.constants.INSUFFICIENT_DATA = "someValue" as any;
    const mySubject = new BehaviorSubject<any>(null);
    const fakeDocument = {
      valueChanges: () => mySubject
    }
    service.getDayEntriesDocument = () => { return fakeDocument as any };
    service.objectManager.convertDayEntryListFromStorageFormat = () => { throw "error" }
    const someObservable: Observable<any> = service.getNutrLogEntriesSubscription(null);
    someObservable.subscribe((value) => {
      expect(value).toBe(service.constants.INSUFFICIENT_DATA);
    });
    mySubject.next("someValue")
  });

  it("should return a converted entry list if there is NOT an error when getNutrLogEntriesSubscription() is called ", () => {
    const expectedReturn = "someExpectedValue";
    const mySubject = new BehaviorSubject<any>(null);
    const fakeDocument = {
      valueChanges: () => mySubject
    }
    service.getDayEntriesDocument = () => { return fakeDocument as any };
    service.objectManager.convertDayEntryListFromStorageFormat = () => { return expectedReturn as any }
    const someObservable: Observable<any> = service.getNutrLogEntriesSubscription(null);
    someObservable.subscribe((value) => {
      expect(value).toBe(expectedReturn);
    });
    mySubject.next("someValue")
  });

  it("should return a converted log if there is NOT an error when getNutrLogSummarySubscription() is called ", () => {
    const expectedReturn = "someExpectedValue";
    const mySubject = new BehaviorSubject<any>(null);
    const fakeDocument = {
      valueChanges: () => mySubject
    }
    service.getLogSummaryDocument = () => { return fakeDocument as any };
    service.objectManager.convertLogSummaryFromFireStorageFormat = () => { return expectedReturn as any }
    const someObservable: Observable<any> = service.getNutrLogSummarySubscription(null);
    someObservable.subscribe((value) => {
      expect(value).toBe(expectedReturn);
    });
    mySubject.next("someValue")
  });

  it("should NOT return a converted log if there is an error when getNutrLogSummarySubscription() is called ", () => {
    service.constants.INSUFFICIENT_DATA = "someValue" as any;
    const mySubject = new BehaviorSubject<any>(null);
    const fakeDocument = {
      valueChanges: () => mySubject
    }
    service.getLogSummaryDocument = () => { return fakeDocument as any };
    service.objectManager.convertLogSummaryFromFireStorageFormat = () => { throw "error" };
    const someObservable: Observable<any> = service.getNutrLogSummarySubscription(null);
    someObservable.subscribe((value) => {
      expect(value).toBe(service.constants.INSUFFICIENT_DATA);
    });
    mySubject.next("someValue")
  });

  it("should not do anything else if addEntryToLog() is called and the document is offline ", async () => {
    service.getDayEntriesDocument = () => null;
    service.checkIfDocumentOffline = async () => true;
    const addedEntry = await service.addEntryToLog(new DayEntry(), new NutritionLog());
    expect(addedEntry).toBe(false);
  });

  it("should not delete the log or do anything if the log is not online and deleteLogFromCurrentUser() is called ", async () => {
    const logSpy = jasmine.createSpy();
    const entrySpy = jasmine.createSpy();
    service.getLogSummaryDocument = () => {
      return {
        delete: logSpy
      } as any;
    };
    service.getDayEntriesDocument = () => {
      return {
        delete: entrySpy
      } as any;
    }
    service.checkIfDocumentOffline = async () => true;
    await service.deleteLogFromCurrentUser(new NutritionLog());
    expect(logSpy).not.toHaveBeenCalled();
    expect(entrySpy).not.toHaveBeenCalled();
  });

  it("should still delete the log if the log is online but not the main log and deleteLogFromCurrentUser() is called ", async () => {
    const logSpy = jasmine.createSpy();
    const entrySpy = jasmine.createSpy();
    service.getLogSummaryDocument = () => {
      return {
        delete: logSpy
      } as any;
    };
    service.getDayEntriesDocument = () => {
      return {
        delete: entrySpy
      } as any;
    }
    const log = new NutritionLog();
    const user = new UserProfile();
    user.mainNutrLogId = log.id + Math.random();
    service.checkIfDocumentOffline = async () => false;
    service.stateManager.getCurrentUser = () => user;
    await service.deleteLogFromCurrentUser(log);
    expect(logSpy).toHaveBeenCalled();
    expect(entrySpy).toHaveBeenCalled();
  });

  it("should not update the log for the current user if the log is offline", async () => {
    let summarySpy = jasmine.createSpy();
    service.getLogSummaryDocument = () => {
      return {
        update: summarySpy
      } as any;
    }
    service.checkIfDocumentOffline = async () => true;
    await service.updateExistingLogForCurrentUser(new NutritionLog())
    expect(summarySpy).not.toHaveBeenCalled();
  });


  it("should call the sync health data cloud func when syncDataFromHealth() is caleld ", async () => {
    const log = new NutritionLog();
    const prof = new UserProfile();
    const entries = [];
    await service.syncDataFromHealth(log, prof, entries);
    expect(service.wrapper.firebaseCloudFunction).toHaveBeenCalled()
  });
});

function setup() {
  const db = autoSpy(AngularFirestore);
  const auth = autoSpy(AuthenticationService);
  const time = autoSpy(TimeService);
  const stateManager = autoSpy(StateManagerService);
  const objectManager = autoSpy(ObjectStorageService);
  const snackBarManager = autoSpy(SnackBarService);
  const conversionManager = autoSpy(ConversionService);
  const tierPermissionsService = autoSpy(TierPermissionsService);
  const firebaseGeneralService = autoSpy(FirebaseGeneralService);
  const payload = autoSpy(PayloadService);
  const router = autoSpy(Router);
  const afAuth = autoSpy(AngularFireAuth);
  const constants = autoSpy(NutritionConstanstsService);
  const wrapper = autoSpy(CallableWrapperService);
  const mobileHealthService = autoSpy(MobileHealthSyncService);
  const environment = autoSpy(EnvironmentService)
  const builder = {
    db,
    auth,
    time,
    stateManager,
    objectManager,
    snackBarManager,
    conversionManager,
    tierPermissionsService,
    firebaseGeneralService,
    payload,
    router,
    afAuth,
    constants,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(new TestHelpers().createFreeUserProfile());
      return new FirebaseNutritionService(db, auth, time, stateManager, objectManager, snackBarManager, conversionManager, tierPermissionsService, firebaseGeneralService, payload, router, afAuth, constants, wrapper, mobileHealthService, environment);
    }
  };

  return builder;
}
