import { Injectable, NgZone } from '@angular/core';
import { UserProfile } from '../../model-classes/general/user-profile';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationService } from '../firebase/authentication.service';
import { FirebaseGeneralService } from '../firebase/firebase-general.service';
import { ObjectStorageService } from './object-storage.service';
import { ConversionService } from './conversion.service';
import { PreferenceService } from './preference.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { ProfileService } from './profile.service';
import { TimeService } from './time-constant.service';
import { NutritionLog } from 'functions/src/classes/nutrition-log';
import { EnergyPayload } from 'functions/src/classes/energy-payload';
import { EnvironmentService } from './environment.service';

/**
 * Service that is responsible for application state management. The state of the application 
 * revolves around two things. The current user profile and the authentication status of that user.
 * The current user's authentication status could be loading, authenticated or unauthenticated. The value
 * of the current user's profile could be null or a {@link UserProfile} object. If the user is loading or 
 * unathenticated then the user profile is null, otherwise it is expected to be a valid user profile object.
 * 
 * Last edited by: Ryan Lefebvre 8/11/2020
 */
@Injectable({
  providedIn: 'root'
})
export class StateManagerService {

  /**
  * Authentication state constant for when user authentication state is unknown.
  */
  USER_LOADING: string = "LOADING";

  /**
  * Authentication state constant for when user is authenticated.
  */
  USER_AUTHENTICATED: string = "AUTHENTICATED";

  /**
  * Authentication state constant for when user is not authenticated.
  */
  USER_NOT_AUTHENTICATED: string = "NOTAUTHENTICATED";

  /**
  * Observable to be used by components and other services to listen for authentication state changes.
  */
  currentUserAuth: BehaviorSubject<string> = new BehaviorSubject<string>(this.USER_LOADING);

  /**
  * Observable to be used by components and other services to listen for state changes of the current user profile.
  */
  currentUserProfile: BehaviorSubject<UserProfile> = new BehaviorSubject<UserProfile>(null);

  /**
   * Key to value in session storage that only exists if the user has authenticated more than once.
   */
  USER_HAS_AUTHENTICATED: string = "hasAuthenticated";

  /**
   * Value set in session storage when first authentication is confirmed.
   */
  AUTH_CONFIRMED: string = "authConfirmed";

  /**
   * Reference to the route that displays the dashboard component.
   */
  ROUTE_DASHBOARD: string = "dashboard";

  /**
  * Key used to cache the user's main log in local storage. 
  */
  MAIN_LOG_LOCAL_STORAGE_KEY: string = "MLLS";

  /**
   * Wrapper around loaction object so that it can be mocked in tests
   */
  LOCATION: any = location;

  /**
   * Key used to get the god mode value. If god mode is true then the user
   * essentially has unlimited permissions. This only last very briefly in
   * session storage while the user has just complete and in app purchase.
   * We do this so that the user does not have to wait for asynchronous
   * requests to finish when their account is updating
   */
  GOD_MODE_KEY: string = "ZEUS";

  /**
   * Random value that is stored when in god mode.
   */
  GOD_MODE_VALUE: string = "ARES";

  /**
   * @ignore
   */
  constructor(
    public router: Router,
    public authService: AuthenticationService,
    public firebaseGeneralManager: FirebaseGeneralService,
    public objectManager: ObjectStorageService,
    public conversionManager: ConversionService,
    public preferenceManager: PreferenceService,
    public snackBarManager: SnackBarService,
    public afAuth: AngularFireAuth,
    public profileService: ProfileService,
    public time: TimeService,
    public environmentService: EnvironmentService,
    public zone: NgZone) {
    this.angularFireAuthSubscription();
    this.userProfileStateChangeSubscription();
  }

  /**
   * The firebase general manager creates an observable that is hooked up to the 
   * document in our database that contains the current user's profile information. 
   * This observable emits a new value anytime that the current user's profile has its state 
   * changed. This function handles the logic related to responding to any state changes to the 
   * current user's profile. This is done by subscribing to that observable and emitting the 
   * new user profile to other classes and services if the user profile is not null. Additional
   * checks are also done for the first authentication of the session where other special logic 
   * must be performed.
   */
  userProfileStateChangeSubscription(): void {
    this.firebaseGeneralManager.currentUser.subscribe((userInformation: UserProfile) => {
      if (userInformation != null) {
        this.updateCurrentUserObservables(userInformation);
        this.checkForFirstAuthOfSession();
      }
    });
  }

