import { Injectable, OnInit } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from "@angular/router";
import { UserProfile } from '../../model-classes/general/user-profile';
import { Subject, Subscription } from 'rxjs';
import { PreferenceService } from '../general/preference.service';
import { SnackBarService } from 'src/app/shared-modules/material/snack-bar-manager.service';
import { TimeService } from '../general/time-constant.service';
import { MatDialog } from '@angular/material';
import { PaymentService } from './payments.service';
import { EnvironmentService } from '../general/environment.service';

/**
 * This service is responsible for all authentication operations including, account creation, sign in and account deletion.
 * It is a wrapper around the AngularFireAuth library and maintains the LogSmarter authentication lifecycle. All code is 
 * asynchronous and any component implementing this service should take the appropriate steps to handle the Promises 
 * returned from this services functions.
 * 
 * Last edited by: Ryan Lefebvre 7/12/2020
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService implements OnInit {

  /**
   * Default sign out message displayed in a snackbar notification for a successful log out operation.
   */
  SIGN_OUT_SUCCESS_MESSAGE: string = "Signed out successfully";

  /**
   * Message to be shown by by the snackbar service if there is an error during a sign out operation.
   */
  SIGN_OUT_FAILURE_MESSAGE: string = "Failed to sign out";

  /**
  * Message to be shown by by the snackbar service if there is an error during a sign in operation.
  */
  SIGN_IN_FAILURE_MESSAGE: string = "Failed to sign in. Credentials may be incorrect";

  /**
   * Reference to the route for the verify email page.
   */
  VERIFY_EMAIL_PAGE: string = "/auth/verify";

  /**
   * Reference to the route for the landing page.
   */
  HOME_PAGE: string = "/";

  /**
   * Message to be shown by the snackbar service when a verification email is sent.
   */
  VERIFY_EMAIL_MESSAGE: string = "Verification email sent";

  /**
  * Message to be shown by the snackbar service when a user tries to log in without verifying their email.
  */
  VERIFY_EMAIL_RESEND_MESSAGE: string = "Verification email resent";

  /**
   * Message to be shown when an error occurs during the account creation process.
   */
  ACCOUNT_CREATION_FAILURE_MESSAGE: string = "Failure to create account";

  /**
  * Message to be shown when an error occurs during the account deletion process.
  */
  ACCOUNT_DELETE_SUCCESS_MESSAGE: string = "Successfully deleted account";

  /**
  * Message to be shown when an error occurs during the account deletion process.
  */
  ACCOUNT_DELETE_FAILURE_MESSAGE: string = "Failure to create account";

  /**
   * Obseravble that emits a string containing an error message any time that an authentication
   * error occurs. i.e. during the sign in or sign up process.
   */
  public eventAuthError: Subject<string> = new Subject<string>();

  /**
  * Reference to a subscription the path in the DB where the currently authenticated user prof  document is stored.
  * We need to unsubscribe from this when we log out or else we will see annoying console errors  
  */
  userProfPathSubscription: Subscription = null;

  /**
   * Message that should be sent by the eventAuthError observable when the authentication
   * error seen is related to a network connection issue.
   */
  NETWORK_CONNECTION_MESSAGE: string = "Request failed. You may not have an internet connection";

  /**
   * Code returned from firebase when a network related issue causes a request to fail
   */
  NETWORK_ERROR_CODE: string = "auth/network-request-failed";

  /**
  * Message that should be sent by the eventAuthError observable when the authentication
  * error seen is related to a network connection issue.
  */
  EMAIL_IN_USE_MESSAGE: string = "The email address is already in use by another account";

  /**
   * Code returned from firebase when a network related issue causes a request to fail
   */
  EMAIL_IN_USE_ERROR_CODE: string = "auth/email-already-in-use";

  /**
   * @ignore
   */
  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    public db: AngularFirestore,
    public router: Router,
    public time: TimeService,
    public preferenceManager: PreferenceService,
    public snackbarManager: SnackBarService,
    public dialogRef: MatDialog,
    public stripe: PaymentService,
    public environmentService: EnvironmentService
  ) { }

  /**
   * @ignore
   */
  ngOnInit() { }

  /**
   * Attempts to create an account for a user with the account email and password passed in as parameters.
   * Account emails are forced to be unique, an error is thrown if the email is already in use by another 
   * user. If the authentication credentials are unique and the account is successfully created, then an 
   * entry in the database is created for the user's profile and the user is force signed out and redirected 
   * to the verify email component. During this process, the user's IP address is recorded and written to their 
   * profile. This is the only time that value will ever be written to. If any error occurs, the user is displayed
   * a snackbar notification saying there was an error. 
   * 
   * @param email email to be linked to the new user account.
   * @param password password to be linked to the new user account.
   * @param newUser contains values of form controls on the register page.
   */
  async createUser(email: string, password: string, newUser: UserProfile): Promise<void> {
    try {
      const userCredentials: firebase.auth.UserCredential = await this.afAuth.auth.createUserWithEmailAndPassword(email, password);
      newUser.dateCreated = this.time.getTimeStamp();
      await this.createUserProfileInFirestore(userCredentials, newUser);
      await this.logOutGoVerify((this.VERIFY_EMAIL_MESSAGE));
      await userCredentials.user.sendEmailVerification();
    } catch (error) {
      if (error.code == this.EMAIL_IN_USE_ERROR_CODE) {
        this.eventAuthError.next(this.EMAIL_IN_USE_MESSAGE);
        this.snackbarManager.showWarningMessage(this.EMAIL_IN_USE_MESSAGE);
      }
      else if (error.code == this.NETWORK_ERROR_CODE) {
        this.eventAuthError.next(this.NETWORK_CONNECTION_MESSAGE);
        this.snackbarManager.showWarningMessage(this.NETWORK_CONNECTION_MESSAGE);
      }
      else {
        this.eventAuthError.next(this.ACCOUNT_CREATION_FAILURE_MESSAGE);
        this.snackbarManager.showFailureMessage(this.ACCOUNT_CREATION_FAILURE_MESSAGE);
      }
    }
  }

  /**
   * Creates a new user profile in Firestore. This function does not create authentication credentials, it expects to 
   * be given the response of a successful createUser() operation and a user profile object to store in the database.  
   * 
   * @param userCredentials Response of a successful createUser operation.
   * @param userProfileData User profile object to store in database that is linked to the UID from userCredentials
   */
  createUserProfileInFirestore(userCredentials: firebase.auth.UserCredential, userProfileData: UserProfile): Promise<void> {
    return this.db.doc(`Users/${userCredentials.user.uid}`)
      .set({
        u: JSON.stringify(userProfileData)
      });
  }

  /**
   * Gets the email that is linked to the UID of the currently authenticated user and 
   * returns a promise that will resolve when the result of an attempt to change the 
   * email to the new email passed in as a parameter returns. 
   * 
   * @param newEmail email that the user would like tolink their account to.
   */
  tryToUpdateEmail(newEmail: string): Promise<void> {
    const user = this.afAuth.auth.currentUser;
    return user.updateEmail(newEmail);
  }

  /**
   * Logs the current user out and sends them to the homepage on success.
   */
  async logOutGoHome(message: string): Promise<void> {
    return await this.logOut(message, this.HOME_PAGE);
  }

  /**
   * Logs the current user out and navigates to the verify email page on success.
   */
  async logOutGoVerify(message: string): Promise<void> {
    return await this.logOut(message, this.VERIFY_EMAIL_PAGE);
  }

  /**
   * Attempts to sign the user out, clear session storage, navigate the user to the route specified
   * and show a success message indicating the sign out operation was successful. If any error occurs 
   * then the error is caught and an error message is displayed.
   * 
   * @param successMessage message to be shown on a successful sign out operation.
   */
  async logOut(successMessage: string, route: string): Promise<void> {
    try {
      if (this.userProfPathSubscription) {
        this.userProfPathSubscription.unsubscribe();
      }
      await this.router.navigate([route]);
      await this.afAuth.auth.signOut();
      sessionStorage.clear();
      localStorage.clear();
      await this.dialogRef.closeAll();
      this.snackbarManager.showSuccessMessage(successMessage);
      if (this.environmentService.isMobile) {
        //@ts-ignore
        StatusBar.backgroundColorByHexString(this.preferenceManager.COLOR_TURQOUSIE);
      }
    } catch (error) {
      this.snackbarManager.showFailureMessage(this.SIGN_OUT_FAILURE_MESSAGE);
    }
  }

  /**
   * Atttempts to sign the user into their account. On success, a check is done to make sure the 
   * user's email is verified. If the user's email is not verified, then they are redirected to the
   * verify email page, a new verification email is sent and a snackbar is displayed telling the 
   * user that their email is not verified. If any error occurs, then the authError observable 
   * emits the latest error message.
   * 
   * @param email email of the user trying to log in.
   * @param password password of the user trying to log in.
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredentials: firebase.auth.UserCredential = await this.afAuth.auth.signInWithEmailAndPassword(email, password);
      const userEmailIsNotVerified: boolean = (userCredentials.user.emailVerified == false);
      if (userEmailIsNotVerified) {
        await this.logOutGoVerify(this.VERIFY_EMAIL_RESEND_MESSAGE);
        await userCredentials.user.sendEmailVerification();
      }
    } catch (error) {
      if (error.code == this.EMAIL_IN_USE_ERROR_CODE) {
        this.eventAuthError.next(this.EMAIL_IN_USE_MESSAGE);
        this.snackbarManager.showWarningMessage(this.EMAIL_IN_USE_MESSAGE);
      }
      else if (error.code == this.NETWORK_ERROR_CODE) {
        this.eventAuthError.next(this.NETWORK_CONNECTION_MESSAGE);
        this.snackbarManager.showWarningMessage(this.NETWORK_CONNECTION_MESSAGE);
      }
      else {
        this.eventAuthError.next(this.SIGN_IN_FAILURE_MESSAGE);
        this.snackbarManager.showFailureMessage(this.SIGN_IN_FAILURE_MESSAGE);
      }
    }
  }

  /**
   * Deletes the account of the current user but none of the data associated with their account. This means that the 
   * user will no longer be able to log in and access that data and the email they previously had linked to their account 
   * can be used by other accounts. If any error occurs, a message is displayed to the user that notifies them their account 
   * could not be deleted. If the user has a stripe subscription, the subscription will also be deleted to prevent any payments
   * being due for an account that does not exist anymore.
   */
  async deleteCurrentUser(currentUser: UserProfile): Promise<void> {
    try {
      const hasSubscription = currentUser.subscriptionID != null;
      if (hasSubscription) {
        await this.stripe.cancelUserStripeSubscription();
      }
      await this.afAuth.auth.currentUser.delete();
      this.dialogRef.closeAll();
      this.snackbarManager.showSuccessMessage(this.ACCOUNT_DELETE_SUCCESS_MESSAGE);
    } catch (error) {
      this.snackbarManager.showSuccessMessage(this.ACCOUNT_DELETE_FAILURE_MESSAGE);
    }
  }

  /**
  * Returns the uid of the currently authenticated user by getting the uid of the auth state from the authentication service.
  */
  getUserID(): string {
    return this.afAuth.auth.currentUser.uid;
  }

}

