import { Injectable } from '@angular/core';
import { ConstantsService } from '../general/constants.service';
import { EnvironmentService } from '../general/environment.service';
import { TimeService } from '../general/time-constant.service';
import { CallableWrapperService } from './callable-wrapper.service';

/**
 * This service is responsible for any communication between our frontend and firebase functions 
 * environment that relates to our Stripe or Octobat integration. Current functions supported are 
 * opening a beanie session and canceling a stripe subscription.
 * 
 * Last edited by: Ryan Lefebvre 7/07/2020
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  /**
   * Name of the firebase cloud function for creating a beanie session.
   */
  CREATE_BEANIE_SESSION: string = 'createBeanieSession';

  /**
   * Name of the firebase cloud function for canceling a user's subscription.
   */
  CANCEL_SUSBCRIPTION: string = 'cancelSub';

  /**
   * Name of the firebase cloud function for updating a user's subscription status for IAP.
   */
  CREATE_IAP_SUBSCRIPTION: string = 'createSubscriptionForIAP';

  /**
   * Name of cloud function that checks if a user's IAP subscription is valid or not.
   */
  CHECK_IAP_SUB_STATUS: string = 'checkSubStatusForIAP';

  /**
   * Key used in session storage to determine if we have checked subscription permissions for IAP 
   * yet this session or not. Only done once per session to avoid unecessary requests.
   */
  IAP_STATUS_CHECK_KEY: string = "theNameForThisDoesNotActuallyMatter";

  /**
 * Name of the firebase cloud function for updating a user's subscription status for IAP.
 */
  CREATE_IAB_SUBSCRIPTION: string = 'createSubscriptionForIAB';

  /**
   * @ignore
   */
  constructor(
    public constantsService: ConstantsService,
    public time: TimeService,
    public wrapper: CallableWrapperService,
    public environmentService: EnvironmentService) { }

  /**
   * Cancels a user's stripe subscription with the id 'subscriptionID'. Returns a promise that will resolve
   * if the subscription is cancelled successfully and reject if any error occurs.
   * 
   * @param subscriptionID ID of the subscription to be canceled.
   */
  async cancelUserStripeSubscription(): Promise<any> {
    return await this.wrapper.firebaseCloudFunction(this.CANCEL_SUSBCRIPTION, this.wrapper.NO_PARAMS);
  }

  /**
   * Creates a beanie session for the current user that links the currently authenticated user's UID 
   * to the beanie session. This session is then opened as a checkout page where the user can upgrade their 
   * account status. Returns the beanie session if the creation attempt was successful and null otherwise.
   * Passes in the origin URL of the application so Octobat can reroute the user appropriately after beanie 
   * sessions.
   */
  async getBeanieSessionForUser(): Promise<any> {
    const fullUrl: string = window.location.href;
    const beanieParams = { fullUrl: fullUrl, isMobile: this.environmentService.isMobile };
    return await this.wrapper.firebaseCloudFunction(this.CREATE_BEANIE_SESSION, beanieParams);
  }

  /**
   * Used to update the users subscription information when they are using the app on mobile.
   * Specifically with IAP.
   * 
   * We do not have any reference UID for subscriptions so we pass the apple store receipt ID
   * since it is the most relevant value for that field and other places in the app will check 
   * the subscriptionID to see if the user has a subscription or not.
   * 
   * @param subscriptionID       original_transaction_id for the IAP subscription
   * @param subscriptionReceipt  The apple store receipt for the users subscription if it exists.
   */
  async attemptToCreateIAPSubscription(subscriptionID: string, subscriptionReceipt: string): Promise<any> {
    const iapParams: any = {
      subscriptionID: subscriptionID,
      appStoreReceipt: subscriptionReceipt
    };
    return await this.wrapper.firebaseCloudFunction(this.CREATE_IAP_SUBSCRIPTION, iapParams);
  }

  /**
   * This function makes a request to the backend to check the state of a user's IAP
   * subscription and update the state if necessary. It should only be called if the user's subPlatform 
   * property indicates that their most recent active subscription was made on iOS (aka an IAP subscription)
   * if the user is on web or android. If the user is on iOS, then this function is still called once per
   * session, but only if the user has an active IAP subscription.
   */
  async checkStatusOfIAPSubscription(originalTransactionId?: string): Promise<any> {
    const resp = await this.wrapper.firebaseCloudFunction(this.CHECK_IAP_SUB_STATUS, { subId: originalTransactionId });
    return resp;
  }

  /**
   * Used to update the user's subscription information when they are using the app on mobile.
   * Specifically with IAB. 
   * 
   * We do not have any reference ID for subscriptions so we pass the purchaseToken as subId
   * since it is the most relevant value for that field and other places in the app will check 
   * the subscriptionID to see if the user has a subscription or not.
   * 
   * @param subscriptionID  The purchaseToken for the users subscription.
   */
  async attemptToCreateIABSubscription(subscriptionID: string): Promise<any> {
    const iabParams: any = {
      subscriptionID: subscriptionID,
    };
    return await this.wrapper.firebaseCloudFunction(this.CREATE_IAB_SUBSCRIPTION, iabParams);
  }

}
