import { Injectable } from '@angular/core';
import { StateManagerService } from './state-manager.service';
import { TimeService } from './time-constant.service';
import { UserProfile } from 'src/app/model-classes/general/user-profile';

/**
 * This service is a wrapper around the user's permissions. Any operations that involve checking
 * the user's permissions should go through this service. It will grab the current user's state from the 
 * state manager and check that user's permissions.
 * 
 * Last edited by: Ryan Lefebvre 12/17/2020
 */
@Injectable({
  providedIn: 'root'
})
export class TierPermissionsService {

  /**
   * Reference to an active subscription status.
   */
  SUBSCRIPTION_STATUS_ACTIVE: string = 'active';

  /**
   * Reference to the tier name for free accounts
   */
  FREE_SUBSCRIPTION_NAME: string = "LS_FREE";

  /**
   * Reference to the tier name for gold subscriptions
   */
  GOLD_SUBSCRIPTION_NAME: string = "GOLD";

  /**
   * Default display name when the user's subscription is unpaid.
   */
  DISPLAY_NAME_UNPAID: string = "Unpaid";

  /**
   * Key used for the tier id, a unique string that is used to identify a tier from others.
   */
  TIER_NAME_KEY: string = "name";

  /**
   * Default value for the tier name property of the user tier permissions JSON. 
   */
  DEFAULT_TIER_NAME: string = this.FREE_SUBSCRIPTION_NAME;

  /**
  * Key used to get display name property. String used to display user tier in the UI.
  */
  DISPLAY_NAME_KEY: string = "displayName";

  /**
   * Default value for the display name property of the user tier permissions JSON. 
   */
  DEFAULT_DISPLAY_NAME: string = "Free";

  /**
  * Key used to get property that says whether or not the user should have the ability to 
  * customize their preferences for general and nutrition preferences.
  */
  SHOW_PREFS_KEY: string = "showPrefs";

  /**
   * Default value for the show preferences name property of the user tier permissions JSON. 
   */
  DEFAULT_SHOW_PREFS: boolean = true;

  /**
  * Key used to get the maximum number of nutrition logs that a user can have.
  */
  MAX_NUTR_LOGS_KEY: string = "maxNumNutrLogs";

  /**
  * Default value for the max nutrition logs property of the user tier permissions JSON. 
  */
  DEFAULT_MAX_LOGS: number = 1;

  /**
  * Key used to get the maximum number of entries that a user can have per log.
  */
  MAX_DAY_ENTRIES_KEY: string = "maxEntriesPerLog";

  /**
  * Default value for the max day entries per nutrition log property of the user tier permissions JSON. 
  */
  DEFAULT_MAX_ENTRIES: number = 21;

  /**
  * Key used to get property that says whether or not the user should be able to view in depth stats.
  * In depth stats are loosely defined and will be expanded in the future. They currently include 
  * Goal intake reccomendations, different graph modes and averages for entry fields.
  */
  IN_DEPTH_STATS_KEY: string = "inDepthStats";

  /**
   * Default value for the in depth stats property of the user tier permissions JSON. 
   */
  DEFAULT_IN_DEPTH: boolean = true;

  /**
  * Key used to get property that says whether or not the user should be able to view 
  * premium resources. Some resources are available to all users but others can aonly be 
  * accessed by uprgrading to premoium.
  */
  SHOW_RESOURCES_KEY: string = "showResources";

  /**
   * Default value for the show resources property of the user tier permissions JSON. 
   */
  DEFAULT_SHOW_RESOURCES: boolean = false;

  /**
   * Last non null value for the current user observable. If this variable is null,
   * then no current user was ever emitted.
   */
  CURRENT_USER: UserProfile = this.stateManager.getCurrentUser();

  /**
   * The number of weeks that a user is given a free trial for
   */
  NUM_WEEKS_FREE_TRIAL: number = 3;

  /**
  * The number of weeks that a user is given a free trial for when they entered a promo code
  */
  NUM_WEEKS_FREE_TRIAL_PROMO: number = 4;

  /**
   * @ignore
   */
  constructor(public stateManager: StateManagerService, public timeService: TimeService) {
    this.currentUserSub();
  }

