import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';

/**
 * This component displays the user's account tier and a button to 
 * allow them to create or update their subscription information.
 * Originally, this component had more logic but that logic was 
 * removed and placed inside the BeanieButtonComponent because 
 * there were other components that required the same logic. This 
 * component relies on the TierPermissionService to stay up to 
 * date with the user's current tier and does not subscribe to 
 * any observables itself.
 *
 * Last edited by: Ryan Lefebvre 6/26/2020
 */
@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  /**
   * Formgroup that allows the user to enter a promo code.
   */
  promoCodeForm: FormGroup = null;

  /**
   * True if the form is being edited. False otherwise.
   */
  formBeingEdited: boolean = false;

  /**
   * True if the spinner is being shown. False otherwise.
   */
  showPromoSpinner = false;

  /**
   * Message that is shown by the promo code spinner component.
   */
  promoSpinnerMessage = 'Updating promo code.'


  /**
  * Reference to subscription to current users state change observable.
  */
  myCurrentUserSubscription: Subscription = null;

  /**
   * Name of the form control used for storing the value fo what the user entered as their promo code.
   */
  FORM_CONTROL_PROMO_CODE: string = 'promoCode';

  /**
   * @ignore
   */
  constructor(
    private fb: FormBuilder,
    public profileControl: ProfileControlService,
    public stateManager: StateManagerService,
    public tierPermissionsManager: TierPermissionsService,
    public firebaseGeneral: FirebaseGeneralService,
    public dialogCreator: DialogCreatorService,
    public environmentService: EnvironmentService,
    public IAP: InAppPurchaseService
  ) {
  }

  /**
   * @ignore
   */
  ngOnInit() {
    this.generateNewPromoCodeForm();
    this.currentUserSubscription();
  }

  /**
   * @ignore Kill subscriptions
   */
  ngOnDestroy() {
    if (this.myCurrentUserSubscription)
      this.myCurrentUserSubscription.unsubscribe();
  }

  /**
  * Handles logic for state changes related to the user's profile.
  * If a new user profile state is emitted. The promo code form is 
  * force closed and the controls are set to the new user profiles 
  * values by generating a new promo code form.
  */
  currentUserSubscription(): void {
    const context = this;
    this.myCurrentUserSubscription = this.stateManager.currentUserProfile.subscribe(user => {
      const userIsNotNull: boolean = user != null;
      if (userIsNotNull) {
        context.generateNewPromoCodeForm();
      }
    });
  }

  /**
   * Generates a new form group for the promo code form.
   */
  generateNewPromoCodeForm(): void {
    this.promoCodeForm = this.fb.group({
      [this.FORM_CONTROL_PROMO_CODE]: [
        {
          value: this.stateManager.getCurrentUser().promoCode == null ? "-" : this.stateManager.getCurrentUser().promoCode,
          disabled: !this.promoCodeBeingEdited()
        }],
    });
  };

  /**
   * Get's the current user state and assings the promoCode property to the value just entered by the user
   * This function makes a call to the editUserPromoCode function in the firebase general service that runs
   * cloud functions to update the user's promo code in the PromoCodes collection in the database, and the 
   * promoCode proprty of their UserProfile in the Users collection
   */
  async updatePromoCode(): Promise<void> {
    if (this.promoCodeBeingEdited()) {
      this.showPromoSpinner = true;
    }

    const userProfileWithNewPromoCode: UserProfile = new UserProfile();
    userProfileWithNewPromoCode.promoCode = this.promoCodeForm.get(this.FORM_CONTROL_PROMO_CODE).value.trim().toUpperCase();

    const editPromoLogic = async () => await this.firebaseGeneral.editUserPromoCode(userProfileWithNewPromoCode);
    await this.dialogCreator.openWaitForOperationDialog(editPromoLogic, "Promo Code", "card_giftcard", "Updating gold user promo code")

    this.profileControl.doneEditing();
    this.showPromoSpinner = false;

    this.generateNewPromoCodeForm();
  }

  /**
   * Returns true if the promo code field is currently being edited and false otherwise.
   */
  promoCodeBeingEdited(): boolean {
    return (this.profileControl.currentEditValue() == this.profileControl.EDITING_PROMO_CODE);
  }

  /**
   * Click handler for the promo code form, edit promo code and cancel button.
   * If pressed will change the form state to the inverse of what it is currently.
   */
  toggleEditPromoCode(): void {
    !this.promoCodeBeingEdited() ? this.profileControl.beginEditing(this.profileControl.EDITING_PROMO_CODE) : this.profileControl.doneEditing();
  }

  /**
   * A wrapper for the tier permissions manager service function
   * userHasGoldAccount. It's only use is to keep this components html cleaner.
   */
  isGoldUser(): boolean {
    return this.tierPermissionsManager.userHasGoldAccount();
  }

  /**
   * Returns true if the currently authenticated user has a a subscriptionm, false otherwise.
   */
  hasSubscriptionAlready(): boolean {
    return this.tierPermissionsManager.userHasActiveSubscription();
  }

  /**
   * Determines wether or not the edit promo code button should be shown.
   * If the current user has a gold account and the promo code is not being edited this should return true
   * Otherwise, this function will return false.
   */
  showEditPromoCodeFormButton(): boolean {
    const canEditPromoCode: boolean = this.isGoldUser();
    const promoCodeNotBeingEditied: boolean = !this.promoCodeBeingEdited();
    return canEditPromoCode && promoCodeNotBeingEditied;
  }

  /**
   * Tells the in app purchase service to forcefully reload fresh product states
   * and try to give the user their subscription if their itunes account owns one.
   */
  restorePurchases() {
    this.IAP.restorePurchases();
  }
}
