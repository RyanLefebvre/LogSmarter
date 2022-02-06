import { UserProfile } from './../../../../functions/src/classes/user-profile';
import { ProfileService } from 'src/app/services/general/profile.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { Router } from '@angular/router';
import { AuthenticationService } from '../firebase/authentication.service';
import { FirebaseGeneralService } from '../firebase/firebase-general.service';
import { ObjectStorageService } from './object-storage.service';
import { ConversionService } from './conversion.service';
import { PreferenceService } from './preference.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { PaymentService } from '../firebase/payments.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject, of } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { TimeService } from './time-constant.service';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { NgZone } from '@angular/core';

describe('StateManagerService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: StateManagerService;

  beforeEach(() => {
    service = setup().default().build();
    service.currentUserAuth = new BehaviorSubject<string>(service.USER_LOADING);
    service.currentUserProfile = new BehaviorSubject<UserProfile>(null);
    service.zone = {
      run: (someLam) => someLam()
    } as any;
    service.LOCATION = {
      reload: jasmine.createSpy()
    }
  });

  it('when userProfileStateChangeSubscription is called it should', () => {
    service.firebaseGeneralManager.currentUser = new BehaviorSubject<UserProfile>(testHelpers.createFreeUserProfile());
    const updateCurrentUserSpy = spyOn(service, 'updateCurrentUserObservables');
    const firstAuthSpy = spyOn(service, 'checkForFirstAuthOfSession');
    service.userProfileStateChangeSubscription();
    expect(updateCurrentUserSpy).toHaveBeenCalled();
    expect(firstAuthSpy).toHaveBeenCalled();
  });

  it('when angularFireAuthSubscription is called it should', () => {
    service.authService.afAuth = {
      user: of(null)
    } as any;
    const userIsAuthedSpy = spyOn(service, 'userIsAuthenticated').and.returnValue(true);
    service.angularFireAuthSubscription();
    expect(userIsAuthedSpy).toHaveBeenCalled();
  });

  it("should logOutAndGoHome() if the user no longer exists in the angularFireAuthSubscription and is authenticated", async () => {
    let lamRef;
    service.authService.afAuth = {
      user: {
        subscribe: (lam) => {
          lamRef = lam
        }
      }
    } as any;
    service.userIsAuthenticated = () => {
      return true
    };
    service.angularFireAuthSubscription()
    await lamRef(null);
    expect(service.authService.logOutGoHome).toHaveBeenCalledWith(service.authService.SIGN_OUT_SUCCESS_MESSAGE);
  });

  it("should return null if the parse value if cached log and paylaods length is not sufficient", () => {
    const getRef = localStorage.getItem;
    localStorage.getItem = () => { return "[]" };
    expect(service.getCachedMainLogAndPayload()).toBe(null)
    localStorage.getItem = getRef;
  });

  it("should not go to the dashboard when checkForFirstAuthOfSession() is called and it is not the first session ", () => {
    let storageref = sessionStorage.getItem
    sessionStorage.getItem = () => "someItem";
    service.checkForFirstAuthOfSession();
    expect(service.router.navigate).not.toHaveBeenCalled();
    sessionStorage.getItem = storageref;
  });

  it("should NOT logOutAndGoHome() if the user no longer exists in the angularFireAuthSubscription is not authenticated", async () => {
    let lamRef;
    service.authService.afAuth = {
      user: {
        subscribe: (lam) => {
          lamRef = lam
        }
      }
    } as any;
    service.userIsAuthenticated = () => {
      return false
    };
    service.angularFireAuthSubscription()
    await lamRef(null);
    expect(service.authService.logOutGoHome).not.toHaveBeenCalled();
  });

  it('should return if the user is authenticated when userIsAuthenticated is called', () => {
    expect(service.userIsAuthenticated()).toBe(false);
    service.currentUserAuth.next(service.USER_AUTHENTICATED);
    expect(service.userIsAuthenticated()).toBe(true);
  });

  it('should return if the user is authenticated when userIsNotAuthenticated is called', () => {
    expect(service.userIsNotAuthenticated()).toBe(false);
    service.currentUserAuth.next(service.USER_NOT_AUTHENTICATED);
    expect(service.userIsNotAuthenticated()).toBe(true);
  });

  it('should return if the user is loading userIsLoading is called', () => {
    expect(service.userIsLoading()).toBe(true);
    service.currentUserAuth.next(service.USER_NOT_AUTHENTICATED);
    expect(service.userIsLoading()).toBe(false);
  });

  it('should return the current user when getCurrentUser is called', () => {
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    expect(service.getCurrentUser()).toBe(null);
    service.currentUserProfile.next(userProfile);
    expect(service.getCurrentUser()).toBe(userProfile);
  });

  it('should update the current user observables when updateCurrentUserObservables is called (not null)', () => {
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    service.updateCurrentUserObservables(userProfile);
    expect(service.currentUserAuth.value).toBe(service.USER_AUTHENTICATED);
  });

  it('should update the current user observables when updateCurrentUserObservables is called (null)', () => {
    const userProfile: UserProfile = null;
    service.updateCurrentUserObservables(userProfile);
    expect(service.currentUserAuth.value).toBe(service.USER_NOT_AUTHENTICATED);
  });

  it('should call navigate when its the first auth of the session when checkForFirstAuthOfSession is called', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    const navigateSpy = spyOn(service.router, 'navigate').and.callFake(async () => true);
    service.checkForFirstAuthOfSession();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should call navigate when its the first auth of the session when checkForFirstAuthOfSession is called and reload the route if navResult is false', async () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    const navigateSpy = spyOn(service.router, 'navigate').and.callFake(async () => false);
    await service.checkForFirstAuthOfSession();
    expect(navigateSpy).toHaveBeenCalled();
  });



  it("should go to the register page when goToRegister() is called ", () => {
    let routeArr = [];
    service.router.navigate = jasmine.createSpy().and.callFake((route) => routeArr.push(route[0]));
    service.goToRegister();
    expect(routeArr[0]).toBe('/auth/register');
  });

  it("should set the cached main log and payload when setCachedMainLogAndPayload() is called ", () => {
    const fakeLogAndPayload = "someObject" as any;
    let localstorRef = localStorage.setItem;
    localStorage.setItem = jasmine.createSpy();
    const expectedReturn = "someExpectedReturn";
    let stringifyRef = JSON.stringify
    JSON.stringify = jasmine.createSpy().and.callFake((fakeLog) => {
      if (fakeLog == fakeLogAndPayload) {
        return expectedReturn;
      }
      else {
        return null;
      }
    });
    service.setCachedMainLogAndPayload(fakeLogAndPayload);
    expect(localStorage.setItem).toHaveBeenCalledWith(service.MAIN_LOG_LOCAL_STORAGE_KEY, expectedReturn);
    localStorage.setItem = localstorRef;
    JSON.stringify = stringifyRef;
  });

  it("should get the item from the cache when getCache() is called", () => {
    const expectedItemInCache = { timeToLive: null, timeOfStorage: null, objectToStore: "someObject" } as any;
    const getFromStorageRef = localStorage.getItem;
    const objKey = "someKey";
    localStorage.getItem = jasmine.createSpy().and.callFake((key: string) => {
      if (key == objKey) {
        return expectedItemInCache;
      }
      else {
        return null;
      }
    });
    const parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake((item) => item);
    expect(service.getCache(objKey)).toBe(expectedItemInCache.objectToStore);
    localStorage.getItem = getFromStorageRef;
    JSON.parse = parseRef;
  });

  it("should NOT get the item from the cache when getCache() is called and the object is expired", () => {
    const expectedItemInCache = { timeToLive: 1, timeOfStorage: 0, objectToStore: "someObject" } as any;
    const getFromStorageRef = localStorage.getItem;
    const objKey = "someKey";
    localStorage.getItem = jasmine.createSpy().and.callFake((key: string) => {
      if (key == objKey) {
        return expectedItemInCache;
      }
      else {
        return null;
      }
    });
    const parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake((item) => item);
    expect(service.getCache(objKey)).toBe(null);
    localStorage.getItem = getFromStorageRef;
    JSON.parse = parseRef;
  });

  it("should NOT get the item from the cache when getCache() is called if there is an error", () => {
    const getFromStorageRef = localStorage.getItem;
    const objKey = "someKey";
    localStorage.getItem = jasmine.createSpy().and.throwError("someError")
    const parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake((item) => item);
    expect(service.getCache(objKey)).toBe(null);
    localStorage.getItem = getFromStorageRef;
    JSON.parse = parseRef;
  });

  it("should set the object in the cache if setCache() is called ", () => {
    const setRef = localStorage.setItem;
    const stringifyRef = JSON.stringify;
    localStorage.setItem = jasmine.createSpy();
    const stringified = "stringified";
    JSON.stringify = jasmine.createSpy().and.callFake((item) => stringified);
    const key = "someKey"
    service.setCache(key, "someObj");
    expect(localStorage.setItem).toHaveBeenCalledWith(key, stringified);
    JSON.stringify = stringifyRef;
    localStorage.setItem = setRef;
  });

  it("should set the object in the cache with a TTL if setCache() is called with a TTL", () => {
    const setRef = localStorage.setItem;
    const stringifyRef = JSON.stringify;
    localStorage.setItem = jasmine.createSpy();
    const stringified = "stringified";
    JSON.stringify = jasmine.createSpy().and.callFake((item) => { expect(item.timeToLive).toBe(9); return stringified; });
    const key = "someKey"
    const timeToLive = 3;
    service.time.getDayInMillis = jasmine.createSpy().and.callFake(() => { return 3 });
    service.setCache(key, "someObj", timeToLive);
    expect(localStorage.setItem).toHaveBeenCalledWith(key, stringified);
    JSON.stringify = stringifyRef;
    localStorage.setItem = setRef;
  });

  it("should get the cached log and payload when getCachedMainLogAndPayload() is called ", () => {
    const getFromStorageRef = localStorage.getItem;
    const log = new NutritionLog();
    log.dayEntries = testHelpers.getRandomEntryList().map((entry: any) => { entry.date = entry.date.getTime(); return entry })
    service.getCurrentUser = () => {
      const user = new UserProfile();
      user.mainNutrLogId = log.id;
      return user;
    }
    const payload = new EnergyPayload();
    const fakeLogAndPayload = [log, payload];
    localStorage.getItem = jasmine.createSpy().and.callFake((key) => {
      if (key == service.MAIN_LOG_LOCAL_STORAGE_KEY) {
        return fakeLogAndPayload;
      } else {
        return null;
      }
    })
    const parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake((item) => { return item; });
    expect(service.getCachedMainLogAndPayload()).toBe(fakeLogAndPayload);
    localStorage.getItem = getFromStorageRef;
    JSON.parse = parseRef;
  });

  it("should return null when getCachedMainLogAndPayload() is called if they dont exist ", () => {
    const getFromStorageRef = localStorage.getItem;
    localStorage.getItem = jasmine.createSpy().and.callFake((key) => {
      return null;
    })
    const parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake((item) => item);
    expect(service.getCachedMainLogAndPayload()).toBe(null);
    localStorage.getItem = getFromStorageRef;
    JSON.parse = parseRef;
  });

  it("should set the god mode to live for 5 minutes when initiateGodMode() is called ", () => {
    service.setCache = jasmine.createSpy();
    service.initiateGodMode();
    expect(service.setCache).toHaveBeenCalledWith(service.GOD_MODE_KEY, service.GOD_MODE_VALUE, 5 / 1440);
  });

  it("should undo god mode when terminateGodMode() is called", () => {
    const removeRef = localStorage.removeItem
    localStorage.removeItem = jasmine.createSpy();
    service.terminateGodMode();
    expect(localStorage.removeItem).toHaveBeenCalledWith(service.GOD_MODE_KEY);
    localStorage.removeItem = removeRef;
  });

  it("should return true if god mode is initiated when isInGodMode() is called", () => {
    service.getCache = () => true;
    service.environmentService.isiOS = true;
    expect(service.isInGodMode()).toBe(true);
  });

  it("should return true if god mode is NOT initiated when isInGodMode() is called", () => {
    service.getCache = () => null;
    service.environmentService.isiOS = true;
    expect(service.isInGodMode()).toBe(false);
    service.getCache = () => true;
    service.environmentService.isiOS = false;
    expect(service.isInGodMode()).toBe(false);
  });

  it("should hide the overflow if hideDocumentOverflow() is called and the environment is mobile", () => {
    const getRef = document.getElementsByClassName;
    document.getElementsByClassName = () => {
      return [{
        classList: {
          add: () => { },
          remove: () => { }
        }
      }] as any
    }
    service.environmentService.isMobile = true;
    document.documentElement.classList.add = jasmine.createSpy();
    service.hideDocumentOverflow();
    expect(document.documentElement.classList.add).toHaveBeenCalledWith("hideOverflow");
    document.getElementsByClassName = getRef;
  });

  it("should NOT hide the overflow if hideDocumentOverflow() is called and the environment is mobile", () => {
    service.environmentService.isMobile = false;
    document.documentElement.classList.add = jasmine.createSpy();
    service.hideDocumentOverflow();
    expect(document.documentElement.classList.add).not.toHaveBeenCalledWith("hideOverflow");
  });

  it("should revert hide the overflow if revertHideOverflow() is called and the environment is mobile", () => {
    const getRef = document.getElementsByClassName;
    document.getElementsByClassName = () => {
      return [{
        classList: {
          add: () => { },
          remove: () => { }
        }
      }] as any
    }
    service.environmentService.isMobile = true;
    document.documentElement.classList.remove = jasmine.createSpy();
    service.revertHideOverflow();
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith("hideOverflow");
    document.getElementsByClassName = getRef;
  });

  it("should NOT revert hide the overflow if revertHideOverflow() is called and the environment is mobile", () => {
    service.environmentService.isMobile = false;
    document.documentElement.classList.remove = jasmine.createSpy();
    service.revertHideOverflow();
    expect(document.documentElement.classList.remove).not.toHaveBeenCalledWith("hideOverflow");
  });

  it("should scroll to the top if the environment is web and scrollToTop is called", () => {
    window.scroll = jasmine.createSpy();
    service.environmentService.isMobile = false;
    service.scrollToTop();
    expect(window.scroll).toHaveBeenCalled();
  });

  it("should scroll to the height passed in of the sidenav when the environment is mobile and scrollToTop is called", () => {
    let obj = { scrollTop: -1 };
    document.getElementsByClassName = () => {
      return [
        obj
      ] as any;
    }
    service.environmentService.isMobile = true;
    service.scrollToTop("someValue" as any);
    expect(obj.scrollTop as any).toBe("someValue" as any);
  });

  it("should scroll to the top of the sidenav when the environment is mobile and scrollToTop is called", () => {
    let obj = { scrollTop: -1 };
    document.getElementsByClassName = () => {
      return [
        obj
      ] as any;
    }
    service.environmentService.isMobile = true;
    service.scrollToTop();
    expect(obj.scrollTop).toBe(0);
  });

});

