import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { UserProfile } from 'src/app/model-classes/general/user-profile';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversionService } from 'src/app/services/general/conversion.service';
import { StateManagerService } from 'src/app/services/general/state-manager.service';
import { PreferenceService } from 'src/app/services/general/preference.service';
import { ValidateMetricHeight } from 'src/app/shared-validators/metric-height-validator';
import { ValidateImperialWeight } from 'src/app/shared-validators/imperial-weight-validator';
import { ValidateInchesHeight } from 'src/app/shared-validators/height-inches-validator';
import { ValidateFootHeight } from 'src/app/shared-validators/height-foot-validator';
import { ValidateMetricWeight } from 'src/app/shared-validators/metric-weight-validator';
import { ValidateUsername } from 'src/app/shared-validators/username-validator';
import { ValidateAge } from 'src/app/shared-validators/age-validator';
import { ValidatePassword } from 'src/app/shared-validators/password-validator';
import { ValidateEmail } from 'src/app/shared-validators/email-validator';
import { DialogCreatorService } from 'src/app/shared-modules/dialogs/dialog-creator.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { ProfileService } from 'src/app/services/general/profile.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { FirebaseGeneralService } from 'src/app/services/firebase/firebase-general.service';
import { EnvironmentService } from 'src/app/services/general/environment.service';

