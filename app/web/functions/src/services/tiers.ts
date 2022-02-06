/**
 * This service is a wrapper around the user's permissions. Any operations that involve checking
 * the user's permissions should go through this service. 
 * 
 * Last edited by: Ryan Lefebvre 7/26/2020
 */

/**
* Reference to an active subscription status.
*/
export const SUBSCRIPTION_STATUS_ACTIVE: string = 'active';

/**
* Reference to an unpaid subscription status.
*/
export const SUBSCRIPTION_STATUS_UNPAID: string = 'unpaid';

/**
* Reference to the tier name for free accounts
*/
export const FREE_TIER_NAME: string = "LS_FREE";

/**
* Reference to the tier name for paid premium subscriptions. 
* IMPORTANT: This is the value set in the metadata on stripe. 
* When and if more tiers are added in the future, more values 
* will be set in the stripe metadata.
*/
export const PREMIUM_TIER_NAME: string = "PREMIUM";

/**
* Key used for the tier id, a unique string that is used to identify a tier from others.
*/
export const TIER_NAME_KEY: string = "name";

/**
* Reference to the tier name for gold subscriptions
*/
export const GOLD_TIER_NAME: string = "GOLD";

/**
 * GOLD_TIER value for the display name property of the user tier permissions JSON. 
 */
export const GOLD_TIER_DISPLAY_NAME: string = "Gold";

/**
* Key used to get display name property. String used to display user tier in the UI.
*/
export const DISPLAY_NAME_KEY: string = "displayName";

/**
 * FREE_TIER value for the display name property of the user tier permissions JSON. 
 */
export const FREE_TIER_DISPLAY_NAME: string = "Free";

/**
 * PREMIUM_TIER value for the display name property of the user tier permissions JSON. 
 */
export const PREMIUM_TIER_DISPLAY_NAME: string = "Premium";

/**
* Key used to get property that says whether or not the user should have the ability to 
* customize their preferences for general and nutrition preferences.
*/
export const SHOW_PREFS_KEY: string = "showPrefs";

/**
 * FREE_TIER value for the show preferences name property of the user tier permissions JSON. 
 */
export const FREE_TIER_SHOW_PREFS: boolean = true;

/**
 * PREMIUM_TIER value for the show preferences name property of the user tier permissions JSON. 
 */
export const PREMIUM_TIER_SHOW_PREFS: boolean = true;

/**
* Key used to get the maximum number of nutrition logs that a user can have.
*/
export const MAX_NUTR_LOGS_KEY: string = "maxNumNutrLogs";

/**
* FREE_TIER value for the max nutrition logs property of the user tier permissions JSON. 
*/
export const FREE_TIER_MAX_LOGS: number = 1;

/**
* PREMIUM_TIER value for the max nutrition logs property of the user tier permissions JSON. 
*/
export const PREMIUM_TIER_MAX_LOGS: number = 75;

/**
* Key used to get the maximum number of entries that a user can have per log.
*/
export const MAX_DAY_ENTRIES_KEY: string = "maxEntriesPerLog";

/**
* FREE_TIER value for the max day entries per nutrition log property of the user tier permissions JSON. 
*/
export const FREE_TIER_MAX_ENTRIES: number = 21;

/**
* PREMIUM_TIER value for the max day entries per nutrition log property of the user tier permissions JSON. 
*/
export const PREMIUM_TIER_MAX_ENTRIES: number = 365;

/**
* Key used to get property that says whether or not the user should be able to view in depth stats.
* In depth stats are loosely defined and will be expanded in the future. They currently include 
* Goal intake reccomendations, different graph modes and averages for entry fields.
*/
export const IN_DEPTH_STATS_KEY: string = "inDepthStats";

/**
 * FREE_TIER value for the in depth stats property of the user tier permissions JSON. 
 */
export const FREE_TIER_IN_DEPTH: boolean = true;

/**
 * PREMIUM_TIER value for the in depth stats property of the user tier permissions JSON. 
 */
export const PREMIUM_TIER_IN_DEPTH: boolean = true;

