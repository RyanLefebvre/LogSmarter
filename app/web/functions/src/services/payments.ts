import FIREBASE = require('firebase-admin');
import * as functions from 'firebase-functions';
import * as profileManager from './profile';
import * as tierManager from './tiers';
import * as functionWrappers from './cloudfunction';
import * as environment from './environment';
import { UserProfile } from '../classes/user-profile';
import Stripe from 'stripe';
import * as platforms from '../constants/platforms';

/**
 * To collect and manage user’s payment information, we use a third party 
 * payment processor called Stripe and have integrated our Stripe account with Octobat. Octobat 
 * creates a checkout and subscription management form that will calculate and apply an 
 * exclusive sales tax at checkout time. This allows us to remain internationally tax compliant and 
 * outsource the complex logic of subscription CRUD. We use Webhooks and firebase cloud 
 * functions to communicate with Stripe and Octobat whenever Subscription CRUD events happen.
 *
 * Last edited by: Ryan Lefebvre 8/30/2020
 */

/**
 * Key for stripe api to perform general operations like subscription lifecycle CRUD
 */
export const STRIPE_API_KEY: string = environment.getStripeAPIKey();

/**
 * Key for stripe webhook API to verify that requests are legitimate.
 */
export const STRIPE_ENDPOINT_SECRET: string = environment.getStripeEndpointSecret();

/**
 * Plan ID for premium monthly that is used to create subscriptions through stripe for individuals.
 * This value can be found through the Stripe dashboard by going to products, clicking 
 * on the product and then looking for the plan. Next to the plan should be an 
 * 'API ID' with the price key.
 */
export const PREMIUM_MONTHLY_PLAN_ID_INDIVIDUAL: string = environment.getStripeIndividualPremiumSubId();

/**
 * Octobat API key for catching and responding to Octobat webhooks.
 */
export const OCTOBAT_SECRET_KEY: string = environment.getOctobatAPIKey();

/**
 * Reference to stripe for subscription lifecycle management.
 */
export const stripe: Stripe = new Stripe(STRIPE_API_KEY, { apiVersion: "2020-03-02" });

/**
 * Event type used to identify a customer subscription updated operation from a stripe webhook.
 */
export const SUBSCRIPTION_UPDATED: string = "customer.subscription.updated";

/**
 * Event type used to identify a customer subscription deletion operation from a stripe webhook.
 */
export const SUBSCRIPTION_DELETED: string = "customer.subscription.deleted";

/**
 * Event type used to identify a subscription charge failed event from a stripe webhook.
 */
export const CHARGE_FAILED: string = "charge.failed";

/**
 * Event type used to identify a Octobat order confirmation event from a stripe webhook.
 */
export const OCTO_ORDER_SUCCESS: string = "octobat.order.succeeded";

/**
 * Key used to get the UID from a subscription objects metadata property 
 */
export const CLIENT_REF_KEY: string = "octobat:client_reference_id";

/**
 * This is the key used to store the value of the IAP owner in the database.
 */
export const IAP_OWNER_KEY: string = "iapOwner";

/**
 * This is the key used to store the value of the IAP owner's receipt in the database.
 * Apple's terminology here is confusing because the receipt is actually an id that 
 * can be used to access what is called a unified receipt through their receipt 
 * verification API. The unified receipt contains the 100 most recent transactions
 * and the most recent transaction is the real receipt not the value stored at this
 * key.
 */
export const IAP_RECEIPT_KEY: string = "receipt";

/**
 * This is the key used to store the value of the IAB owner in the database.
 */
export const IAB_OWNER_KEY: string = "iabOwner";

/**
 * IAB notification type for a subscription that was cancelled.
 */
export const SUBSCRIPTION_CANCELED: number = 3;

/**
 * IAB notification type for a subscription that was restarted.
 */
export const SUBSCRIPTION_RESTARTED: number = 7;

/**
 * IAB notification type for a subscription that was revoked.
 */
export const SUBSCRIPTION_REVOKED: number = 12;

/**
 * IAB notification type for a subscription that expired.
 */
export const SUBSCRIPTION_EXPIRED: number = 13;

/**
 * IAB notification type for a subscription that renewed.
 */
export const SUBSCRIPTION_RENEWED: number = 2;

