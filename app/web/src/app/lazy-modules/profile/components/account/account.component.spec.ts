import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { AccountComponent } from './account.component';
import { autoSpy } from 'autoSpy';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { FormBuilder } from '@angular/forms';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { BehaviorSubject } from 'rxjs';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { Subscription } from 'rxjs';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';


describe('AccountComponent', () => {
  let component: AccountComponent;
  const testHelper: TestHelpers = new TestHelpers();

  beforeEach(() => {
    component = setup().default().build();
  });

  it('should not crash when ngOnInit is called ', () => {
    let crashed: boolean = false;
    try {
      component.ngOnInit();
    } catch (error) {
      crashed = true;
    }
    expect(crashed).toBe(false);
  });

  it('should generate a new promo code form and initialize the current user subscription when ngOnInit is called', () => {
    const generateFormSpy = spyOn(component, 'generateNewPromoCodeForm');
    const currentUserSubSpy = spyOn(component, 'currentUserSubscription');

    component.ngOnInit();

    expect(generateFormSpy).toHaveBeenCalledTimes(1);
    expect(currentUserSubSpy).toHaveBeenCalledTimes(1);
  });

  it('should not crash and unsubscribe from any subscriptions when ngOnDestroy() is called', () => {
    component.ngOnInit();

    expect(testHelper.isUnsubscribed(component.myCurrentUserSubscription)).toBe(false);
    expect(testHelper.testOnDestroy(component)).toBe(false);
    expect(testHelper.isUnsubscribed(component.myCurrentUserSubscription)).toBe(true);
  });

  it('should not try to unsubscribe from myCurrentUserSubscription if it does not exist when ngOnDestroy is called', () => {
    component.myCurrentUserSubscription = new Subscription();
    const unsubSpy: jasmine.Spy<() => void> = spyOn(component.myCurrentUserSubscription, "unsubscribe");
    component.myCurrentUserSubscription = null;
    component.ngOnDestroy();
    expect(unsubSpy).not.toHaveBeenCalled();
  });

  it('should close edits to the promoCode form and generate a new promoCode if the user profile‘s not null when currentUserSubscription is called ', () => {
    let lambdaRef = null;
    const generateFormSpy = spyOn(component, 'generateNewPromoCodeForm');
    const formEditSpy = spyOn(component.profileControl, 'doneEditing');

    component.stateManager.currentUserProfile = {
      subscribe: (user) => {
        lambdaRef = user;
      },
    } as any;

    component.currentUserSubscription();

    const userProf = new TestHelpers().createFreeUserProfile();

    lambdaRef(userProf);

    expect(generateFormSpy).toHaveBeenCalledTimes(1);
  });

  it("should return true if the user has an active subscription if hasSubscriptionAlready()", () => {
    const dummy = "someReturn" as any;
    component.tierPermissionsManager.userHasActiveSubscription = () => dummy;
    expect(component.hasSubscriptionAlready() as any).toBe(dummy)
  });

  it("should call restore purchases when restorePurchases() is called ", () => {
    component.restorePurchases();
    expect(component.IAP.restorePurchases).toHaveBeenCalled();
  });

  it('should not close edits to the promoCode form or generate a new promoCode if the user profile‘s null when currentUserSubscription is called', () => {
    let lambdaRef = null;
    const generateFormSpy = spyOn(component, 'generateNewPromoCodeForm');
    const formEditSpy = spyOn(component.profileControl, 'doneEditing');

    component.stateManager.currentUserProfile = {
      subscribe: (user) => {
        lambdaRef = user;
      },
    } as any;

    component.currentUserSubscription();

    const userProf = new TestHelpers().createFreeUserProfile();

    lambdaRef(null);

    expect(generateFormSpy).not.toHaveBeenCalled();
    expect(formEditSpy).not.toHaveBeenCalled();
  });

  it('should set the value of the promoCode form field to null if the current user does not have a code when generateNewPromoCodeForm is called', () => {
    const userProf = {
      promoCode: null
    } as any

    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userProf);

    component.generateNewPromoCodeForm();

    expect(component.promoCodeForm.get(component.FORM_CONTROL_PROMO_CODE).value).toEqual('-');
  });

  it('should set the value of the promoCode form field to the users promoCode if the current user has entered a code when generateNewPromoCodeForm is called', () => {
    const userProf = {
      promoCode: 'LS2021'
    } as any;

    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userProf);

    component.generateNewPromoCodeForm();

    expect(component.promoCodeForm.get(component.FORM_CONTROL_PROMO_CODE).value).toEqual('LS2021');
  });

  it('should should edit the user promoCode when updatePromoCode is called', async () => {
    const userProf = {
      promoCode: null
    } as any

    const editUserPromoSpy = spyOn(component.firebaseGeneral, 'editUserPromoCode')
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userProf);
    spyOn(component, 'promoCodeBeingEdited').and.returnValue(false);
    component.dialogCreator.openWaitForOperationDialog = async (someLogic) => {
      await someLogic();
      return {} as any;
    }
    component.generateNewPromoCodeForm();


    await component.updatePromoCode();

    expect(editUserPromoSpy).toHaveBeenCalledTimes(1);
  });

  it('should show the spinner of the promo code is being edited when updatePromoCode is called', async () => {
    const userProf = {
      promoCode: null
    } as any

    const editUserPromoSpy = spyOn(component.firebaseGeneral, 'editUserPromoCode')
    spyOn(component.stateManager, 'getCurrentUser').and.returnValue(userProf);
    spyOn(component, 'promoCodeBeingEdited').and.returnValue(true);

    component.generateNewPromoCodeForm();

    await component.updatePromoCode();

    expect(component.showPromoSpinner).toBe(false);
  });

  it('should return true if the current edit value for profile control is PROMO when promoCodeBeingEdited is called', () => {
    component.profileControl.EDITING_PROMO_CODE = "PROMO";
    spyOn(component.profileControl, 'currentEditValue').and.returnValue(component.profileControl.EDITING_PROMO_CODE);

    expect(component.promoCodeBeingEdited()).toBe(true);
  });

  it('should return false if the current edit value for the profile control is not PROMO when promoCodeBeingEdited is called', () => {
    component.profileControl.EDITING_PROMO_CODE = "PROMO";
    spyOn(component.profileControl, 'currentEditValue').and.returnValue('NOT EDITING');

    expect(component.promoCodeBeingEdited()).toBe(false);
  });

  it('should call begin edit if the promo code is not being edited when toggleEditPromoCode is called', () => {
    component.profileControl.doneEditing = () => { };
    const profileControlSpy = spyOn(component.profileControl, 'beginEditing');

    spyOn(component, 'promoCodeBeingEdited').and.returnValue(false);

    component.toggleEditPromoCode();

    expect(profileControlSpy).toHaveBeenCalledTimes(1);
  });

  it('should call done editing if the promo code is not being edited when toggleEditPromoCode is called', () => {
    component.profileControl.doneEditing = () => { };
    const profileControlSpy = spyOn(component.profileControl, 'doneEditing');

    spyOn(component, 'promoCodeBeingEdited').and.returnValue(true);

    component.toggleEditPromoCode();

    expect(profileControlSpy).toHaveBeenCalledTimes(1);
  });

  it('should return true if the user has a gold account when isGoldUser is called', () => {
    const tierPermissionsManagerSpy = spyOn(component.tierPermissionsManager, 'userHasGoldAccount').and.returnValue(true);

    expect(component.isGoldUser()).toBe(true);
    expect(tierPermissionsManagerSpy).toHaveBeenCalledTimes(1);
  });

  it('should return false if the user does not have a gold account when isGoldUser is called', () => {
    const tierPermissionsManagerSpy = spyOn(component.tierPermissionsManager, 'userHasGoldAccount').and.returnValue(false);

    expect(component.isGoldUser()).toBe(false);
    expect(tierPermissionsManagerSpy).toHaveBeenCalledTimes(1);
  });

  it('should return true if the current user is a gold user and the promo code is not being edited when showEditPromoCodeFormButton is called', () => {
    component.isGoldUser = () => true;
    component.promoCodeBeingEdited = () => false;

    expect(component.showEditPromoCodeFormButton()).toBe(true);
  });

  it('should return false if the user is not a gold user when showEditPromoCodeFormButton is called', () => {
    component.isGoldUser = () => false;
    component.promoCodeBeingEdited = () => false;

    expect(component.showEditPromoCodeFormButton()).toBe(false);
  });

  it('should return false if the promoCode is being edited when showEditPromoCodeFormButton is called', () => {
    component.isGoldUser = () => true;
    component.promoCodeBeingEdited = () => true;

    expect(component.showEditPromoCodeFormButton()).toBe(false);
  });
});

function setup() {
  const fb = autoSpy(FormBuilder);
  const profileControl = autoSpy(ProfileControlService);
  const stateManager = autoSpy(StateManagerService);
  const tierPermissionsManager = autoSpy(TierPermissionsService);
  const firebaseGeneral = autoSpy(FirebaseGeneralService);
  const dialogCreator = autoSpy(DialogCreatorService);
  const environment = autoSpy(EnvironmentService);
  const iap = autoSpy(InAppPurchaseService);
  const builder = {
    fb,
    profileControl,
    stateManager,
    tierPermissionsManager,
    firebaseGeneral,
    environment,
    iap,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      spyOn(stateManager, 'getCurrentUser').and.returnValue(new TestHelpers().createFreeUserProfile());
      stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(null);
      return new AccountComponent(new FormBuilder(), profileControl, stateManager, tierPermissionsManager, firebaseGeneral, dialogCreator, environment, iap);
    }
  };
  return builder;
}