  /**
  * Handles logic for subscription to angular fire auth state. If the user 
  * is not null, then angular fire has an active auth session.
  */
  angularFireAuthSubscription(): void {
    this.authService.afAuth.user.subscribe(async (user: firebase.User) => {
      const userExists: boolean = (user != null);
      const userHasUID: boolean = userExists && (user.uid != null);
      const userIsValidAndVerified: boolean = userHasUID && user.emailVerified;
      if (userIsValidAndVerified) {
        this.firebaseGeneralManager.createCurrentUserSubscription();
      }
      if (!userExists) {
        const userWasSignedInButNoLongerExists: boolean = this.userIsAuthenticated();
        if (userWasSignedInButNoLongerExists) {
          await this.authService.logOutGoHome(this.authService.SIGN_OUT_SUCCESS_MESSAGE);
        }
        this.updateCurrentUserObservables(null);
      }
    });
  }

  /**
  * Returns true if the user is confirmed as authneticated. False otherwise.
  */
  userIsAuthenticated(): boolean {
    return this.currentUserAuth.value == this.USER_AUTHENTICATED;
  }

  /**
  * Returns true if the user is confirmed as not authneticated. False otherwise.
  */
  userIsNotAuthenticated(): boolean {
    return this.currentUserAuth.value == this.USER_NOT_AUTHENTICATED;
  }

  /**
  * Returns true if the asynchronous code to determine authentication state 
  * has not yet returned. False otherwise.
  */
  userIsLoading(): boolean {
    return this.currentUserAuth.value == this.USER_LOADING;
  }

  /**
  * Returns the current state of the user profile obseravble. If the user is not authenticated then the
  * observable value will be null.
  */
  getCurrentUser(): UserProfile {
    return this.currentUserProfile.value;
  }

  /**
  * Helper function for logic associated with updating current user profile 
  * subscription and current user auth subscription. User is authenticated 
  * if their UserProfile is not null. They are unauthenticated otherwise.
  * 
  * @param newUserState new state of user profile.
  */
  updateCurrentUserObservables(newUserState: UserProfile): void {
    this.currentUserProfile.next(newUserState);
    if (newUserState != null) {
      this.currentUserAuth.next(this.USER_AUTHENTICATED);
    }
    else {
      this.currentUserAuth.next(this.USER_NOT_AUTHENTICATED);
    }
  }

  /**
   * Checks whether or not the user just authenticated the first time for this session. If this is true then
   * the value 'hasAuthenticated' should not be in session storage. If the value is not in session storage
   * then it is set and the user is redirected to the dashboard. This is the function responsible for making 
   * the user appear to automatically sign in if their credentails are in local storage. If the user has already
   * been authenticated for the first time this session, then nothing is done.
   */
  async checkForFirstAuthOfSession(): Promise<void> {
    const userHasAuthenticated: string = sessionStorage.getItem(this.USER_HAS_AUTHENTICATED);
    const thisIsFirstAuthOfSession: boolean = (userHasAuthenticated == null);
    if (thisIsFirstAuthOfSession) {
      const navResult = await this.zone.run(async () => await this.router.navigate([this.ROUTE_DASHBOARD]));
      if (!navResult) {
        this.LOCATION.reload();
      } else {
        sessionStorage.setItem(this.USER_HAS_AUTHENTICATED, this.AUTH_CONFIRMED);
      }
    }
  }

  /**
   * Navigates to the register navigator page which allows users to
   * choose what user type they will be. This function is a hold over
   * from when we used to have the register navigator page.
   */
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Caches an object in local storage. If the object already exists
   * then it is overwritten. This function accepts an optional TTL param.
   * if the TTL param exists, then the object will only be able to be retrieved 
   * from the cache while there has not been more time since the time the object 
   * was stored then was specified as the TTL param.
   * 
   * @param key Key used to retrieve object from the cache
   * @param obj The object to be set in local storage
   * @param timeToLiveInDays How many day the object should exist in cache (decimals allowed)
   */
  setCache(key: string, obj: any, timeToLiveInDays?: number): void {
    let timeToLiveInMsec: number = null;
    if (timeToLiveInDays) {
      timeToLiveInMsec = (this.time.getDayInMillis() * timeToLiveInDays);
    }
    const storageObject: string = JSON.stringify({
      objectToStore: obj,
      timeOfStorage: (new Date()).getTime(),
      timeToLive: timeToLiveInMsec
    });
    localStorage.setItem(key, storageObject);
  }