/**
 * Instead of manually setting the properties on a user's profile that are used to 
 * check the status of their stripe subscription. This function should be called 
 * whenever a new subscription is created regardless of the platform.
 * 
 * Before writing to the DB, a check is made to make sure that the write is necessary.
 * If any of the subscription properties that this function updates are not the same 
 * as what this function would change them to, then a write occurs. Otherwise, the 
 * account already has the desired subscription properties and a write is not necessary.
 * 
 * @param uid uid of the user's profile to update
 * @param subscriptionId id of the subscription the user purchased, this is platform dependent.
 * @param platform the platform the subscription was created on i.e. web, ios or android.
 */
export const activateSubscription = async (uid: string, subscriptionId: string, platform?: string): Promise<void> => {
    const userProf: UserProfile = await profileManager.getUserProfileFromUID(uid);
    const subID: string = subscriptionId;
    const subStatus: string = tierManager.SUBSCRIPTION_STATUS_ACTIVE;
    const subTier: string = tierManager.PREMIUM_TIER_NAME;
    const differentSubscriptionIds: boolean = (subscriptionId != userProf.subscriptionID);
    const differentSubStatus: boolean = (subStatus != userProf.subscriptionStatus);
    const differentTier: boolean = (subTier != userProf.subscriptionTier);
    const differentPlatforms: boolean = (platform != userProf.subPlatform);
    const needToUpdateDB = (differentSubscriptionIds || differentPlatforms || differentSubStatus || differentTier);
    if (needToUpdateDB) {
        userProf.subscriptionStatus = subStatus;
        userProf.subscriptionID = subID;
        userProf.subscriptionTier = subTier;
        userProf.subPlatform = platform;
        await profileManager.updateUserInDB(userProf, uid);
        const referredBy = userProf.referredBy;
        if (referredBy !== null) {
            await referralHelper(referredBy, true);
        }
    }
}

/**
 * Instead of manually setting the properties on a user's profile that are used to 
 * check the status of their stripe subscription. This function should be called 
 * whenever an existing subscription is marked as unpaid regardless of the platform.
 * 
 * Before writing to the DB, a check is made to make sure that the write is necessary.
 * If any of the subscription properties that this function updates are not the same 
 * as what this function would change them to, then a write occurs. Otherwise, the 
 * account already has the desired subscription properties and a write is not necessary.
 * 
 * @param uid uid of the user's profile to update.
 */
export const deactivateSubscription = async (uid: string): Promise<void> => {
    const userProf: UserProfile = await profileManager.getUserProfileFromUID(uid);
    const subStatus: string = tierManager.SUBSCRIPTION_STATUS_UNPAID;
    const subTier: string = tierManager.FREE_TIER_NAME;
    const differentSubStatus: boolean = (subStatus != userProf.subscriptionStatus);
    const differentTier: boolean = (subTier != userProf.subscriptionTier);
    const needToUpdateDB = (differentSubStatus || differentTier);
    if (needToUpdateDB) {
        userProf.subscriptionStatus = subStatus;
        userProf.subscriptionTier = subTier;
        await profileManager.updateUserInDB(userProf, uid);
        const referredBy = userProf.referredBy;
        if (referredBy !== null) {
            await referralHelper(referredBy, false);
        }
    }
}

/**
 * Called from the client whenever a user's account is deleted. This should 
 * only delete the user's subscription if their subscription is a stripe 
 * subscription. This is because IAP does not offer any way to delete or
 * cancel the subscription through an API.
 * 
 * Cancels a stripe subscription that is linked to a UserProfile object.
 * Whatever authenticated user makes a request to this function will have their
 * subscription deleted if a subscriptionID exists on their profile.
 */
export const cancelSubBody = async (params: any[]) => {
    const idxOfContext = 0;
    const context = params[idxOfContext];
    let user = await profileManager.getUserProfile(context);
    const stripeSubscriptionID = user.subscriptionID;
    const userHasASubscription: boolean = stripeSubscriptionID != null;
    const canDeleteSubscription: boolean = (user.subPlatform == null);
    if (userHasASubscription && canDeleteSubscription) {
        await stripe.subscriptions.del(stripeSubscriptionID);
    }
    return { user: user, message: "We canceled your subscription bro" };
};
export const cancelSub = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context, cancelSubBody, [context, data]);
});