function setup() {
  const router = autoSpy(Router);
  const authService = autoSpy(AuthenticationService);
  const firebaseGeneralManager = autoSpy(FirebaseGeneralService);
  const objectManager = autoSpy(ObjectStorageService);
  const conversionManager = autoSpy(ConversionService);
  const preferenceManager = autoSpy(PreferenceService);
  const snackBarManager = autoSpy(SnackBarService);
  const stripeService = autoSpy(PaymentService);
  const afAuth = autoSpy(AngularFireAuth);
  const profileService = autoSpy(ProfileService);
  const environmentService = autoSpy(EnvironmentService);
  const timeService = autoSpy(TimeService);
  const zone = autoSpy(NgZone);
  const builder = {
    router,
    authService,
    firebaseGeneralManager,
    objectManager,
    conversionManager,
    preferenceManager,
    snackBarManager,
    stripeService,
    afAuth,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      authService.afAuth = {
        user: of({
          uid: "123",
          emailVerified: true
        })
      } as any;
      (firebaseGeneralManager.currentUser as any) = new BehaviorSubject<UserProfile>(null);
      return new StateManagerService(router, authService, firebaseGeneralManager, objectManager, conversionManager, preferenceManager, snackBarManager, afAuth, profileService, timeService, environmentService, zone);
    }
  };

  return builder;
}
