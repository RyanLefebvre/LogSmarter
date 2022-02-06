import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AuthenticationService } from 'src/app/services/firebase/authentication.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';

/**
 * Prompts the user as to whether or not they would like to send a password reset to the 
 * email passed into this component as a parameter. If the user presses the confirm button, 
 * then an attempt is made to send the reset email. If they press the close button, then
 * the dialog is closed. 
 * 
 * Last edited by: Ryan Lefebvre 7/27/2020
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  /** 
   * True if the spinner is being shown indicating a password reset operation. False otherwise.
   */
  showSpinner: boolean = false;

  /**
   * Message displayed underneath the mat-spinner in the log-smarter-spinner-wheel component.
   */
  spinnerMessage: string = "Sending password reset email";

  /**
   * @ignore
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ForgotPasswordComponent>,
    public auth: AuthenticationService,
    public snackbar: SnackBarService) { }

  /**
  * @ignore 
  */
  ngOnInit() { }

  /**
   * Attempts to send a password reset email to the email passed in as a param
   * to this dialog. If the request to send the reset email is successful, then 
   * a snackbar notification indicating a success is displayed and the dialog is
   * closed. If the request to send the email fails, then an error message is 
   * displayed, if the error is one relating to the email address passed in not being 
   * linked to a LogSmarter user then a failure mesage for that case is shown, otherwise 
   * a more general message is shown. While the result of the reset email request is 
   * being waited upon, the dialog cannot be closed and a spinner is displayed in the place
   * of the buttons. A small timeout is added to the spinner to prevent the component from 
   * flickering and looking awkward on a quick response from firebase.
   */
  async attemptToSendResetEmail(): Promise<void> {
    this.dialogRef.disableClose = true;
    this.showSpinner = true;
    const SUC_MSG: string = "Password reset email sent successfully";
    const GENERAL_FAIL_MSG: string = "Failed to send password reset email";
    const USER_NOT_FOUND_CODE: string = "auth/user-not-found";
    const INVALID_EMAIL_CODE: string = "auth/invalid-email";
    const USER_NOT_FOUND_MSG: string = "No user found with specified email.";
    try {
      const emailToSendResetTo: string = this.data.email;
      await this.auth.afAuth.auth.sendPasswordResetEmail(emailToSendResetTo);
      this.snackbar.showSuccessMessage(SUC_MSG);
    } catch (error) {
      const errorCode = error.code;
      const errorHasCode: boolean = (errorCode != null);
      const userWithEmailNotFound: boolean = errorHasCode && (errorCode == USER_NOT_FOUND_CODE);
      const invalidEmailPassedIn: boolean = errorHasCode && (errorCode == INVALID_EMAIL_CODE);
      const shouldShowUserNotFound: boolean = (userWithEmailNotFound || invalidEmailPassedIn);
      if (shouldShowUserNotFound) {
        this.snackbar.showFailureMessage(USER_NOT_FOUND_MSG);
      } else {
        this.snackbar.showFailureMessage(GENERAL_FAIL_MSG);
      }
    }
    this.showSpinner = false;
    this.dialogRef.close();
  }

}
