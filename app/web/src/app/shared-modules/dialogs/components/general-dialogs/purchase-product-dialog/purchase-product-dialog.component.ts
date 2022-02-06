import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { TimeService } from 'src/app/services/general/time-constant.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

/**
 * Displays a warning to the user about their free account. In place of the dialog title
 * is the number of days that the user has left in their free trial. Below that 
 * is two buttons, one of which is the beanie button which is used to take the user
 * to the payment portal, the other is a close button that is only enabled if the user's
 * free trial is not past the limit or they have an active subscription. 
 * 
 * Last edited by: Ryan Lefebvre 7/28/2020
 */
@Component({
  selector: 'app-purchase-product-dialog',
  templateUrl: './purchase-product-dialog.component.html',
  styleUrls: ['./purchase-product-dialog.component.css']
})
export class PurchaseProductComponent implements OnInit {

  /**
   * Message displayed underneath the spinner when the purchase is processing.
   */
  spinnerMessage: string = "Processing subscription upgrade. This may take a second."

  /**
   * Reference to the IAP wrapper around the cordova store object.
   */
  IAP: InAppPurchaseService = null;

  /**
   * Content of the product that is displayed on web for individual users.
   */
  INDIVIDUAL_PRODUCT_WEB: any = {
    title: "PREMIUM",
    price: "$8.99",
    billingPeriodUnit: "Month",
    canPurchase: true
  };

  /**
  * Selling points returned when the user is an individual user. 
  */
  INDIV_SELLING_POINTS: string = "Unlock access to increased data storage, and exclusive resources. Storage increase allows for 75 logs with up to 365 entries per log.";

  /**
   * True if the product was already owned or unable to be purchased when the dialog opened initially.
   */
  notOwnedOrAvailableToBegin: boolean = null;

  /**
   * @ignore 
   */
  constructor(
    public permissions: TierPermissionsService,
    public stateManager: StateManagerService,
    public dialogRef: MatDialogRef<PurchaseProductComponent>,
    public router: Router,
    public environmentService: EnvironmentService,
    public snackbar: SnackBarService,
    public timeService: TimeService,
    @Inject(MAT_DIALOG_DATA) public data,
    public auth: AuthenticationService) { }

  /**
  * @ignore 
  */
  ngOnInit() {
    this.dialogRef.disableClose = true;
    this.IAP = this.data.iap;
    const onMobileAndStoreDidntLoad: boolean = (this.environmentService.isMobile && !this.IAP.STORE);
    if (onMobileAndStoreDidntLoad) {
      this.dialogRef.close();
      return;
    }
    this.notOwnedOrAvailableToBegin = ((this.getProduct().owned) || !(this.getProduct().canPurchase));
  }

  /**
   * Returns a one sentence description of the product the user is buying that changes 
   * based on user type. This is because each user type has different premium features.
   */
  getProductSellingPoints(): string {
    const sellingPoints: string = this.INDIV_SELLING_POINTS;
    return sellingPoints
  }

  /**
   * Closes the dialog with a lambda called by the after close function that will
   * take the user to the terms of service page.
   */
  goToTerms(): void {
    this.dialogRef.close(() => this.router.navigate(['/info/terms']));
  }

  /**
   * Closes the dialog with a lambda called by the after close function that will
   * take the user to the privacy policy page.
   */
  goToPrivacy(): void {
    this.dialogRef.close(() => this.router.navigate(['/info/privacy']));
  }

  /**
   * Returns a list of all the subscriptions that a user can purchase.
   */
  getProduct(): any {
    let product;
    if (this.environmentService.isMobile) {
      if (this.IAP) {
        product = this.IAP.getIndividualSubscriptionProduct();
      }
    }
    else if (this.environmentService.isWeb) {
      product = this.INDIVIDUAL_PRODUCT_WEB;
    }
    if (!product) {
      this.snackbar.showFailureMessage("Error loading product!");
      this.dialogRef.close();
    }
    return product;
  }

  /**
   * Reutrns true if there is an iOS IAP purchase in progress.
   * False otherwise. If the IAP is null then false is 
   * reutrned.
   */
  purchaseInProgress(): boolean {
    let purchInProg: boolean = false;
    if (this.IAP) {
      purchInProg = (this.IAP.purchaseInProgress || this.IAP.stateChangeInProgress);
    }
    return purchInProg;
  }

  /**
   * Click handler for any of the subscription purchase 
   * buttons. Turns a spinner on, waits for the product to 
   * be ordered and then turns the spinner of with a delay after.
   * This is done with a delay because there is a lag between 
   * when the store.order method returns and the user's iOS
   * version will open the native pop ups for a purchase.
   * 
   * @param product product being purchased. 
   */
  async handlePurchaseClick(): Promise<void> {
    if (this.IAP) {
      await this.IAP.orderProduct(this.getProduct());
    }
  }

  /**
   * Returns true if the current user's account is unpaid. False otherwise
   */
  userIsUnpaid(): boolean {
    return this.permissions.userSubscriptionUnpaid();
  }

}
