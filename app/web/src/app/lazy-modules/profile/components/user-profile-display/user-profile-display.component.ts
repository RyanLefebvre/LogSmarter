import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { StateManagerService } from '../../../../services/general/state-manager.service';
import { ConversionService } from '../../../../services/general/conversion.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { ValidateUsername } from '../../../../shared-validators/username-validator';
import { ValidateImperialWeight } from '../../../../shared-validators/imperial-weight-validator'
import { ValidateAge } from 'src/app/shared-validators/age-validator';
import { ValidateMetricHeight } from 'src/app/shared-validators/metric-height-validator';
import { ValidateFootHeight } from 'src/app/shared-validators/height-foot-validator';
import { ValidateInchesHeight } from 'src/app/shared-validators/height-inches-validator';
import { ValidateMetricWeight } from 'src/app/shared-validators/metric-weight-validator';
import { ValidateEmail } from 'src/app/shared-validators/email-validator';
import { WeightPipe } from 'src/app/shared-pipes/weight-pipe';
import { HeightPipe } from 'src/app/shared-pipes/height-pipe';
import { ProfileControlService } from 'src/app/services/general/profile-control.service';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';
import { Subscription } from 'rxjs';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { ProfileService } from 'src/app/services/general/profile.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { ConstantsService } from 'src/app/services/general/constants.service';
import { ValidateCalories } from 'src/app/shared-validators/calorie-validator';
import { InAppPurchaseService } from 'src/app/services/general/in-app-purchase.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * This component serves as the page that displays the user's profile 
 * information. It contains forms for editing profile data and updating
 * account preferences. It also contains the account component which will
 * redirect the user to a beanie session to update their subscription information.
 * The forms that update user preferences are in a sub component. Their functional 
 * requirements are described in that component.
 * 
 * Underneath the form for editing profile information are up to 3 buttons. An 
 * 'edit profile' button, 'reset password' button and a 'sign out' button. Ifthe  profile 
 * form is being edited, then two buttons will be displayed, a 'confirmation' button and
 * a 'close' button. 
 * 
 * The 'edit profile' button puts the profile edit form into edit mode and 
 * allows user's to update their height, age, weight, gender and activity level
 * through the profile edit form. This button is disabled if any other forms on the profile
 * page are being edited. This button is not displayed if the user has a free tier account
 * where the trial has ended, the user has a premium account but their subscription is not
 * active or if the profile form is being edited.
 * 
 * The 'reset password' button is only displayed if  the user has a free account with
 * time left in the free trial, the profile form is not being edited or the user has an
 * active subscription. If a form on the page is being edited, this button is disabled.
 * If the button is pressed, it will open the password reset dialog.
 * 
 * The 'sign out' button is displayed as long the user has a free account with time left in 
 * the free trial or they have an active subscription and the profile form is not being 
 * edited.This button is disabled if any other forms on the page are being edited. If pressed,
 * this button will navigate to the home page and set the auth state of the application to
 * unauthenticated.
 * 
 * The 'confirmation' button is only displayed if the profile form is  being edited. 
 * If pressed, the confirmation button will submit the values entered in the profile edit
 * form. When pressed, a spinner will be shown and hide all buttons in the profile edit
 * form. When the profile edit request returns, the spinner is hidden, the profile form is marked
 * as no longer being in edit mode and the result of the profile edit request is displayed.
 * Lastly, this button is disabled if any of the profile form controls are invalid.
 * 
 * The 'close' button is displayed if the profile form is being edited. If pressed,
 * the button will mark the profile form as not being edited and reset its state.
 * 
 * If the user's account is past the free limit or it is a premium account with a status that
 * is not active, a button will be displayed with a lock. If the user clicks on the button, 
 * they will be prompted by either the account warning dialog or the unpaid warning dialog.
 *  
 * Lastly, this component contains a 'delete account' button at the bottom of the page.
 * This button is only displayed if the user has a premium account and their subscription 
 * is active. If pressed, the user will be prompted with the confirmation dialog to make 
 * sure they want to proceed with account deletion.
 * 
 * Last edited by: Ryan Lefebvre 7/29/2020
 */
@Component({
  selector: 'app-user-profile-display',
  templateUrl: './user-profile-display.component.html',
  styleUrls: ['./user-profile-display.component.css'],
})
export class UserProfileDisplayComponent implements OnInit, OnDestroy {

