import { Injectable } from '@angular/core';
import { UserProfile } from '../../model-classes/general/user-profile';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { PreferenceService } from '../general/preference.service';
import { ObjectStorageService } from '../general/object-storage.service';
import { NutritionLog } from 'src/app/model-classes/nutrition-log/nutrition-log';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { TimeService } from '../general/time-constant.service';
import { Router } from '@angular/router';
import { ProfileService } from '../general/profile.service';
import { EnvironmentService } from '../general/environment.service';
import { StateManagerService } from '../general/state-manager.service';
import { EnergyPayload } from 'functions/src/classes/energy-payload';

/** 
 * The firebase general service is responsible for any operations that involve firebase that are 
 * not directly related to authentication or nutrition log CRUD. The responsiblities of this service 
 * include CRUD operations on user profiles and their various properties and retrieving any public data 
 * from our firestore database like the list of our employees that is displayed on the about page.
 * 
 * Last edited by: Ryan Lefebvre 9/30/2020
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseGeneralService {

  /**
   * Reference to the path in our firestore database where UserProfile objects are stored.
   */
  USER_PATH: string = "Users";

  /**
   * Reference to the path in our firestore database where the resources document is stored.
   */
  RESOURCES_PATH: string = "Resources/Resources";

  /**
   * Reference to the path in our firestore database where the social posts document is stored.
   */
  SOCIAL_PATH: string = "Social/social-dashboard";

  /**
   * Reference to the path in our firestore database where the FAQ document is stored.
   */
  FAQ_PATH: string = "FAQ/AllQuestions";

  /**
   * Reference to the path in our firestore database where the testimonials document is stored.
   */
  TESTIMONIAL_PATH: string = "Testimonials/Testimonials";

  /**
   * Reference to the path in our firestore database where the employees document is stored.
   */
  EMPLOYEE_PATH: string = "About/Employees";

  /**
   * References to the path in our firestore database where the instagram API secret key can be found
   */
  INSTAGRAMAPI_PATH: string = "InstagramAPI/InstagramAPI";

  /**
   * Name of the firebase function used to edit the demographic and preference information of a UserProfile object.
   */
  FUNCTION_EDIT_USER_PROFILE: string = "editUserProfile";

  /**
   * Name of the firebase function used to edit the promo code of a given UserProfile object.
   */
  FUNCTION_EDIT_USER_PROMO_CODE: string = "editUserPromoCode";

  /**
   * Message to be displayed when the user's demographic profile information is successfully edited.
   */
  USER_PROF_EDIT_SUCCESS: string = "User profile edited successfully";

  /**
  * Message to be displayed when an attempt to edit the user's demographic profile information fails.
  */
  USER_PROF_EDIT_FAILURE: string = "Failed to edit user profile";

  /**
   * Message to be displayed when the user's promo code is successfully edited.
   */
  USER_PROMO_CODE_EDIT_SUCCESS: string = "Promo code edited successfully";

  /**
   * Message to be displayed when an attempt to edit the user's promo code fails.
   */
  USER_PROMO_CODE_EDIT_FAILURE: string = "Failed to edit promo code";

  /**
   * Message to be displayed when the user's preferences are successfully edited.
   */
  USER_PREF_EDIT_SUCCESS: string = "User preferences edited successfully";

  /**
  * Message to be displayed when an attempt to edit the user's preferences fails.
  */
  USER_PREF_EDIT_FAILURE: string = "Failed to edit user preferences";

  /**
  * Message to be displayed when the user's main log is successfully set.
  */
  MAIN_LOG_SET_SUCCESS: string = "Main log set successfully";

  /**
  * Message to be displayed when the user's main log fails to be set.
  */
  MAIN_LOG_SET_FAILURE: string = "Failed to set main log";

  /**
  * Message to be displayed when the user's main log is successfully removed.
  */
  MAIN_LOG_REMOVE_SUCCESS: string = "Main log removed successfully";

  /**
  * Message to be displayed when the user's main log fails to be removed.
  */
  MAIN_LOG_REMOVE_FAILURE: string = "Failed to remove main log";

  /**
   * Key used in the firebase storage form of the UserProfile.
   */
  USER_PROF_STORAGE_KEY: string = "u";

  /**
   * This observable is used to emit the state changes to the authenticated user's UserProfile object. 
   * This service is responsible for cleaning the profile before emitting state changes. The only 
   * service that should subscribe to this observable is the state manager who uses the result 
   * of this observable emitting state changes to determin auth state and distribute the state of 
   * the current user to other components and services.
   */
  currentUser: BehaviorSubject<UserProfile> = new BehaviorSubject<UserProfile>(null);

  /**
  * Message to be displayed when the user's email is reverted to its previous state.
  */
  EMAIL_REVERT_SUCCESS: string = "Reverted email address";

  /**
  * Message to be displayed when the user's email is NOT reverted to its previous state.
  */
  EMAIL_REVERT_FAILURE: string = "Failed to revert email address";

  /**
   * Route within application that specifies the register page. 
   */
  ROUTE_REGISTER: string = "auth/register";

  /**
   * Key used to define user type for register page query params
   */
  specialUserKey: string = "uType";

  /**
   * Key used in session storage to get the cached version of the user profile.
   */
  CACHED_USER_KEY: string = "thisIsTheCachedUser";

  /**
   * Key used to get the TTL of cached user profile
   */
  TTL_KEY: string = "ttl";

  /**
   * Key used to get the user profile from the cached user profile obj.
   */
  USER_PROFILE_KEY: string = "user";

  /**
   * Thirty seconds in milliseconds.
   */
  THIRTY_SECONDS: number = 30000

  /**
   * Helper lambda for setting the cached user profile in local storage.
   */
  setCachedUserProfile: (UserProfile) => void = (user) => localStorage.setItem(this.CACHED_USER_KEY, JSON.stringify({
    [this.USER_PROFILE_KEY]: user,
    [this.TTL_KEY]: ((new Date()).getTime() + this.THIRTY_SECONDS)
  }));

  /**
   * Helper lambda for retrieving a unique deep copy of the cached profile.
   */
  getCachedProfile: () => UserProfile = () => {
    let userObj: any = localStorage.getItem(this.CACHED_USER_KEY);
    let userProfile: UserProfile;
    const userExists: boolean = (userObj && userObj[this.USER_PROFILE_KEY] != null);
    const cacheNotExpired = (userExists && ((new Date()).getTime() < userObj[this.TTL_KEY]));
    if (userExists && cacheNotExpired) {
      userProfile = JSON.parse(userObj[this.USER_PROFILE_KEY]);
    }
    return userProfile;
  };

  /**
   * @ignore
   */
  constructor(
    public db: AngularFirestore,
    public auth: AuthenticationService,
    public prefs: PreferenceService,
    public objectManager: ObjectStorageService,
    public snackBarManager: SnackBarService,
    public fireFunc: AngularFireFunctions,
    public timeManager: TimeService,
    public profile: ProfileService,
    public environmentService: EnvironmentService,
    public router: Router) { }

  /**
   * Returns a subscription to an observable that emits a value whenever the state of the 
   * currently authenticated user is changed. This means that some property of the user's 
   * UserProfile object has changed in the database. The body of the subscription will clean
   * the objects properties and then call next on an observable that the StateManagerService
   * subscribes to in order to track state changes to the current user's UserProfile. If an 
   * error were to occurr during the body of the subscription, then a value of null is emitted.
   */
  createCurrentUserSubscription(): Subscription {
    const user_ID: string = this.auth.getUserID();
    this.auth.userProfPathSubscription = this.db.collection(this.USER_PATH).doc(user_ID).valueChanges().subscribe(
      (userProfileResponse: any) => {
        if (userProfileResponse) {
          try {
            const cleanedProfile: UserProfile = this.cleanUserProfile(userProfileResponse);
            const cachedProfile: UserProfile = this.getCachedProfile();
            let profileToUse: UserProfile = cachedProfile;
            if (!cachedProfile) {
              profileToUse = cleanedProfile;
            }
            const userWasNotDeleted = !(profileToUse.wasDeleted)
            if (userWasNotDeleted) {
              this.currentUser.next(profileToUse)
              if (this.environmentService.isMobile) {
                const cleanedThemeColor: string = profileToUse.userPreferences[this.prefs.GENERAL_PREFS][this.prefs.THEME_COLOR];
                //@ts-ignore
                StatusBar.backgroundColorByHexString(cleanedThemeColor);
              }
            }
          }
          catch (err) {
            this.currentUser.next(null);
          }
        }
      });
    return this.auth.userProfPathSubscription;
  }

  /**
   * Performs a check to see if the user was deleted on another device but the user stayed signed in to their 
   * current session because they are currently in a long lasting firebase session. If the user did get deleted,
   * then the wasDeleted flag on their profile should be flipped to 'true'. In this case the user should 
   * be signed out immediately.  
   */
  async checkIfUserWasDeleted(userProfileResponse: any): Promise<void> {
    const wasDeleted = (userProfileResponse.wasDeleted == true);
    if (wasDeleted) {
      await this.auth.logOutGoHome(this.auth.ACCOUNT_DELETE_SUCCESS_MESSAGE);
    }
  }

  /**
   * This function is responsible for cleaning the response to a request to read the state of a UserProfile object 
   * in the database. If any error occurs then a new UserProfile object is returned with default values. Otherwise, all attributes are 
   * copied from the response from Firebase into a UserProfile object. Special checks are done for the user's preferences,
   * if the user does not have any preferences, then all of their preferences are set to the default defined in the 
   * preference management service. Lastly a check is done for the creation date of the profile. If the creation date 
   * does not exist, then it is set to excactly 3 weeks before the current date. 3 weeks was chosen somewhat arbitrarily,
   * this is because we just needed a value that was more than the length of the free trial.
   * 
   * Lastly, a check was added for the user's email address. If their profile email address does not
   * match their firebase auth email address, a request is made to the backend to trigger an update that
   * will sync the email address for the user's profile, firebase auth and their stripe subscription if 
   * it exists. This can only happen if the user makes a request to change their email address then does 
   * not confirm the email change but instead reverts it by clicking the link in the email sent to their 
   * previous account email to undo the change.
   * 
   * @param userProfileResponse response of a firebase document query.
   */
  cleanUserProfile(userProfileResponse: any): UserProfile {
    try {
      const profileToReturn: UserProfile = new UserProfile();
      const userInformation = JSON.parse(userProfileResponse[this.USER_PROF_STORAGE_KEY]);
      this.checkIfUserWasDeleted(userInformation);
      profileToReturn.username = userInformation.username;
      profileToReturn.isMale = userInformation.isMale;
      profileToReturn.age = userInformation.age;
      profileToReturn.weight_lbs = userInformation.weight_lbs;
      profileToReturn.height_inches = userInformation.height_inches;
      profileToReturn.mainNutrLogId = userInformation.mainNutrLogId;
      profileToReturn.activityLevel = userInformation.activityLevel;
      profileToReturn.estimatedTDEE = userInformation.estimatedTDEE;
      profileToReturn.subscriptionStatus = userInformation.subscriptionStatus;
      profileToReturn.subscriptionTier = userInformation.subscriptionTier;
      profileToReturn.subscriptionID = userInformation.subscriptionID;
      profileToReturn.subPlatform = userInformation.subPlatform;
      profileToReturn.tierPermissions = userInformation.tierPermissions;
      profileToReturn.emailAddr = userInformation.emailAddr;
      profileToReturn.heardAboutUs = userInformation.heardAboutUs;
      profileToReturn.wasDeleted = userInformation.wasDeleted;
      profileToReturn.referredBy = userInformation.referredBy;
      profileToReturn.numReferrals = userInformation.numReferrals;
      profileToReturn.hasLoggedInBefore = userInformation.hasLoggedInBefore;
      profileToReturn.promoCode = userInformation.promoCode;
      profileToReturn.lastEdit = userInformation.lastEdit;
      const userHasPreferences: boolean = (userInformation.userPreferences != null);
      const userHasGeneralPrefs: boolean = userHasPreferences && (userInformation.userPreferences[this.prefs.GENERAL_PREFS] != null);
      const userHasNutritionPrefs: boolean = userHasPreferences && (userInformation.userPreferences[this.prefs.NUTR_PREFS] != null);
      profileToReturn.userPreferences = this.prefs.getDefaultPreferences();
      if (userHasGeneralPrefs && userHasNutritionPrefs) {
        profileToReturn.userPreferences = userInformation.userPreferences
      }
      this.markDateCreatedBasedOnProfileTypeAndTier(profileToReturn, userInformation);
      const authEmail: string = this.auth.afAuth.auth.currentUser.email;
      const emailsDontMatch: boolean = (authEmail != profileToReturn.emailAddr);
      if (emailsDontMatch && profileToReturn.hasLoggedInBefore) {
        const WE_NO_LONGER_WANT_TO_SHOW_THESE_SNACKBARS: boolean = true;
        this.updateUserProfileInDB(profileToReturn, this.EMAIL_REVERT_SUCCESS, this.EMAIL_REVERT_FAILURE, WE_NO_LONGER_WANT_TO_SHOW_THESE_SNACKBARS);
      }
      return profileToReturn;
    }
    catch (error) {
      const emptyProfile = new UserProfile();
      emptyProfile.userPreferences = this.prefs.getDefaultPreferences();
      return emptyProfile;
    }
  }

  /**
   * This function handles the logic for marking the date created property of different 
   * profile types. This needs to be done because our system will lock anyone out whose 
   * account is past the limit of the free trial (14 days). Only individual users have access to  
   * a free trial currently. So to force coaching users to having no free trial, we 
   * automatically set their account to having a date created property that is more than
   * two weeks old. For individual users, they will have their true date created property 
   * used as the value to check against the free trial limit unless for some reason that
   * property does not exist. In that case, we assume that their free trial has run out and
   * mark their account as being created three weeks ago.
   * 
   * @param userProfile UserProfile to mark the date created property of.
   * @param userInformationFromFirebase JSON with same schema as userprofile that contains true user state. 
   */
  markDateCreatedBasedOnProfileTypeAndTier(userProfile: UserProfile, userInformationFromFirebase: any) {
    const hasNoDateCreated: boolean = !(userInformationFromFirebase.dateCreated);
    if (hasNoDateCreated) {
      this.markDateCreatedAsFiveWeeksAgo(userProfile);
    }
    else {
      userProfile.dateCreated = userInformationFromFirebase.dateCreated;
    }
  }

  /**
   * Marks a user profile's date created property as exactly 5 weeks before the current date.
   * This is used in cases where we want to make sure that we mark the users profiled created 
   * date as a date that is after the limit of what is allowed for the free trial (21 days).
   * The choice of 5 weeks was arbitrary. 
   * 
   * @param userProfile User Profile to mark the date created property of.
   */
  markDateCreatedAsFiveWeeksAgo(userProfile: UserProfile) {
    const currentDateInMillis = this.timeManager.getTimeStamp();
    const fiveWeeksInMillis = this.timeManager.getWeekInMillis() * 5;
    const fiveWeeksAgo = currentDateInMillis - fiveWeeksInMillis;
    userProfile.dateCreated = fiveWeeksAgo;
  }

  /**
  * Makes a request to firebase that will edit the UserProfile properties of the currently authenticated user.
  * New demographic information is expected to be passed in as a parameter to this function in the form of a 
  * UserProfile object. If the operation is successful then the onSuccess message is displayed, if the operation 
  * fails or an error occurs, then the onFailure message is displayed. 
  * 
  * @param userProfile contains new demographic or preference information for user. 
  * @param onSuccess  success message
  * @param onFailure failure message
  * @param shouldNotShowMessage true if none of the messages should be shown.
  * @param setHasLoggedInBefore true if just updating the user profiles has logged in before property to true
  */
  async updateUserProfileInDB(userProfile: UserProfile, onSuccess: string, onFailure: string, shouldNotShowMessage?: boolean, setHasLoggedInBefore?: boolean): Promise<any> {
    const cachedReferenceInCaseThingsBreak: UserProfile = this.getCachedProfile();
    userProfile.lastEdit = (new Date()).getTime();
    this.setCachedUserProfile(userProfile);
    this.currentUser.next(userProfile);
    if (!shouldNotShowMessage) {
      this.snackBarManager.showSuccessMessage(onSuccess);
    }
    try {
      await this.fireFunc.httpsCallable(this.FUNCTION_EDIT_USER_PROFILE)({
        user: userProfile,
        setHasLoggedInBefore: setHasLoggedInBefore
      }).toPromise();
    }
    catch (err) {
      if (err.code == "internal") {
        this.snackBarManager.showWarningMessage("Can't Connect");
      }
      else if (!shouldNotShowMessage) {
        this.snackBarManager.showFailureMessage(onFailure);
      }
      this.setCachedUserProfile(cachedReferenceInCaseThingsBreak)
      this.currentUser.next(cachedReferenceInCaseThingsBreak);
    }
  }

  /**
   * Makes a request to firebase to update the demographic information and user 
   * preferences of the authenticated user's user profile. The new properties are
   * stored in a user profile object meant to represent the state of the user's 
   * new profile. On the backend, this function will trigger an update the user's TDEE.
   * No other variables will be changed.
   *  
   * @param newCurrentUserInfo user profile with updated demographic information.
   * @param showSnackbar true if the snack bar should be shown.
   */
  async editUserProfile(newCurrentUserInfo: UserProfile): Promise<void> {
    const SHOW_MESSAGES: boolean = false;
    return this.updateUserProfileInDB(newCurrentUserInfo, this.USER_PROF_EDIT_SUCCESS, this.USER_PROF_EDIT_FAILURE, SHOW_MESSAGES);
  }

  /**
   * Makes a request to firebase that will edit the promoCode property of the currently authenticated user.
   * If the operation is successfull, then the onSuccess message is displayed.
   * If the operation fails, then the onFailure message is displayed.
   * 
   * @param userProfile contains a new promo code for the user.
   */
  async updateUserPromoCodeInDB(userProfile: UserProfile, onSuccess: string, onFailure: string): Promise<any> {
    try {
      const result = await this.fireFunc.httpsCallable(this.FUNCTION_EDIT_USER_PROMO_CODE)({ user: userProfile }).toPromise();
      result.errMsg ? this.snackBarManager.showFailureMessage(result.errMsg) : this.snackBarManager.showSuccessMessage(onSuccess);
    } catch (err) {
      this.snackBarManager.showFailureMessage(onFailure);
    }
  }

  /**
   * Makes a request to firebase to update the promoCode property of the authenticated user.
   * On the backend, the promoCode property in the UserProfile will be updated.
   * The table of promo codes will also be updated.
   * 
   * @param newCurrentUserInfo user profile with the updated promo code.
   */
  async editUserPromoCode(newCurrentUserInfo: UserProfile): Promise<void> {
    return await this.updateUserPromoCodeInDB(newCurrentUserInfo, this.USER_PROMO_CODE_EDIT_SUCCESS, this.USER_PROMO_CODE_EDIT_FAILURE);
  }

  /**
   * Makes a request to firebase to update the demographic information and user 
   * preferences of the authenticated user's user profile. The new properties are
   * stored in a user profile object meant to represent the state of the user's 
   * new profile. On the backend, this function will also update the user's TDEE.
   * No other variables will be changed.
   *  
   * @param newCurrentUserInfo user profile with updated demographic information.
   * @param showSnackbar true if the snack bar should be shown.
   */
  async editUserPreferences(newUserWithNewPreferences: UserProfile): Promise<void> {
    return this.updateUserProfileInDB(newUserWithNewPreferences, this.USER_PREF_EDIT_SUCCESS, this.USER_PREF_EDIT_FAILURE);
  }

  /**
   * The UserProfile object has a property that stores the id of the nutrition log that the user considers their 
   * main log. This is used as a reference to retrieve that log that is displayed on the dashboard for the current user.
   * This means to set a new log, the user will have to edit their UserProfile in the database.
   * 
   * During testing for release of the paid beta, an optional parameter was added to allow the user's TDEE to be updated
   * when the main log is set. This was added to allow for a case where the user already had a main log but they set a new main 
   * log. In that case, we need to update their TDEE to the estimated TDEE from the energy payload of their current main log. 
   * This case is currently only possible to happen when the main log is set through the log management dialog,
   * 
   * @param currentUserProfile user profile to add the new main log id to.
   * @param newMainLog Nutrition log to be set as the main log.
   */
  async setUserMainNutrLog(currentUserProfile: UserProfile, newMainLog: NutritionLog, updateTDEETo?: number, stateMan?: StateManagerService): Promise<void> {
    const hasTDEEToUpdateTo: boolean = (updateTDEETo != null);
    if (hasTDEEToUpdateTo) {
      currentUserProfile.estimatedTDEE = updateTDEETo;
    }
    currentUserProfile.mainNutrLogId = newMainLog.id;
    if (stateMan) {
      stateMan.setCachedMainLogAndPayload([newMainLog, new EnergyPayload()]);
    }
    return this.updateUserProfileInDB(currentUserProfile, this.MAIN_LOG_SET_SUCCESS, this.MAIN_LOG_SET_FAILURE);
  }

  /**
   * Removes the main nutrition log from the current user's UserProfile. This means resetting 
   * the mainNutritionLogId property of the profile to null. An additional constraint that must be 
   * met is making sure that the user's estimated TDEE from their previous log is carried over to their 
   * profile so that there are no wild jumps in TDEE when moving from one main log to another.
   * 
   * @param currentUserProfile user profile to add the new main log id to.
   * @param newMainLog Nutrition log to be set as the main log.
   */
  async removeUserMainNutrLog(currentUserProfile: UserProfile, currentEstimatedTDEE: number, state: StateManagerService) {
    const mainLogAndPayload = state.getCachedMainLogAndPayload();
    if (mainLogAndPayload) {
      const mainPayload = mainLogAndPayload[1];
      if (mainPayload.estimatedTDEE) {
        currentEstimatedTDEE = mainPayload.estimatedTDEE;
      }
    }
    currentUserProfile.mainNutrLogId = null;
    currentUserProfile.estimatedTDEE = currentEstimatedTDEE;
    const MAIN_LOG_LOCAL_STORAGE_KEY: string = "MLLS";
    localStorage.removeItem(MAIN_LOG_LOCAL_STORAGE_KEY);
    return this.updateUserProfileInDB(currentUserProfile, this.MAIN_LOG_REMOVE_SUCCESS, this.MAIN_LOG_REMOVE_FAILURE);
  }

  /**
   * Returns an observable that emits the state of the public social post document in our firestore database.
   */
  getSocials(): Observable<firebase.firestore.DocumentSnapshot> {
    return this.db.doc(this.SOCIAL_PATH).get();
  }

  /**
   * Returns an observable that emits the state of the public FAQ document in our firestore database.
   */
  getFaqs(): Observable<firebase.firestore.DocumentSnapshot> {
    return this.db.doc(this.FAQ_PATH).get();
  }

  /**
   * Returns an observable that emits the state of the public employees document in our firestore database.
   */
  getEmployees(): Observable<firebase.firestore.DocumentSnapshot> {
    return this.db.doc(this.EMPLOYEE_PATH).get();
  }

  /**
   * Returns an observable that emits the state of the public testimonials document in our firestore database.
   */
  getTestimonials(): Observable<firebase.firestore.DocumentSnapshot> {
    return this.db.doc(this.TESTIMONIAL_PATH).get();
  }

  /**
   * Returns an observable that emits the state of the public resources document in our firestore database.
   */
  getResources(): Observable<firebase.firestore.DocumentSnapshot> {
    return this.db.doc(this.RESOURCES_PATH).get();
  }

  /**
   * Returns an observable that emits the state of the instagram API keys in our firestore database.
   */
  getInstagramAPIKeys(): Observable<firebase.firestore.DocumentSnapshot> {
    return this.db.doc(this.INSTAGRAMAPI_PATH).get();
  }

}
