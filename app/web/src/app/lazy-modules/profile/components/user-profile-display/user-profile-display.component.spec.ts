import { UserProfile } from './../../../../model-classes/general/user-profile';
import { TestHelpers } from 'src/app/services/general/testHelpers';
import { FormBuilder } from '@angular/forms';
import { ConversionService } from '../../../../services/general/conversion.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { WeightPipe } from 'src/app/shared-pipes/weight-pipe';
import { HeightPipe } from 'src/app/shared-pipes/height-pipe';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ProfileService } from 'src/app/services/general/profile.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { UserProfileDisplayComponent } from './user-profile-display.component';
import { autoSpy } from 'autoSpy';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { NutritionConstanstsService } from 'src/app/services/nutrition-log/nutrition-constansts.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';
import { CallableWrapperService } from 'src/app/services/firebase/callable-wrapper.service';

describe('UserProfileDisplayComponent', () => {
  const testHelper: TestHelpers = new TestHelpers();

  let component: UserProfileDisplayComponent;
  beforeEach(() => {
    component = setup().default().build();

    component.permissions.CURRENT_USER = testHelper.createFreeUserProfile();
    component.permissions.getUserTier = jasmine.createSpy().and.returnValue(component.permissions.CURRENT_USER.tierPermissions);
    component.permissions.userHasSubscription = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier()[component.permissions.TIER_NAME_KEY] != component.permissions.FREE_SUBSCRIPTION_NAME
    );
    component.permissions.userHasGoldAccount = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier[component.permissions.TIER_NAME_KEY] == component.permissions.GOLD_SUBSCRIPTION_NAME
    );
    component.permissions.userHasActiveSubscription = jasmine.createSpy().and.returnValue(
      (component.permissions.userHasSubscription() && (component.permissions.CURRENT_USER.subscriptionStatus ==
        component.permissions.SUBSCRIPTION_STATUS_ACTIVE)) || component.permissions.userHasGoldAccount()
    );
  });

  it('should not crash when ngOnInit() is called it ', () => {
    const crashed: boolean = testHelper.testOnInit(component);
    expect(crashed).toBe(false);
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

  it("should show the editAndRestButton if the profile is not being edited and the user is not past the free limit or inactive ", () => {
    component.profileControl.EDITING_PROFILE = "someValue";
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE + "someOtherValue");
    component.permissions.freeTrialOverAndUserHasNotPaid = () => false;
    component.permissions.userSubscriptionUnpaid = () => false;
    expect(component.showEditResetButton()).toBe(true);
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE + "someOtherValue");
    component.permissions.freeTrialOverAndUserHasNotPaid = () => false;
    component.permissions.userSubscriptionUnpaid = () => true;
    expect(component.showEditResetButton()).toBe(true);
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE + "someOtherValue");
    component.permissions.freeTrialOverAndUserHasNotPaid = () => true;
    component.permissions.userSubscriptionUnpaid = () => false;
    expect(component.showEditResetButton()).toBe(true);
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE);
    component.permissions.freeTrialOverAndUserHasNotPaid = () => false;
    component.permissions.userSubscriptionUnpaid = () => false;
    expect(component.showEditResetButton()).toBe(false);
  });

  it('should create a subscritpion that generates new forms after editing when currentUserSubscription() is called ', () => {
    component.ngOnInit();

    // currentUserSubscription is called in the components constructor
    expect(component.myCurrentUserSubscription).not.toBe(Subscription.EMPTY);

    // make sure that a new form is created when data is passed to the subscription
    component.stateManager.currentUserProfile.next(testHelper.createFreeUserProfile());
    expect(component.profileEditForm.untouched).toBe(true);
  });

  it('should return whether the edit reset and sign out buttons should be shown when showSignOutButton() is called ', () => {
    component.profileControl.EDITING_PROFILE = "someValue";
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE + "someOtherValue");
    expect(component.showSignOutButton()).toBe(true);
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE);
    expect(component.showSignOutButton()).toBe(false);
  });

  it('should return true if a form other than the profile form is being edited when disableEditResetAndSignOutButton() is called', () => {
    component.ngOnInit();

    expect(component.disableEditResetAndSignOutButton()).toBe(false);

    component.profileControl.beginEditing(component.profileControl.EDITING_GENERAL_PREFS);

    expect(component.disableEditResetAndSignOutButton()).toBe(true);

    component.profileControl.doneEditing();
    component.toggleProfileFormEdit();

    expect(component.disableEditResetAndSignOutButton()).toBe(false);
  });

  it('should return true if the user profile form is being edited when userProfileFormBeingEdited() is called ', () => {
    component.ngOnInit();

    expect(component.userProfileFormBeingEdited()).toBe(false);

    component.toggleProfileFormEdit();

    expect(component.userProfileFormBeingEdited()).toBe(true);
  });

  it('should return whether the confirmation and close buttons should be shown when showConfirmationAndCloseButton() is called ', () => {
    component.submitting = true;
    component.userProfileFormBeingEdited = () => true;
    expect(component.showConfirmationAndCloseButton()).toBe(false);
    component.submitting = false;
    component.userProfileFormBeingEdited = () => true;
    expect(component.showConfirmationAndCloseButton()).toBe(true);
    component.submitting = false;
    component.userProfileFormBeingEdited = () => false;
    expect(component.showConfirmationAndCloseButton()).toBe(false);
    component.submitting = true;
    component.userProfileFormBeingEdited = () => false;
    expect(component.showConfirmationAndCloseButton()).toBe(false);
  });

  it('should return true if the user has a subscription and showDeleteButton() is called', () => {
    component.ngOnInit();

    // free account
    expect(component.showDeleteButton()).toBe(false);

    // premium account
    component.permissions.CURRENT_USER = testHelper.createPremiumUserProfile();
    component.permissions.getUserTier = jasmine.createSpy().and.returnValue(component.permissions.CURRENT_USER.tierPermissions);
    component.permissions.userHasSubscription = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier()[component.permissions.TIER_NAME_KEY] != component.permissions.FREE_SUBSCRIPTION_NAME
    );
    component.permissions.userHasGoldAccount = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier[component.permissions.TIER_NAME_KEY] == component.permissions.GOLD_SUBSCRIPTION_NAME
    );
    component.permissions.userHasActiveSubscription = jasmine.createSpy().and.returnValue(
      (component.permissions.userHasSubscription() && (component.permissions.CURRENT_USER.subscriptionStatus ==
        component.permissions.SUBSCRIPTION_STATUS_ACTIVE)) || component.permissions.userHasGoldAccount()
    );
    expect(component.showDeleteButton()).toBe(true);

    // free account
    component.permissions.CURRENT_USER = testHelper.createFreeUserProfile();
    component.permissions.getUserTier = jasmine.createSpy().and.returnValue(component.permissions.CURRENT_USER.tierPermissions);
    component.permissions.userHasSubscription = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier()[component.permissions.TIER_NAME_KEY] != component.permissions.FREE_SUBSCRIPTION_NAME
    );
    component.permissions.userHasGoldAccount = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier[component.permissions.TIER_NAME_KEY] == component.permissions.GOLD_SUBSCRIPTION_NAME
    );
    component.permissions.userHasActiveSubscription = jasmine.createSpy().and.returnValue(
      (component.permissions.userHasSubscription() && (component.permissions.CURRENT_USER.subscriptionStatus ==
        component.permissions.SUBSCRIPTION_STATUS_ACTIVE)) || component.permissions.userHasGoldAccount()
    );
    expect(component.showDeleteButton()).toBe(false);

    // gold account
    component.permissions.CURRENT_USER = testHelper.createGoldUserProfile();
    component.permissions.getUserTier = jasmine.createSpy().and.returnValue(component.permissions.CURRENT_USER.tierPermissions);
    component.permissions.userHasSubscription = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier()[component.permissions.TIER_NAME_KEY] != component.permissions.FREE_SUBSCRIPTION_NAME
    );
    component.permissions.userHasGoldAccount = jasmine.createSpy().and.returnValue(
      component.permissions.getUserTier[component.permissions.TIER_NAME_KEY] == component.permissions.GOLD_SUBSCRIPTION_NAME
    );
    component.permissions.userHasActiveSubscription = jasmine.createSpy().and.returnValue(
      (component.permissions.userHasSubscription() && (component.permissions.CURRENT_USER.subscriptionStatus ==
        component.permissions.SUBSCRIPTION_STATUS_ACTIVE)) || component.permissions.userHasGoldAccount()
    );
    expect(component.showDeleteButton()).toBe(true);
  });

  it('should return whether the delete button should be disabled when disableDeleteButton() is called', () => {
    component.ngOnInit();

    // component just initialized, no form being edited
    expect(component.disableDeleteButton()).toBe(false);

    // toggle the form within this component - editing
    component.toggleProfileFormEdit();
    expect(component.disableDeleteButton()).toBe(true);

    // toggle the form within this component - done editing
    component.toggleProfileFormEdit();
    expect(component.disableDeleteButton()).toBe(false);

    // toggle a form not in this component
    component.profileControl.beginEditing(component.profileControl.EDITING_NUTR_PREFS);
    expect(component.disableDeleteButton()).toBe(true);
  });

  it('should return whether the profile form controls should be disabled when disableUserProfileFormControls(() is called', () => {
    component.profileControl.EDITING_PROFILE = "someValue";
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE + "someOtherValue");
    component.submitting = true;
    expect(component.disableUserProfileFormControls()).toBe(true);
    component.profileControl.currentEditValue = () => (component.profileControl.EDITING_PROFILE + "someOtherValue");
    component.submitting = false;
    expect(component.disableUserProfileFormControls()).toBe(true);
    component.profileControl.currentEditValue = () => component.profileControl.EDITING_PROFILE;
    component.submitting = true;
    expect(component.disableUserProfileFormControls()).toBe(true);
    component.profileControl.currentEditValue = () => component.profileControl.EDITING_PROFILE;
    component.submitting = false;
    expect(component.disableUserProfileFormControls()).toBe(false);
  });

  it('should open the password reset dialog when openPasswordReset() is called ', () => {
    component.ngOnInit();

    component.openPasswordReset();

    expect(component.dialog.openPasswordResetDialog).toHaveBeenCalled();
  });

  it('should toggle form editing toggleProfileFormEdit() is called ', () => {
    component.ngOnInit();

    expect(component.userProfileFormBeingEdited()).toBe(false);

    component.toggleProfileFormEdit();
    expect(component.userProfileFormBeingEdited()).toBe(true);

    component.toggleProfileFormEdit();
    expect(component.userProfileFormBeingEdited()).toBe(false);
  });

  it('should edit the user profile when handleSubmit() is called', async () => {
    component.conversionManager = new ConversionService(new NutritionConstanstsService());
    component.fb = new FormBuilder()
    const someUser = new UserProfile();
    someUser.height_inches = 69;
    someUser.weight_lbs = 420;
    someUser.activityLevel = "someActivityLevel";
    someUser.age = 21;
    someUser.isMale = true;
    someUser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.profileEditForm = component.generateNewProfileEditForm();
    let lamRef;
    component.dialog.openProfileStateChangeDialog = async (someLamda) => {
      lamRef = someLamda;
      return true;
    }
    await component.handleSubmit()
    await lamRef();
    expect(component.firebaseGeneral.editUserProfile).toHaveBeenCalled();
  });

  it('should log the user out and go to the verify page if their email changed when handleSubmit() is called', async () => {
    component.conversionManager = new ConversionService(new NutritionConstanstsService());
    component.fb = new FormBuilder()
    const someUser = new UserProfile();
    someUser.height_inches = 69;
    someUser.weight_lbs = 420;
    someUser.activityLevel = "someActivityLevel";
    someUser.age = 21;
    someUser.isMale = true;
    someUser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.updateEmailIfChanged = async () => true;
    component.dialog.openProfileStateChangeDialog = async (someLamda) => {
      await someLamda();
      return true;
    }
    await component.handleSubmit()
    expect(component.firebaseGeneral.editUserProfile).toHaveBeenCalled();
    expect(component.auth.logOutGoVerify).toHaveBeenCalled();
  });

  it('should NOT log the user out and go to the verify page if their email did not change when handleSubmit() is called', async () => {
    component.conversionManager = new ConversionService(new NutritionConstanstsService());
    component.fb = new FormBuilder()
    const someUser = new UserProfile();
    someUser.height_inches = 69;
    someUser.weight_lbs = 420;
    someUser.activityLevel = "someActivityLevel";
    someUser.age = 21;
    someUser.isMale = true;
    someUser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.updateEmailIfChanged = async () => false;
    component.dialog.openProfileStateChangeDialog = async (someLamda) => {
      await someLamda();
      return true;
    }
    await component.handleSubmit()
    expect(component.firebaseGeneral.editUserProfile).toHaveBeenCalled();
    expect(component.auth.logOutGoVerify).not.toHaveBeenCalled();
  });

  it('should submit the form handleSubmit() is called if the user is missing demographic information', async () => {
    component.conversionManager = new ConversionService(new NutritionConstanstsService());
    component.fb = new FormBuilder()
    const someUser = new UserProfile();
    someUser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.updateEmailIfChanged = async () => false;
    component.dialog.openProfileStateChangeDialog = async (someLamda) => {
      await someLamda();
      return true;
    }
    await component.handleSubmit()
    expect(component.submitting).toBe(false);
    expect(component.firebaseGeneral.editUserProfile).toHaveBeenCalled();
  });

  it('should submit the users weight and height fine if their number system is metric when handleSubmit() is called', async () => {
    component.conversionManager = new ConversionService(new NutritionConstanstsService());
    component.fb = new FormBuilder()
    const someUser = new UserProfile();
    someUser.height_inches = 69;
    someUser.weight_lbs = 420;
    someUser.activityLevel = "someActivityLevel";
    someUser.age = 21;
    someUser.isMale = true;
    someUser.age = 99;
    someUser.username = "someUsername            With spacesOnPurpose";
    someUser.weight_lbs = testHelper.getRandomWeight();
    someUser.height_inches = testHelper.getRandomWeight();
    someUser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    someUser.userPreferences.general.isImperial = false;
    someUser.estimatedTDEE = testHelper.getRandomCalories();
    component.stateManager.getCurrentUser = () => someUser;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.updateEmailIfChanged = async () => true;
    component.dialog.openProfileStateChangeDialog = async (someLamda) => {
      await someLamda();
      return true;
    }
    let userRef;
    component.firebaseGeneral.editUserProfile = (user) => {
      userRef = user;
      return null;
    }
    await component.handleSubmit();
    expect(userRef.estimatedTDEE).toBe(Math.round(someUser.estimatedTDEE));
    expect(someUser.username.trim()).toBe(userRef.username)
  });

  it('should submit the users weight and height fine if their number system is metric when handleSubmit() is called', async () => {
    component.conversionManager = new ConversionService(new NutritionConstanstsService());
    component.fb = new FormBuilder()
    const someUser = new UserProfile();
    someUser.height_inches = 69;
    someUser.weight_lbs = 420;
    someUser.activityLevel = "someActivityLevel";
    someUser.age = 21;
    someUser.isMale = true;
    someUser.weight_lbs = testHelper.getRandomWeight();
    someUser.height_inches = testHelper.getRandomWeight();
    someUser.userPreferences = (new PreferenceService({} as any)).getDefaultPreferences();
    someUser.userPreferences.general.isImperial = false;
    component.stateManager.getCurrentUser = () => someUser;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.updateEmailIfChanged = async () => true;
    component.dialog.openProfileStateChangeDialog = async (someLamda) => {
      await someLamda();
      return true;
    }
    await component.handleSubmit()
    expect(component.firebaseGeneral.editUserProfile).toHaveBeenCalled();
    expect(component.auth.logOutGoVerify).toHaveBeenCalled();
  });

  it('should return false if the email does not exist when updateEmailIfChanged has been called', async () => {
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'] = null;

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(false);
  });

  it('should return false if the email exists but it has not been changed when updateEmailIfChanged is called', async () => {
    component.showEmailChangeSuccess = false;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'test@example.com', sendEmailVerification: () => { } } as any;

    const emailSpy: jasmine.Spy<(newEmail) => Promise<void>> = spyOn(component.authManager, 'tryToUpdateEmail');
    const verifySpy: jasmine.Spy<() => Promise<void>> = spyOn(component.authManager.afAuth.auth.currentUser, 'sendEmailVerification');

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(false);
    expect(emailSpy).not.toHaveBeenCalled();
    expect(verifySpy).not.toHaveBeenCalled();
    expect(component.showEmailChangeSuccess).toBe(false);
  });

  it('should update the email if it has been changed and set showEmailChangeSuccess to true when updateEmailIfChanged has been called ', async () => {
    component.profileEditForm = component.generateNewProfileEditForm();
    component.showEmailChangeSuccess = false;

    // email change === true scenario
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'old@example.com', sendEmailVerification: () => { } } as any;

    const emailSpy: jasmine.Spy<(newEmail) => Promise<void>> = spyOn(component.authManager, 'tryToUpdateEmail');
    const verifySpy: jasmine.Spy<() => Promise<void>> = spyOn(component.authManager.afAuth.auth.currentUser, 'sendEmailVerification');

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(true);
    expect(emailSpy).toHaveBeenCalledWith('test@example.com');
    expect(verifySpy).toHaveBeenCalled();
    expect(component.showEmailChangeSuccess).toBe(true);
  });

  it('should reAuth if an error occurs and the error is a needs auth error when updateEmailIfChanged is called', async () => {
    component.showEmailChangeSuccess = false;
    component.showEmailChangeFailure = false;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'old@example.com', sendEmailVerification: () => { } } as any;

    const error = { code: 'auth/requires-recent-login' } as any;

    component.authManager.tryToUpdateEmail = (email) => {
      throw error;
    }

    const verifySpy: jasmine.Spy<() => Promise<void>> = spyOn(component.authManager.afAuth.auth.currentUser, 'sendEmailVerification');

    // successful reauth is false
    const dialogSpy: jasmine.Spy<(message) => Promise<boolean>> = spyOn(component.dialog, 'openReauthDialog').and.returnValue(Promise.resolve(false));

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(false);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(dialogSpy).toHaveBeenCalledWith('Changing your email');
    expect(component.showEmailChangeSuccess).toBe(false);
    expect(component.showEmailChangeFailure).toBe(true);
  });

  it('should call updateEmailIfChanged when a reauthentication is successful', async () => {
    component.showEmailChangeSuccess = false;
    component.showEmailChangeFailure = false;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'old@example.com', sendEmailVerification: () => { } } as any;

    const error = { code: 'auth/requires-recent-login' } as any;

    component.authManager.tryToUpdateEmail = () => {
      // set this to false to fail satisfy the first conditional and terminate when the func calls itself
      component.profileEditForm.controls[component.FORM_CONTROL_EMAIL] = null;
      throw error;
    };

    const emailSpy: jasmine.Spy<() => Promise<boolean>> = spyOn(component, 'updateEmailIfChanged').and.callThrough();

    // successful reauth is true
    spyOn(component.dialog, 'openReauthDialog').withArgs(component.NEEDS_AUTH_MESSAGE).and.returnValue(Promise.resolve(true));

    const result = await component.updateEmailIfChanged();

    expect(emailSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(false);
  });

  it('should set the email change fail message to the email invalid message if the email is invalid when updateEmailIfChange is called', async () => {
    component.EMAIL_CHANGE_FAIL_MESSAGE = '';
    component.showEmailChangeSuccess = false;
    component.showEmailChangeFailure = false;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'old@example.com', sendEmailVerification: () => { } } as any;
    const error = { code: component.INVALID_EMAIL_ERROR } as any;


    component.authManager.tryToUpdateEmail = (email) => {
      throw error;
    }

    const verifySpy: jasmine.Spy<() => Promise<void>> = spyOn(component.authManager.afAuth.auth.currentUser, 'sendEmailVerification');

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(false);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(component.showEmailChangeFailure).toBe(true);
    expect(component.showEmailChangeSuccess).toBe(false);
    expect(component.EMAIL_CHANGE_FAIL_MESSAGE).toEqual(component.INVALID_EMAIL_MESSAGE + component.OTHER_EDITS_VALID);
  });

  it('should set the email change fail message to the email in use message if the email is in use when updateEmailIfChange is called', async () => {
    component.EMAIL_CHANGE_FAIL_MESSAGE = '';
    component.showEmailChangeSuccess = false;
    component.showEmailChangeFailure = false;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'old@example.com', sendEmailVerification: () => { } } as any;
    const error = { code: component.EMAIL_IN_USE_ERROR } as any;


    component.authManager.tryToUpdateEmail = (email) => {
      throw error;
    }

    const verifySpy: jasmine.Spy<() => Promise<void>> = spyOn(component.authManager.afAuth.auth.currentUser, 'sendEmailVerification');

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(false);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(component.showEmailChangeFailure).toBe(true);
    expect(component.showEmailChangeSuccess).toBe(false);
    expect(component.EMAIL_CHANGE_FAIL_MESSAGE).toEqual(component.EMAIL_IN_USE_MESSAGE + component.OTHER_EDITS_VALID);
  });

  it('should set the email change fail message to the default value if the error message does not have a code property when updateEmailIfChange is called', async () => {
    component.EMAIL_CHANGE_FAIL_MESSAGE = '';
    component.showEmailChangeSuccess = false;
    component.showEmailChangeFailure = false;
    component.profileEditForm = component.generateNewProfileEditForm();
    component.profileEditForm.controls['email'].patchValue('test@example.com');
    component.authManager.afAuth.auth.currentUser = { email: 'old@example.com', sendEmailVerification: () => { } } as any;
    const error = {} as any;


    component.authManager.tryToUpdateEmail = (email) => {
      throw error;
    }

    const verifySpy: jasmine.Spy<() => Promise<void>> = spyOn(component.authManager.afAuth.auth.currentUser, 'sendEmailVerification');

    const result = await component.updateEmailIfChanged();

    expect(result).toBe(false);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(component.showEmailChangeFailure).toBe(true);
    expect(component.showEmailChangeSuccess).toBe(false);
    expect(component.EMAIL_CHANGE_FAIL_MESSAGE).toEqual(component.DEFAULT_EMAIL_FAIL_MESSAGE + component.OTHER_EDITS_VALID);
  });

  it('should open dialogs when handleDelete() is called', (done) => {
    component.ngOnInit();

    component.handleDelete().then(() => {
      expect(component.dialog.openReauthDialog).toHaveBeenCalled();
      done();
    });

    component.dialog.openReauthDialog = jasmine.createSpy().and.returnValue(true);
    component.handleDelete().then(() => {
      expect(component.dialog.openDeleteProfileDialog).toHaveBeenCalled();
      done();
    });
  });

  it('should generate a new form when generateNewProfileEditForm() is called', () => {
    component.ngOnInit();

    expect(component.generateNewProfileEditForm().untouched).toBe(true);
  });

  it('should not update user height or weight if they do not exist for the current user when generateNewProfileEditForm is called', () => {
    const userProfile = new UserProfile();
    userProfile.height_inches = null;
    userProfile.weight_lbs = null;
    //userProfile.isMale = false;

    component.stateManager.getCurrentUser = () => userProfile;

    const heightConvertSpy: jasmine.Spy<(height) => number> = spyOn(component.conversionManager, 'convertInchesToFeet');
    const weightConvertSpy: jasmine.Spy<(weight) => number> = spyOn(component.conversionManager, 'convertLbsToKg');

    expect(component.stateManager.getCurrentUser().height_inches).toBe(null);

    component.generateNewProfileEditForm();

    expect(heightConvertSpy).not.toHaveBeenCalledWith(null);
    expect(weightConvertSpy).not.toHaveBeenCalledWith(null);
  });

  it('shoud set display gender to female if currentUser isMale is false when generateNewProfileEditForm is called', () => {
    const userProfile = new UserProfile();
    userProfile.isMale = false;

    component.stateManager.getCurrentUser = () => userProfile;

    expect(component.stateManager.getCurrentUser().height_inches).toBe(null);

    const newForm = component.generateNewProfileEditForm();

    expect(newForm.get(component.FORM_CONTROL_DISPLAY_GENDER).value).toEqual('Female');
  });
});