  /**
   * Group of form controls that make up the profile edit form. Contains controls to 
   * edit username, age, activity level, weight, height, gender and email. All controls in 
   * the form are pre-filled with the current user's profile information when this 
   * component is loaded. If this form is not being edited, then all controls are disabled and 
   * just used to display the user's profile information. If this form is being edited, the 
   * value of the form controls can be edited. Functional requirements for the individual
   * form controls are listed below.
   * 
   * Username must be a valid string less than or equal to 25 characters. A null
   * value means that no username was provided and will default to an empty string.
   * 
   * Activity level is a numeric representation of a user's physical activity. It is
   * split into 4 categories: sedentary, lightly active, active and very active.
   * Activity level will be equal to one of those four categories or null. If null,
   * no activity level was reported.
   * 
   * Height is stored in the user profile as a number of inches, but user's do not 
   * enter their height in this format. Instead the form controls displayed are based 
   * upon the users number system prefence. If the number system is set to 'imperial' then
   * two controls are displayed. One for feet and one for inches. For feet, the value must 
   * be an integer between 0 and 9, for inches the value must be an integer between 0 and 11.
   * If the number system is 'metric', then the only height control displayed is centimeters.
   * The value for centimeters must be between 0 and 302.3
   *    
   * Weight is stored in the user profile as a number of lbs, but users do not always enter
   * their weight in this format. If the number system is imperial, a form control for the 
   * number of lbs will be displayed. The value must be a number between 0 and 99997.3.
   * If the number system is metric, then a form control for a number of kg's will be displayed.
   * This value must be a positive number between 0 and  45358.0123. These awkward decimal numbers 
   * were chosen because they will always round down and prevent an innacurate floating point 
   * calculation from causing the number to round up when converting between imperial and metric.
   * it is unlikely that a user would switch their number sytem and have ridiculous weights entered,
   * but if they did and the numbers rounded up, they would violate the imposed constraints on 
   * weight.
   * 
   * Gender can be one of three values, null, male or female. If the form controls value is 
   * true, then the user is male, if the value is false, then the user is female, if the 
   * value is null, then the user's gender is unknown.
   * 
   * Age is stored in the user profile as a number of years. It must be an integer between 
   * 0 and 999. If age is null, then the user's age is unknown.
   * 
   * Email constraints are generally handled by firebase, but some basic checks are done.
   * The form prevents the email from being null, greater than 256 characters, being an 
   * empty string, not including an @ symbol or containing whitespace. Lastly, the email 
   * must be unique, meaning it can't be associated with another LogSmarter user. This 
   * check is done by firebase.
   * 
   */
  profileEditForm: FormGroup = this.generateNewProfileEditForm();

  /**
   * Key for username form control.
   */
  FORM_CONTROL_USERNAME: string = "username";

  /**
  * Key for activity level form control.
  */
  FORM_CONTROL_ACTIVITY_LEVEL: string = "activityLevel";

  /**
  * Key for metric weight form control.
  */
  FORM_CONTROL_WEIGHT_KG: string = "weight_kg";

  /**
  * Key for imperial weight form control.
  */
  FORM_CONTROL_WEIGHT_LB: string = "weight_lbs";

  /**
  * Key for metric height form control.
  */
  FORM_CONTROL_HEIGHT_CM: string = "height_cm";

  /**
  * Key for imperial height form control (feet).
  */
  FORM_CONTROL_HEIGHT_FEET: string = "height_feet";

  /**
  * Key for imperial height form control (inches).
  */
  FORM_CONTROL_HEIGHT_INCHES: string = "height_inches";

  /**
  * Key for gender form control.
  */
  FORM_CONTROL_GENDER: string = "isMale";

  /**
  * Key for age form control.
  */
  FORM_CONTROL_AGE: string = "age_years";

  /**
  * Key for email form control.
  */
  FORM_CONTROL_EMAIL: string = "email";

  /**
  * Key for TDEE form control.
  */
  FORM_CONTROL_TDEE: string = "tdee";

  /**
  * Key for display TDEE form control.
  */
  FORM_CONTROL_DISPLAY_TDEE: string = "displayTDEE";

  /**
  * Key for display weight form control.
  */
  FORM_CONTROL_DISPLAY_WEIGHT: string = "display_weight";