/////////////////////////////////////////////  InAppBilling(Android) ///////////////////////////////////////////

/**
 * This function should only be called from inside the callback triggered in the Android client when a user 
 * owns a product after a successful purchase but does not have an active subscription in their user profile
 * which indicates their account permissions need to be updated. This function is expecting to be passed 
 * a subscription id, which is the purchaseToken from the Android product. Using that information, a document
 * is created in the IAB table that maps PurchaseTokens -> Uid of users that purchased the product. The user's profile
 * is also updated to have premium permissions. 
 */
export const createSubscriptionForIABBody = async (params: any[]) => {
    const idxOfContext = 0;
    const idxOfData = 1;
    const data = params[idxOfData];
    const context = params[idxOfContext];
    const currentUid = await profileManager.getUIDFromContext(context)
    const subscriptionId = data.subscriptionID;
    let subscriptionCreationWasSuccesful = false;
    try {
        await (activateSubscription(currentUid, subscriptionId, platforms.PLATFORM_ANDROID));
        await (setOwnerOfIAB(subscriptionId, currentUid));
        subscriptionCreationWasSuccesful = true;
    } catch (error) {
        subscriptionCreationWasSuccesful = false;
    }
    return {
        subscriptionCreationWasSuccesful: subscriptionCreationWasSuccesful,
        message: "We tried to create your IAB subscription bro"
    };
};
export const createSubscriptionForIAB = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context, createSubscriptionForIABBody, [context, data]);
});

/**
 * This function sets a document in the IAB table in our database. That table contains a list of documents that are 
 * named after the purchaseToken of IAB subscriptions. Inside the document, we store the uid of the user that bought
 * the subscription. This allows us to look the user up when we receive state updates from the Google Play Webhooks.
 * 
 * @param subscriptionID the ID of the subscription aka its purchaseToken.
 * @param uid uid of the user who owns this subscription.
 */
export const setOwnerOfIAB = async (subscriptionID: string, uid: any): Promise<FirebaseFirestore.WriteResult> => {
    return FIREBASE.firestore().collection('IAB').doc(subscriptionID).set({
        [IAB_OWNER_KEY]: uid
    });
}

/**
 * Returns the owner for the document stored in the IAB table's collection
 * of purchase_tokens if it exists. Otherwise, an object with null for both of those
 * properties is returned.
 * 
 * @param subscriptionID purchaseToken to query in the database.
 */
export const getOwnerOfIAB = async (subscriptionID: string): Promise<string> => {
    const dummyValue: any = { [IAB_OWNER_KEY]: null };
    let ownerObject: any = dummyValue;
    try {
        await FIREBASE.firestore().collection('IAB').doc(subscriptionID).get().then(snapshot => {
            const iabSnapData: FirebaseFirestore.DocumentData = snapshot.data();
            ownerObject = iabSnapData;
        });
    } catch (error) {
        ownerObject = dummyValue;
    }
    return ownerObject;
}

/**
 * Endpoint for various android webhooks related to subscriptions. Handles subscription Updates and deletes. 
 * If a subscription object is created, deleted or a charge fails, this function will receive a request from
 * Android and then based upon the body of that request, a user's profile is updated to the most current information
 * from Google.
 */
