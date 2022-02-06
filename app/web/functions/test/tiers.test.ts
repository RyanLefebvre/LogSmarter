import * as Tiers from '../src/services/tiers';
import * as TestHelpers from './testHelpers';
import { assert } from 'console';

describe("Functions/Services/Tiers", () => {

    afterEach(() => {
        TestHelpers.resetAllSpies();
    });

    it('should return the correct values for permissions when FreeTierPermissions() is called', () => {
        const actualPermissions = Tiers.freeTierPermissions();
        const allPermissionsValuesAreCorrect = !([
            actualPermissions[Tiers.TIER_NAME_KEY] === Tiers.FREE_TIER_NAME,
            actualPermissions[Tiers.DISPLAY_NAME_KEY] === Tiers.FREE_TIER_DISPLAY_NAME,
            actualPermissions[Tiers.SHOW_PREFS_KEY] === Tiers.FREE_TIER_SHOW_PREFS,
            actualPermissions[Tiers.MAX_NUTR_LOGS_KEY] === Tiers.FREE_TIER_MAX_LOGS,
            actualPermissions[Tiers.MAX_DAY_ENTRIES_KEY] === Tiers.FREE_TIER_MAX_ENTRIES,
            actualPermissions[Tiers.IN_DEPTH_STATS_KEY] === Tiers.FREE_TIER_IN_DEPTH,
            actualPermissions[Tiers.SHOW_RESOURCES_KEY] === Tiers.FREE_TIER_SHOW_RESOURCES,
        ].includes(false));
        assert(allPermissionsValuesAreCorrect === true);
    });

    it('should return the correct values for permissions when premiumTierPermissions() is called', () => {
        const actualPermissions = Tiers.premiumTierPermissions();
        const allPermissionsValuesAreCorrect = !([
            actualPermissions[Tiers.TIER_NAME_KEY] === Tiers.PREMIUM_TIER_NAME,
            actualPermissions[Tiers.DISPLAY_NAME_KEY] === Tiers.PREMIUM_TIER_DISPLAY_NAME,
            actualPermissions[Tiers.SHOW_PREFS_KEY] === Tiers.PREMIUM_TIER_SHOW_PREFS,
            actualPermissions[Tiers.MAX_NUTR_LOGS_KEY] === Tiers.PREMIUM_TIER_MAX_LOGS,
            actualPermissions[Tiers.MAX_DAY_ENTRIES_KEY] === Tiers.PREMIUM_TIER_MAX_ENTRIES,
            actualPermissions[Tiers.IN_DEPTH_STATS_KEY] === Tiers.PREMIUM_TIER_IN_DEPTH,
            actualPermissions[Tiers.SHOW_RESOURCES_KEY] === Tiers.PREMIUM_TIER_SHOW_RESOURCES,
        ].includes(false));
        assert(allPermissionsValuesAreCorrect === true);
    });

    it('should return the correct values for permissions when goldTierPermissions() is called', () => {
        const actualPermissions = Tiers.goldTierPermissions();
        const allPermissionsValuesAreCorrect = !([
            actualPermissions[Tiers.TIER_NAME_KEY] === Tiers.GOLD_TIER_NAME,
            actualPermissions[Tiers.DISPLAY_NAME_KEY] === Tiers.GOLD_TIER_DISPLAY_NAME,
            actualPermissions[Tiers.SHOW_PREFS_KEY] === Tiers.PREMIUM_TIER_SHOW_PREFS,
            actualPermissions[Tiers.MAX_NUTR_LOGS_KEY] === Tiers.PREMIUM_TIER_MAX_LOGS,
            actualPermissions[Tiers.MAX_DAY_ENTRIES_KEY] === Tiers.PREMIUM_TIER_MAX_ENTRIES,
            actualPermissions[Tiers.IN_DEPTH_STATS_KEY] === Tiers.PREMIUM_TIER_IN_DEPTH,
            actualPermissions[Tiers.SHOW_RESOURCES_KEY] === Tiers.PREMIUM_TIER_SHOW_RESOURCES,
        ].includes(false));
        assert(allPermissionsValuesAreCorrect === true);
    });

    it("should return goldTierPermissions() if the user's tierName is gold and getUserTier() is called", () => {
        const userTierName = Tiers.GOLD_TIER_NAME;
        const userSubscriptionStatus = " status does not matter for this case";
        const actualPermissions = Tiers.getUserTier(userTierName, userSubscriptionStatus);
        const expectedPermissions = Tiers.goldTierPermissions();
        const actualIsExpected = TestHelpers.isEquivalent(actualPermissions, expectedPermissions);
        assert(actualIsExpected);
    });

    it("should return freeTierPermissions() if the user's tierName is free and getUserTier() is called", () => {
        const userTierName = Tiers.FREE_TIER_NAME;
        const userSubscriptionStatus = " status does not matter for this case";
        const actualPermissions = Tiers.getUserTier(userTierName, userSubscriptionStatus);
        const expectedPermissions = Tiers.freeTierPermissions();
        const actualIsExpected = TestHelpers.isEquivalent(actualPermissions, expectedPermissions);
        assert(actualIsExpected);
    });

    it("should return premiumTierPermissions() if the user's tierName is premium, their subscription is active and getUserTier() is called", () => {
        const userTierName = Tiers.PREMIUM_TIER_NAME;
        const userSubscriptionStatus = Tiers.SUBSCRIPTION_STATUS_ACTIVE;
        const actualPermissions = Tiers.getUserTier(userTierName, userSubscriptionStatus);
        const expectedPermissions = Tiers.premiumTierPermissions();
        const actualIsExpected = TestHelpers.isEquivalent(actualPermissions, expectedPermissions);
        assert(actualIsExpected);
    });

    it("should return freeTierPermissions() if the user's tierName is premium, their subscription is NOT active and getUserTier() is called", () => {
        const userTierName = Tiers.PREMIUM_TIER_NAME;
        const userSubscriptionStatus = "NOT ACTIVE";
        const actualPermissions = Tiers.getUserTier(userTierName, userSubscriptionStatus);
        const expectedPermissions = Tiers.freeTierPermissions();
        const actualIsExpected = TestHelpers.isEquivalent(actualPermissions, expectedPermissions);
        assert(actualIsExpected);
    });
});