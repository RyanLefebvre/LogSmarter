/**
 * Class that represents a LogSmarter user. Contains 
 * demographic information, references to logs, personal  
 * preference settings and stripe variables.
 * 
 * Last edited by: Ryan Lefebvre 7/27/2020
 */
export class UserProfile {

    /**
     * This property is used as a flag to let our userUpdated trigger know 
     * that the user whose profile had a state change needs its TDEE 
     * calculated and written to the database.
     */
    needToUpdateTDEE: boolean = false;

    /**
     * Username for logsmarter user. Does not need to be unique because 
     * uid is linked to account not username. Only restriction is that 
     * the username must be a valid string with less than or equal to 
     * 25 characters. A value of null means that no username was provided 
     * and the value will default to empty string.
     */
    username: string = null;

    /**
     * Flag to capture user gender. If null, then gender is unknown. 
     * If true the user is male. If false, the user is female.
     */
    isMale: boolean = null

    /**
     * The users age in years. Must be a positive integer that is less 
     * than or equal to 999. If null, no age was reported.
     */
    age: number = null;

    /**
     * The user's weight is always stored in lbs. Must be a positive number 
     * that is less than or equal to 999. All entered weights will be rounded 
     * to one decimal place for simplicity. If null, no weight was reported.
     */
    weight_lbs: number = null;

    /**
     * The user's height is always stored in inches. Must be a positive 
     * integer that is less than or equal to 119. Because the height is entered
     * as feet and inches seperately, the restrictions are enforced individually.
     * If null, no height was reported.
     */
    height_inches: number = null;

    /**
     * Activity level is a numeric representation of how physically active someone
     * is during the day. This should be a continuous variable, but it is hard to measure
     * accurately. For this reason, we use a discretized model of activity levels.
     * 
     * It is split into 4 categories: sedentary, lightly active, active and very active.
     * Activity level will be equal to one of those four categories or null. If null,
     * no activity level was reported.
     */
    activityLevel: string = "sedentary"

    /**
     * Whenever a nutrition log is created, a time stamp is recorded on the log to use 
     * as a unique identifier. This variable holds the value of the user's main logs id.
     * This lets the dashboard component display the user's main log when they sign in.
     * If null, no main log is selected for the user.
     */
    mainNutrLogId: number = null;

    /**
     * The estimated baseline TDEE for the user. If no baseline estimate exists, then 
     * this variable is null. If the value of this variable is outside the range of 
     * valid TDEE's defined in the LogSmarter documentation, then this variable is 
     * treated as if it is null.
     */
    estimatedTDEE: number = null;

    /**
     * The date that the user profile was created. After account creation this 
     * variable should become read only. If this variable is not a valid date, 
     * it will default to a date that is exactly three before whatever the 
     * current date is. this locks the user out of any paid content that they 
     * may not have access to.
     */
    dateCreated: number = (new Date()).getTime();

    /**
     * The user's subscription tier. This is an id used to link their 
     * subscription to one of the tiers which affects their account 
     * permissions.
     * 
     * Possible value as of 6/20/2020 are 'LS_FREE', 'PREMIUM' and 
     * 'GOLD'. More tiers may be implemented in the future.
     * 
     * This variable should never be null or a value that is not one 
     * of the the valid tier id's. If it is, the tier will default to 
     * 'LS_FREE'.
     */
    subscriptionTier: string = "LS_FREE";

    /**
     * Reference to stripe subscription id. If null, no subscription 
     * exists. If not null then the id can be used to retrie the stripe
     * subscription object using the stripe API.
     */
    subscriptionID: any = null;

    /**
     * Status of the subscription. If no subscription exists, then this 
     * variable is null. If a subscription exists, this variable represents 
     * the state of the subscription in the subscription lifecycle. Relevant 
     * possible values include 'active', 'canceled', 'unpaid'. For a valid 
     * subscription where user has account linked to a paying tier, any value 
     * besides 'active' is an issue and restrictions are placed on account 
     * permissions.
     */
    subscriptionStatus: any = null;

    /**
     * A JSON representing the user's preferences. This JSON 
     * is intentionally left loosely typed so that it is easy 
     * to expand in the future. As of 6/20/2020, there are 
     * two categories of preferences that the user has control over,
     * general preferences and nutrition preferences. If the userPreferences
     * JSON is not complete, the values in this JSON will be the default for 
     * the user.
     */
    userPreferences: any = null;

    /**
     * A JSON representing the user's subscription tier permissions. This JSON is
     * intentionally left loosely typed so that it is easy to expand in the future. As
     * of 7/16/2020, the default values for this JSON are set using the tier permission service. 
     */
    tierPermissions: any | null = null;

    /**
     * Used to keep track of user's email in the auth table. This allows us to keep their stripe
     * subscription in sync if they decide to change their email. We can do this by checking their
     * email every time that their profile is updated.
     */
    emailAddr: string | null = null;

    /**
     * If this property is anything besides null, it means that the user's profile was deleted and 
     * that they should be signed out of their current session in the client. This is meant to 
     * prevent user's from staying signed in on another device even though their account got 
     * deleted on a different device.
     */
    wasDeleted: any = null;

    /**
     * This property is used to identify what platform the user's subsription belongs to. This 
     * lets the frontend and backend differentiate between special operations that are unique 
     * to stripe(web), in-app-purchase(iOS) and in-app-billing(android). Potential values are 
     * null which indicates a stripe subscription, "apple" which indicates an IAP subscription and 
     * "android" which indicates an IAB subscription.
     */
    subPlatform: string | null = null;

    /**
    * False if the user has never logged in. True otherwise. Used as a flag to know when to 
    * open the first time tips dialog.
    */
    hasLoggedInBefore: boolean | null = null;

    /**
    * String that contains a message with max length of 140 characters explaining how the
    * user heard about why LogSmarter.
    */
    heardAboutUs: string | null;

    /**
     * User referral or referral code
     */
    referredBy: string | null;

    /**
     * The number of referral this user has. Everytime a user pays for a premium subscription or 
     * is upgraded to a gold subscription, they should receive +1 point. Any canceled or unpaid 
     * subscriptions will result in -1 point
     */
    numReferrals: number | null;

    /** 
     * A string that gold users can configure and share with others to receive share points when 
     * other user's register as paying customers with their promo code. This variable is null for 
     * all user types except for gold users when the gold user has set a promo code in via the field 
     * in the account component.
     */
    promoCode: string | null = null;

    /**
    * Timestamp used to help in deciding whether the client should rely on the cached profile.
    */
    lastEdit: number;
}