export const androidEventWebhookBody = async (request: any, response: any) => {
    const rtdnEvent = request.body;
    const subscriptionNotification = rtdnEvent.subscriptionNotification;
    const isSubscriptionRTDN: boolean = (subscriptionNotification != null);
    if (isSubscriptionRTDN) {
        const notificationType: number = subscriptionNotification.notificationType;
        const mayNeedToDowngrade: boolean = [
            SUBSCRIPTION_CANCELED,
            SUBSCRIPTION_REVOKED,
            SUBSCRIPTION_EXPIRED
        ].includes(notificationType);
        const mayNeedToUpgrade: boolean = [
            SUBSCRIPTION_RESTARTED,
            SUBSCRIPTION_RENEWED
        ].includes(notificationType);
        const mightNeedToUpdate: boolean = (mayNeedToDowngrade || mayNeedToUpgrade);
        if (mightNeedToUpdate) {
            const purchaseToken: string = subscriptionNotification.purchaseToken;
            const iabOwnerObject: any = (await getOwnerOfIAB(purchaseToken));
            const subscriptionOwnerUID: string = iabOwnerObject[IAB_OWNER_KEY];
            const profileOfOwner: UserProfile = await profileManager.getUserProfileFromUID(subscriptionOwnerUID);
            const subIsUsersCurrentSub: boolean = (purchaseToken == profileOfOwner.subscriptionID);
            if (subIsUsersCurrentSub) {
                if (mayNeedToDowngrade) {
                    await deactivateSubscription(subscriptionOwnerUID);
                }
                else if (mayNeedToUpgrade) {
                    await activateSubscription(subscriptionOwnerUID, purchaseToken, platforms.PLATFORM_ANDROID);
                }
            }
        }
    }
    return response.json({ received: true, ref: 'Yeah we do android stuff here bro.' }).end();
}
export const androidEvents = functions.https.onRequest(androidEventWebhookBody);


/**
 * Unfortunately, the google play console does not support setting up test and production 
 * URLs for webhooks. Instead they let you define a pub sub topic to send notifications to.
 * this creates a problem because then you cannot send notifications directly from google 
 * to an endpoint. Instead we have created a listener for any published messages within 
 * the topic that will forward the messages to both the development and production 
 * environments.
 * 
 * THIS SHOULD ONLY BE DEPLOYED IN PROD UNLESS YOU ARE IN DEV AND KNOW EXACTLY WHAT 
 * YOU ARE DOING BY DEPLOYING THIS FUNCTION. 
 */
export const androidEventWebhooks = functions.pubsub.topic("iab").onPublish(async message => {
    const decodedDataFromB64 = JSON.parse((Buffer.from(message.data, 'base64').toString('ascii')));
    const devOptions = {
        url: 'https://us-central1-logsmarterv2.cloudfunctions.net/androidEvents',
        method: 'POST',
        body: decodedDataFromB64,
        json: true,
    };
    const prodOptions = {
        url: "https://us-central1-logsmarter-production.cloudfunctions.net/androidEvents",
        method: 'POST',
        body: decodedDataFromB64,
        json: true,
    };
    await functionWrappers.httpRequest(devOptions);
    await functionWrappers.httpRequest(prodOptions);
});

/////////////////////////////////////////////  InAppPurchase(iOS) ///////////////////////////////////////////

/**
 * Returns true if a user's apple subscription is still valid, false otherwise.
 * This function assumes that the user's current subscription is an apple subscription.
 * If their subscription is not an apple subscription, then false will be returned. 
 */
export const checkIfAppleSubscriptionIsValid = async (subId: string): Promise<boolean> => {
    let subscriptionIsStillActive: boolean = true;
    try {
        const ownerAndReceipt = await getOwnerAndReceiptOfIAP(subId);
        const appStoreReceipt = (ownerAndReceipt as any)[IAP_RECEIPT_KEY];
        const body = {
            'receipt-data': appStoreReceipt,
            'password': environment.getAppleSecretKey(),
            'exclude-old-transactions': true,
        };
        const receiptValidationRequestDevOptions = {
            url: environment.getDevUrlForAppleReceiptValidationAPI(),
            method: 'POST',
            body: body,
            json: true,
        };
        const receiptValidationRequestProdOptions = {
            url: environment.getProdUrlForAppleReceiptValidationAPI(),
            method: 'POST',
            body: body,
            json: true,
        };
        let responseFromApple = await functionWrappers.httpRequest(receiptValidationRequestProdOptions);
        const weAreInDevEnvironment = (responseFromApple.status == 21007);
        if (weAreInDevEnvironment) {
            responseFromApple = await functionWrappers.httpRequest(receiptValidationRequestDevOptions);
        }
        const latestReceiptInfo = responseFromApple.latest_receipt_info[0];
        const expirationTimeMsec = parseInt(latestReceiptInfo.expires_date_ms);
        const currentTimeMsec = (new Date()).getTime();
        subscriptionIsStillActive = (currentTimeMsec < expirationTimeMsec);
    } catch (error) {
        subscriptionIsStillActive = false;
    }
    return subscriptionIsStillActive;
}

