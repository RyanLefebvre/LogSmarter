import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AuthenticationService } from '../firebase/authentication.service';
import { PaymentService } from '../firebase/payments.service';
import { EnvironmentService } from './environment.service';
import { StateManagerService } from './state-manager.service';
import { TierPermissionsService } from './tier-permissions.service';

/**
 * This service is used for all functionality related to iOS in-app purchases. 
 * certain setup and maintenance is reqired to handle products in the store.
 * All functions in this service should only be called if the project is 
 * being build for mobile, otherwise behavior is undefined.
 * 
 * Last edited by: Ryan Lefebvre 12/23/2020
 */
@Injectable({
  providedIn: 'root'
})
export class InAppPurchaseService {

  /**
   * This variable is a wrapper around the store object exposed 
   * from the cordova plugin we use for IAP. The ts-ignore comment on the 
   * assignment prevents errors from the typescript compiler when building for web.
   */
  STORE: any = null;

  /**
   * True if a purchase is in process. False otherwise.
   */
  purchaseInProgress: boolean = false;

  /**
   * True if a subscription state change is in progress. False otherwise.
   */
  stateChangeInProgress: boolean = false;

  /**
   * Constant used to refere to a portion of the route for the subscription
   * message page that is unique.
   */
  SUBSCRIPTION_MESSAGE_ROUTE: string = "subscription-message";

  /**
  *  Fake product used to test the individual premium subscription.
  */
  DUMMY_INDIVIDUAL_SUBSCRIPTION_PRODUCT: any = {
    title: "INDIVIDUAL PREMIUM",
    description: ("Unlock more entries, logs and resources"),
    price: "$8.99",
    billingPeriodUnit: "Month",
    canPurchase: true
  };

  /**
   * Reference to the individual premium subscription.
   */
  INDIVIDUAL_SUBSCRIPTION_PRODUCT: any = null;

  /**
   * Individual product ID for iOS IAP mobile product.
   */
  INDIVIDUAL_ID: string = this.environmentService.getIndividualId();

  /**
   * URL used for receipt validation
   */
  VALIDATOR_URL: string = this.environmentService.getFoveaValidatorURL();

  /**
   * @ignore
   */
  constructor(
    public environmentService: EnvironmentService,
    public stateManager: StateManagerService,
    public payments: PaymentService,
    public dialogCreator: DialogCreatorService,
    public snackbar: SnackBarService,
    public authenticationService: AuthenticationService,
    public zone: NgZone,
    public router: Router,
    public tierPermissions: TierPermissionsService) { }

  /**
   * Adds an event listener to the onDeviceReady event that is fired by cordova.
   * Once the device is ready, the store is set up and initialized. This is necessary,
   * because we need to be able to handle payments immediately once the device is 
   * ready.
   */
  setUpStoreWhenDeviceReady(): void {
    const context: InAppPurchaseService = this;
    document.addEventListener('deviceready', () => {
      context.setUpStore(context);
    });
  }

  /**
   * Handles all of the boilerplate necessary to setup the store for IAP.
   * Adds event listeners to all of the store events necessary to handle receipt validation
   * and lastly adds the event listener that is needed to respond to subscription state 
   * update events.
   * 
   * @param context function needs a reference to the context because the 'this' keyword becomes meaningless
   */
  setUpStore(context: InAppPurchaseService): void {
    context.STORE = context.getCordovaStorePlugin();
    context.STORE.verbosity = context.STORE.DEBUG;
    const individualPremiumParams = {
      id: context.INDIVIDUAL_ID,
      type: context.STORE.PAID_SUBSCRIPTION
    };
    context.STORE.register([individualPremiumParams]);
    context.STORE.validator = context.VALIDATOR_URL;
    context.STORE.when('subscription').updated(() => {
      const premiumIndividual: any = context.STORE.get(context.INDIVIDUAL_ID);
      if (premiumIndividual) {
        context.INDIVIDUAL_SUBSCRIPTION_PRODUCT = premiumIndividual;
      }
    });
    context.STORE.refresh();
    context.STORE.when('subscription').approved((product) => {
      product.verify();
    });
    context.STORE.when('subscription').verified((product) => {
      product.finish();
    });
    context.STORE.when('subscription').owned((product) => {
      if (context.purchaseIsAllowed(context)) {
        context.purchaseInProgress = false;
        context.subUpgradeLogic(product);
      }
    });
    context.STORE.when('subscription').error((err) => {
      context.errorLogic(context, err.code == 6777010);
    });
    context.STORE.error(function (e) {
      const couldBeAndroidOrderError: boolean = (context.environmentService.isAndroid && context.purchaseInProgress);
      if (couldBeAndroidOrderError) {
        context.errorLogic(context);
      }
    });
  }

  /**
   * Returns the cordova store plugin in a format that is
   * easier to mock when unit testing and to ignore the fact
   * that the cordova object will not exist on web
   */
  getCordovaStorePlugin(): any {
    // @ts-ignore 
    return store;
  }

