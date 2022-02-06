import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { ProfileControlService as ProfileControlService } from 'src/app/services/general/profile-control.service';
import { ObjectStorageService } from 'src/app/services/general/object-storage.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { Subscription } from 'rxjs';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';

/**
 * Component that serves as a list of the user's preferences.
 * All preferences are contained in a preference category. For
 * example, in the first release, there were two categories of 
 * preferences. These were 'general' preferences and 'nutrition'
 * prefences. Each category of preferences has its own form on 
 * the page. When the page is loaded, the forms are populated with 
 * the data stored in the user's profile. The controls are initially 
 * disabled and just used as a display.
 * 
 * Each form has an 'edit preferences' button. If pressed, the button 
 * will mark the form associated with button as being edited and enable 
 * the form controls. Then the edit preferences button will be hidden 
 * and two buttons will be displayed. A 'confirm' and 'close' button,
 * if pressed, the 'confirm' button will submit the form and if the 
 * 'close' button is pressed, the form will be taken out of edit mode.
 * 
 * If the user has a free account or their subscription has entered a state of unpaid,
 * the forms will not be able to be edited and at the bottom of the form will be
 * a lock button that if pressed will open a dialog telling the user how to unlock
 * the preferences feature. 
 * 
 * Last edited by: Ryan Lefebvre 6/24/2020
 */
@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.css']
})
export class PreferencesComponent implements OnInit, OnDestroy {

  /**
   * Group of form controls for the user's general preferences. 
   * These include, number system, theme and whether or not the 
   * user should receive email notifications. These are all 
   * catagorical variables with default values. This means that 
   * no validation needs to be done on the controls.
   */
  generalPreferencesForm: FormGroup = null;

  /**
   * Form control key for number system. Potential 
   * values are metric and imperial. Variable is stored
   * as a boolean where true is imperial and false is metric.
   */
  FORM_CONTROL_NUMBER_SYSTEM: string = "numberSystem";

  /**
   * Form control key for user theme. Valid choices are hex 
   * values of colors. The valid options are listed in depth 
   * in the preference service.
   */
  FORM_CONTROL_THEME: string = "theme";

  /**
   * Form control key for whether or not the user is able 
   * to receive email notifications. Stored as a boolean
   * where true means yes send notifications and false means
   * don't send notifications
   */
  FORM_CONTROL_SEND_EMAIL: string = "sendEmail";

  /**
  * Group of form controls for the user's nutrition preferences. 
  * These include, sort mode, order mode, graph mode, surplus 
  * size and deficit size. These are all catagorical variables with
  * default values. This means that no validation needs to be done on the controls.
  */
  nutritionPreferencesForm: FormGroup = null;

  /**
   * Form control for how the list-view-grid component 
   * displays a log's list of entries. Possible values 
   * ascending and descending. If set to day, then the 
   * entries are all displayed in one big list. If set to 
   * week, then the log's entries are chunked into 7 day 
   * blocks.
   */
  FORM_CONTROL_SORT_MODE: string = "sortMode";

  /**
   * Form control for how the list-view-grid component 
   * displays a log's list of entries. Possible values 
   * are ascending and descending. If set to ascending then 
   * the earliest entry will be at the top of the list. 
   * If set to descending, the newest entry will be at the top of 
   * the list.
   */
  FORM_CONTROL_ODER_MODE: string = "orderMode";

  /**
   * Form control for what type of graph is displayed 
   * by default when the in depth log page is opened,
   * the type of graph set in the user's preferences will 
   * be displayed. Possible values are line and scatter.
   */
  FORM_CONTROL_GRAPH_MODE: string = "graphMode";

  /**
   * Form control for what type of surplus size the user
   * has set in their preferences. Possible values are
   * conservative, moderate and aggressive.
   */
  FORM_CONTROL_SURPLUS_SIZE: string = "surplusSize";

  /**
   * Form control for what type of deficit size the user
   * has set in their preferences. Possible values are
   * conservative, moderate and aggressive.
   */
  FORM_CONTROL_DEFICIT_SIZE: string = "deficitSize";

  /**
   * Reference to a subscription to the observable that 
   * emits which form is currently being edited on the 
   * user profile page.
   */
  myCurrentlyBeingEditedSubscription: Subscription = null;

  /**
   * Reference to a subscription to the observable that 
   * emits which form is currently being edited on the 
   * user profile page.
   */
  myCurrentUserSubscription: Subscription = null;

  /**
   * True if the nutrition preferences form spinner should
   * be shown indicating that the form is submitting.
   */
  showNutrSpinner: boolean = false;

  /**
   * True if the general preferences form spinner should
   * be shown indicating that the form is submitting.
   */
  showGeneralSpinner: boolean = false;