/**
 * This function is called once per day/session if the user's subPlatform property indicates that their
 * most recent active subscription was made on iOS (aka an IAP subscription) if the user is on 
 * web or android. If the user is on iOS, then this function is still called once per session, but 
 * only if the user has an active IAP subscription. If the user does not have an active subscription,
 * then the client's store object should be used to verify whether the product.owned status is 
 * true or false and update the user's account permissions appropriately. 
 * 
 * This solution is awkward thanks to apple's extremely shitty webhook system that basically
 * does jack shit and does not send any meaningful or consistent updates. Their own documentation
 * even says not to rely on the webhooks, so it wasn't a real option. Thus we have to poll 
 * repeatedly to check subscription status. 
 * 
 * In addition to this, we will run a cron job once per day to check subscription status for 
 * all active IAP users that are using features like automated algorithm feedback so that 
 * premium users who do not pay cannot get around paying their monthly fees by setting up 
 * data collection and feedback automation then never signing in, which would mean this 
 * function is never directly called. 
 */
export const checkSubStatusForIAPBody = async (params: any[]) => {
    const idxOfContext = 0;
    const idxOfData = 1;
    const context = params[idxOfContext];
    const data = params[idxOfData];
    const uid = await profileManager.getUIDFromContext(context)
    const userProfile: UserProfile = await profileManager.getUserProfileFromUID(uid);
    let subId = data.subId;
    const checkingStatusForSubThatRequesterMayNotOwn: boolean = (subId != null);
    if (!checkingStatusForSubThatRequesterMayNotOwn) {
        subId = userProfile.subscriptionID;
    }
    const subscriptionIsStillActiveAccordingToApple: boolean = await checkIfAppleSubscriptionIsValid(subId);
    const receiptAndOwnerOfIAP: any = (await getOwnerAndReceiptOfIAP(subId));
    const uidOwnerOfIAP: string = receiptAndOwnerOfIAP[IAP_OWNER_KEY];
    const ownerIsRequester: boolean = (uidOwnerOfIAP == uid);
    if (ownerIsRequester && subscriptionIsStillActiveAccordingToApple) {
        await activateSubscription(uid, subId, platforms.PLATFORM_iOS);
    }
    const profileOfOwner = await profileManager.getUserProfileFromUID(uidOwnerOfIAP);
    const newOwnerTookThisGuysSubSoWeHaveToDowngradeHim: boolean = (!ownerIsRequester && (userProfile.subscriptionID == profileOfOwner.subscriptionID));
    if ((ownerIsRequester && !subscriptionIsStillActiveAccordingToApple) || newOwnerTookThisGuysSubSoWeHaveToDowngradeHim) {
        await deactivateSubscription(uid);
    }
    let ownerProfStatusIsTheSameSubAndIsActive: boolean = false;
    if (uidOwnerOfIAP) {
        ownerProfStatusIsTheSameSubAndIsActive = (profileOfOwner.subscriptionStatus == tierManager.SUBSCRIPTION_STATUS_ACTIVE) && (profileOfOwner.subscriptionID == subId);
    }
    return {
        subscriptionIdCheckingFor: subId,
        subscriptionIsActive: subscriptionIsStillActiveAccordingToApple,
        subscriptionOwnerUID: uidOwnerOfIAP,
        subscriptionOwnerProfileIsActive: ownerProfStatusIsTheSameSubAndIsActive,
        message: "We checked the status of your IAP subscription",
    };

};
export const checkSubStatusForIAP = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context, checkSubStatusForIAPBody, [context, data]);
});

/**
 * This function should only be called from inside the callback triggered in the iOS client when a user 
 * owns a product after a successful purchase but does not have an active subscription in their user profile
 * which indicates their account permissions need to be updated. This function is expecting to be passed 
 * a subscription id, which is the original_transaction_id and a subscriptrion receipt which is the appStoreReceipt.
 * Both of these values are stored in the database and the users profile is updated to reflect that they own the 
 * subscription that is linked to the previously mentioned variables and given premium permissions.
 */
