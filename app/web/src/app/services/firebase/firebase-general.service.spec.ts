import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService } from './authentication.service';
import { PreferenceService } from '../general/preference.service';
import { ObjectStorageService } from '../general/object-storage.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { TimeService } from '../general/time-constant.service';
import { FirebaseGeneralService } from './firebase-general.service';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileService } from '../general/profile.service';
import { Router } from '@angular/router';
import { EnvironmentService } from '../general/environment.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';

describe('FirebaseGeneralService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: FirebaseGeneralService;
  let dbDocSpy: any;
  let userProfile: UserProfile;

  beforeEach(() => {
    service = setup().default().build();
    dbDocSpy = spyOn(service.db, 'doc').and.returnValue({
      get: function () {
        return of();
      }
    } as any);
    userProfile = testHelpers.createFreeUserProfile();
  })

  it('should create the current user subscription when createCurrentUserSubscription is called (no error)', () => {
    service.auth.getUserID = jasmine.createSpy().and.returnValue("123");

    const mock = {
      doc: function () {
        return {
          valueChanges: function () {
            return of<unknown>("");
          }
        }
      }
    } as any;
    const collectionSpy = spyOn(service.db, 'collection').and.returnValue(mock);
    service.createCurrentUserSubscription();
    expect(collectionSpy).toHaveBeenCalled();
  });

  it('should use the cached user and create the current user subscription when createCurrentUserSubscription is called and there is a cached profile(no error)', () => {
    service.auth.getUserID = jasmine.createSpy().and.returnValue("123");

    const mock = {
      doc: function () {
        return {
          valueChanges: function () {
            return {
              subscribe: (lam) => {
                lam("someValue :)")
              }
            }
          }
        }
      }
    } as any;

    const collectionSpy = spyOn(service.db, 'collection').and.returnValue(mock);
    service.getCachedProfile = () => new UserProfile();
    service.createCurrentUserSubscription();
    expect(collectionSpy).toHaveBeenCalled();
  });

  it('should create the current user subscription when createCurrentUserSubscription is called', () => {
    service.auth.getUserID = jasmine.createSpy().and.returnValue("123");
    let someuser = new UserProfile();
    someuser.wasDeleted = false;
    let subject = new BehaviorSubject<UserProfile>(new UserProfile());
    const mock = {
      doc: function () {
        return {
          valueChanges: function () {
            return subject
          }
        }
      }
    } as any;
    const collectionSpy = spyOn(service.db, 'collection').and.returnValue(mock);
    const currentUserSpy = spyOn(service.currentUser, 'next');
    service.cleanUserProfile = jasmine.createSpy().and.returnValue(someuser);
    service.createCurrentUserSubscription();
    subject.next(null);
    expect(collectionSpy).toHaveBeenCalled();
    expect(currentUserSpy).toHaveBeenCalled();
  });

  it('should NOT create the current user subscription when createCurrentUserSubscription is called if the user was deleted', () => {
    service.auth.getUserID = jasmine.createSpy().and.returnValue("123");
    let someuser = new UserProfile();
    someuser.wasDeleted = true;
    let subject = new BehaviorSubject<UserProfile>(new UserProfile());
    const mock = {
      doc: function () {
        return {
          valueChanges: function () {
            return subject
          }
        }
      }
    } as any;
    const collectionSpy = spyOn(service.db, 'collection').and.returnValue(mock);
    const currentUserSpy = spyOn(service.currentUser, 'next');
    service.cleanUserProfile = jasmine.createSpy().and.returnValue(someuser);
    service.createCurrentUserSubscription();
    subject.next(null);
    expect(currentUserSpy).not.toHaveBeenCalled();
  });

  it('should catch the error in the current user subscription when createCurrentUserSubscription is called (error)', () => {
    service.auth.getUserID = jasmine.createSpy().and.returnValue("123");
    let someuser = new UserProfile();
    someuser.wasDeleted = false;
    let subject = new BehaviorSubject<UserProfile>(new UserProfile());
    const mock = {
      doc: function () {
        return {
          valueChanges: function () {
            return subject
          }
        }
      }
    } as any;
    const collectionSpy = spyOn(service.db, 'collection').and.returnValue(mock);
    const currentUserSpy = spyOn(service.currentUser, 'next');
    service.cleanUserProfile = jasmine.createSpy().and.callFake(() => { throw "error" })
    service.createCurrentUserSubscription();
    subject.next(null);
    expect(collectionSpy).toHaveBeenCalled();
    expect(currentUserSpy).toHaveBeenCalledWith(null);
  });

  it('should create the current user subscription when createCurrentUserSubscription is called on mobile', () => {
    service.environmentService.isMobile = true;
    service.prefs = new PreferenceService({} as any);
    service.auth.getUserID = jasmine.createSpy().and.returnValue("123");
    let someuser = new UserProfile();
    someuser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    someuser.wasDeleted = false;
    let subject = new BehaviorSubject<UserProfile>(new UserProfile());
    const mock = {
      doc: function () {
        return {
          valueChanges: function () {
            return subject
          }
        }
      }
    } as any;
    const collectionSpy = spyOn(service.db, 'collection').and.returnValue(mock);
    const currentUserSpy = spyOn(service.currentUser, 'next');
    service.cleanUserProfile = jasmine.createSpy().and.callFake(() => { return someuser });
    service.createCurrentUserSubscription();
    subject.next(null);
    expect(collectionSpy).toHaveBeenCalled();
    expect(currentUserSpy).toHaveBeenCalledWith(someuser);
  });

  it('should check if a user was deleted when checkIfUserWasDeleted is called', (done) => {
    const logOutGoHomeSpy: jasmine.Spy<() => Promise<void>> = spyOn(service.auth, 'logOutGoHome').and.returnValue(new Promise(resolve => resolve()));
    service.checkIfUserWasDeleted({ wasDeleted: true }).then(() => {
      expect(logOutGoHomeSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return a \'\cleaned\'\ UserProfile object when cleanUserProfile is called and has no preferences or date created ', () => {
    const jsonMock = {
      [service.USER_PROF_STORAGE_KEY]: {
        username: userProfile.username,
        isMale: userProfile.isMale,
        age: userProfile.age,
        weight_lbs: userProfile.weight_lbs,
        height_inches: userProfile.height_inches,
        mainNutrLogId: userProfile.mainNutrLogId,
        activityLevel: userProfile.activityLevel,
        estimatedTDEE: userProfile.estimatedTDEE,
        subscriptionStatus: userProfile.subscriptionStatus,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionId: userProfile.subscriptionID,
        tierPermissions: userProfile.tierPermissions,
        emailAddr: userProfile.emailAddr,
        wasDeleted: userProfile.wasDeleted,
        userPreferences: null,
        dateCreated: null
      }
    };
    service.auth.afAuth = {
      auth: {
        currentUser: {
          email: "ihatewritingunittests@angular.com"
        }
      }
    } as any;
    let parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake(prof => prof);
    const returnProfile: UserProfile = service.cleanUserProfile(jsonMock);
    expect(returnProfile.username).toBe(jsonMock[service.USER_PROF_STORAGE_KEY].username);
    JSON.parse = parseRef;
  });

  it('should return a \'\cleaned\'\ UserProfile object and update the users email when cleanUserProfile is called and emails do not match and they have loggedInBefore ', () => {
    const jsonMock = {
      [service.USER_PROF_STORAGE_KEY]: {
        username: userProfile.username,
        isMale: userProfile.isMale,
        age: userProfile.age,
        weight_lbs: userProfile.weight_lbs,
        height_inches: userProfile.height_inches,
        mainNutrLogId: userProfile.mainNutrLogId,
        activityLevel: userProfile.activityLevel,
        estimatedTDEE: userProfile.estimatedTDEE,
        subscriptionStatus: userProfile.subscriptionStatus,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionId: userProfile.subscriptionID,
        tierPermissions: userProfile.tierPermissions,
        emailAddr: userProfile.emailAddr,
        wasDeleted: userProfile.wasDeleted,
        hasLoggedInBefore: true,
        userPreferences: null,
        dateCreated: null
      }
    };
    service.auth.afAuth = {
      auth: {
        currentUser: {
          email: "someOtherEmailADDR"
        }
      }
    } as any;
    let parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake(prof => prof);
    service.updateUserProfileInDB = jasmine.createSpy();
    const returnProfile: UserProfile = service.cleanUserProfile(jsonMock);
    expect(returnProfile.emailAddr).toBe(jsonMock[service.USER_PROF_STORAGE_KEY].emailAddr);
    expect(service.updateUserProfileInDB).toHaveBeenCalled();
    expect(jsonMock.emailAddr).not.toBe(null)
    JSON.parse = parseRef;
  });

  it('should return a \'\cleaned\'\ UserProfile object and NOT update the users email when cleanUserProfile is called and emails do not match, but they have not loggedInBefore ', () => {
    const jsonMock = {
      [service.USER_PROF_STORAGE_KEY]: {
        username: userProfile.username,
        isMale: userProfile.isMale,
        age: userProfile.age,
        weight_lbs: userProfile.weight_lbs,
        height_inches: userProfile.height_inches,
        mainNutrLogId: userProfile.mainNutrLogId,
        activityLevel: userProfile.activityLevel,
        estimatedTDEE: userProfile.estimatedTDEE,
        subscriptionStatus: userProfile.subscriptionStatus,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionId: userProfile.subscriptionID,
        tierPermissions: userProfile.tierPermissions,
        emailAddr: userProfile.emailAddr,
        wasDeleted: userProfile.wasDeleted,
        hasLoggedInBefore: false,
        userPreferences: null,
        dateCreated: null
      }
    };
    service.auth.afAuth = {
      auth: {
        currentUser: {
          email: userProfile.emailAddr
        }
      }
    } as any;
    let parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake(prof => prof);
    service.updateUserProfileInDB = jasmine.createSpy();
    const returnProfile: UserProfile = service.cleanUserProfile(jsonMock);
    expect(returnProfile.emailAddr).toBe(jsonMock[service.USER_PROF_STORAGE_KEY].emailAddr);
    expect(service.updateUserProfileInDB).not.toHaveBeenCalled();
    expect(jsonMock.emailAddr).not.toBe(null)
    JSON.parse = parseRef;
  });

  it('should return a \'\cleaned\'\ UserProfile object when the user has general prefs and nutrtion prefs ', () => {
    const jsonMock = {
      [service.USER_PROF_STORAGE_KEY]: {
        username: userProfile.username,
        isMale: userProfile.isMale,
        age: userProfile.age,
        weight_lbs: userProfile.weight_lbs,
        height_inches: userProfile.height_inches,
        mainNutrLogId: userProfile.mainNutrLogId,
        activityLevel: userProfile.activityLevel,
        estimatedTDEE: userProfile.estimatedTDEE,
        subscriptionStatus: userProfile.subscriptionStatus,
        subscriptionTier: userProfile.subscriptionTier,
        subscriptionId: userProfile.subscriptionID,
        tierPermissions: userProfile.tierPermissions,
        emailAddr: userProfile.emailAddr,
        wasDeleted: userProfile.wasDeleted,
        userPreferences: (new PreferenceService(new EnvironmentService())).getDefaultPreferences(),
        dateCreated: null
      }
    };
    service.auth.afAuth = {
      auth: {
        currentUser: {
          email: userProfile.emailAddr
        }
      }
    } as any;
    let parseRef = JSON.parse;
    JSON.parse = jasmine.createSpy().and.callFake(prof => prof);
    service.updateUserProfileInDB = jasmine.createSpy();
    service.prefs = new PreferenceService(new EnvironmentService())
    const returnProfile: UserProfile = service.cleanUserProfile(jsonMock);
    expect(returnProfile.emailAddr).toBe(jsonMock[service.USER_PROF_STORAGE_KEY].emailAddr);
    expect(service.updateUserProfileInDB).not.toHaveBeenCalled();
    expect(jsonMock.emailAddr).not.toBe(null)
    JSON.parse = parseRef;
  });

  it('should set the user\'\s date created to 5 weeks ago when markDateCreatedBasedOnProfileTypeAndTier is called (no date created)', () => {
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    const initialDateCreated = userProfile.dateCreated;
    service.markDateCreatedBasedOnProfileTypeAndTier(userProfile, { dateCreated: null });
    const newDateCreated = userProfile.dateCreated;
    expect(newDateCreated < initialDateCreated).toBe(true);
  });

  it('should set the user\'\s date created to 5 weeks ago when markDateCreatedBasedOnProfileTypeAndTier is called (valid date created, coach)', () => {
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    const initialDateCreated = userProfile.dateCreated;
    service.markDateCreatedBasedOnProfileTypeAndTier(userProfile, {});
    const newDateCreated = userProfile.dateCreated;
    expect(newDateCreated).toBeLessThan(initialDateCreated);
  });

  it('should set the user\'\s date created to the existing date created when markDateCreatedBasedOnProfileTypeAndTier is called (valid date created, individual)', () => {
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    const initialDateCreated = userProfile.dateCreated;
    service.markDateCreatedBasedOnProfileTypeAndTier(userProfile, { dateCreated: userProfile.dateCreated });
    const newDateCreated = userProfile.dateCreated;
    expect(newDateCreated).toBe(initialDateCreated);
  });

  it('should mark the date created as four weeks prior to the current time when markDateCreatedAsthreeWeeksAgo is called', () => {
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    const initialDateCreated = userProfile.dateCreated;
    service.markDateCreatedAsFiveWeeksAgo(userProfile);
    const threeWeeksAgoDateCreated = userProfile.dateCreated;
    expect(threeWeeksAgoDateCreated < initialDateCreated).toBe(true);
  });

  it('shoud update the user profile in the db when updateUserProfileInDB is called (no error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(str => of());
    const snackBarSuccessSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.updateUserProfileInDB(userProfile, "success", "failure").then(() => {
      expect(snackBarSuccessSpy).toHaveBeenCalled();
      done();
    })
  });


  it('shoud update the user profile in the db when updateUserProfileInDB is called but not show the message if showMessage() is false (no error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(str => of());
    const snackBarSuccessSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.updateUserProfileInDB(userProfile, "success", "failure", true).then(() => {
      expect(snackBarSuccessSpy).not.toHaveBeenCalled();
      done();
    })
  });

  it('shoud update the user profile in the db when updateUserProfileInDB is called ut not show the message if showMessage() is false (error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(null);
    const snackBarFailureSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.updateUserProfileInDB(userProfile, "success", "failure", true).then(() => {
      expect(snackBarFailureSpy).not.toHaveBeenCalled();
      done();
    })
  });

  it('shoud update the user profile in the db when updateUserProfileInDB is called (internal error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.callFake(() => { throw { code: "internal" } })
    const snackBarWarningSpy = spyOn(service.snackBarManager, 'showWarningMessage');
    service.updateUserProfileInDB(userProfile, "success", "failure").then(() => {
      expect(snackBarWarningSpy).toHaveBeenCalled();
      done();
    });
  });

  it('shoud update the user profile in the db when updateUserPromoCodeInDB is called (no error) success message', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(str => {
      return {
        toPromise: () => {
          return {}
        }
      } as any;
    });
    const snackBarSuccessSpy = spyOn(service.snackBarManager, 'showSuccessMessage');
    service.updateUserPromoCodeInDB(userProfile, "success", "failure").then(() => {
      expect(snackBarSuccessSpy).toHaveBeenCalled();
      done();
    });
  });

  it('shoud update the user profile in the db when updateUserPromoCodeInDB is called (no error) failure message', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(str => {
      return {
        toPromise: () => {
          return {
            errMsg: "Some error message"
          }
        }
      } as any;
    });
    const snackBarFailureSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.updateUserPromoCodeInDB(userProfile, "success", "failure").then(() => {
      expect(snackBarFailureSpy).toHaveBeenCalled();
      done();
    });
  });

  it('shoud update the user profile in the db when updateUserPromoCodeInDB is called (error)', (done) => {
    const fireFuncSpy = spyOn(service.fireFunc, 'httpsCallable').and.returnValue(null);
    const snackBarFailureSpy = spyOn(service.snackBarManager, 'showFailureMessage');
    service.updateUserPromoCodeInDB(userProfile, "success", "failure").then(() => {
      expect(snackBarFailureSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should update the user profile when editUserProfile is called', (done) => {
    const updateUserProfileInDbSpy: jasmine.Spy<() => Promise<any>> = spyOn(service, 'updateUserProfileInDB').and.returnValue(new Promise(resolve => resolve(null)));
    service.editUserProfile(userProfile).then(() => {
      expect(updateUserProfileInDbSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should update user profile in the db when editUserPreferences is called', (done) => {
    const updateUserProfileInDbSpy: jasmine.Spy<() => Promise<any>> = spyOn(service, 'updateUserProfileInDB').and.returnValue(new Promise(resolve => resolve(null)));
    service.editUserPreferences(userProfile).then(() => {
      expect(updateUserProfileInDbSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should update the user promo code in the db when editUserPromoCode is called', (done) => {
    const updateUserPromoCodeInDbSpy: jasmine.Spy<() => Promise<any>> = spyOn(service, 'updateUserPromoCodeInDB').and.returnValue(new Promise(resolve => resolve(null)));
    service.editUserPromoCode(userProfile).then(() => {
      expect(updateUserPromoCodeInDbSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should set the user\'\s main nutrition setUserMainNutrLog is called it should (no TDEE to update)', (done) => {
    const updateUserProfileInDbSpy: jasmine.Spy<() => Promise<any>> = spyOn(service, 'updateUserProfileInDB').and.returnValue(new Promise(resolve => resolve(null)));
    service.setUserMainNutrLog(userProfile, testHelpers.getRandomNutritionLog()).then(() => {
      expect(updateUserProfileInDbSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should set the user\'\s main nutrition setUserMainNutrLog is called it should (TDEE to update)', (done) => {
    const updateUserProfileInDbSpy: jasmine.Spy<() => Promise<any>> = spyOn(service, 'updateUserProfileInDB').and.returnValue(new Promise(resolve => resolve(null)));
    service.setUserMainNutrLog(userProfile, testHelpers.getRandomNutritionLog(), 1800).then(() => {
      expect(updateUserProfileInDbSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return socials when getSocials is called', (done) => {
    service.getSocials().toPromise().then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return FAQs when getFaqs is called', (done) => {
    service.getFaqs().toPromise().then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return employees when getEmployees is called', (done) => {
    service.getEmployees().toPromise().then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return testimonials when getTestimonials is called', (done) => {
    service.getTestimonials().toPromise().then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return resources when getResources is called', (done) => {
    service.getResources().toPromise().then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should return instagram api keys when getInstagramAPIKeys is called', (done) => {
    service.getInstagramAPIKeys().toPromise().then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    })
  });

  it('should remove the users main nutrition log when removeUserMainNutrLog is called', (done) => {
    const nutritionLog = {
      estimatedTDEE: 2500
    }
    const stateManagerMock: any = {
      getCachedMainLogAndPayload: function () {
        return [null, nutritionLog];
      }
    }
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    userProfile.estimatedTDEE = 2400;
    spyOn(service, 'updateUserProfileInDB').and.returnValue(Promise.resolve());

    expect(nutritionLog.estimatedTDEE).not.toBe(userProfile.estimatedTDEE);
    service.removeUserMainNutrLog(userProfile, 2500, stateManagerMock).then(() => {
      expect(userProfile.estimatedTDEE).toBe(nutritionLog.estimatedTDEE);
      done();
    })
  });

  it("should parse the user object and return the profile if the cache is NOT expired and getCachedProfile() is called ", () => {
    const getRef = localStorage.getItem
    const expectedUserValue: any = '"something"';
    const userObj = {
      [service.USER_PROFILE_KEY]: expectedUserValue,
      [service.TTL_KEY]: (new Date()).getTime() * 100
    };
    service.setCachedUserProfile(userObj);
    localStorage.getItem = () => {
      return userObj as any;
    };
    expect(service.getCachedProfile()).toBe(JSON.parse(expectedUserValue));
    localStorage.getItem = getRef
    localStorage.removeItem(service.CACHED_USER_KEY);
  });

  it("should NOT parse the user object and return the profile if the cache is expired and getCachedProfile() is called ", () => {
    const getRef = localStorage.getItem
    const expectedUserValue: any = '"something"';
    const userObj = {
      [service.USER_PROFILE_KEY]: expectedUserValue,
      [service.TTL_KEY]: (new Date()).getTime() / 100
    };
    service.setCachedUserProfile(userObj);
    localStorage.getItem = () => {
      return userObj as any;
    };
    expect(service.getCachedProfile()).not.toBe(JSON.parse(expectedUserValue));
    localStorage.getItem = getRef
    localStorage.removeItem(service.CACHED_USER_KEY);
  });

  it("should set the cached log and payload if setUserMainNutrtLog is called and the statemanage is not null ", async () => {
    const fakeState = {
      setCachedMainLogAndPayload: jasmine.createSpy()
    } as any;
    await service.setUserMainNutrLog(new UserProfile(), new NutritionLog(), null, fakeState);
    expect(fakeState.setCachedMainLogAndPayload).toHaveBeenCalled();
  });

  it("should not break if removeUserMainNutrLog() is called and the mainLogAndPayload are null ", async () => {
    const fakeState = {
      getCachedMainLogAndPayload: jasmine.createSpy().and.returnValue(null)
    } as any;
    await service.removeUserMainNutrLog(new UserProfile(), 0, fakeState);
    expect(fakeState.getCachedMainLogAndPayload).toHaveBeenCalled();
  });

  it("should not break if removeUserMainNutrLog() is called and the mainLogAndPayload are not null but the payloadTDEE is  ", async () => {
    const fakeState = {
      getCachedMainLogAndPayload: jasmine.createSpy().and.returnValue([null, {}])
    } as any;
    await service.removeUserMainNutrLog(new UserProfile(), 0, fakeState);
    expect(fakeState.getCachedMainLogAndPayload).toHaveBeenCalled();
  });

});

function setup() {
  const db = autoSpy(AngularFirestore);
  const auth = autoSpy(AuthenticationService);
  const prefs = autoSpy(PreferenceService);
  const objectManager = autoSpy(ObjectStorageService);
  const snackBarManager = autoSpy(SnackBarService);
  const fireFunc = autoSpy(AngularFireFunctions);
  const timeManager = autoSpy(TimeService);
  const profile = autoSpy(ProfileService);
  const router = autoSpy(Router);
  const environmentService = autoSpy(EnvironmentService);
  const builder = {
    db,
    auth,
    prefs,
    objectManager,
    snackBarManager,
    fireFunc,
    timeManager,
    environmentService,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      timeManager.getTimeStamp = jasmine.createSpy().and.returnValue(new Date().getTime());
      timeManager.getWeekInMillis = jasmine.createSpy().and.returnValue(7 * 24 * 60 * 60 * 1000);
      return new FirebaseGeneralService(db, auth, prefs, objectManager, snackBarManager, fireFunc, timeManager, profile, environmentService, router);
    }
  };

  return builder;
}