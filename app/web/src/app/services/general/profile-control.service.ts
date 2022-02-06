import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Controls communication between forms on the profile page.
 * Constraints imposed on that page limit the amount of forms that 
 * can be open at once. This means that all components need to know if a form
 * is being edited. This service is used to emit when a from has begun or finished
 * being edited.
 * 
 * Last edited by: Ryan Lefebvre 7/26/2020
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileControlService {

  /**
   * Key for profile page form communication that indicates no form is being edited.
   */
  NOT_EDITING: string = "NONE";

  /**
   * Key for profile page form communication that indicates the profile form is being edited.
   */
  EDITING_PROFILE: string = "PROFILE";

  /**
   * Key for profile page form communication that indicates the general preferences form
   * is being edited.
   */
  EDITING_GENERAL_PREFS: string = "GENERAL";

  /**
   * Key for profile page form communication that indicates the general preferences form
   * is being edited.
   */
  EDITING_NUTR_PREFS: string = "NUTRITION";

  /**
  * Key for profile page form communication that indicates the octobat beanie button 
  * has been pressed and the portal is loading.
  */
  EDITING_PORTAL: string = "PORTAL";

  /**
  * Key for profile page form communication that indicates reminders are being edited.
  */
  EDITING_REMINDER: string = "REMINDER";

  /**
   * Key for profile page form communication that indicats that the promo code/account form
   * is being edited
   */
  EDITING_PROMO_CODE: string = "PROMO";

  /**
   * This service simply exists as a wrapper around this subscription.
   * It controls communication between the multiple forms on the page to 
   * control what form is being edited and what forms will be disabled.
   */
  currentlyBeingEdited: BehaviorSubject<string> = new BehaviorSubject<string>(this.NOT_EDITING);

  /**
   * @ignore
   */
  constructor() { }

  /**
   * Returns the value of whatever form is being currently edited.
   */
  currentEditValue(): string {
    return this.currentlyBeingEdited.value;
  }

  /**
   * Emits a value that indicates which form has begun being edited.
   * 
   * @param message profile page form key that is associated with the form being edited.
   */
  beginEditing(message: string) {
    this.currentlyBeingEdited.next(message);
  }

  /**
   * Emits a value that indicates no forms on the profile page are being edited.
   */
  doneEditing(): void {
    this.currentlyBeingEdited.next(this.NOT_EDITING);
  }

}