export const createSubscriptionForIAPBody = async (params: any[]) => {
    const idxOfContext = 0;
    const idxOfData = 1;
    const data = params[idxOfData];
    const context = params[idxOfContext];
    const currentUid = await profileManager.getUIDFromContext(context)
    const subscriptionId = data.subscriptionID;
    const receipt = data.appStoreReceipt;
    let subscriptionCreationWasSuccesful = false;
    try {
        await (activateSubscription(currentUid, subscriptionId, platforms.PLATFORM_iOS));
        await (setOwnerOfIAP(subscriptionId, receipt, currentUid));
        subscriptionCreationWasSuccesful = true;
    } catch (error) {
        subscriptionCreationWasSuccesful = false;
    }
    return {
        subscriptionCreationWasSuccesful: subscriptionCreationWasSuccesful,
        message: "We tried to create your IAP subscription bro"
    };
};
export const createSubscriptionForIAP = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context, createSubscriptionForIAPBody, [context, data]);
});

/**
 * This function sets a document in the IAP table in our database. That table contains a list of documents that are 
 * named after the original_transaction_id of IAP subscriptions. Inside the document, two values are stored, the uid 
 * of the owner of the subscription and the subscription receipt. The subscription receipt is really a unique id that 
 * can be used to query apple's receipt verification API.
 * 
 * @param subscriptionID the ID of the subscription aka its original_transaction_id.
 * @param appStoreReceipt the appstore receipt aka the receiptVerificationId.
 * @param uid uid of the user who owns this subscription.
 */
export const setOwnerOfIAP = async (subscriptionID: string, appStoreReceipt: string, uid: any): Promise<FirebaseFirestore.WriteResult> => {
    return FIREBASE.firestore().collection('IAP').doc(subscriptionID).set({
        [IAP_OWNER_KEY]: uid,
        [IAP_RECEIPT_KEY]: appStoreReceipt
    });
}

/**
 * Returns the owner and receipt value for the document stored in the IAP table's collection
 * of original_transaction ids if it exists. Otherwise, an object with null for both of those
 * properties is returned.
 * 
 * @param subscriptionID original_transaction_id to query in the database.
 */
export const getOwnerAndReceiptOfIAP = async (subscriptionID: string): Promise<string> => {
    const dummyValue: any = {
        [IAP_OWNER_KEY]: null,
        [IAP_RECEIPT_KEY]: null
    };
    let ownerAndReceipt: any = dummyValue;
    try {
        await FIREBASE.firestore().collection('IAP').doc(subscriptionID).get().then(snapshot => {
            const iapSnapData: FirebaseFirestore.DocumentData = snapshot.data();
            ownerAndReceipt = iapSnapData;
        });
    } catch (error) {
        ownerAndReceipt = dummyValue;
    }
    return ownerAndReceipt;
}

/////////////////////////////////////////////  STRIPE ///////////////////////////////////////////
/**
 * Endpoint for various stripe webhooks related to subscriptions. Handles subscription Updates and deletes. This function defers 
 * any logic related to subscription creation to the Octobat webhook handler. If a subscription object is created, deleted or 
 * a charge fails, this function will receive a request from stripe and then based upon the body of that request, a user's 
 * profile is updated to the most current information from stripe.
 */
export const stripeEventWebhookBody = async (request: any, response: any) => {
    let sig: any = request.headers["stripe-signature"];
    const event: any = await stripe.webhooks.constructEvent(request.rawBody, sig, STRIPE_ENDPOINT_SECRET);
    const eventType = event.type;
    try {
        let uid: any = null;
        if (eventType == SUBSCRIPTION_DELETED) {
            uid = await getUidFromSubscriptionEvent(event);
            const userProf: UserProfile = await profileManager.getUserProfileFromUID(uid);
            const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(userProf.subscriptionID);
            const subStatus: Stripe.Subscription.Status = subscription.status;
            if (subStatus != tierManager.SUBSCRIPTION_STATUS_ACTIVE) {
                await deactivateSubscription(uid);
            }
        }
        else if (eventType == CHARGE_FAILED) {
            uid = await getUidForChargeFailed(event);
            await deactivateSubscription(uid);
        }
        return response.json({ received: true, ref: 'Nice bro.' }).end();
    }
    catch (err) {
        return response.status(400).end();
    }
}
export const events = functions.https.onRequest(stripeEventWebhookBody);