function setup() {
  const stateManager = autoSpy(StateManagerService);
  const auth = autoSpy(AuthenticationService);
  const fb = autoSpy(FormBuilder);
  const conversionManager = autoSpy(ConversionService);
  const dialog = autoSpy(DialogCreatorService);
  const preferenceManager = autoSpy(PreferenceService);
  const weightPipe = autoSpy(WeightPipe);
  const heightPipe = autoSpy(HeightPipe);
  const authManager = autoSpy(AuthenticationService);
  const permissions = autoSpy(TierPermissionsService);
  const firebaseGeneral = autoSpy(FirebaseGeneralService);
  const snackBar = autoSpy(SnackBarService);
  const prof = autoSpy(ProfileService);
  const generalConstants = autoSpy(ConstantsService);
  const iap = autoSpy(InAppPurchaseService);
  const environment = autoSpy(EnvironmentService);
  const builder = {
    stateManager,
    auth,
    fb,
    conversionManager,
    dialog,
    preferenceManager,
    weightPipe,
    heightPipe,
    authManager,
    permissions,
    firebaseGeneral,
    snackBar,
    prof,
    generalConstants,
    environment,
    default() {
      return builder;
    },
    build() {
      jasmine.getEnv().allowRespy(true);
      spyOn(stateManager, 'getCurrentUser').and.returnValue(new TestHelpers().createFreeUserProfile());
      authManager.afAuth = {
        auth: {
          currentUser: {
            email: "someemail@gmail.com"
          } as any
        } as any
      } as any;
      permissions.TIER_NAME_KEY = "name";
      permissions.FREE_SUBSCRIPTION_NAME = "LS_FREE";
      permissions.GOLD_SUBSCRIPTION_NAME = "GOLD";
      permissions.SUBSCRIPTION_STATUS_ACTIVE = "active";
      stateManager.currentUserProfile = new BehaviorSubject<UserProfile>(null);
      return new UserProfileDisplayComponent(stateManager, auth, new FormBuilder(), conversionManager, dialog, preferenceManager, weightPipe, heightPipe, new ProfileControlService(), authManager, permissions, firebaseGeneral, snackBar, prof, generalConstants, iap, { detectChanges: () => { } } as any, environment);
    }
  };

  return builder;
}