  /**
  * Key for display height form control.
  */
  FORM_CONTROL_DISPLAY_HEIGHT: string = "display_height";

  /**
   * Key for display age form control.
   */
  FORM_CONTROL_DISPLAY_AGE: string = "display_age";

  /**
   * Key for display gender form control
   */
  FORM_CONTROL_DISPLAY_GENDER: string = "display_gender";

  /**
   * Key for display activity level form control
   */
  FORM_CONTROL_DISPLAY_ACTIVITY_LEVEL: string = "display_activity_level"

  /**
   * Key for display activity level form control
   */
  FORM_CONTROL_DISPLAY_EMAIL: string = "display_email"

  /**
   * True if the spinner indicating a loading operation should be displayed. False otherwise.
   */
  submitting: boolean = false;

  /**
   * Reference to subscription to current users state change observable.
   */
  myCurrentUserSubscription: Subscription = null;

  /**
   * Flag for displaying user email change success message. Informs 
   * the user that they must validate their new email before they 
   * authenticate next time.
   */
  showEmailChangeSuccess: boolean = false;

  /**
  * Flag for displaying user email change failure message. Informs 
  * the user that the email they entered must already be in use or 
  * that the request failed.
  */
  showEmailChangeFailure: boolean = false;

  /**
   * Error code for an invalid email being sent to firebase when trying to change a user's email.
   */
  INVALID_EMAIL_ERROR: string = "auth/invalid-email ";

  /**
   * Message displayed when an invalid email error is thrown.
   */
  INVALID_EMAIL_MESSAGE: string = "New email provided was invalid. ";

  /**
  * Error code for an email in use being sent to firebase when trying to change a user's email.
  */
  EMAIL_IN_USE_ERROR: string = "auth/email-already-in-use";

  /**
  * Message displayed when an email in use error is thrown.
  */
  EMAIL_IN_USE_MESSAGE: string = "Email provided is already in use. ";

  /**
  * Error code for needing to reauthneticate when trying to change a user's email.
  */
  NEEDS_AUTH_ERROR: string = "auth/requires-recent-login";

  /**
   * Message passed into reauthentication dialog when the user must re-authenticate.
   */
  NEEDS_AUTH_MESSAGE: string = "Changing your email";

  /**
  *  Informs user that other profile edits will persist even if an email error occurs.
  */
  OTHER_EDITS_VALID: string = "Other profile edits will persist";

  /**
   * Message displayed for a succesful email change.
   */
  EMAIL_CHANGE_SUC_MESSAGE: string = "Email has Changed. Must validate new email before next authentication.";

  /**
   * Email fail message is dynamic. This is a reference to the default value.
   */
  DEFAULT_EMAIL_FAIL_MESSAGE: string = "Email change has failed. ";

  /**
   * Message displayed for a failed email change.
   */
  EMAIL_CHANGE_FAIL_MESSAGE: string = (this.DEFAULT_EMAIL_FAIL_MESSAGE + this.OTHER_EDITS_VALID);

  /**
   * Message displayed under spinner to indicate a loading operation.
   */
  spinnerMessage: string = "Updating profile information. This may take a moment.";

  /**
   * @ignore
   */
  constructor(
    public stateManager: StateManagerService,
    public auth: AuthenticationService,
    public fb: FormBuilder,
    public conversionManager: ConversionService,
    public dialog: DialogCreatorService,
    public preferenceManager: PreferenceService,
    public weightPipe: WeightPipe,
    public heightPipe: HeightPipe,
    public profileControl: ProfileControlService,
    public authManager: AuthenticationService,
    public permissions: TierPermissionsService,
    public firebaseGeneral: FirebaseGeneralService,
    public snackBar: SnackBarService,
    public prof: ProfileService,
    public generalConstants: ConstantsService,
    public iap: InAppPurchaseService,
    public cdr: ChangeDetectorRef,
    public environmentService: EnvironmentService) {
    this.currentUserSubscription();
  }

  /**
   * @ignore
   */
  ngOnInit() { }

  /**
   * @ignore Kill subscriptions
   */
  ngOnDestroy() {
    if (this.myCurrentUserSubscription) {
      this.myCurrentUserSubscription.unsubscribe();
    }
  }