/**
 *  Catches octobat webhooks to handle subscription lifecycle management. When a susbcription is created
 *  the uid is passed in as a unique reference to the user who opened the beanie management portal. This
 *  is used to get the users account email from the db to update their stripe attributes. If a user already
 *  has a subscription in any state and they create a new one, their old subscription is canceled and replaced
 *  with the new one. This maintains the constraint of one subscription per user. In this case, the subscription 
 *  that is overwritten, is deleted at the end of the function. This needs to be done last so the subscription id
 *  on the user's profile is not the one associated with the subscription that is being deleted and does not trigger
 *  an update from the stripe update helper that would set their permissions to LS_FREE,null,null.
 * 
 *  Another important note is that when canceling a subscription manually, cancel the subscription, dont 
 *  delete otherwise the user's UserProfile will not update appropriately.
 */
export const octobatWebhookBody = async (request: any, response: any) => {
    const octResp = request.body
    const eventType = octResp.event_type;
    if (eventType == OCTO_ORDER_SUCCESS) {
        const uid = octResp.data.beanie_session.client_reference_id;
        const userProf: UserProfile = await profileManager.getUserProfileFromUID(uid);
        const currentUserSubscriptionID = userProf.subscriptionID;
        const userAlreadyHasSubscription = (currentUserSubscriptionID != null);
        const newSubscriptionID = octResp.data.stripe.subscription_id;
        const currentSubIsDifferentThanNew: boolean = (newSubscriptionID != currentUserSubscriptionID);
        await activateSubscription(uid, newSubscriptionID);
        const needToDeleteSubscriptionThatGotReplaced = (userAlreadyHasSubscription && currentSubIsDifferentThanNew);
        if (needToDeleteSubscriptionThatGotReplaced) {
            await stripe.subscriptions.del(currentUserSubscriptionID);
        }
    }
    return response.json({ received: true, ref: 'octo webhook received' }).end();
};
export const octobatWebhooks = functions.https.onRequest(octobatWebhookBody);

/**
 * Creates a secure beanie session id for the user who clicked on the management portal 
 * button to navigate to the beanie portal. Waits for session object and returns it to 
 * the client. If the user does not have a subscription. A subscription creation 
 * portal is opened. If the user has a subscription then the setup portal is opened. 
 */
export const createBeanieBody = async (params: any[]) => {
    const idxOfContext = 0;
    const idxOfData = 1;
    const data = params[idxOfData];
    const context = params[idxOfContext];
    const uid: string = await profileManager.getUIDFromContext(context);
    const userEmail: string = await profileManager.getUserEmailFromDB(uid);
    const userProf: UserProfile = await profileManager.getUserProfileFromUID(uid);
    let urlRequestCameFrom: string = data.fullUrl;
    let idxOfHash: number = null;
    if (urlRequestCameFrom) {
        idxOfHash = urlRequestCameFrom.indexOf("#");
    }
    const hasHash: boolean = (idxOfHash != null && idxOfHash != -1);
    if (hasHash) {
        urlRequestCameFrom = urlRequestCameFrom.substring(0, idxOfHash);
    }
    let userThemeColor: string = userProf.userPreferences.general.currentTheme;
    const noPreferredTheme: boolean = !(userThemeColor);
    const noOriginURL: boolean = (!(urlRequestCameFrom) || !(hasHash));
    if (noPreferredTheme) {
        const logSmarterDefaultThemeColor: string = "#43dbbd";
        userThemeColor = logSmarterDefaultThemeColor;
    }
    if (noOriginURL) {
        const defaultURL = "https://www.logsmarter.net/"
        urlRequestCameFrom = defaultURL;
    }
    const beaniePostData: any = {
        primary_color: userThemeColor,
        client_reference_id: uid,
        billing_address_collection: 'required',
        coupon_collection: true,
        save_payment_method: 'always',
        tax_calculation: 'exclusive',
        setup_future_usage: 'off_session',
        subscription_data: {
            subscription_items: [
                { plan: getSubscriptionId() }
            ],
        },
        prefill_data: {
            customer_email: userEmail
        }
    };
    beaniePostData['cancel_url'] = urlRequestCameFrom + '#/';
    beaniePostData['success_url'] = urlRequestCameFrom + '#/subscription-message';
    const userHasSubscription = (userProf.subscriptionID != null);
    const userHasActiveSubscription = (userHasSubscription && (userProf.subscriptionStatus == tierManager.SUBSCRIPTION_STATUS_ACTIVE));
    if (userHasActiveSubscription) {
        const subscription = await stripe.subscriptions.retrieve(userProf.subscriptionID);
        const custId = subscription.customer;
        beaniePostData.mode = 'subscription';
        beaniePostData.gateway = 'stripe';
        beaniePostData.customer = custId;
    }
    const beanieOptions = {
        url: 'https://apiv2.octobat.com/beanie/sessions',
        method: 'POST',
        body: beaniePostData,
        json: true,
        auth: {
            user: OCTOBAT_SECRET_KEY,
            pass: ''
        }
    };
    const beanieSession = await functionWrappers.httpRequest(beanieOptions);
    return beanieSession
};
export const createBeanieSession = functions.https.onCall(async (data, context) => {
    return await functionWrappers.authenticatedCloudFunctionWrapper(context, createBeanieBody, [context, data]);
});

