import { Component, OnInit, Inject } from '@angular/core';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

/**
 * This component is a simple wrapper around our terms of service. It places the terms in a 
 * mat-dialog contained in a div that allows the user to scroll and read the entire terms of
 * service text. Beneath that is a button that lets the user close the dialog. Any user signing 
 * up is forced to agree to our terms of service before creating an account with LogSmarter.
 * 
 * Last edited by: Ryan Lefebvre 7/27/2020
 */
@Component({
  selector: 'app-terms-dialog',
  templateUrl: './terms-dialog.component.html',
  styleUrls: ['./terms-dialog.component.css']
})
export class TermsDialogComponent implements OnInit {

  /**
   * @ignore
   */
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data) { }

  /**
   * @ignore
   */
  ngOnInit() { }

}