  /**
   * Handles logic for state changes related to the user's profile.
   * If a new user profile state is emitted. The profile edit form is 
   * force closed and the controls are set to the new user profiles 
   * values by generating a new profile edit form.
   */
  currentUserSubscription(): void {
    const context = this;
    this.myCurrentUserSubscription = this.stateManager.currentUserProfile.subscribe(user => {
      const userIsNotNull: boolean = user != null;
      if (userIsNotNull) {
        context.profileEditForm = context.generateNewProfileEditForm();
      }
    });
  }

  /**
   * Returns true if the edit profile, sign out and reset password buttons should be displayed. 
   * False otherwise. Edit profile should be shown if the user profile form 
   * is not being edited. It should be hidden if the user has a free account 
   * that is past the free limit or a premium account that is unpaid.
   */
  showEditResetButton(): boolean {
    const profileNotBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.EDITING_PROFILE);
    const shouldShow: boolean = profileNotBeingEdited;
    return shouldShow;
  }

  /**
   * Returns true if the sign out button should be displayed. 
   * False otherwise. Should be shown if the user profile form 
   * is not being edited. 
   */
  showSignOutButton(): boolean {
    const profileNotBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.EDITING_PROFILE);
    const shouldShow: boolean = profileNotBeingEdited;
    return shouldShow;
  }

  /**
   * Returns true if the edit profile, sign out and reset password buttons should be disabled. 
   * This is true if a form besides the profile form is being edited.
   */
  disableEditResetAndSignOutButton(): boolean {
    const someFormBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.NOT_EDITING);
    const currentEditValueNotProfile: boolean = (this.profileControl.currentEditValue() != this.profileControl.EDITING_PROFILE);
    const shouldBeDisabled: boolean = someFormBeingEdited && currentEditValueNotProfile;
    return shouldBeDisabled;
  }

  /**
   * Returns true if the current value of the being edited 
   * observable indicates that the user profile form is being edited.
   */
  userProfileFormBeingEdited(): boolean {
    return (this.profileControl.currentEditValue() == this.profileControl.EDITING_PROFILE);
  }

  /**
   * Returns true if the confirmation and close buttons should be displayed. 
   * False otherwise. These buttons should be displayed if the profile form 
   * is being edited and it is not in the middle of a submission, i.e. the 
   * spinner is displayed.
   */
  showConfirmationAndCloseButton(): boolean {
    const submittingForm: boolean = this.submitting;
    const editingProfileForm: boolean = this.userProfileFormBeingEdited()
    const showConfirmationAndClose: boolean = !submittingForm && editingProfileForm;
    return showConfirmationAndClose;
  }

  /**
   * Returns true if the delete button should be shown. False otherwise.
   * This button should be shown if the user has an active subscription.
   */
  showDeleteButton(): boolean {
    return this.permissions.userHasActiveSubscription();
  }

  /**
   * Returns true is the delete button should be disabled. False 
   * otherwise. This button should be disabled if any form is being 
   * edited.
   */
  disableDeleteButton(): boolean {
    const someFormBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.NOT_EDITING);
    return someFormBeingEdited;
  }

  /**
   * True if the profile edit form is not currently being edited or is 
   * being submitted. False otherwise.
   */
  disableUserProfileFormControls(): boolean {
    const submitting: boolean = this.submitting;
    const profileFormNotBeingEdited: boolean = (this.profileControl.currentEditValue() != this.profileControl.EDITING_PROFILE);
    const shouldBeDisabled: boolean = submitting || profileFormNotBeingEdited;
    return shouldBeDisabled;
  }

  /**
   * Helper function for opening password reset dialog. Automatically opens
   * the dialog with the current user's email.
   */
  openPasswordReset(): void {
    const authenticatedUserEmail: string = this.authManager.afAuth.auth.currentUser.email;
    this.dialog.openPasswordResetDialog(authenticatedUserEmail);
  }

  /**
   * Click handler for 'edit profile' button and close button. If the profile 
   * edit form is not being edited, this function will switch the form into 
   * edit mode. If the profile form is being edited, this function will switch 
   * the form into display mode. After any toggle of the forms edit status, the window
   * will scroll to the top to prevent opening the form at the bottom which 
   * looks awkward.
   */
  toggleProfileFormEdit(): void {
    if (!this.userProfileFormBeingEdited()) {
      this.profileControl.beginEditing(this.profileControl.EDITING_PROFILE);
    }
    else {
      this.profileControl.doneEditing();
      this.profileEditForm = this.generateNewProfileEditForm();
    }
    window.scrollTo(0, 0);
  }

  /**
   * Handles submission of the user profile edit form. 
   * Turns on the spinner to indicate a  request is being made
   * and to lock down the profile edit form. Then waits for 
   * a request to update the users email if it changed. Regardless
   * of whether the user's email was changed and if the change request 
   * complete successfully, the state of the form controls are copied 
   * into the properties of a user pofile. Then a request is made to 
   * firebase to edit the use profile. The user's profile has to be edited 
   * on the backend to avoid any read only data from being updated. Once the 
   * request to edit the user's profile returns. The form is marked as not being 
   * edited and the spinner is hidden. If the user's email did change, then they are signed 
   * out to make sure that their new email gets verified.
   */
  async handleSubmit(): Promise<void> {
    this.submitting = true;
    const userDetailsToCopy: UserProfile = this.stateManager.getCurrentUser();
    if (this.profileEditForm.controls[this.FORM_CONTROL_USERNAME].value) {
      userDetailsToCopy.username = this.profileEditForm.controls[this.FORM_CONTROL_USERNAME].value.trim();
    }
    userDetailsToCopy.isMale = this.profileEditForm.get(this.FORM_CONTROL_GENDER).value;
    if (this.profileEditForm.get(this.FORM_CONTROL_AGE).value) {
      userDetailsToCopy.age = Math.round(this.profileEditForm.get(this.FORM_CONTROL_AGE).value);
    }
    userDetailsToCopy.activityLevel = this.profileEditForm.get(this.FORM_CONTROL_ACTIVITY_LEVEL).value;
    if (!(this.stateManager.getCurrentUser().userPreferences.general.isImperial)) {
      userDetailsToCopy.weight_lbs = this.conversionManager.convertKgToLbs(
        this.profileEditForm.get(this.FORM_CONTROL_WEIGHT_KG).value);
      userDetailsToCopy.height_inches = this.conversionManager.convertCentimetersToInches(
        this.profileEditForm.get(this.FORM_CONTROL_HEIGHT_CM).value);
    }
    else {
      userDetailsToCopy.weight_lbs = this.profileEditForm.get(this.FORM_CONTROL_WEIGHT_LB).value;
      userDetailsToCopy.height_inches = this.conversionManager.convertFeetAndInchesToInches(
        this.profileEditForm.get([this.FORM_CONTROL_HEIGHT_FEET]).value
        , this.profileEditForm.get([this.FORM_CONTROL_HEIGHT_INCHES]).value);
    }
    userDetailsToCopy.userPreferences = this.stateManager.getCurrentUser().userPreferences;
    userDetailsToCopy.mainNutrLogId = this.stateManager.getCurrentUser().mainNutrLogId;
    userDetailsToCopy.estimatedTDEE = this.stateManager.getCurrentUser().estimatedTDEE;
    let formTDEE: number = this.profileEditForm.get([this.FORM_CONTROL_TDEE]).value;
    if (formTDEE) {
      formTDEE = Math.round(formTDEE);
    }
    const userManuallySuppliedMaintenance: boolean = (userDetailsToCopy.estimatedTDEE != formTDEE && formTDEE != null);
    if (userManuallySuppliedMaintenance) {
      userDetailsToCopy.estimatedTDEE = formTDEE;
    }
    let emailChanged: boolean;
    await this.dialog.openProfileStateChangeDialog(async () => {
      emailChanged = await this.updateEmailIfChanged();
      this.firebaseGeneral.editUserProfile(userDetailsToCopy);
    });
    this.profileControl.doneEditing();
    if (emailChanged) {
      this.auth.logOutGoVerify(this.auth.VERIFY_EMAIL_MESSAGE);
    }
    this.submitting = false;
    this.cdr.detectChanges();
  }

  /**
   * Attempts to update the user's email through firebase, if the value entered 
   * in the profile edit form for the email form control is different than the 
   * email that is linked to the user's firebase UID. If the values are different
   * a request is made through firebase to change the users email and to send 
   * them an email change verification email. If all goes as planned, then a 
   * success message is displayed to the user about their email change. If any
   * error occurs during this process, the error will be caught and a email 
   * change failure message will be displayed. If the email did not change, 
   * then nothing happens.
   * 
   * Returns true if the email changed, false otherwise.
   */
  async updateEmailIfChanged(): Promise<boolean> {
    if (!this.profileEditForm.controls[this.FORM_CONTROL_EMAIL]) {
      return false;
    } else {
      const newEmail: string = this.profileEditForm.controls[this.FORM_CONTROL_EMAIL].value.trim();
      const oldEmail: string = this.authManager.afAuth.auth.currentUser.email;
      let emailChanged: boolean = (newEmail != oldEmail);
      if (emailChanged) {
        try {
          await this.authManager.tryToUpdateEmail(newEmail);
          await this.authManager.afAuth.auth.currentUser.sendEmailVerification();
          this.showEmailChangeSuccess = true;
        }
        catch (error) {
          const errorHasCode: boolean = (error && error.code);
          const needToReAuthenticate: boolean = errorHasCode && (error.code == this.NEEDS_AUTH_ERROR);
          if (needToReAuthenticate) {
            const successfulReAuth: boolean = await this.dialog.openReauthDialog(this.NEEDS_AUTH_MESSAGE);
            if (successfulReAuth) {
              return this.updateEmailIfChanged();
            }
          }
          if (errorHasCode) {
            if (error.code == this.INVALID_EMAIL_ERROR) {
              this.EMAIL_CHANGE_FAIL_MESSAGE = this.INVALID_EMAIL_MESSAGE;
            }
            else if (error.code == this.EMAIL_IN_USE_ERROR) {
              this.EMAIL_CHANGE_FAIL_MESSAGE = this.EMAIL_IN_USE_MESSAGE;
            }
            else {
              this.EMAIL_CHANGE_FAIL_MESSAGE = this.DEFAULT_EMAIL_FAIL_MESSAGE;
            }
          }
          else {
            this.EMAIL_CHANGE_FAIL_MESSAGE = this.DEFAULT_EMAIL_FAIL_MESSAGE;
          }
          this.EMAIL_CHANGE_FAIL_MESSAGE += this.OTHER_EDITS_VALID;
          this.showEmailChangeFailure = true;
          this.profileEditForm.controls[this.FORM_CONTROL_EMAIL].setValue(oldEmail);
          emailChanged = false;
        }
      }
      return emailChanged;
    }
  }

  /**
   * Click handler for delete account button. Opens the reauthnetication dialog. 
   * If successful, will open the delete profile dialog which will force the user to confirm 
   * they want to delete their account.
   */
  async handleDelete(): Promise<void> {
    const DELETE_PROF_OPERATION_MSG: string = "Deleting your profile";
    const successfulAuthentication = await this.dialog.openReauthDialog(DELETE_PROF_OPERATION_MSG);
    if (successfulAuthentication) {
      this.dialog.openDeleteProfileDialog();
    }
  }

  /**
   * Generates a new profile edit form that matches the constraints explained by the 
   * profileEditForm variable. Grabs the state of the current user from the state 
   * manager to pre-fill the controls with the values stored in the current user's
   * user profile. Two controls in the form worth mentioning that are not mentioned
   * anywhere else are the display height and weight controls. These are necessary 
   * because the format of how heights and weights are displayed is different when 
   * the profile edit form is being edited and when it is not. If the form is not 
   * being edited, the heights and weights are altered through a pipe to format them 
   * for display. This appends units to the value for weight and height.
   */
  generateNewProfileEditForm(): FormGroup {
    const context = this;
    let footHeightValue: number = null;
    let inchesHeightValue: number = null;
    let cmHeightValue: number = null;
    let weightLbValue: number = null;
    let weightKgValue: number = null;
    if (this.stateManager.getCurrentUser().height_inches) {
      footHeightValue = this.conversionManager.convertInchesToFeet(this.stateManager.getCurrentUser().height_inches);
      inchesHeightValue = this.conversionManager.convertTotalInchesToRemainderInches(this.stateManager.getCurrentUser().height_inches);
      cmHeightValue = this.conversionManager.convertInchesToCentimeters(this.stateManager.getCurrentUser().height_inches);
    }
    if (this.stateManager.getCurrentUser().weight_lbs) {
      weightKgValue = this.conversionManager.convertLbsToKg(this.stateManager.getCurrentUser().weight_lbs);
      weightLbValue = this.stateManager.getCurrentUser().weight_lbs;
    }
    return this.fb.group({
      [context.FORM_CONTROL_USERNAME]: [
        {
          value: this.stateManager.getCurrentUser().username,
          disabled: !this.userProfileFormBeingEdited()
        },
        ValidateUsername],
      [context.FORM_CONTROL_ACTIVITY_LEVEL]: [
        {
          value: this.stateManager.getCurrentUser().activityLevel,
          disabled: !this.userProfileFormBeingEdited()
        }],
      [context.FORM_CONTROL_WEIGHT_KG]: [
        {
          value: weightKgValue,
          disabled: !this.userProfileFormBeingEdited()
        }, ValidateMetricWeight],
      [context.FORM_CONTROL_HEIGHT_CM]: [
        {
          value: cmHeightValue,
          disabled: !this.userProfileFormBeingEdited()
        }, ValidateMetricHeight],
      [context.FORM_CONTROL_HEIGHT_FEET]: [
        {
          value: footHeightValue,
          disabled: !this.userProfileFormBeingEdited()
        }, ValidateFootHeight],
      [context.FORM_CONTROL_HEIGHT_INCHES]: [
        {
          value: inchesHeightValue,
          disabled: !this.userProfileFormBeingEdited()
        }, ValidateInchesHeight],
      [context.FORM_CONTROL_WEIGHT_LB]: [{
        value: weightLbValue,
        disabled: !this.userProfileFormBeingEdited()
      }, ValidateImperialWeight],
      [context.FORM_CONTROL_GENDER]: [{
        value: this.stateManager.getCurrentUser().isMale,
        disabled: !this.userProfileFormBeingEdited()
      }],
      [context.FORM_CONTROL_AGE]: [{
        value: this.stateManager.getCurrentUser().age,
        disabled: !this.userProfileFormBeingEdited()
      }, ValidateAge],
      [context.FORM_CONTROL_TDEE]: [{
        value: this.stateManager.getCurrentUser().estimatedTDEE,
        disabled: !this.userProfileFormBeingEdited()
      }, ValidateCalories],
      [context.FORM_CONTROL_EMAIL]: [{
        value: this.authManager.afAuth.auth.currentUser.email,
        disabled: !this.userProfileFormBeingEdited()
      }, [Validators.required, ValidateEmail]],
      [context.FORM_CONTROL_DISPLAY_WEIGHT]: [{
        value: this.weightPipe.transform(this.stateManager.getCurrentUser().weight_lbs),
        disabled: true
      }],
      [context.FORM_CONTROL_DISPLAY_HEIGHT]: [{
        value: (this.stateManager.getCurrentUser().height_inches === null || this.stateManager.getCurrentUser().height_inches === 0) ? '-' : this.heightPipe.transform(this.stateManager.getCurrentUser().height_inches),
        disabled: true
      }],
      [context.FORM_CONTROL_DISPLAY_AGE]: [{
        value: this.valueOrLine(this.stateManager.getCurrentUser().age),
        disabled: true
      }],
      [context.FORM_CONTROL_DISPLAY_EMAIL]: [{
        value: this.valueOrLine(this.stateManager.getCurrentUser().emailAddr),
        disabled: true
      }],
      [context.FORM_CONTROL_DISPLAY_GENDER]: [{
        value: this.stateManager.getCurrentUser().isMale === null ? "-" : this.stateManager.getCurrentUser().isMale ? "Male" : "Female",
        disabled: true
      }],
      [context.FORM_CONTROL_DISPLAY_ACTIVITY_LEVEL]: [{
        value: this.stateManager.getCurrentUser().activityLevel == null ? "-" : this.prof.activityLevelDisplayName(this.stateManager.getCurrentUser().activityLevel),
        disabled: true
      }],
      [context.FORM_CONTROL_DISPLAY_TDEE]: [{
        value: this.stateManager.getCurrentUser().estimatedTDEE == null ? "-" : this.stateManager.getCurrentUser().estimatedTDEE + " kcal",
        disabled: true
      }]
    });
  }

  /**
   * @ignore
   */
  private valueOrLine(value: any): string {
    return value === null ? "-" : value;
  }

}