/**
 * Returns the correct monthly subscription stripe id to be used for stripe subscriptions.
 * 
 * @param user UserProfile to get subscriptionId for 
 */
export const getSubscriptionId = (): string => {
    return PREMIUM_MONTHLY_PLAN_ID_INDIVIDUAL;

}

/**
 * Keeps stripe customer email in sync with user's email. Wraps in a try catch 
 * to prevent any errors from affecting the UserProfile updated trigger that calls 
 * this function. This will fail silently if it does somehow fail.
 * 
 * @param userProf UserProfile of the user whos subscription we want to keep in sync. 
 */
export const keepSubscriptionDataInSync = async (userProf: UserProfile): Promise<void> => {
    try {
        const hasSubscription: boolean = userProf.subscriptionID != null;
        const hasActiveSubscription: boolean = (hasSubscription && (userProf.subscriptionStatus == tierManager.SUBSCRIPTION_STATUS_ACTIVE));
        const hasStripeSubscription: boolean = (userProf.subPlatform == platforms.PLATFORM_WEB)
        if (hasActiveSubscription && hasStripeSubscription) {
            const subscription: any = await stripe.subscriptions.retrieve(userProf.subscriptionID);
            const custId: string = subscription.customer;
            const customer: any = await stripe.customers.retrieve(custId);
            const currentCustEmail: string = customer.email;
            if (currentCustEmail != userProf.emailAddr) {
                await stripe.customers.update(custId, { "email": userProf.emailAddr });
            }
        }
    } catch (error) { };
}


/**
 * Extracts an email from a stripe charged failed event and returns the email.
 * 
 * @param event Charge failed event object from a stripe webhook event.
 */
export const getUidForChargeFailed = async (event: any) => {
    try {
        const custID = event.data.object.customer;
        const subList = await stripe.subscriptions.list({ 'customer': custID })
        const someSubscription = subList.data[0];
        const uid = (someSubscription.metadata)[CLIENT_REF_KEY];
        return uid;
    }
    catch (error) {
        return null;
    }
}

/**
 * Uses the information returned from Stripe webhooks about
 * subscription events to get the subscriptions owners UID.
 * 
 * @param event Customer object from a stripe webhook event.
 */
export const getUidFromSubscriptionEvent = async (event: any) => {
    try {
        const uid = (event.data.object.metadata)[CLIENT_REF_KEY];
        return uid;
    }
    catch (error) {
        return null;
    }
}

/**
 * Helper function for adding and removing referral points from a user
 * 
 * @param referredBy  the UID of the user who will have their referral points changed
 * @param addReferral if a referral point should be added or removed
 */
export const referralHelper = async (referredBy: string, addReferral: boolean) => {
    try {
        let userWhoReferred;
        if (referredBy != null) {
            userWhoReferred = await profileManager.getUserProfileFromUID(referredBy);
            if (userWhoReferred == null) {
                return;
            }
            if (!userWhoReferred.numReferrals) {
                userWhoReferred.numReferrals = 0;
            }
            addReferral ? userWhoReferred.numReferrals++ : userWhoReferred.numReferrals--;
            await profileManager.updateUserInDB(userWhoReferred, referredBy);
        }
    } catch (error) {
        return;
    }
};