  /**
   * Returns an object from the cache. If the object exists, then it 
   * is checked for a TTL. If the object exists and there is no TTL 
   * param or the TTL param has not expired, then the object is returned.
   * Otherwise null is returned (i.e. ttl expired or no object in cache).
   * 
   * @param key key that was specified for the object at storage time.
   */
  getCache(key: string): any | null {
    const NO_OBJECT: null = null;
    try {
      const storageObject: string = localStorage.getItem(key);
      const actualObject: any = JSON.parse(storageObject);
      let expired: boolean = false;
      if (actualObject.timeToLive) {
        const timeObjCanLiveTo = (actualObject.timeOfStorage + actualObject.timeToLive);
        expired = ((new Date()).getTime() >= timeObjCanLiveTo);
      }
      if (!expired) {
        return actualObject.objectToStore;
      } else {
        return NO_OBJECT;
      }
    } catch (error) {
      return NO_OBJECT;
    }
  }

  /**
   * Returns the user's main log and payload from the cahce if it exists.
   * An array with two null objects otherwise.
   */
  getCachedMainLogAndPayload(): [NutritionLog, EnergyPayload] {
    let cachedLogAndPayload: any = localStorage.getItem(this.MAIN_LOG_LOCAL_STORAGE_KEY);
    if (cachedLogAndPayload) {
      cachedLogAndPayload = JSON.parse(cachedLogAndPayload);
      if (cachedLogAndPayload != null && cachedLogAndPayload.length == 2) {
        cachedLogAndPayload[0].getEntryAtDate = NutritionLog.prototype.getEntryAtDate
        cachedLogAndPayload[0].dayEntries.forEach(entry => {
          entry.date = new Date(entry.date);
          return entry;
        });
      } else {
        return null;
      }
    }
    if (cachedLogAndPayload && cachedLogAndPayload[0].id == this.getCurrentUser().mainNutrLogId) {
      return cachedLogAndPayload
    }
    else {
      return null;
    }
  }

  /**
   * Sets the user's cache for their main log and energy payload.
   * 
   * @param logAndPayload LogAndPayload to be cached as the user's main log.
   */
  setCachedMainLogAndPayload(logAndPayload: [NutritionLog, EnergyPayload]): void {
    localStorage.setItem(this.MAIN_LOG_LOCAL_STORAGE_KEY, JSON.stringify(logAndPayload));
  }

  /**
   * Initiates god mode. This means that for 5 minutes, the user has elevated privledges 
   * while having a free account. Once five minutes is over, the user's permissions are
   * returned to normal and it is expected that their account will have been granted 
   * permissions by that point.
   */
  initiateGodMode(): void {
    const minutesInDay: number = (1440);
    const fiveMinuteFractionOfDay: number = (5 / minutesInDay);
    this.setCache(this.GOD_MODE_KEY, this.GOD_MODE_VALUE, fiveMinuteFractionOfDay)
  }

  /**
   * Terminates god mode if it is still active.
   */
  terminateGodMode(): void {
    localStorage.removeItem(this.GOD_MODE_KEY);
  }

  /**
   * Returns true if god mode should be granted to a user regarding an iOS purchase. False otherwise.
   */
  isInGodMode(): boolean {
    const theyHaveTimeLeft: boolean = (this.getCache(this.GOD_MODE_KEY) != null);
    const isOnIOS: boolean = this.environmentService.isiOS;
    const inGodMode: boolean = (theyHaveTimeLeft && isOnIOS);
    return inGodMode;
  }

  /**
   * Hides overflow on the global HTML document. Used on mobile when certain pages 
   * look weird if they can scroll.
   */
  hideDocumentOverflow() {
    if (this.environmentService.isMobile) {
      document.documentElement.classList.add("hideOverflow");
      const lsWrapperDoc: Element = document.getElementsByClassName("logSmarterWrapper")[0];
      lsWrapperDoc.classList.add("lsGradientBackgroundColor")
    }
  }

  /**
   * Reverts the class appended to the root element when hideDocumentOverflow() is called.
   */
  revertHideOverflow() {
    if (this.environmentService.isMobile) {
      document.documentElement.classList.remove("hideOverflow");
      const lsWrapperDoc: Element = document.getElementsByClassName("logSmarterWrapper")[0];
      lsWrapperDoc.classList.remove("lsGradientBackgroundColor")
    }
  }

  /**
   * Handles scrolling back to the top of the UI regardless of environment.
   * Takes an optional paramter for the y position to scroll back to. If not 
   * provided then the function will scroll back to the top.
   */
  scrollToTop(yPosition?: number): void {
    const mayNeedToReverseRubberBanding: boolean = (this.environmentService.isMobile);
    if (mayNeedToReverseRubberBanding) {
      const sideNavContent: Element = (document.getElementsByClassName('mat-sidenav-content'))[0];
      sideNavContent.scrollTop = (yPosition || 0);
    } else {
      window.scroll(0, yPosition || 0);
    }
  }

}