  /**
   * Maintains state of the current user within the tier permissions service. Prevents 
   * any errors from occuring when user profile could become null, for example during an
   * email change.
   */
  currentUserSub(): void {
    this.stateManager.currentUserProfile.subscribe(userProf => {
      if (userProf != null) {
        this.CURRENT_USER = userProf;
      }
    })
  }

  /**
   * Returns the current user's tier. Their tier is a JSON that consists of 
   * information about the permissions that their account has. If the user's tier
   * is null then the default tier values are returned.
   */
  getUserTier(): any {
    if(this.stateManager.isInGodMode()){
      return this.getGodTier();
    }
    const currentUserTier: {} = this.CURRENT_USER.tierPermissions;
    const userHasNoPermissions: boolean = !currentUserTier;
    if (userHasNoPermissions) {
      return userHasNoPermissions;
    } else {
      return currentUserTier;
    }
  }

  /**
   * Similar to the user's preferences, the user's tier permissions are only set on the 
   * backend and are essentially just a big JSON. This function is a helper in case anything 
   * goes wrong and the user needs to be reset to their default permissions. It is also used 
   * to set the user's preferences initially when their account is created.
   */
  getDefaultTier(): any {
    return {
      [this.TIER_NAME_KEY]: this.DEFAULT_TIER_NAME,
      [this.DISPLAY_NAME_KEY]: this.DEFAULT_DISPLAY_NAME,
      [this.SHOW_PREFS_KEY]: this.DEFAULT_SHOW_PREFS,
      [this.MAX_NUTR_LOGS_KEY]: this.DEFAULT_MAX_LOGS,
      [this.MAX_DAY_ENTRIES_KEY]: this.DEFAULT_MAX_ENTRIES,
      [this.IN_DEPTH_STATS_KEY]: this.DEFAULT_IN_DEPTH,
      [this.SHOW_RESOURCES_KEY]: this.DEFAULT_SHOW_RESOURCES
    }
  }

  /**
   * Similar to the user's preferences, the user's tier permissions are only set on the 
   * backend and are essentially just a big JSON. This function is a helper for when we 
   * give iOS users elevated perissions immediately after a purchase to give the backend 
   * time to respond and not slow down the client while they wait. It is important to note
   * that these are still exactly the same as regular premium permissions and only actually
   * last 5 minutes or until the god mode is terminated.
   */
  getGodTier(): any {
    return {
      [this.TIER_NAME_KEY]: "PENDING",
      [this.DISPLAY_NAME_KEY]: "PENDING",
      [this.SHOW_PREFS_KEY]: true,
      [this.MAX_NUTR_LOGS_KEY]: 75,
      [this.MAX_DAY_ENTRIES_KEY]: 365,
      [this.IN_DEPTH_STATS_KEY]: true,
      [this.SHOW_RESOURCES_KEY]: true
    }
  }

  /**
   * Helper function for locking down certain components when the user should not have permissions because
   * their free trial has ended or they have a premium account, but the subscription is no longer active.
   */
  freeTrialOverOrSubscriptionNotActive(): boolean {
    if(this.stateManager.isInGodMode()){
      return false;
    }
    return (this.freeTrialOverAndUserHasNotPaid() || this.userSubscriptionUnpaid());
  }

  /**
   * Returns a string that contains instructions to the user about how to fix their 
   * account when it is in the unpaid status and what steps they need to take to 
   * transition back to an active account.
   */
  getUnpaidMessage(): string {
    return (
      "Your subscription has been marked with a status of unpaid." +
      " This means that an automatic payment on your subscription has failed." +
      " To re-activate your subscription, click the button below."
    );
  }

  /**
   * Reutrns true if the user's subscription is unpaid. False otherwise.
   */
  userSubscriptionUnpaid(): boolean {
    if(this.stateManager.isInGodMode()){
      return false;
    }
    const nonNullStatus: boolean = (this.CURRENT_USER.subscriptionStatus != null)
    const nonActiveSub: boolean = nonNullStatus && (this.CURRENT_USER.subscriptionStatus != this.SUBSCRIPTION_STATUS_ACTIVE)
    return nonActiveSub;
  }

