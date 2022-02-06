import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { StateManagerService } from './state-manager.service';
import { TimeService } from './time-constant.service';
import { TierPermissionsService } from './tier-permissions.service';
import { autoSpy } from 'autoSpy';
import { BehaviorSubject } from 'rxjs';

describe('TierPermissionsService', () => {
  const testHelpers: TestHelpers = new TestHelpers();
  let service: TierPermissionsService;

  beforeEach(() => {
    service = setup().default().build();
  });

  it('should subscribe to the current user when currentUserSub is called', () => {
    service.CURRENT_USER = null;
    expect(service.CURRENT_USER).toBeNull();
    const userProfile: UserProfile = testHelpers.createFreeUserProfile();
    service.stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(userProfile);
    service.currentUserSub();
    expect(service.CURRENT_USER).toBe(userProfile);
  });

  it('should return the users tier when getUserTier is called', () => {
    const userProfile: UserProfile = service.CURRENT_USER;
    expect(service.getUserTier()).toBe(userProfile.tierPermissions);
    userProfile.tierPermissions = null;
    expect(service.getUserTier()).toBe(true);
  });

  it('should return the default tier when getDefaultTier is called', () => {
    const defaultTier = {
      [service.TIER_NAME_KEY]: service.DEFAULT_TIER_NAME,
      [service.DISPLAY_NAME_KEY]: service.DEFAULT_DISPLAY_NAME,
      [service.SHOW_PREFS_KEY]: service.DEFAULT_SHOW_PREFS,
      [service.MAX_NUTR_LOGS_KEY]: service.DEFAULT_MAX_LOGS,
      [service.MAX_DAY_ENTRIES_KEY]: service.DEFAULT_MAX_ENTRIES,
      [service.IN_DEPTH_STATS_KEY]: service.DEFAULT_IN_DEPTH,
      [service.SHOW_RESOURCES_KEY]: service.DEFAULT_SHOW_RESOURCES
    };
    expect(service.getDefaultTier()).toEqual(defaultTier);
  });

  it('should return if the user\'\s free trial is over or their subscription is inactive when freeTrialOverOrSubscriptionNotActive is called', () => {
    spyOn(service, 'freeTrialOverAndUserHasNotPaid').and.returnValue(true);
    spyOn(service, 'userSubscriptionUnpaid').and.returnValue(true);
    expect(service.freeTrialOverOrSubscriptionNotActive()).toBe(true);
    spyOn(service, 'freeTrialOverAndUserHasNotPaid').and.returnValue(false);
    expect(service.freeTrialOverOrSubscriptionNotActive()).toBe(true);
    spyOn(service, 'userSubscriptionUnpaid').and.returnValue(false);
    expect(service.freeTrialOverOrSubscriptionNotActive()).toBe(false);
  });

  it('should return the unpaid message when getUnpaidMessage is called', () => {
    expect(service.getUnpaidMessage()).toBeDefined();
  });

  it('should return if the user subscription is unpaid when userSubscriptionUnpaid is called', () => {
    expect(service.userSubscriptionUnpaid()).toBe(true);
    service.CURRENT_USER.subscriptionStatus = service.SUBSCRIPTION_STATUS_ACTIVE;
    expect(service.userSubscriptionUnpaid()).toBe(false);
  });

  it('should return if the user has a subscription when userHasSubscription is called', () => {
    expect(service.userHasSubscription()).toBe(false);
    service.CURRENT_USER = testHelpers.createPremiumUserProfile();
    expect(service.userHasSubscription()).toBe(true);
    service.CURRENT_USER = testHelpers.createGoldUserProfile();
    expect(service.userHasSubscription()).toBe(true);
  });

  it('should return if the user has an active subscription when userHasActiveSubscription is called', () => {
    expect(service.userHasActiveSubscription()).toBe(false);
    service.CURRENT_USER = testHelpers.createPremiumUserProfile();
    service.CURRENT_USER.subscriptionStatus = service.SUBSCRIPTION_STATUS_ACTIVE;
    expect(service.userHasActiveSubscription()).toBe(true);
    service.CURRENT_USER = testHelpers.createGoldUserProfile();
    service.CURRENT_USER.subscriptionStatus = null;
    expect(service.userHasActiveSubscription()).toBe(true);
  });

  it('should return if the user has a gold account when userHasGoldAccount is called', () => {
    expect(service.userHasGoldAccount()).toBe(false);
    service.CURRENT_USER = testHelpers.createPremiumUserProfile();
    expect(service.userHasGoldAccount()).toBe(false);
    service.CURRENT_USER = testHelpers.createGoldUserProfile();
    expect(service.userHasGoldAccount()).toBe(true);
  });

  it('should return if the user\'\s free trial is over or the user has not paid when freeTrialOverAndUserHasNotPaid is called', () => {
    expect(service.freeTrialOverAndUserHasNotPaid()).toBe(false);
    spyOn(service, 'daysLeftInCurrentUserTrial').and.returnValue(-5);
    expect(service.freeTrialOverAndUserHasNotPaid()).toBe(true);
    service.CURRENT_USER = testHelpers.createPremiumUserProfile();
    expect(service.freeTrialOverAndUserHasNotPaid()).toBe(false);
  });

  it('should return the display name for the user\'\s tier when getDisplayNameForTier is called', () => {
    expect(service.getDisplayNameForTier()).toBe(service.DISPLAY_NAME_UNPAID);
    service.CURRENT_USER = testHelpers.createPremiumUserProfile();
    expect(service.getDisplayNameForTier()).toBe("Premium");
    service.CURRENT_USER = testHelpers.createGoldUserProfile();
    expect(service.getDisplayNameForTier()).toBe("Gold");
  });

  it('should return if the user is within the first 11 days of their 14 day trial when showAccountWarning is called', () => {
    spyOn(service, 'daysLeftInCurrentUserTrial').and.returnValue(7);
    expect(service.showAccountWarning()).toBe(false);
    spyOn(service, 'daysLeftInCurrentUserTrial').and.returnValue(3);
    expect(service.showAccountWarning()).toBe(true);
    service.CURRENT_USER = testHelpers.createGoldUserProfile();
    expect(service.showAccountWarning()).toBe(false);
  });

  it('should return a non-negative integer when daysLeftInCurrentUserTrial is called', () => {
    expect(service.daysLeftInCurrentUserTrial() >= 0).toBe(true);
  });

  it("should return a free trial time period specific to the promo code users when numWeeks", () => {
    service.stateManager.getCurrentUser = () => {
      const user = new UserProfile();
      user.referredBy = "someValue";
      return user;
    }
    expect(service.getNumWeeksFreeTrial()).toBe(service.NUM_WEEKS_FREE_TRIAL_PROMO);
  });

  it("should reutrn the god tier definition if getGodTier() is called ", () => {
    expect(service.getGodTier()).toEqual({
      [service.TIER_NAME_KEY]: "PENDING",
      [service.DISPLAY_NAME_KEY]: "PENDING",
      [service.SHOW_PREFS_KEY]: true,
      [service.MAX_NUTR_LOGS_KEY]: 75,
      [service.MAX_DAY_ENTRIES_KEY]: 365,
      [service.IN_DEPTH_STATS_KEY]: true,
      [service.SHOW_RESOURCES_KEY]: true
    })
  });

  it("should return false if freeTrialOverOrSubNotActive() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.freeTrialOverAndUserHasNotPaid()).toBe(false);
  });

  it("should return getGodTier if the statemanager is in god mode and getUserTier() is called ", () => {
    service.stateManager.isInGodMode = () => true;
    const expectedTier: any = "someExpectedTier";
    service.getGodTier = () => expectedTier;
    expect(service.getUserTier()).toBe(expectedTier);
  });

  it("should return false if userSubscriptionUnpaid() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.userSubscriptionUnpaid()).toBe(false)
  });

  it("should return true if userHasActiveSubscription() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.userHasActiveSubscription()).toBe(true)
  });

  it("should return true if userHasSubscription() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.userHasSubscription()).toBe(true)
  });

  it("should return false if freeTrialOverAndUserHasNotPaid() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.freeTrialOverAndUserHasNotPaid()).toBe(false)
  });

  it("should return false if freeTrialOverOrSubscriptionNotActive() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.freeTrialOverOrSubscriptionNotActive()).toBe(false)
  });

  it("should return false if  showAccountWarning() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.showAccountWarning()).toBe(false)
  });

  it("should return 'Premium' if getDisplayNameForTier() is called and the service is in god mode", async () => {
    service.stateManager.isInGodMode = () => true;
    expect(service.getDisplayNameForTier()).toBe("Premium")
  });


});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const builder = {
    stateManager,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(null);
      stateManager.getCurrentUser = jasmine.createSpy().and.returnValue(new TestHelpers().createFreeUserProfile());
      return new TierPermissionsService(stateManager, new TimeService());
    }
  };

  return builder;
}
