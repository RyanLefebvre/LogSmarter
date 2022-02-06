import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FirebaseNutritionService } from 'src/app/services/firebase/firebase-nutrition.service';
import { Router } from '@angular/router';
import { ConstantsService } from 'src/app/services/general/constants.service';

/**
 * A dialog that is used to confirm and execute sensitive operations. The dialog is 
 * given a title, a prompt to display about the action being performed, logic to perform
 * if the confirmation is successful and a spinner message to display while the logic 
 * is executing. This dialog is not responsible for any snackbar notifications associated
 * with the confirmation logic and cannot be closed once the logic begins until the request
 * associated with the logic returns.
 * 
 * Last edited by: Ryan Lefebvre 12/23/2020
 */
@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit {

  /**
   * True if the spinner should be shown, false otherwise.
   */
  showSpinner: boolean = false;

  /**
   * @ignore
   */
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    public fbNutr: FirebaseNutritionService,
    public router: Router,
    public constants: ConstantsService,
    @Inject(MAT_DIALOG_DATA) public data) { }

  /**
   * @ignore
   */
  ngOnInit() { }

  /**
   * Click handler for the confirmation button. Turns on the spinner,
   * disables closing the dialog and executes the logic to perform.
   * Lastly closes the dialog.
   */
  async confirm(): Promise<void> {
    try {
      this.dialogRef.disableClose = true;
      this.showSpinner = true;
      const confirmLogic: Function = this.data.confirmationLogic;
      await confirmLogic();
    }
    catch (error) { }
    setTimeout(() => this.closeDialog(), this.constants.SPINNER_TIMEOUT);
  }

  /**
   * A wrapper function around the logic responsible for closing the dialog.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