  /**
   * Spinner message shown when editing general preferences.
   */
  generalSpinnerMessage: string = " Updating general preferences";

  /**
   * Spinner message shown when editing nutrition preferences.
   */
  nutritionSpinnerMessage: string = " Updating nutrition preferences";

  /**
   * THIS WILL REMAIN FALSE UNTIL WE IMPLEMENT PROGRAMATICALLY EMAILING USERS.
   */
  showReceiveEmails: boolean = false;

  /**
   * @ignore
   */
  constructor
    (private fb: FormBuilder,
      public firebaseManager: FirebaseGeneralService,
      public prefs: PreferenceService,
      public stateManager: StateManagerService,
      public profileControl: ProfileControlService,
      public dialog: DialogCreatorService,
      public iap: InAppPurchaseService,
      public objectManager: ObjectStorageService,
      public permissions: TierPermissionsService) {
  }

  /**
   * @ignore
   */
  ngOnInit() {
    this.setFormsToCurrentuserState();
    this.currentUserSubscription();
    this.formBeingEditedSubscription();
  }

  /**
   * @ignore kill subscriptions.
   */
  ngOnDestroy(): void {
    this.myCurrentlyBeingEditedSubscription.unsubscribe();
  }

  /**
   * Resets the values of all form controls in all 
   * preference forms to the current values in the user's profile.
   */
  setFormsToCurrentuserState(): void {
    this.generateNewGeneralPreferencesForm();
    this.generateNutritionPreferencesForm();
  }

  /**
   * Handles logic for responding to state changes from the 
   * observable that emits which forms are being edited. 
   * Makes sure that every time a form is toggled in or out of 
   * edit mode that new forms are generated so that the controls
   * display the current user state.
   */
  formBeingEditedSubscription(): void {
    const context = this;
    this.myCurrentlyBeingEditedSubscription =
      this.profileControl.currentlyBeingEdited.subscribe(() => {
        context.setFormsToCurrentuserState();
      });
  }

  /**
   * Handles logic for responding to state changes of the current authenticated
   * user's user profile.Makes sure that every time the user's profile is updated
   * that new forms are generated so that the controls display the current user state.
   */
  currentUserSubscription(): void {
    const context = this;
    this.myCurrentUserSubscription =
      this.profileControl.currentlyBeingEdited.subscribe(() => {
        context.setFormsToCurrentuserState();
      });
  }

  /**
   * Returns true if the current user's account has sufficient 
   * permissions to edit their profile preferences. False 
   * otherwise. If this function returns true, the forms will be
   * locked immediately.
   */
  allowEditPreferences(): boolean {
    const WE_NO_LONGER_RESTRICT_THIS_SO_ALWAYS_RETURN_TRUE: boolean = true;
    return WE_NO_LONGER_RESTRICT_THIS_SO_ALWAYS_RETURN_TRUE;
  }

  /**
   * Turns on the spinner of whatever form is being edited indicating 
   * that the form is submitting. Then creates a new user profile with
   * the same demographic properties and preferences as the current user's
   * profile and makes a request to firebase to update the user's preferences. 
   * Once the request returns, the profile control is updated to no forms being edited
   * and the spinner of the form being edited is hidden. New state changes to the user 
   * and the form being marked as being edited will automatically trigger updates to 
   * the forms.
   */
  async updatePreferences(): Promise<void> {
    if (this.generalPreferencesBeingEdited()) {
      this.showGeneralSpinner = true;
    }
    else if (this.nutritionPreferencesBeingEdited()) {
      this.showNutrSpinner = true;
    }
    const userProfileWithNewPrefs: UserProfile = this.stateManager.getCurrentUser();
    userProfileWithNewPrefs.userPreferences = {
      general: {
        isImperial: this.generalPreferencesForm.controls[this.FORM_CONTROL_NUMBER_SYSTEM].value,
        currentTheme: this.generalPreferencesForm.controls[this.FORM_CONTROL_THEME].value,
        emailNotifications: this.generalPreferencesForm.controls[this.FORM_CONTROL_SEND_EMAIL].value
      },
      nutrition: {
        sortMode: this.nutritionPreferencesForm.controls[this.FORM_CONTROL_SORT_MODE].value,
        orderMode: this.nutritionPreferencesForm.controls[this.FORM_CONTROL_ODER_MODE].value,
        graphMode: this.nutritionPreferencesForm.controls[this.FORM_CONTROL_GRAPH_MODE].value,
        surplus: this.nutritionPreferencesForm.controls[this.FORM_CONTROL_SURPLUS_SIZE].value,
        deficit: this.nutritionPreferencesForm.controls[this.FORM_CONTROL_DEFICIT_SIZE].value,
      }
    };
    this.dialog.openPreferenceStateChangeDialog(async () => this.firebaseManager.editUserPreferences(userProfileWithNewPrefs));
    this.profileControl.doneEditing();
    this.showNutrSpinner = false;
    this.showGeneralSpinner = false;
  }