  /**
   * Returns true if there is an ongoing purchase for a product that the user can
   * actually buy. This means that purchase in progress is true and the product is 
   * the corrct product for the user's account type.
   * 
   * @param context reference to the IAP to avoid using the this keyword incorrectly 
   */
  purchaseIsAllowed(context: InAppPurchaseService): boolean {
    const purchaseAllowed: boolean = (context.purchaseInProgress);
    return purchaseAllowed;
  }

  /**
   * Returns an array containing the products that the currently authenticated
   * user can purchase. This function will filter the products by the user's type.
   */
  getIndividualSubscriptionProduct(): any {
    return this.INDIVIDUAL_SUBSCRIPTION_PRODUCT;
  }

  /**
   * Click handler for the restore purchases button which is completely uneccessary 
   * buuuuuut is required by IOS app store review guidelines. This button is used
   * to let users reclaim a subscription that they purchased on device1 on device2, 
   * but makes asolutely no sense in an application with its own authentication system
   * where apple ID is not tied to the user's account.
   * 
   * This function force refreshes the store and gives the user the product, if their 
   * apple ID owns it. it opens the purchase product dialog so that the checkout flow
   * appears somewhat normal.
   * 
   * Prevents the user from restoring the purchases if they do not actually 
   * own the product.
   */
  restorePurchases(): void {
    const prodForUserType = this.getIndividualSubscriptionProduct();
    if (!prodForUserType) {
      this.snackbar.showFailureMessage("Failed to load in app purchases");
      return;
    }
    const userDoesNotOwnProduct = (prodForUserType.owned != true);
    if (userDoesNotOwnProduct) {
      this.snackbar.showFailureMessage("Subscription is not owned. No purchase to restore!");
      this.purchaseInProgress = false;
    }
    else {
      this.purchaseInProgress = true;
      this.STORE.refresh();
      if (!this.dialogCreator.upgradeDialogIsOpen) {
        this.dialogCreator.openFreeAccountWarningDialog(this);
      }
    }
  }

  /**
   * Wrapper around the order method of the cordova IAP store.
   * 
   * @param product product to order.
   */
  orderProduct(product: any): Promise<void> {
    this.purchaseInProgress = true;
    return this.STORE.order(product.id);
  }

  /**
   * Logic that is used when there is an error with an in app purchase.
   * 
   * @param context reference to the IAP to avoid using the this keyword incorrectly 
   * @param isInternetError true if the error happened because there was no internet  
   */
  errorLogic(context: InAppPurchaseService, isInternetError?: boolean): void {
    context.zone.run(() => {
      context.purchaseInProgress = false;
      context.stateChangeInProgress = false;
      if (!isInternetError) {
        context.snackbar.showFailureMessage("Failed to complete purchase");
      } else {
        context.snackbar.showWarningMessage("You may not have an internet connection");
      }
    });
  }

  /**
   * Routes the user to the subscription message page and displays some 
   * nice messages to congratulate them on become a paying logsmarter
   * subscriber. Then fires off a request that will update the user's
   * account's status in the database.
   * 
   * @param product the product from the cordova store that the user purchased
   */
  subUpgradeLogic(product): void {
    const context = this;
    const windowScroll = () => window.scroll(0, 0);
    context.zone.run(async () => {
      context.stateManager.initiateGodMode();
      context.snackbar.showSuccessMessage("Account Subscription Upgraded.");
      context.dialogCreator.dialog.closeAll();
      context.router.navigate([context.SUBSCRIPTION_MESSAGE_ROUTE]);
      context.upgradeAccountAfterPurchase(context, product);
      windowScroll();
    });
  }

  /**
   * Handles the logic necessary to make a request to the 
   * backend to upgrade a user's account after a subscription
   * purchase. This logic should only ever be executed if the 
   * user is on iOS, otherwise their account will be upgraded
   * through webhooks.
   * 
   * @param context reference to the IAP to avoid using the this keyword incorrectly 
   * @param product the product from the cordova store that the user purchased
   */
  async upgradeAccountAfterPurchase(context: InAppPurchaseService, product): Promise<void> {
    const noChangeInProgress: boolean = (!context.stateChangeInProgress)
    if (noChangeInProgress) {
      context.stateChangeInProgress = true;
      let subscriptionId: string;
      if (context.environmentService.isiOS) {
        subscriptionId = product.transaction.original_transaction_id;
        const receipt: string = product.transaction.appStoreReceipt
        await context.payments.attemptToCreateIAPSubscription(subscriptionId, receipt);
      }
      else if (context.environmentService.isAndroid) {
        subscriptionId = product.transaction.purchaseToken;
        await context.payments.attemptToCreateIABSubscription(subscriptionId);
      }
      context.stateChangeInProgress = false;
    }
  }

}
