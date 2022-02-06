import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

/**
 * Creates small notifications for events in the application. 3 types of events
 * are possible to create. A success, failure and warning event. This service is 
 * a wrapper around the MatSnackBar library to simplify any snackbar notifications
 * that need to be created.
 * 
 * Last edited by: Ryan Lefebvre 7/26/2020
 */
@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  /**
   * Number of msec that success snackbar notifications are displayed.
   */
  successDuration: number = 1000;

  /**
   * Number of msec that failure snackbar notifications are displayed.
   */
  failureDuration: number = 1000;

  /**
   * Number of msec that warning snackbar notifications are displayed.
   */
  warningDuration: number = 1000;

  /**
   * True if another snackbar is open. False otherwise.
   */
  someSnackBarOpen: boolean = false;

  /**
   * @ignore
   */
  constructor(public _snackBar: MatSnackBar) { }

  /**
   * Opens a snackbar notification to display a success message.
   */
  showSuccessMessage(message: string): void {
    if (!this.someSnackBarOpen) {
      this.someSnackBarOpen = true;
      this._snackBar.open(message, null, {
        verticalPosition: 'top',
        duration: this.successDuration,
        panelClass: ['success-snackbar']
      })
      setTimeout(() => this.someSnackBarOpen = false, this.successDuration);
    }
  }

  /**
   * Opens a snackbar notification to display a failure message.
   */
  showFailureMessage(message: string): void {
    if (!this.someSnackBarOpen) {
      this.someSnackBarOpen = true;
      this._snackBar.open(message, null, {
        verticalPosition: 'top',
        duration: this.failureDuration,
        panelClass: ['failure-snackbar']
      })
      setTimeout(() => this.someSnackBarOpen = false, this.failureDuration);
    }
  }

  /**
  * Opens a snackbar notification to display a warning message.
  */
  showWarningMessage(message: string): void {
    this.someSnackBarOpen = true;
    this._snackBar.open(message, null, {
      verticalPosition: 'top',
      duration: this.warningDuration,
      panelClass: ['warning-snackbar']
    })
    setTimeout(() => this.someSnackBarOpen = false, this.warningDuration);
  }

}