  /**
   * Generates a new general preferences form and fills the values of the form controls 
   * with the state of the current authenticated user's profile.
   */
  generateNewGeneralPreferencesForm(): void {
    this.generalPreferencesForm = this.fb.group({
      [this.FORM_CONTROL_NUMBER_SYSTEM]: [this.stateManager.getCurrentUser().userPreferences.general.isImperial],
      [this.FORM_CONTROL_THEME]: [this.stateManager.getCurrentUser().userPreferences.general.currentTheme],
      [this.FORM_CONTROL_SEND_EMAIL]: [this.stateManager.getCurrentUser().userPreferences.general.emailNotifications]
    });
  }

  /**
   * Returns true if the general prefences form is being edited. False otherwise.
   */
  generalPreferencesBeingEdited(): boolean {
    return (this.profileControl.currentEditValue() == this.profileControl.EDITING_GENERAL_PREFS);
  }

  /**
   * Click handler for the general preferences form, edit preferences and close button.
   * If pressed will change the form state to the inverse of what it is currently.
   */
  toggleEditGeneralPreferences(): void {
    if (!this.generalPreferencesBeingEdited()) {
      this.profileControl.beginEditing(this.profileControl.EDITING_GENERAL_PREFS);
    }
    else {
      this.profileControl.doneEditing();
    }
  }

  /**
   * Generates a new nutrition preferences form and fills the values of the form controls 
   * with the state of the current authenticated user's profile.
   */
  generateNutritionPreferencesForm() {
    this.nutritionPreferencesForm = this.fb.group({
      [this.FORM_CONTROL_SORT_MODE]: [this.stateManager.getCurrentUser().userPreferences.nutrition.sortMode],
      [this.FORM_CONTROL_ODER_MODE]: [this.stateManager.getCurrentUser().userPreferences.nutrition.orderMode],
      [this.FORM_CONTROL_GRAPH_MODE]: [this.stateManager.getCurrentUser().userPreferences.nutrition.graphMode],
      [this.FORM_CONTROL_SURPLUS_SIZE]: [this.stateManager.getCurrentUser().userPreferences.nutrition.surplus],
      [this.FORM_CONTROL_DEFICIT_SIZE]: [this.stateManager.getCurrentUser().userPreferences.nutrition.deficit],
    });
  }

  /**
   * Returns true if the button that enables editing the general preferences 
   * form should be shown. This is true if the general prefences form is not 
   * in edit mode and the user's tier has preference editing permissions.
   */
  showEditGeneralPrefFormButton(): boolean {
    const canEditPrefs: boolean = this.allowEditPreferences();
    const generalPrefsNotBeingEdited: boolean = !this.generalPreferencesBeingEdited();
    const showEditButton: boolean = canEditPrefs && generalPrefsNotBeingEdited;
    return showEditButton;
  }

  /**
   * Returns true if the button that enables editing the general preferences 
   * form should be disabled. This is true if another form on the profile page
   * is being edited 
   */
  disableEditGeneralPrefFormButton(): boolean {
    const someOtherFormBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.NOT_EDITING);
    return someOtherFormBeingEdited;
  }

  /**
   * Returns true if the nutrition prefences form is being edited. False otherwise.
  */
  nutritionPreferencesBeingEdited(): boolean {
    return (this.profileControl.currentEditValue() == this.profileControl.EDITING_NUTR_PREFS);
  }

  /**
   * Click handler for the nutrition preferences form, edit preferences and close button.
   * If pressed will change the form state to the inverse of what it is currently.
   */
  toggleEditNutritionPreferences(): void {
    if (!this.nutritionPreferencesBeingEdited()) {
      this.profileControl.beginEditing(this.profileControl.EDITING_NUTR_PREFS);
    }
    else {
      this.profileControl.doneEditing();
    }
  }

  /**
   * Returns true if the button that enables editing the nutrition preferences 
   * form should be shown. This is true if the nutrition prefences form is not 
   * in edit mode and the user's tier has preference editing permissions.
   */
  showEditNutrPrefFormButton(): boolean {
    const canEditPrefs: boolean = this.allowEditPreferences();
    const nutrPrefsNotBeingEdited: boolean = !this.nutritionPreferencesBeingEdited();
    const showEditButton: boolean = canEditPrefs && nutrPrefsNotBeingEdited;
    return showEditButton;
  }

  /**
   * Returns true if the button that enables editing the nutrition preferences 
   * form should be disabled. This is true if another form on the profile page
   * is being edited.
   */
  disableEditNutrPrefFormButton(): boolean {
    const someOtherFormBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.NOT_EDITING);
    return someOtherFormBeingEdited;
  }

}