  /**
   * Returns true if the user has a paid subscription or they have a gold tier account.
   * If this function returns false, then paid features should be hidden.
   */
  userHasSubscription(): boolean {
    if(this.stateManager.isInGodMode()){
      return true;
    }
    return (((this.getUserTier())[this.TIER_NAME_KEY]) != this.FREE_SUBSCRIPTION_NAME);
  }

  /**
   * Returns true if the user has a subscription and their subscription status is 'active'.
   */
  userHasActiveSubscription(): boolean {
    if(this.stateManager.isInGodMode()){
      return true;
    }
    const hasActiveSub: boolean = (this.userHasSubscription() && (this.CURRENT_USER.subscriptionStatus == this.SUBSCRIPTION_STATUS_ACTIVE));
    const hasGoldSub: boolean = this.userHasGoldAccount();
    const shouldBeConsideredActive: boolean = (hasActiveSub || hasGoldSub);
    return shouldBeConsideredActive;
  }

  /**
   * Returns true if the user has a gold subscription account. Gold subscriptions get access to premium features
   * without having to pay a monthly fee. These accounts can only be granted by developers. Returns false if 
   * user's account tier is anything but a gold subscription.
   */
  userHasGoldAccount(): boolean {
    return ((this.getUserTier())[this.TIER_NAME_KEY]) == this.GOLD_SUBSCRIPTION_NAME;
  }

  /**
   * Returns true if the current users free trial is over and they have not paid. Returns false otherwise.
   */
  freeTrialOverAndUserHasNotPaid(): boolean {
    if(this.stateManager.isInGodMode()){
      return false;
    }
    const freeTrialOver: boolean = this.daysLeftInCurrentUserTrial() <= 0;
    const hasNotPaid: boolean = !this.userHasSubscription()
    const freeTrialOverAndHasNotPaid: boolean = freeTrialOver && hasNotPaid;
    return freeTrialOverAndHasNotPaid;
  }

  /**
   * Returns an appropriate display name for the user's tier based on their accounts current status.
   * This is shown in the UI to the user to tell them what their account's subscription status is.
   * If the account subscription is unpaid, this function defaults to returning the string 'unpaid'.
   */
  getDisplayNameForTier(): string {
    if(this.stateManager.isInGodMode()){
      return "Premium";
    }
    if (this.userSubscriptionUnpaid())
      return this.DISPLAY_NAME_UNPAID;
    else
      return ((this.getUserTier())[this.DISPLAY_NAME_KEY]);
  }

  /**
   * Returns false if the current user is still within the first 11 days of their 14 day trial period.
   * Returns true if 5 days or less remain in the trial period indicating that the account warning dialog
   * should be displayed.
   */
  showAccountWarning(): boolean {
    if(this.stateManager.isInGodMode()){
      return false;
    }
    const userHasPaid: boolean = this.userHasSubscription();
    const moreThan5DaysLeft: boolean = this.daysLeftInCurrentUserTrial() > 5;
    const userIsGold: boolean = this.userHasGoldAccount();
    const showWarning: boolean = !userHasPaid && !moreThan5DaysLeft && !userIsGold
    return showWarning;
  }

  /**
   * Returns the number of weeks in a users free trial period.
   * This function is only used for individual users. Users with 
   * a promo code on their profile will get an extended length free trial 
   */
  getNumWeeksFreeTrial(): number {
    const curUser: UserProfile = this.stateManager.getCurrentUser();
    const enteredValidPromoWhenCreated: boolean = ((curUser != null) && (curUser.referredBy != null));
    if (enteredValidPromoWhenCreated) {
      return this.NUM_WEEKS_FREE_TRIAL_PROMO;
    }
    else {
      return this.NUM_WEEKS_FREE_TRIAL;
    }
  }

  /**
   * Returns the number of whole days left in the current user's trial. If the free
   * trial has expired, then 0 is always returned.
   */
  daysLeftInCurrentUserTrial(): number {
    const user = this.CURRENT_USER;
    const curUserDateCreatedInMillis = new Date(user.dateCreated).getTime();
    const timeStamp = (this.timeService.getTimeStamp());
    const timeBetween = (timeStamp - curUserDateCreatedInMillis);
    const numDaysBetween = timeBetween / this.timeService.getDayInMillis();
    const daysLeft = Math.round(Math.max(0, (7 * this.getNumWeeksFreeTrial()) - numDaysBetween));
    return daysLeft;
  }

}