/**
* Key used to get property that says whether or not the user should be able to view 
* premium resources. Some resources are available to all users but others can aonly be 
* accessed by uprgrading to premoium.
*/
export const SHOW_RESOURCES_KEY: string = "showResources";

/**
 * FREE_TIER value for the show resources property of the user tier permissions JSON. 
 */
export const FREE_TIER_SHOW_RESOURCES: boolean = false;

/**
 * PREMIUM_TIER value for the show resources property of the user tier permissions JSON. 
 */
export const PREMIUM_TIER_SHOW_RESOURCES: boolean = true;

/**
 * Given a user's subscription tier and their subscription status, this 
 * function will assign the user's profile a tier JSON that contains the 
 * permissions associated with a user's account. This function is called 
 * any time that a user has their UserProfile's state edited.  
 * 
 * There are currently only two types of subscriptions. Free subscriptions,
 * which really are not subscriptions and only last 14 days, and premium subscriptions.
 * Premium subscriptions only have premium permissions if their status is active, so 
 * a user only receives premium subscriptions if their tier is not the free tier name 
 * and their subscription status is active.
 * 
 * Gold subscriptions are just premium subscriptions that never have to pay. They 
 * receive all premium features and permissions indefinitely without being charged.
 */
export function getUserTier(tierName: string, subscriptionStatus: string) {
    const userHasGoldSubscription: boolean = (tierName == GOLD_TIER_NAME);
    if (userHasGoldSubscription) {
        return goldTierPermissions();
    }
    else {
        const userHasFreeSubscription: boolean = (tierName == FREE_TIER_NAME);
        if (userHasFreeSubscription) {
            return freeTierPermissions();
        }
        else {
            const userHasActiveSubscription: boolean = (subscriptionStatus == SUBSCRIPTION_STATUS_ACTIVE);
            if (userHasActiveSubscription) {
                return premiumTierPermissions();
            }
            else {
                return freeTierPermissions();
            }
        }
    }
}

/**
 * Returns the tier permissions associated with a free account. These are the 
 * default permissions associated with any account.
 */
export function freeTierPermissions(): any {
    return {
        [TIER_NAME_KEY]: FREE_TIER_NAME,
        [DISPLAY_NAME_KEY]: FREE_TIER_DISPLAY_NAME,
        [SHOW_PREFS_KEY]: FREE_TIER_SHOW_PREFS,
        [MAX_NUTR_LOGS_KEY]: FREE_TIER_MAX_LOGS,
        [MAX_DAY_ENTRIES_KEY]: FREE_TIER_MAX_ENTRIES,
        [IN_DEPTH_STATS_KEY]: FREE_TIER_IN_DEPTH,
        [SHOW_RESOURCES_KEY]: FREE_TIER_SHOW_RESOURCES
    }
}

/**
 * Returns the tier permissions associated with a premium subscription.
 * This assumes that the premium subscription is active.
 */
export function premiumTierPermissions(): any {
    return {
        [TIER_NAME_KEY]: PREMIUM_TIER_NAME,
        [DISPLAY_NAME_KEY]: PREMIUM_TIER_DISPLAY_NAME,
        [SHOW_PREFS_KEY]: PREMIUM_TIER_SHOW_PREFS,
        [MAX_NUTR_LOGS_KEY]: PREMIUM_TIER_MAX_LOGS,
        [MAX_DAY_ENTRIES_KEY]: PREMIUM_TIER_MAX_ENTRIES,
        [IN_DEPTH_STATS_KEY]: PREMIUM_TIER_IN_DEPTH,
        [SHOW_RESOURCES_KEY]: PREMIUM_TIER_SHOW_RESOURCES
    }
}

/**
 * Returns the tier permissions associated with a Gold subscription.
 * Gold susbcriptions are essentially free paid subscription.
 */
export function goldTierPermissions(): any {
    const goldPermissions = premiumTierPermissions();
    goldPermissions[TIER_NAME_KEY] = GOLD_TIER_NAME;
    goldPermissions[DISPLAY_NAME_KEY] = GOLD_TIER_DISPLAY_NAME;
    return goldPermissions;
}
