import { TestHelpers } from 'src/app/services/general/testHelpers';
import { FormBuilder } from '@angular/forms';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { ObjectStorageService } from 'src/app/services/general/object-storage.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { PreferencesComponent } from './preferences.component';
import { autoSpy } from 'autoSpy';
import { Subscription } from 'rxjs';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { UserProfile } from 'functions/src/classes/user-profile';

describe('PreferencesComponent', () => {
  const testHelpers: TestHelpers = new TestHelpers();

  let component: PreferencesComponent;
  beforeEach(() => {
    component = setup().default().build();
    component.stateManager.getCurrentUser = jasmine.createSpy().and.returnValue(testHelpers.createFreeUserProfile());
    component.permissions.getUserTier = jasmine.createSpy().and.returnValue(testHelpers.mockTierPermissionServiceGetUserTier(component.stateManager.getCurrentUser()));
    component.profileControl = new ProfileControlService();
  });

  it('should not crash when ngOnInit is called', () => {
    // Initialize component, just make sure it doesn't crash
    let crashed: boolean = testHelpers.testOnInit(component);
    expect(crashed).toBe(false);
  });

  it('should not crash and unsubscribe from any subscriptions when ngOnDestroy is called', () => {
    // Initialize component
    component.ngOnInit();

    // The form unsubscribed in the ngOnDestroy method should NOT be unsubscribed after component initialization
    let unsubscribed: boolean = testHelpers.isUnsubscribed(component.myCurrentlyBeingEditedSubscription);
    expect(unsubscribed).toBe(false);

    // Destroy component, shouldn't crash
    const crashed: boolean = testHelpers.testOnDestroy(component);
    expect(crashed).toBe(false);

    // The form unsubscribed in the ngOnDestroy method should be unsubscribed now 
    unsubscribed = testHelpers.isUnsubscribed(component.myCurrentlyBeingEditedSubscription);
    expect(unsubscribed).toBe(true);
  });

  it('should generate new forms when setFormsToCurrentuserState() is called ', () => {
    // Initialize component, setFormsToCurrentuserState called in ngOnInit() 
    component.ngOnInit();

    // The new FormGroup objects should be untouched
    expect(component.generalPreferencesForm.untouched).toBe(true);
    expect(component.nutritionPreferencesForm.untouched).toBe(true);
  });

  it('should set myCurrentlyBeingEditedSubscription to a Subscription object when formBeingEditedSubscription() is called', () => {
    // Initialize component 
    component.ngOnInit();

    // myCurrentlyBeingEditedSubscription should be a non-empty Subscription object
    expect(component.myCurrentlyBeingEditedSubscription).not.toBe(Subscription.EMPTY);
  });

  it('should set myCurrentUserSubscription to a Subscription object currentUserSubscription() is called ', () => {
    // Initialize component
    component.ngOnInit();

    // myCurrentUserSubscription should be a non-empty Subscription object 
    expect(component.myCurrentUserSubscription).not.toBe(Subscription.EMPTY);
  });

  it('should update the users preferences after updatePreferences is called (general)', async () => {
    component.ngOnInit();
    const someUser = new UserProfile();
    someUser.tierPermissions = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.generalPreferencesBeingEdited = () => true;
    component.profileControl.doneEditing = jasmine.createSpy();
    await component.updatePreferences();
    expect(component.dialog.openPreferenceStateChangeDialog).toHaveBeenCalled();
    expect(component.profileControl.doneEditing).toHaveBeenCalled();
    expect(component.showNutrSpinner).toBe(false);
    expect(component.showGeneralSpinner).toBe(false);
  });

  it('should update the users preferences after updatePreferences is called (nutrition)', async () => {
    component.ngOnInit();
    const someUser = new UserProfile();
    someUser.tierPermissions = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.nutritionPreferencesBeingEdited = () => true;
    component.profileControl.doneEditing = jasmine.createSpy();
    await component.updatePreferences();
    expect(component.dialog.openPreferenceStateChangeDialog).toHaveBeenCalled();
    expect(component.profileControl.doneEditing).toHaveBeenCalled();
    expect(component.showNutrSpinner).toBe(false);
    expect(component.showGeneralSpinner).toBe(false);
  });

  it('should update the users preferences after updatePreferences is called (neither)', async () => {
    component.ngOnInit();
    const someUser = new UserProfile();
    someUser.tierPermissions = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.nutritionPreferencesBeingEdited = () => false;
    component.generalPreferencesBeingEdited = () => false;
    component.profileControl.doneEditing = jasmine.createSpy();
    await component.updatePreferences();
    expect(component.dialog.openPreferenceStateChangeDialog).toHaveBeenCalled();
    expect(component.profileControl.doneEditing).toHaveBeenCalled();
    expect(component.showNutrSpinner).toBe(false);
    expect(component.showGeneralSpinner).toBe(false);
  });

  it('should ask for the firebase manager to edit the users preferences when the wait for operation dialog is opened when updatePreferences() is called ', async () => {
    component.ngOnInit();
    const someUser = new UserProfile();
    someUser.tierPermissions = (new PreferenceService({} as any)).getDefaultPreferences();
    component.stateManager.getCurrentUser = () => someUser;
    component.nutritionPreferencesBeingEdited = () => true;
    component.profileControl.doneEditing = jasmine.createSpy();
    let lamRef
    component.dialog.openPreferenceStateChangeDialog = jasmine.createSpy().and.callFake((logic) => {
      lamRef = logic;
    });
    await component.updatePreferences();
    lamRef();
    expect(component.firebaseManager.editUserPreferences).toHaveBeenCalledWith(someUser);
  });

  it('should update the users preferences after updatePreferences is called (nutrition)', () => {
    component.ngOnInit();

    expect(component.generalPreferencesBeingEdited() && component.nutritionPreferencesBeingEdited()).toBe(false);

    component.toggleEditNutritionPreferences();
    expect(component.nutritionPreferencesBeingEdited()).toBe(true);
    component.updatePreferences().then(() => {
      expect(component.nutritionPreferencesBeingEdited()).toBe(false);
    });
  });

  it('should generate a new form when generateNewGeneralPreferencesForm() is called', () => {
    // Initialize component
    component.ngOnInit();

    // generateNewGeneralPreferencesForm is called in the components ngOnInit
    expect(component.generalPreferencesForm.untouched).toBe(true);
  });

  it('should return whether the user is editing their general preferences when generalPreferencesBeingEdited() is called', () => {
    // Initialize componens
    component.ngOnInit();

    // After the component is initialized, general preferences should not be in editing by the user
    expect(component.generalPreferencesBeingEdited()).toBe(false);
  });

  it('will invert the forms state when toggleEditGeneralPreferences() is called ', () => {
    // Initialize component
    component.ngOnInit();

    expect(component.profileControl.EDITING_GENERAL_PREFS).toBe("GENERAL");
  });

  it('should generate a new form when generateNutritionPreferencesForm() is called', () => {
    // Initialize component
    component.ngOnInit();

    // generateNutritionPreferencesForm is called in the components ngOnInit
    expect(component.nutritionPreferencesForm.untouched).toBe(true);
  });

  it('should return whether the user can edit general preferences when showEditGeneralPrefFormButton() is called', () => {
    component.ngOnInit();
    component.allowEditPreferences = jasmine.createSpy().and.returnValue(true);
    component.generalPreferencesBeingEdited = jasmine.createSpy().and.returnValue(false);
    expect(component.showEditGeneralPrefFormButton()).toBe(true);
    component.allowEditPreferences = jasmine.createSpy().and.returnValue(false);
    component.generalPreferencesBeingEdited = jasmine.createSpy().and.returnValue(false);
    expect(component.showEditGeneralPrefFormButton()).toBe(false);
    component.allowEditPreferences = jasmine.createSpy().and.returnValue(true);
    component.generalPreferencesBeingEdited = jasmine.createSpy().and.returnValue(true);
    expect(component.showEditGeneralPrefFormButton()).toBe(false)
  });

  it("should return true all of the time when alloweditPreferences() is called, false otherwise", () => {
    component.permissions.freeTrialOverOrSubscriptionNotActive = () => false;
    expect(component.allowEditPreferences()).toBe(true);
    component.permissions.freeTrialOverOrSubscriptionNotActive = () => true;
    expect(component.allowEditPreferences()).toBe(true);
  });

  it('should return whether the form button should be disabled when disableEditGeneralPrefFormButton() is called', () => {
    // Initialize component
    component.ngOnInit();

    // Should return false when the component is first initialized
    expect(component.disableEditGeneralPrefFormButton()).toBe(false);

    // Toggle each form and make sure that the edit general pref form button is disabled
    component.toggleEditNutritionPreferences();
    expect(component.disableEditGeneralPrefFormButton()).toBe(true);
    component.toggleEditNutritionPreferences();
    component.toggleEditGeneralPreferences();
    expect(component.disableEditGeneralPrefFormButton()).toBe(true);
    component.toggleEditGeneralPreferences();

    // No forms being edited, edit general pref form button should not be disabled
    expect(component.disableEditGeneralPrefFormButton()).toBe(false);
  });

  it('should return whether the nutrition preferences are being edited when nutritionPreferencesBeingEdited() is called', () => {
    // Initialize component
    component.ngOnInit();

    expect(component.nutritionPreferencesBeingEdited()).toBe(false);
    component.toggleEditNutritionPreferences();
    expect(component.nutritionPreferencesBeingEdited()).toBe(true);
    component.toggleEditNutritionPreferences();
    expect(component.nutritionPreferencesBeingEdited()).toBe(false);
  });

  it('should toggle nutrition preferences when toggleEditNutritionPreferences is called', () => {
    // Initialize component
    component.ngOnInit();

    expect(component.nutritionPreferencesBeingEdited()).toBe(false);
    component.toggleEditNutritionPreferences();
    expect(component.nutritionPreferencesBeingEdited()).toBe(true);
    component.toggleEditGeneralPreferences();
    expect(component.nutritionPreferencesBeingEdited()).toBe(false);
  });

  it('should return whether the nutrition preferences form button should be shown when showEditNutrPrefFormButton() is called', () => {
    component.ngOnInit();
    component.allowEditPreferences = jasmine.createSpy().and.returnValue(true);
    component.nutritionPreferencesBeingEdited = jasmine.createSpy().and.returnValue(false);
    expect(component.showEditNutrPrefFormButton()).toBe(true);
    component.allowEditPreferences = jasmine.createSpy().and.returnValue(false);
    component.nutritionPreferencesBeingEdited = jasmine.createSpy().and.returnValue(false);
    expect(component.showEditNutrPrefFormButton()).toBe(false);
    component.allowEditPreferences = jasmine.createSpy().and.returnValue(true);
    component.nutritionPreferencesBeingEdited = jasmine.createSpy().and.returnValue(true);
    expect(component.showEditNutrPrefFormButton()).toBe(false);
  });

  it('should return if the nutrition pref form button should be disabled when disableEditNutrPrefFormButton() is called', () => {
    component.ngOnInit();

    expect(component.disableEditNutrPrefFormButton()).toBe(false);
    component.toggleEditGeneralPreferences();
    expect(component.disableEditNutrPrefFormButton()).toBe(true);
    component.toggleEditGeneralPreferences();
    expect(component.disableEditNutrPrefFormButton()).toBe(false);
    component.toggleEditNutritionPreferences();
    expect(component.disableEditNutrPrefFormButton()).toBe(true);
    component.toggleEditNutritionPreferences();
    expect(component.disableEditNutrPrefFormButton()).toBe(false);
  });

});

function setup() {
  const firebaseManager = autoSpy(FirebaseGeneralService);
  const prefs = autoSpy(PreferenceService);
  const stateManager = autoSpy(StateManagerService);
  const profileControl = autoSpy(ProfileControlService);
  const dialogCreator = autoSpy(DialogCreatorService);
  const objectManager = autoSpy(ObjectStorageService);
  const permissions = autoSpy(TierPermissionsService);
  const iap = autoSpy(InAppPurchaseService);
  const builder = {
    firebaseManager,
    prefs,
    stateManager,
    profileControl,
    dialogCreator,
    objectManager,
    permissions,
    default() {
      return builder;
    },
    build() {
      return new PreferencesComponent(new FormBuilder(), firebaseManager, prefs, stateManager, profileControl, dialogCreator, iap, objectManager, permissions);
    }
  };

  return builder;
}
