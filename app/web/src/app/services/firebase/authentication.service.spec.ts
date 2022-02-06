import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { TimeService } from '../general/time-constant.service';
import { PreferenceService } from '../general/preference.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { MatDialog } from '@angular/material';
import { PaymentService } from './payments.service';
import { AuthenticationService } from './authentication.service';
import { autoSpy } from 'autoSpy';
import { Subscription } from 'rxjs';
import { EnvironmentService } from '../general/environment.service';

describe('AuthenticationService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: AuthenticationService;

  beforeEach(() => {
    service = setup().default().build();
    service.userProfPathSubscription = new Subscription();
    service.afAuth = {
      auth: {
        currentUser: {
          uid: "123",
          delete: function () {
            return new Promise<void>(resolve => resolve());
          },
          updateEmail: function () {
            return new Promise<void>(resolve => resolve());
          }
        },
        signInWithEmailAndPassword: function () {
          return new Promise(resolve => resolve(null));
        },
        signOut: function () {
          return new Promise(resolve => resolve(null));
        },
        createUserWithEmailAndPassword: function (userCredentials: firebase.auth.UserCredential, userProfileData: UserProfile) {
          return Promise.resolve({
            user: {
              sendEmailVerification: function () {
                return new Promise(resolve => resolve(null));
              }
            }
          });
        }
      }
    } as any;
  });

  it('should not crash when ngOnInit is called', () => {
    const crashed: boolean = testHelpers.testOnInit(service);
    expect(crashed).toBe(false);
  });

  it('should attempt to create an account when createUser is called (valid ip)', (done) => {
    service.ngOnInit();
    service.environmentService.isWeb = true;
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    const logOutGoVerifySpy: jasmine.Spy<() => Promise<void>> = spyOn(service, 'logOutGoVerify').and.returnValue(new Promise<void>(resolve => resolve()));
    service.createUserProfileInFirestore = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.createUser("username", "password", userProfile).then(() => {
      expect(logOutGoVerifySpy).toHaveBeenCalled();
      done();
    });
  });



  it('should attempt to create an account when createUser is called (error)', (done) => {
    service.ngOnInit();
    service.environmentService.isWeb = true;
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.createUserProfileInFirestore = null;
    const snackBarFailureSpy: jasmine.Spy<() => void> = spyOn(service.snackbarManager, 'showFailureMessage');
    service.createUser("username", "password", userProfile).then(() => {
      expect(snackBarFailureSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should show a warning message about the users email when create user is called  ( email error)', (done) => {
    service.ngOnInit();
    service.environmentService.isWeb = true;
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.createUserProfileInFirestore = jasmine.createSpy().and.callFake(() => {
      throw { code: service.EMAIL_IN_USE_ERROR_CODE }
    })
    const snackBarWarningSpy: jasmine.Spy<() => void> = spyOn(service.snackbarManager, 'showWarningMessage');
    service.createUser("username", "password", userProfile).then(() => {
      expect(snackBarWarningSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should show a warning message about the users connection when create user is called  ( network error)', (done) => {
    service.ngOnInit();
    service.environmentService.isWeb = true;
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.createUserProfileInFirestore = jasmine.createSpy().and.callFake(() => {
      throw { code: service.NETWORK_ERROR_CODE }
    })
    const snackBarWarningSpy: jasmine.Spy<() => void> = spyOn(service.snackbarManager, 'showWarningMessage');
    service.createUser("username", "password", userProfile).then(() => {
      expect(snackBarWarningSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should create a user profile in firestore when createUserProfileInFirestore is called', (done) => {
    service.ngOnInit();

    const dbDocSpy: jasmine.Spy<() => AngularFirestoreDocument> = spyOn(service.db, 'doc').and.returnValue({
      set: function () {
        return new Promise<void>(resolve => resolve());
      } as any
    } as AngularFirestoreDocument);

    const userCredentials: firebase.auth.UserCredential = {
      user: {
        uid: "123"
      }
    } as any;
    service.createUserProfileInFirestore(userCredentials, {} as UserProfile).then(() => {
      expect(dbDocSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should try to update email when tryToUpdateEmail is called', () => {
    service.ngOnInit();

    const updateEmailSpy: jasmine.Spy<() => Promise<void>> = spyOn(service.afAuth.auth.currentUser, 'updateEmail');
    service.tryToUpdateEmail("email@gmail.com");
    expect(updateEmailSpy).toHaveBeenCalled();
  });

  it('should call logout when logOutGoHome is called', (done) => {
    service.ngOnInit();

    const logOutSpy: jasmine.Spy<() => Promise<void>> = spyOn(service, 'logOut').and.returnValue(new Promise<void>(resolve => resolve()));
    service.logOutGoHome("").then(() => {
      expect(logOutSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should call logout when logOutGoVerify is called (no error)', (done) => {
    service.ngOnInit();

    const logOutSpy: jasmine.Spy<() => Promise<void>> = spyOn(service, 'logOut').and.returnValue(new Promise<void>(resolve => resolve()));
    service.logOutGoVerify("").then(() => {
      expect(logOutSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should call logout when logOutGoVerify is called (error)', (done) => {
    service.ngOnInit();

    const snackBarFailureSpy: jasmine.Spy<() => void> = spyOn(service.snackbarManager, 'showFailureMessage');
    service.afAuth.auth.signOut = null;
    service.logOutGoVerify("").then(() => {
      expect(snackBarFailureSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should attempt to sign out when logOut is called (web)', (done) => {
    service.environmentService.isWeb = true;
    service.ngOnInit();
    const sessionStorageSpy: jasmine.Spy<() => void> = spyOn(Storage.prototype, 'clear').and.callFake(() => { });
    const dialogRefClearSpy: jasmine.Spy<() => void> = spyOn(service.dialogRef, 'closeAll');
    service.logOut("", "").then(() => {
      expect(sessionStorageSpy).toHaveBeenCalled();
      expect(dialogRefClearSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT unsubscribe form the userProfPath and then attempt to sign out when logOut is called (web)', (done) => {
    service.environmentService.isWeb = true;
    service.ngOnInit();
    service.userProfPathSubscription = null;
    const sessionStorageSpy: jasmine.Spy<() => void> = spyOn(Storage.prototype, 'clear').and.callFake(() => { });
    const dialogRefClearSpy: jasmine.Spy<() => void> = spyOn(service.dialogRef, 'closeAll');
    service.logOut("", "").then(() => {
      expect(sessionStorageSpy).toHaveBeenCalled();
      expect(dialogRefClearSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should attempt to sign out when logOut is called (mobile)', (done) => {
    service.environmentService.isMobile = true;
    service.ngOnInit();

    const sessionStorageSpy: jasmine.Spy<() => void> = spyOn(Storage.prototype, 'clear').and.callFake(() => { });
    const dialogRefClearSpy: jasmine.Spy<() => void> = spyOn(service.dialogRef, 'closeAll');
    service.logOut("", "").then(() => {
      expect(sessionStorageSpy).toHaveBeenCalled();
      expect(dialogRefClearSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should call sendEmailVerification when login is called (email unverified)', (done) => {
    service.ngOnInit();

    const sendEmailVerificationSpy: jasmine.Spy<() => Promise<firebase.auth.UserCredential>> = spyOn(service.afAuth.auth, 'signInWithEmailAndPassword').and.returnValue(Promise.resolve({
      user: {
        emailVerified: false,
        sendEmailVerification: function () {
          return new Promise<void>(resolve => resolve());
        }
      }
    } as any));
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.login("username", "password").then(() => {
      expect(sendEmailVerificationSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT call sendEmailVerification when login is called (email unverified)', (done) => {
    service.ngOnInit();
    const sendEmailVerificationSpy: jasmine.Spy<() => Promise<firebase.auth.UserCredential>> = spyOn(service.afAuth.auth, 'signInWithEmailAndPassword').and.returnValue(Promise.resolve({
      user: {
        emailVerified: true,
        sendEmailVerification: function () {
          return new Promise<void>(resolve => resolve());
        }
      }
    } as any));
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.login("username", "password").then(() => {
      expect(service.logOutGoVerify).not.toHaveBeenCalled();
      done();
    });
  });

  it('should NOT call sendEmailVerification when login is called (error)', (done) => {
    service.ngOnInit();
    spyOn(service.afAuth.auth, 'signInWithEmailAndPassword').and.returnValue(null);
    service.eventAuthError = {
      next: jasmine.createSpy()
    } as any;
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.login("username", "password").then(() => {
      expect(service.logOutGoVerify).not.toHaveBeenCalled();
      expect(service.eventAuthError.next).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT call sendEmailVerification when login is called (email error)', (done) => {
    service.ngOnInit();
    spyOn(service.afAuth.auth, 'signInWithEmailAndPassword').and.callFake(() => { throw { code: service.EMAIL_IN_USE_ERROR_CODE } });
    service.eventAuthError = {
      next: jasmine.createSpy()
    } as any;
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.login("username", "password").then(() => {
      expect(service.logOutGoVerify).not.toHaveBeenCalled();
      expect(service.eventAuthError.next).toHaveBeenCalled();
      expect(service.snackbarManager.showWarningMessage).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT call sendEmailVerification when login is called (network error)', (done) => {
    service.ngOnInit();
    spyOn(service.afAuth.auth, 'signInWithEmailAndPassword').and.callFake(() => { throw { code: service.NETWORK_ERROR_CODE } });
    service.eventAuthError = {
      next: jasmine.createSpy()
    } as any;
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.login("username", "password").then(() => {
      expect(service.logOutGoVerify).not.toHaveBeenCalled();
      expect(service.eventAuthError.next).toHaveBeenCalled();
      expect(service.snackbarManager.showWarningMessage).toHaveBeenCalled();
      done();
    });
  });

  it('should NOT call sendEmailVerification when login is called (error with no message)', (done) => {
    service.ngOnInit();
    spyOn(service.afAuth.auth, 'signInWithEmailAndPassword').and.callFake(() => { throw "newError" })
    service.eventAuthError = {
      next: jasmine.createSpy()
    } as any;
    service.logOutGoVerify = jasmine.createSpy().and.returnValue(new Promise<void>(resolve => resolve()));
    service.login("username", "password").then(() => {
      expect(service.logOutGoVerify).not.toHaveBeenCalled();
      expect(service.eventAuthError.next).toHaveBeenCalled();
      done();
    });
  });

  it('should delete the current user when deleteCurrentUser is called (free)', (done) => {
    service.ngOnInit();

    const deleteSpy = spyOn(service.afAuth.auth.currentUser, 'delete');
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    service.deleteCurrentUser(userProfile).then(() => {
      expect(deleteSpy).toHaveBeenCalled();
      done()
    });
  });

  it('should delete the current user when deleteCurrentUser is called (premium)', (done) => {
    service.ngOnInit();

    const deleteSpy = spyOn(service.afAuth.auth.currentUser, 'delete');
    const userProfile: UserProfile = testHelpers.createPremiumUserProfile();
    userProfile.subscriptionID = "31284184"
    service.deleteCurrentUser(userProfile).then(() => {
      expect(deleteSpy).toHaveBeenCalled();
      done()
    });
  });

  it('should delete the current user when deleteCurrentUser is called (error)', (done) => {
    service.ngOnInit();

    const snackBarSpy = spyOn(service.snackbarManager, 'showSuccessMessage');
    service.deleteCurrentUser(null).then(() => {
      expect(snackBarSpy).toHaveBeenCalled();
      done()
    });
  });

  it('should return the users uid when getUserID is called', () => {
    service.ngOnInit();

    expect(service.getUserID()).toBe("123");
  });

});

function setup() {
  const afs = autoSpy(AngularFirestore);
  const afAuth = autoSpy(AngularFireAuth);
  const db = autoSpy(AngularFirestore);
  const router = autoSpy(Router);
  const time = autoSpy(TimeService);
  const preferenceManager = autoSpy(PreferenceService);
  const snackbarManager = autoSpy(SnackBarService);
  const dialogRef = autoSpy(MatDialog);
  const stripe = autoSpy(PaymentService);
  const env = autoSpy(EnvironmentService);
  const builder = {
    afs,
    afAuth,
    db,
    router,
    time,
    preferenceManager,
    snackbarManager,
    dialogRef,
    stripe,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      return new AuthenticationService(afs, afAuth, db, router, time, preferenceManager, snackbarManager, dialogRef, stripe, env);
    }
  };

  return builder;
}
