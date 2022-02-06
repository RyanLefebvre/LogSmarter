import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { TierPermissionsService } from 'src/app/services/general/tier-permissions.service';

/**
 * Displays a message to the user about their subscription. This component is 
 * intentionally left open ended so that it can be expanded in the future but is 
 * only currently used to inform the user if their subscription is unpaid. This
 * component should be able to be closed as long as the user's subscription is 
 * active. At creation time, a title, message and whether or not to show contact
 * info are passed in as paramters to this dialog. Below the title message and
 * contact info are two buttons, one of which is the beanie button which is used
 * to take the user to the payment portal, the other is a close button that is 
 * only enabled if the user's subscription is active. 
 * 
 * Last edited by: Ryan Lefebvre 7/28/2020
 */
@Component({
  selector: 'app-subscription-message-dialog',
  templateUrl: './subscription-message-dialog.component.html',
  styleUrls: ['./subscription-message-dialog.component.css']
})
export class SubscriptionMessageDialogComponent implements OnInit {

  /**
   * @ignore
   */
  constructor(
    public tierPermissionManager: TierPermissionsService,
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<SubscriptionMessageDialogComponent>) { }

  /**
   * @ignore
   */
  ngOnInit() {
    this.makeSureDialogCantBeClosed();
  }

  /**
   * Called to make sure that the dialog cannot be closed unless
   * the close button is displayed and the user click on it.
   */
  makeSureDialogCantBeClosed(): void {
    this.dialogRef.disableClose = true;
  }

}