/**
 * This component is the register form for LogSmarter users. It is essentially a 
 * wrapper around a form with controls for the user's username, email, password 
 * and all demographic information needed for their user profile: Age, height, weight
 * gender. Two additional form controls exist, one for number system and another that 
 * asserts the user agrees to the LogSmarter terms and conditions before they sign up.
 * If the value of the number system form control is changed, the displayed controls
 * for height and weight will change to appropriate controls for that number system.
 * 
 * The register button is disabled as long as the form is invalid. The requirements 
 * for what makes a control invalid are described in detail within the files of the 
 * validators that are applied to those controls.
 * 
 * While the majority of the controls have validators that can make the control invalid,
 * a subset of the controls are required and the register button will remain disabled until 
 * all have a valid value. The required controls are username, password, password confirmation,
 * email and agreeing to the terms.
 * 
 * If no form controls are invalid and the required form contros have values, the register
 * form can be submitted. On a successful submission, the user will be redirected to the 
 * verify email page. On an unsuccessful submission, an error will be returned from 
 * firebase and displayed to the user.
 * 
 * Last edited by: Ryan Lefebvre 9/30/2020
 */
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpComponent implements OnInit, OnDestroy {

  /**
   * Key for username form control.
   */
  FORM_CONTROL_USERNAME: string = "username";

  /**
   * Key for password form control.
   */
  FORM_CONTROL_PASSWORD: string = "password";

  /**
   * Key for password form control.
   */
  FORM_CONTROL_PASSWORD_CONFIRMATION: string = "passwordConfirmation";

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
   * Form control key for number system. Potential 
   * values are metric and imperial. Variable is stored
   * as a boolean where true is imperial and false is metric.
   */
  FORM_CONTROL_NUMBER_SYSTEM: string = "numberSystem";

  /**
  * Key for terms agreement form control.
  */
  FORM_CONTROL_AGREE_TO_TERMS: string = "agreeToTerms";

  /**
  * Key for promo code form control.
  */
  FORM_CONTROL_PROMO: string = "promo";

  /**
  * Key for statement saying how they heard about us.
  */
  FORM_CONTROL_HEARD_ABOUT: string = "heardAboutUs";

  /**
   * Constant that indicates the user has not yet agreed to the terms and conditions.
   */
  DOES_NOT_AGREE_YET: string = null;

  /**
   * Group of formcontrols that are necessary to populate user's profile 
   * and create a unique UID that is linked to their email to reference 
   * on authentication.
   */
  registerForm: FormGroup = this.fb.group({
    [this.FORM_CONTROL_USERNAME]: [null, [Validators.required, ValidateUsername]],
    [this.FORM_CONTROL_PASSWORD]: [null, [Validators.required, ValidatePassword]],
    [this.FORM_CONTROL_PASSWORD_CONFIRMATION]: [null, [Validators.required, ValidatePassword]],
    [this.FORM_CONTROL_EMAIL]: [null, [Validators.required, ValidateEmail]],
    [this.FORM_CONTROL_HEIGHT_FEET]: [null, ValidateFootHeight],
    [this.FORM_CONTROL_HEIGHT_INCHES]: [null, ValidateInchesHeight],
    [this.FORM_CONTROL_WEIGHT_LB]: [null, ValidateImperialWeight],
    [this.FORM_CONTROL_WEIGHT_KG]: [null, ValidateMetricWeight],
    [this.FORM_CONTROL_HEIGHT_CM]: [null, ValidateMetricHeight],
    [this.FORM_CONTROL_GENDER]: [null],
    [this.FORM_CONTROL_AGE]: [null, ValidateAge],
    [this.FORM_CONTROL_ACTIVITY_LEVEL]: [null],
    [this.FORM_CONTROL_NUMBER_SYSTEM]: [this.prefs.NUMBER_SYSTEM_IMPERIAL],
    [this.FORM_CONTROL_AGREE_TO_TERMS]: [this.DOES_NOT_AGREE_YET, [Validators.required]],
    [this.FORM_CONTROL_HEARD_ABOUT]: [null],
    [this.FORM_CONTROL_PROMO]: [null]
  });

  /**
  * Displays an error message from firebase if a register operation is denied.
  */
  errorMessage: string = "";

  /**
   * Reference to observable that emits any errors that occur during firebase register process.
   */
  myErrorSubscription: Subscription = null;

  /**
   * true if the spinner should be shown. Indicating an ongoing register operation.
   */
  showSpinner: boolean = false;

  /**
   * Message displayed underneath the mat-spinner in the log-smarter-spinner-wheel component.
   */
  spinnerMessage: string = "Creating LogSmarter™ account. Don't leave this page!";

  /**
   * Reference to the subscription to the activated route that controls query params
   */
  myRouteSub: Subscription = null;

  /**
   * @ignore
   */
  constructor(
    public conversionManager: ConversionService,
    public dialogService: DialogCreatorService,
    private fb: FormBuilder,
    public router: Router,
    public stateManager: StateManagerService,
    public authManager: AuthenticationService,
    public prefs: PreferenceService,
    public prof: ProfileService,
    public snackBarManager: SnackBarService,
    public cdr: ChangeDetectorRef,
    public route: ActivatedRoute,
    public firebaseGeneralService: FirebaseGeneralService,
    public environmentService: EnvironmentService) {
    this.errorSubscription();
  }

  /**
   * @ignore
   */
  ngOnInit(): void {
    if (this.environmentService.isMobile) {
      setTimeout(() => document.getElementsByClassName("fillSpaceOnMobile")[0].classList.add("lsGradientBackgroundColor"), 0);
    }
  }

  /**
   * @ignore kill subscriptions
   */
  ngOnDestroy(): void {
    if (this.myErrorSubscription) {
      this.myErrorSubscription.unsubscribe();
    }
    if (this.environmentService.isMobile) {
      document.getElementsByClassName("fillSpaceOnMobile")[0].classList.remove("lsGradientBackgroundColor");
    }
  }

  /**
   * Creates a subscription to an observabe that emits any error messages 
   * returned from firebase on an unsuccessful register operation. This message 
   * will then be displayed to the user.
   */
  errorSubscription(): void {
    this.myErrorSubscription = this.authManager.eventAuthError.subscribe((errorMessage: string) => {
      this.errorMessage = errorMessage;
      this.showSpinner = false;
      this.cdr.markForCheck();
    });
  }

  /**
   * True if there is an error message to display, false otherwise.
   */
  hasErrorMessage(): boolean {
    return (this.errorMessage != "" && this.errorMessage != null);
  }

  /**
   * Returns true if the number system is imperial. This is used to 
   * show and hide form controls based on what the number system is.
   * If imperial, shows height feet annd inches and weight lbs form control. 
   * If metric shows height cm and weight kg form control. 
   */
  isImperial(): boolean {
    return (this.registerForm.get(this.FORM_CONTROL_NUMBER_SYSTEM).value === this.prefs.NUMBER_SYSTEM_IMPERIAL);
  }

  /**
   * Handles submission of the register form. Validation has already been performed on most controls.
   * The last thing that needs to be checked is that the password matches the password confirmation.
   * If this check passes, then the results of the register form are converted into a user profile.
   * This function then waits for the results of an attempted register. If the user is registered,
   * successfully, they will be re-routed from the page. If they fail, an error mesage is displayed.
   */
  async handleSubmit(): Promise<void> {
    const theyMatch: boolean = this.checkThatPassWordsMatch();
    let context = this;
    if (theyMatch) {
      try {
        context.showSpinner = true;
        let email: string = this.registerForm.controls[this.FORM_CONTROL_EMAIL].value;
        if (email) {
          email = email.trim();
        }
        let password: string = this.registerForm.controls[this.FORM_CONTROL_PASSWORD].value;
        if (password) {
          password = password.trim()
        }
        const user: UserProfile = this.convertResultsToModel();
        const logicToWaitFor: (() => Promise<any>) = async () => await this.authManager.createUser(email, password, user);
        window.scrollTo(0, 0);
        const successfulSignUp: boolean = await this.dialogService.openWaitForOperationDialog(logicToWaitFor, "Register", "touch_app", "Creating LogSmarter™ account. This may take a second.", true);
        if (!successfulSignUp) {
          this.updateUiForRegisterError("Failed to create your account");
        }
      } catch (err) {
        this.updateUiForRegisterError(err.message);
      }
    }
  }

  /**
   * Updates the user interface to display an error message if an error 
   * occured during the register process.
   * 
   * @param errorMessage 
   */
  updateUiForRegisterError(errorMessage: string): void {
    this.errorMessage = errorMessage;
    this.showSpinner = false;
    this.cdr.markForCheck();
  }

  /**
   * Returns true if the value of the password and password confirmation 
   * form controls match. If they do not then an error message is displayed 
   * and false is returned.
   */
  checkThatPassWordsMatch(): boolean {
    const password: string = this.registerForm.controls[this.FORM_CONTROL_PASSWORD].value;
    const passwordConfirmation = this.registerForm.controls[this.FORM_CONTROL_PASSWORD_CONFIRMATION].value;
    const allowSubmit: boolean = (password == passwordConfirmation);
    if (!allowSubmit) {
      this.errorMessage = "Password confirmation must match initial";
    }
    return allowSubmit;
  }

  /**
  * Converts the current values of the register form into a user profile that will be stored as the 
  * initial data for a user in firebase. 
  */
  convertResultsToModel(): UserProfile {
    const newUser: UserProfile = new UserProfile();
    newUser.userPreferences = this.prefs.getDefaultPreferences();
    newUser.username = this.registerForm.controls[this.FORM_CONTROL_USERNAME].value;
    if (newUser.username) {
      newUser.username = newUser.username.trim();
    }
    newUser.userPreferences.general.isImperial = this.registerForm.controls[this.FORM_CONTROL_NUMBER_SYSTEM].value;
    if (newUser.userPreferences.general.isImperial == this.prefs.NUMBER_SYSTEM_IMPERIAL) {
      newUser.height_inches = this.conversionManager.convertFeetAndInchesToInches(
        this.registerForm.controls[this.FORM_CONTROL_HEIGHT_FEET].value,
        this.registerForm.controls[this.FORM_CONTROL_HEIGHT_INCHES].value);
      newUser.weight_lbs = this.registerForm.controls[this.FORM_CONTROL_WEIGHT_LB].value;
    }
    else if (newUser.userPreferences.general.isImperial == this.prefs.NUMBER_SYSTEM_METRIC) {
      newUser.height_inches = this.conversionManager.convertCentimetersToInches(this.registerForm.controls[this.FORM_CONTROL_HEIGHT_CM].value);
      newUser.weight_lbs = this.conversionManager.convertKgToLbs(this.registerForm.controls[this.FORM_CONTROL_WEIGHT_KG].value);
    };
    newUser.isMale = this.registerForm.controls[this.FORM_CONTROL_GENDER].value;
    const age: number = this.registerForm.controls[this.FORM_CONTROL_AGE].value;
    if (age) {
      newUser.age = Math.round(age);
    }
    newUser.activityLevel = this.registerForm.controls[this.FORM_CONTROL_ACTIVITY_LEVEL].value;
    newUser.heardAboutUs = this.registerForm.controls[this.FORM_CONTROL_HEARD_ABOUT].value;
    if (newUser.heardAboutUs) {
      newUser.heardAboutUs = newUser.heardAboutUs.trim();
    }
    newUser.referredBy = this.registerForm.controls[this.FORM_CONTROL_PROMO].value;
    if (newUser.referredBy) {
      newUser.referredBy = newUser.referredBy.trim().toUpperCase();
    }
    return newUser;
  }

  /**
   * Helper function for opening the terms of service dialog.
   */
  openTerms(): void {
    this.dialogService.openTermsDialog();
  }

  /**
   * Returns true if the user agrees to the terms of service. False otherwise.
   */
  userAgreesToTerms(): boolean {
    return (this.registerForm.controls[this.FORM_CONTROL_AGREE_TO_TERMS].value == true);
  }

}
